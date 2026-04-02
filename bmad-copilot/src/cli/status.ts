/**
 * @fileoverview Status command — show BMAD installation diagnostics.
 *
 * Checks the workspace for:
 * - `_bmad/` directory and modules
 * - `.github/prompts/` and `.github/agents/` BMAD files
 * - `claude-code` source availability (informational)
 * - VS Code CLI and extension status
 * - Manifest CSV health
 *
 * @module cli/status
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as cp from 'node:child_process';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface StatusOptions {
  /** Working directory (project root). */
  cwd: string;
}

/* ------------------------------------------------------------------ */
/*  Pretty output helpers                                             */
/* ------------------------------------------------------------------ */

const FMT = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

/* ------------------------------------------------------------------ */
/*  Status command                                                    */
/* ------------------------------------------------------------------ */

export async function status(options: StatusOptions): Promise<void> {
  const { cwd } = options;

  console.log('');
  console.log(FMT.bold('  BMAD Copilot Adapter — Status'));
  console.log(FMT.dim('  ─────────────────────────────'));
  console.log('');

  // ── 1. Node.js ──────────────────────────────────────────────
  const nodeVersion = process.versions.node;
  const nodeMajor = parseInt(nodeVersion.split('.')[0], 10);
  printCheck('Node.js', `v${nodeVersion}`, nodeMajor >= 18);

  // ── 2. Working directory ────────────────────────────────────
  console.log(`  ${FMT.dim('Workspace:')} ${cwd}`);
  console.log('');

  // ── 3. _bmad/ directory ─────────────────────────────────────
  const bmadDir = path.join(cwd, '_bmad');
  const hasBmad = fs.existsSync(bmadDir);
  printCheck('_bmad/ directory', hasBmad ? 'Found' : 'Missing', hasBmad);

  if (hasBmad) {
    // Modules
    const modules = detectModules(bmadDir);
    console.log(`  ${FMT.dim('  Modules:')}  ${modules.length > 0 ? modules.join(', ') : 'none'}`);

    // Config
    const configDir = path.join(bmadDir, '_config');
    const hasConfig = fs.existsSync(configDir);
    printCheck('  _config/ manifests', hasConfig ? 'Found' : 'Missing', hasConfig);

    if (hasConfig) {
      const manifests = ['bmad-help.csv', 'agent-manifest.csv', 'workflow-manifest.csv', 'task-manifest.csv', 'tool-manifest.csv'];
      for (const m of manifests) {
        const mPath = path.join(configDir, m);
        const exists = fs.existsSync(mPath);
        const count = exists ? countCsvRows(mPath) : 0;
        console.log(`  ${FMT.dim(`    ${m}:`)} ${exists ? `${count} entries` : FMT.yellow('not found')}`);
      }
    }
  }

  console.log('');

  // ── 4. .github/prompts/ ─────────────────────────────────────
  const promptsDir = path.join(cwd, '.github', 'prompts');
  const promptFiles = listBmadFiles(promptsDir, '.prompt.md');
  printCheck('.github/prompts/', promptFiles.length > 0 ? `${promptFiles.length} file(s)` : 'Empty or missing', promptFiles.length > 0);

  // ── 5. .github/agents/ ──────────────────────────────────────
  const agentsDir = path.join(cwd, '.github', 'agents');
  const agentFiles = listBmadAgentFiles(agentsDir);
  printCheck('.github/agents/', agentFiles.length > 0 ? `${agentFiles.length} file(s)` : 'Empty or missing', agentFiles.length > 0);

  // ── 6. Claude-code source (informational only) ─────────────
  if (hasBmad) {
    const claudeSrc = path.join(bmadDir, 'ide', 'claude-code', 'prompts');
    const hasClaudeSrc = fs.existsSync(claudeSrc);
    printCheck('claude-code source', hasClaudeSrc ? 'Present (informational)' : 'Not found', hasClaudeSrc, true);
  }

  console.log('');

  // ── 7. VS Code CLI ──────────────────────────────────────────
  const vsCodeInfo = detectVsCode();
  printCheck('VS Code CLI', vsCodeInfo.version ?? 'Not found in PATH', vsCodeInfo.available, !vsCodeInfo.available);

  // ── 8. Extension installed ──────────────────────────────────
  if (vsCodeInfo.available) {
    const extInstalled = checkExtensionInstalled();
    printCheck('BMAD extension', extInstalled ? 'Installed' : 'Not installed', extInstalled, !extInstalled);
  }

  // ── Summary ─────────────────────────────────────────────────
  console.log('');
  console.log(FMT.dim('  ─────────────────────────────'));

  if (!hasBmad) {
    console.log('');
    console.log(`  ${FMT.yellow('⚠')} BMAD not installed. Run:`);
    console.log(FMT.dim('    npx bmad-copilot-adapter bootstrap'));
  } else if (promptFiles.length === 0 && agentFiles.length === 0) {
    console.log('');
    console.log(`  ${FMT.yellow('⚠')} No Copilot prompt files. Run:`);
    console.log(FMT.dim('    npx bmad-copilot-adapter update'));
  } else {
    console.log('');
    console.log(`  ${FMT.green('✔')} ${FMT.bold('BMAD Copilot Adapter ready')}`);
  }

  console.log('');
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

/**
 * Print a status check line with icon.
 *
 * @param label - Check label.
 * @param value - Check value/status.
 * @param ok - Whether the check passed.
 * @param isOptional - Whether this check is optional.
 */
function printCheck(label: string, value: string, ok: boolean, isOptional = false): void {
  const icon = ok ? FMT.green('✔') : isOptional ? FMT.yellow('◇') : FMT.red('✖');
  console.log(`  ${icon} ${label}: ${value}`);
}

/**
 * Detect installed BMAD modules in the _bmad directory.
 *
 * @param bmadDir - Absolute path to _bmad directory.
 * @returns Array of module names.
 */
function detectModules(bmadDir: string): string[] {
  try {
    return fs
      .readdirSync(bmadDir, { withFileTypes: true })
      .filter(
        (e) =>
          e.isDirectory() &&
          e.name !== '_config' &&
          e.name !== '_memory' &&
          e.name !== 'docs' &&
          e.name !== 'ide' &&
          !e.name.startsWith('.'),
      )
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * Count non-header rows in a CSV file.
 *
 * @param filePath - Absolute path to CSV file.
 * @returns Number of data rows (excluding header).
 */
function countCsvRows(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
    return Math.max(0, lines.length - 1);
  } catch {
    return 0;
  }
}

/**
 * List BMAD files in a directory with a specific suffix.
 *
 * @param dir - Absolute path to directory.
 * @param suffix - File suffix to filter by.
 * @returns Array of matching filenames.
 */
function listBmadFiles(dir: string, suffix: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.startsWith('bmad') && f.endsWith(suffix));
  } catch {
    return [];
  }
}

/**
 * List BMAD agent files in a directory.
 *
 * @param dir - Absolute path to directory.
 * @returns Array of agent filenames.
 */
function listBmadAgentFiles(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir).filter((f) => f.startsWith('bmad-agent') && f.endsWith('.md'));
  } catch {
    return [];
  }
}

/**
 * Detect VS Code CLI availability and version.
 *
 * @returns Object with availability status and version string.
 */
function detectVsCode(): { available: boolean; version: string | null } {
  const isWindows = process.platform === 'win32';

  try {
    // Avoid DEP0190: don't pass args array when shell is true
    const result = isWindows
      ? cp.spawnSync('code.cmd --version', { timeout: 10000, shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
      : cp.spawnSync('code', ['--version'], { timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] });

    if (result.status === 0) {
      const version = result.stdout?.toString().trim().split('\n')[0] ?? null;
      return { available: true, version };
    }
  } catch {
    // Fall through
  }

  return { available: false, version: null };
}

/**
 * Check if the BMAD Copilot Adapter extension is installed in VS Code.
 *
 * @returns `true` if extension is installed.
 */
function checkExtensionInstalled(): boolean {
  const isWindows = process.platform === 'win32';
  const extensionId = 'evil9369.bmad-copilot-adapter';

  try {
    // Avoid DEP0190: don't pass args array when shell is true
    const result = isWindows
      ? cp.spawnSync('code.cmd --list-extensions', { timeout: 15000, shell: true, stdio: ['ignore', 'pipe', 'pipe'] })
      : cp.spawnSync('code', ['--list-extensions'], { timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] });

    if (result.status === 0) {
      return result.stdout?.toString().toLowerCase().includes(extensionId.toLowerCase()) ?? false;
    }
  } catch {
    // Fall through
  }

  return false;
}
