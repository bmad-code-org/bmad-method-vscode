/**
 * @fileoverview Extension entry point for the BMAD Copilot Adapter.
 *
 * **Responsibilities**
 * 1. Register the `@bmad` Chat Participant via the VS Code Chat API.
 * 2. Create the {@link CliBridge} for real CLI process spawning.
 * 3. Trigger an initial {@link CommandRegistry.scan} on activation.
 * 4. Watch for `_bmad/` and `.github/` directory changes and re-scan.
 * 5. Register `bmad-copilot.rescan` and `bmad-copilot.install` commands.
 *
 * **Debugging**
 * - Open the Output panel → select "BMAD Copilot" to see all logs.
 * - Set breakpoints in any `src/*.ts` file; they resolve via source maps.
 * - Press F5 to launch the Extension Development Host.
 *
 * @module extension
 */

import * as vscode from 'vscode';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { CommandRegistry } from './commandRegistry.js';
import { CliBridge } from './cliBridge.js';
import { ChatBridge } from './chatBridge.js';
// NOTE: promptMirror.ts is DEPRECATED and not imported.
// The adapter is a pure read-only bridge. The official
// `npx bmad-method install` generates `.github/prompts` directly.

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

const PARTICIPANT_ID = 'bmad';
const OUTPUT_CHANNEL_NAME = 'BMAD Copilot';

/* ------------------------------------------------------------------ */
/*  activate                                                          */
/* ------------------------------------------------------------------ */

/**
 * VS Code extension activation entry point.
 *
 * @param context - Extension context for managing disposables.
 */
export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  const outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  context.subscriptions.push(outputChannel);

  log(outputChannel, 'Activating BMAD Copilot Adapter…');

  /* -------------------------------------------------------------- */
  /*  Core services                                                 */
  /* -------------------------------------------------------------- */

  const registry = new CommandRegistry();
  const cliBridge = new CliBridge(outputChannel);

  // Initial scan — read official .github/prompts as-is (no mirroring)
  const workspaceRoot = getWorkspaceRoot();
  if (workspaceRoot) {
    await performScan(registry, workspaceRoot, outputChannel);
  } else {
    log(outputChannel, 'No workspace folder open — skipping initial scan.');
  }

  /* -------------------------------------------------------------- */
  /*  Chat Participant                                               */
  /* -------------------------------------------------------------- */

  const chatBridge = new ChatBridge(registry, cliBridge, outputChannel);

  const participant = vscode.chat.createChatParticipant(
    PARTICIPANT_ID,
    chatBridge.handler,
  );
  participant.iconPath = new vscode.ThemeIcon('rocket');
  context.subscriptions.push(participant);

  log(outputChannel, 'Chat participant @bmad registered.');

  /* -------------------------------------------------------------- */
  /*  Prompt integrity check on activation                           */
  /* -------------------------------------------------------------- */

  if (workspaceRoot) {
    const promptsDir = require('node:path').join(workspaceRoot, '.github', 'prompts');
    const agentsDir = require('node:path').join(workspaceRoot, '.github', 'agents');
    const bmadDirLocal = require('node:path').join(workspaceRoot, '_bmad');

    const hasBmadDir = fs.existsSync(bmadDirLocal);
    
    let hasPrompts = false;
    if (fs.existsSync(promptsDir)) {
      try {
        hasPrompts = fs.readdirSync(promptsDir).some((f: string) => f.startsWith('bmad') && f.endsWith('.prompt.md'));
      } catch (err) {
        log(outputChannel, `Failed to read ${promptsDir}: ${err instanceof Error ? err.message : String(err)}`);
        hasPrompts = false;
      }
    }
    
    let hasAgents = false;
    if (fs.existsSync(agentsDir)) {
      try {
        hasAgents = fs.readdirSync(agentsDir).some((f: string) => f.startsWith('bmad-agent') && f.endsWith('.md'));
      } catch (err) {
        log(outputChannel, `Failed to read ${agentsDir}: ${err instanceof Error ? err.message : String(err)}`);
        hasAgents = false;
      }
    }

    if (hasBmadDir && !hasPrompts && !hasAgents) {
      log(outputChannel, 'Prompt integrity check: _bmad/ exists but .github/prompts/ and .github/agents/ missing — notifying user.');
      vscode.window.showWarningMessage(
        'BMAD Copilot: Prompt files missing. Use @bmad /update or run `npx bmad-copilot-adapter update` to sync.',
        'Run Update',
      ).then((choice) => {
        if (choice === 'Run Update') {
          vscode.commands.executeCommand('bmad-copilot.update');
        }
      });
    } else if (!hasBmadDir) {
      log(outputChannel, 'Prompt integrity check: No _bmad/ found. BMAD not installed.');
    } else {
      log(outputChannel, 'Prompt integrity check: OK.');
    }
  }

  /* -------------------------------------------------------------- */
  /*  Registered commands                                            */
  /* -------------------------------------------------------------- */

  // Manual rescan
  context.subscriptions.push(
    vscode.commands.registerCommand('bmad-copilot.rescan', async () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showWarningMessage('BMAD Copilot: No workspace folder is open.');
        return;
      }
      const count = await performScan(registry, root, outputChannel);
      vscode.window.showInformationMessage(`BMAD Copilot: Scanned ${count} commands.`);
    }),
  );

  // Update command — invalidate + rescan + notify
  context.subscriptions.push(
    vscode.commands.registerCommand('bmad-copilot.update', async () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showWarningMessage('BMAD Copilot: No workspace folder is open.');
        return;
      }
      log(outputChannel, 'Update command triggered — invalidating and rescanning…');
      registry.invalidate();
      const count = await performScan(registry, root, outputChannel);
      vscode.window.showInformationMessage(`BMAD Copilot: Updated — ${count} commands refreshed.`);
    }),
  );

  // Open install terminal
  context.subscriptions.push(
    vscode.commands.registerCommand('bmad-copilot.install', () => {
      const root = getWorkspaceRoot();
      if (!root) {
        vscode.window.showWarningMessage('BMAD Copilot: No workspace folder is open.');
        return;
      }
      cliBridge.openTerminal(['install', '--tools', 'github-copilot'], root);
    }),
  );

  /* -------------------------------------------------------------- */
  /*  File watchers                                                  */
  /* -------------------------------------------------------------- */

  if (workspaceRoot) {
    // Watch _bmad/ and .github/ for changes
    const patterns = [
      new vscode.RelativePattern(workspaceRoot, '_bmad/**'),
      new vscode.RelativePattern(workspaceRoot, '.github/prompts/**'),
      new vscode.RelativePattern(workspaceRoot, '.github/agents/**'),
    ];

    let scanTimer: ReturnType<typeof setTimeout> | undefined;
    const debouncedScan = () => {
      if (scanTimer) clearTimeout(scanTimer);
      scanTimer = setTimeout(async () => {
        log(outputChannel, 'File change detected — rescanning…');
        const root = getWorkspaceRoot();
        if (root) await performScan(registry, root, outputChannel);
      }, 2000);
    };

    for (const pattern of patterns) {
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);
      watcher.onDidChange(debouncedScan);
      watcher.onDidCreate(debouncedScan);
      watcher.onDidDelete(debouncedScan);
      context.subscriptions.push(watcher);
    }

    log(outputChannel, 'File watchers on _bmad/ and .github/ registered.');
  }

  /* -------------------------------------------------------------- */
  /*  Configuration change listener                                  */
  /* -------------------------------------------------------------- */

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration(async (e) => {
      if (e.affectsConfiguration('bmad')) {
        log(outputChannel, 'Configuration changed — rescanning…');
        const root = getWorkspaceRoot();
        if (root) await performScan(registry, root, outputChannel);
      }
    }),
  );

  log(outputChannel, 'BMAD Copilot Adapter activated ✓');
}

/* ------------------------------------------------------------------ */
/*  deactivate                                                        */
/* ------------------------------------------------------------------ */

/** Extension deactivation hook. */
export function deactivate(): void {
  // All disposables are managed via context.subscriptions.
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Scan the workspace for official BMAD prompt files and build the
 * command registry.
 *
 * This function reads `.github/prompts/` and `.github/agents/` as-is.
 * It does NOT mirror, convert, or rewrite any files. The official
 * `npx bmad-method install` is the sole source of truth.
 */
async function performScan(
  registry: CommandRegistry,
  workspaceRoot: string,
  outputChannel: vscode.OutputChannel,
): Promise<number> {
  const config = vscode.workspace.getConfiguration('bmad');
  const configuredBmadDir = config.get<string>('bmadDir');

  try {
    const state = await registry.scan(workspaceRoot, configuredBmadDir || undefined);
    if (!state) {
      log(outputChannel, 'Scan returned null — _bmad/ not found.');
      return 0;
    }
    log(
      outputChannel,
      `Scan complete: ${state.commands.size} commands, ` +
        `${state.promptFiles.size} prompt files, ` +
        `modules=[${state.modules.join(', ')}]`,
    );
    return state.commands.size;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    log(outputChannel, `Scan failed: ${msg}`);
    vscode.window.showWarningMessage(`BMAD Copilot: scan failed — ${msg}`);
    return 0;
  }
}

/**
 * Locate the `_bmad` directory in the workspace.
 *
 * @param workspaceRoot - Absolute path to the workspace root.
 * @returns Absolute path to `_bmad`, or `null` if not found.
 */
function findBmadDir(workspaceRoot: string): string | null {
  const candidate = path.join(workspaceRoot, '_bmad');
  if (fs.existsSync(candidate)) return candidate;
  const parent = path.dirname(workspaceRoot);
  if (parent !== workspaceRoot) {
    const parentCandidate = path.join(parent, '_bmad');
    if (fs.existsSync(parentCandidate)) return parentCandidate;
  }
  return null;
}

/**
 * Get the first workspace folder's filesystem path.
 *
 * @returns Absolute path to the workspace root, or `undefined` if no workspace is open.
 */
function getWorkspaceRoot(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
}

/**
 * Write a timestamped log message to the output channel.
 *
 * @param channel - VS Code output channel.
 * @param message - Message to log.
 */
function log(channel: vscode.OutputChannel, message: string): void {
  const ts = new Date().toISOString();
  channel.appendLine(`[${ts}] ${message}`);
}
