/**
 * @fileoverview CLI Bridge — spawns `bmad-method` CLI as a child process
 * and streams output to Copilot Chat or VS Code terminals.
 *
 * **Capabilities**
 * - Resolve the bmad CLI executable (local `node_modules/.bin/bmad` or `npx`)
 * - Check CLI availability and version
 * - Spawn interactive commands in a VS Code terminal (for `install`)
 * - Spawn non-interactive commands and stream stdout/stderr (for `status`)
 * - Cancellation via CancellationToken (kills child process)
 *
 * **Windows Support**
 * - Resolves `.cmd` executables on Windows
 * - Uses `shell: true` on Windows for proper PATH resolution
 *
 * @module cliBridge
 */

import * as vscode from 'vscode';
import * as cp from 'node:child_process';
import * as path from 'node:path';
import * as fs from 'node:fs';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

/** Resolved CLI command and base arguments. */
export interface CliResolution {
  /** The executable command (absolute path or `npx`/`npx.cmd`). */
  command: string;
  /** Base arguments prepended to every invocation (e.g. `['bmad-method']` for npx). */
  baseArgs: string[];
}

/** Result of a captured CLI execution. */
export interface CliResult {
  /** Process exit code (0 = success). */
  exitCode: number;
  /** Combined stdout text. */
  stdout: string;
  /** Combined stderr text. */
  stderr: string;
}

/* ------------------------------------------------------------------ */
/*  CliBridge                                                         */
/* ------------------------------------------------------------------ */

/**
 * Bridges the BMAD CLI (`npx bmad-method`) into the VS Code environment.
 *
 * The bridge resolves the CLI executable, provides availability checks,
 * and offers two execution modes:
 *
 * 1. **Terminal mode** — opens a VS Code integrated terminal for
 *    interactive commands (e.g. `install` with its @clack/prompts UI).
 * 2. **Stream mode** — spawns a child process and pipes stdout/stderr
 *    into a Copilot Chat response stream.
 */
export class CliBridge {
  private readonly outputChannel: vscode.OutputChannel;

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
  }

  /* -------------------------------------------------------------- */
  /*  Resolution                                                     */
  /* -------------------------------------------------------------- */

  /**
   * Resolve the bmad CLI executable path.
   *
   * **Priority order:**
   * 1. `<workspaceRoot>/node_modules/.bin/bmad` (local install)
   * 2. `npx bmad-method` (npx fallback)
   *
   * On Windows, `.cmd` extensions are checked first.
   *
   * @param workspaceRoot - Absolute path to workspace root.
   * @returns Resolved command and base arguments.
   */
  resolveCli(workspaceRoot: string): CliResolution {
    const isWindows = process.platform === 'win32';

    // 1. Try local node_modules/.bin/bmad
    const localBinNames = isWindows
      ? ['bmad.cmd', 'bmad.ps1', 'bmad']
      : ['bmad'];

    for (const binName of localBinNames) {
      const localBin = path.join(workspaceRoot, 'node_modules', '.bin', binName);
      if (fs.existsSync(localBin)) {
        this.log(`Resolved CLI: local ${localBin}`);
        return { command: localBin, baseArgs: [] };
      }
    }

    // 2. Fallback: npx bmad-method
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';
    this.log(`Resolved CLI: ${npxCmd} bmad-method`);
    return { command: npxCmd, baseArgs: ['bmad-method'] };
  }

  /* -------------------------------------------------------------- */
  /*  Availability                                                   */
  /* -------------------------------------------------------------- */

  /**
   * Check whether `bmad-method` is reachable and return its version.
   *
   * @param workspaceRoot - Absolute workspace root path.
   * @returns Version string (e.g. `"6.0.0-Beta.8"`) or `null` if unavailable.
   */
  async getVersion(workspaceRoot: string): Promise<string | null> {
    try {
      const cli = this.resolveCli(workspaceRoot);
      const result = await this.spawnAndCapture(
        ['--version'],
        workspaceRoot,
        cli,
        5000,
      );
      if (result.exitCode === 0 && result.stdout.trim()) {
        return result.stdout.trim();
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Quick check: is the `_bmad/` directory present?
   *
   * @param workspaceRoot - Absolute workspace root path.
   * @returns `true` if `_bmad/` exists.
   */
  hasBmadInstallation(workspaceRoot: string): boolean {
    return fs.existsSync(path.join(workspaceRoot, '_bmad'));
  }

  /**
   * Quick check: are GitHub Copilot prompt files present?
   *
   * @param workspaceRoot - Workspace root.
   * @returns `true` if `.github/prompts/` or `.github/agents/` has bmad files.
   */
  hasCopilotPromptFiles(workspaceRoot: string): boolean {
    const promptsDir = path.join(workspaceRoot, '.github', 'prompts');
    const agentsDir = path.join(workspaceRoot, '.github', 'agents');

    const check = (dir: string) => {
      if (!fs.existsSync(dir)) return false;
      try {
        return fs.readdirSync(dir).some((f) => f.startsWith('bmad'));
      } catch {
        return false;
      }
    };

    return check(promptsDir) || check(agentsDir);
  }

  /* -------------------------------------------------------------- */
  /*  Terminal mode (interactive)                                    */
  /* -------------------------------------------------------------- */

  /**
   * Open a VS Code integrated terminal and execute a bmad CLI command.
   *
   * Used for interactive commands like `install` that rely on
   * `@clack/prompts` for rich terminal UI.
   *
   * @param args          - CLI arguments (e.g. `['install', '--tools', 'github-copilot']`).
   * @param workspaceRoot - Workspace root (used as cwd).
   * @returns The created terminal instance.
   */
  openTerminal(args: string[], workspaceRoot: string): vscode.Terminal {
    const cli = this.resolveCli(workspaceRoot);
    const fullArgs = [...cli.baseArgs, ...args];
    
    // Quote command and args to prevent shell injection and handle spaces
    const quotedCommand = cli.command.includes(' ') ? `"${cli.command}"` : cli.command;
    const quotedArgs = fullArgs.map(arg => arg.includes(' ') ? `"${arg}"` : arg);
    const cmdLine = `${quotedCommand} ${quotedArgs.join(' ')}`;

    const terminal = vscode.window.createTerminal({
      name: 'BMAD Install',
      cwd: workspaceRoot,
    });

    terminal.show();
    terminal.sendText(cmdLine);

    this.log(`Opened terminal: ${cmdLine}`);
    return terminal;
  }

  /* -------------------------------------------------------------- */
  /*  Stream mode (Copilot Chat output)                             */
  /* -------------------------------------------------------------- */

  /**
   * Spawn a bmad CLI command and stream its output into a Copilot Chat
   * response stream.
   *
   * stdout lines are emitted as Markdown. stderr lines are emitted
   * inside blockquotes with a warning prefix.
   *
   * ANSI escape codes are stripped automatically.
   *
   * @param args          - CLI arguments.
   * @param workspaceRoot - Workspace root (cwd).
   * @param stream        - Copilot Chat response stream.
   * @param token         - Cancellation token; kills the child process on cancel.
   * @returns Process exit code.
   */
  async spawnToChat(
    args: string[],
    workspaceRoot: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken,
  ): Promise<number> {
    const cli = this.resolveCli(workspaceRoot);
    const fullArgs = [...cli.baseArgs, ...args];

    this.log(`Spawning: ${cli.command} ${fullArgs.join(' ')}`);

    return new Promise<number>((resolve, reject) => {
      const proc = cp.spawn(cli.command, fullArgs, {
        cwd: workspaceRoot,
        shell: process.platform === 'win32',
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
          CI: '1', // Suppress interactive prompts
        },
      });

      // Cancel → kill
      const cancelSub = token.onCancellationRequested(() => {
        this.log('Cancellation requested — killing process');
        proc.kill('SIGTERM');
        setTimeout(() => {
          if (!proc.killed) proc.kill('SIGKILL');
        }, 3000);
      });

      proc.stdout?.on('data', (data: Buffer) => {
        const text = stripAnsi(data.toString());
        if (text.trim()) {
          stream.markdown(text);
        }
      });

      proc.stderr?.on('data', (data: Buffer) => {
        const text = stripAnsi(data.toString()).trim();
        if (text) {
          stream.markdown(`\n> ⚠️ ${text}\n`);
        }
      });

      let settled = false;

      proc.on('close', (code) => {
        if (settled) return;
        settled = true;
        cancelSub.dispose();
        this.log(`Process exited with code ${code}`);
        resolve(code ?? 1);
      });

      proc.on('error', (err) => {
        if (settled) return;
        settled = true;
        cancelSub.dispose();
        this.log(`Process error: ${err.message}`);
        reject(err);
      });
    });
  }

  /* -------------------------------------------------------------- */
  /*  Internal helpers                                              */
  /* -------------------------------------------------------------- */

  /**
   * Spawn a command and capture its full output (no streaming).
   *
   * @param args          - CLI arguments.
   * @param workspaceRoot - Working directory.
   * @param cli           - Resolved CLI.
   * @param timeout       - Max wait in ms.
   * @returns Captured result.
   */
  private spawnAndCapture(
    args: string[],
    workspaceRoot: string,
    cli: CliResolution,
    timeout: number,
  ): Promise<CliResult> {
    const fullArgs = [...cli.baseArgs, ...args];

    return new Promise<CliResult>((resolve, reject) => {
      const proc = cp.spawn(cli.command, fullArgs, {
        cwd: workspaceRoot,
        shell: process.platform === 'win32',
        timeout,
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
        },
      });

      let stdout = '';
      let stderr = '';

      proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
      proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

      proc.on('close', (code) => {
        resolve({ exitCode: code ?? 1, stdout, stderr });
      });

      proc.on('error', (err) => reject(err));
    });
  }

  /** Write to the BMAD output channel. */
  private log(message: string): void {
    const ts = new Date().toISOString();
    this.outputChannel.appendLine(`[${ts}] [CliBridge] ${message}`);
  }
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                         */
/* ------------------------------------------------------------------ */

/**
 * Strip ANSI escape codes from a string.
 *
 * @param text - Input text possibly containing escape sequences.
 * @returns Clean text.
 */
function stripAnsi(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
}
