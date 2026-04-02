/**
 * @fileoverview Command Registry — scans a BMAD installation and builds
 * the canonical {@link RegistryState} that all other layers consume.
 *
 * **Responsibilities**
 * 1. Locate the `_bmad/` directory in the workspace.
 * 2. Parse every manifest CSV (`bmad-help`, `agent-manifest`,
 *    `workflow-manifest`, `task-manifest`, `tool-manifest`).
 * 3. Derive a {@link BmadCommand} for each actionable entry.
 * 4. Expose the state via {@link CommandRegistry.state}.
 *
 * **Design rules**
 * - Zero hard-coded commands — everything is discovered at runtime.
 * - Manifest schemas are defined in {@link types}.
 * - The registry never mutates BMAD files.
 *
 * @module commandRegistry
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type {
  AgentManifestEntry,
  BmadCommand,
  BmadHelpEntry,
  PromptPattern,
  RegistryState,
  TaskToolManifestEntry,
  WorkflowManifestEntry,
} from './types.js';

/* ------------------------------------------------------------------ */
/*  CSV parsing (minimal, zero-dependency)                            */
/* ------------------------------------------------------------------ */

/**
 * Parse a CSV string with header row into an array of column→value objects.
 *
 * Handles double-quoted fields and embedded commas — the same subset
 * that the core BMAD installer relies on.
 *
 * @param csv - Raw CSV text.
 * @returns Array of records keyed by header column names.
 */
function parseCsv<T extends Record<string, string>>(csv: string): T[] {
  const lines = csv.split('\n').filter((l) => l.trim() && !l.startsWith('#'));
  if (lines.length < 2) {
    return [];
  }

  // Trim headers to handle CRLF line endings on Windows
  const headers = parseCsvLine(lines[0]).map(h => h.trim());
  const records: T[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.length === 0) {
      continue;
    }
    const record: Record<string, string> = {};
    for (let h = 0; h < headers.length; h++) {
      record[headers[h]] = (values[h] ?? '').trim();
    }
    records.push(record as T);
  }
  return records;
}

/**
 * Split a single CSV line into field values, respecting double-quoted
 * fields that may contain commas.
 *
 * @param line - A single CSV line.
 * @returns Array of unquoted field values.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

/* ------------------------------------------------------------------ */
/*  Slash-name ↔ CLI syntax helpers                                   */
/* ------------------------------------------------------------------ */

/**
 * Convert a BMAD CLI colon-style command to a Copilot-friendly slash
 * name.
 *
 * @example
 * cliToSlash('bmad:bmm:create-prd') // → 'bmad-bmm-create-prd'
 *
 * @param cli - Colon-delimited CLI command.
 * @returns Dash-delimited slash name.
 */
export function cliToSlash(cli: string): string {
  return cli.replaceAll(':', '-');
}

/**
 * Convert a Copilot slash-name back to BMAD CLI colon syntax.
 *
 * The algorithm is intentionally conservative: it only replaces the
 * structural dashes that separate `bmad`, module, type-prefix
 * (`agent`), and the trailing name — everything else stays as-is.
 *
 * **Limitation:** For core agents with hyphenated names (e.g., `tech-writer`),
 * the slash name `bmad-agent-tech-writer` is ambiguous and may be incorrectly
 * parsed as module=tech, name=writer. This affects only the display `cliSyntax`
 * field and does not impact command execution.
 *
 * @example
 * slashToCli('bmad-bmm-create-prd') // → 'bmad:bmm:create-prd'
 * slashToCli('bmad-agent-bmm-pm')   // → 'bmad:agent:bmm:pm'
 * slashToCli('bmad-help')           // → 'bmad:help'
 *
 * @param slash - Dash-delimited slash name.
 * @returns Colon-delimited CLI command.
 */
export function slashToCli(slash: string): string {
  // Remove leading '/' if present
  const clean = slash.startsWith('/') ? slash.slice(1) : slash;

  const parts = clean.split('-');
  if (parts[0] !== 'bmad') {
    return clean;
  }

  // Agent pattern: bmad-agent-<module>-<name>
  if (parts[1] === 'agent') {
    if (parts.length >= 4) {
      const module = parts[2];
      const name = parts.slice(3).join('-');
      return `bmad:agent:${module}:${name}`;
    }
    // Core agent: bmad-agent-<name>
    return `bmad:agent:${parts.slice(2).join('-')}`;
  }

  // Core task/tool with no module: bmad-<name>
  if (parts.length === 2) {
    return `bmad:${parts[1]}`;
  }

  // Module workflow: bmad-<module>-<workflow-name>
  const module = parts[1];
  const rest = parts.slice(2).join('-');
  return `bmad:${module}:${rest}`;
}

/* ------------------------------------------------------------------ */
/*  Prompt-pattern detection                                          */
/* ------------------------------------------------------------------ */

/**
 * Determine the prompt-injection pattern for a workflow based on its
 * file extension, matching the four patterns from the official
 * `github-copilot.js` installer.
 *
 * | Extension | Pattern          |
 * |-----------|------------------|
 * | `.md`     | md-workflow      |
 * | `.yaml`   | yaml-workflow    |
 * | `.xml`    | task             |
 *
 * @param workflowFile - Relative path to the workflow file.
 * @returns The applicable {@link PromptPattern}.
 */
function detectPattern(workflowFile: string): PromptPattern {
  if (workflowFile.endsWith('.yaml') || workflowFile.endsWith('.yml')) {
    return 'yaml-workflow';
  }
  if (workflowFile.endsWith('.xml')) {
    return 'task';
  }
  return 'md-workflow';
}

/* ------------------------------------------------------------------ */
/*  CommandRegistry                                                   */
/* ------------------------------------------------------------------ */

/**
 * Scans a BMAD installation directory and produces an immutable
 * {@link RegistryState} containing every discoverable command.
 *
 * Usage:
 * ```ts
 * const reg = new CommandRegistry();
 * const state = await reg.scan('/path/to/project');
 * state.commands.forEach(cmd => console.log(cmd.slashName));
 * ```
 */
export class CommandRegistry {
  /** The last successful scan result. `null` until {@link scan} completes. */
  private _state: RegistryState | null = null;

  /** Read-only accessor for the current registry state. */
  get state(): RegistryState | null {
    return this._state;
  }

  /* -------------------------------------------------------------- */
  /*  Public API                                                    */
  /* -------------------------------------------------------------- */

  /**
   * Perform a full scan of the workspace to discover the BMAD
   * installation and build the command map.
   *
   * @param workspaceRoot - Absolute path to the VS Code workspace root.
   * @param overrideBmadDir - Optional explicit `_bmad` path (from config).
   * @returns The populated {@link RegistryState}, or `null` if no
   *          BMAD installation was found.
   */
  async scan(workspaceRoot: string, overrideBmadDir?: string): Promise<RegistryState | null> {
    const bmadDir = overrideBmadDir || this.findBmadDir(workspaceRoot);
    if (!bmadDir) {
      return null;
    }

    const configDir = path.join(bmadDir, '_config');
    if (!fs.existsSync(configDir)) {
      return null;
    }

    // --- Parse all manifests in parallel ---
    const [helpEntries, agents, workflows, tasks, tools] = await Promise.all([
      this.loadCsv<BmadHelpEntry>(path.join(configDir, 'bmad-help.csv')),
      this.loadCsv<AgentManifestEntry>(path.join(configDir, 'agent-manifest.csv')),
      this.loadCsv<WorkflowManifestEntry>(path.join(configDir, 'workflow-manifest.csv')),
      this.loadCsv<TaskToolManifestEntry>(path.join(configDir, 'task-manifest.csv')),
      this.loadCsv<TaskToolManifestEntry>(path.join(configDir, 'tool-manifest.csv')),
    ]);

    // --- Detect installed modules ---
    const modules = this.detectModules(bmadDir);

    // --- Build command map ---
    const commands = new Map<string, BmadCommand>();

    // 1. Commands from bmad-help.csv (primary source of truth)
    for (const entry of helpEntries) {
      this.registerHelpEntry(entry, commands);
    }

    // 2. Agent activators — one per agent
    for (const agent of agents) {
      this.registerAgentActivator(agent, commands);
    }

    // 3. Tasks and tools from their respective manifests
    for (const task of tasks) {
      this.registerTaskTool(task, 'task', commands);
    }
    for (const tool of tools) {
      this.registerTaskTool(tool, 'tool', commands);
    }

    this._state = {
      bmadDir,
      commands,
      helpEntries,
      agents,
      workflows,
      tasks,
      tools,
      modules,
      promptFiles: new Map(),
      hasCopilotFiles: false,
      lastScan: new Date().toISOString(),
    };

    // --- Scan .github/prompts/ and .github/agents/ ---
    // Use workspaceRoot directly instead of deriving from bmadDir
    // to support overrideBmadDir pointing to non-standard locations
    this.scanCopilotPromptFiles(workspaceRoot, commands);

    return this._state;
  }

  /**
   * Invalidate (clear) the cached registry state.
   *
   * After calling this, {@link state} returns `null` until the next
   * {@link scan} completes. Use this before a forced rescan to ensure
   * stale data is not served.
   */
  invalidate(): void {
    this._state = null;
  }

  /**
   * Convenience method: invalidate + scan in one call.
   *
   * Equivalent to:
   * ```ts
   * registry.invalidate();
   * await registry.scan(workspaceRoot, overrideBmadDir);
   * ```
   *
   * @param workspaceRoot - Absolute workspace root path.
   * @param overrideBmadDir - Optional explicit `_bmad` path.
   * @returns The new {@link RegistryState}, or `null`.
   */
  async rescan(workspaceRoot: string, overrideBmadDir?: string): Promise<RegistryState | null> {
    this.invalidate();
    return this.scan(workspaceRoot, overrideBmadDir);
  }

  /**
   * Look up a command by its slash name.
   *
   * @param slashName - Command name (with or without leading `/`).
   * @returns The matched {@link BmadCommand} or `undefined`.
   */
  resolve(slashName: string): BmadCommand | undefined {
    const key = slashName.startsWith('/') ? slashName.slice(1) : slashName;
    return this._state?.commands.get(key);
  }

  /**
   * Fuzzy search across registered commands.
   *
   * Returns commands whose `slashName` or `description` contains the
   * query string (case-insensitive).
   *
   * @param query - Free-text search string.
   * @param limit - Maximum results to return (default 20).
   * @returns Matching commands in Map iteration order (not scored by relevance).
   */
  search(query: string, limit = 20): BmadCommand[] {
    if (!this._state) {
      return [];
    }
    const q = query.toLowerCase();
    const results: BmadCommand[] = [];
    for (const cmd of this._state.commands.values()) {
      if (
        cmd.slashName.toLowerCase().includes(q) ||
        cmd.description.toLowerCase().includes(q)
      ) {
        results.push(cmd);
      }
      if (results.length >= limit) {
        break;
      }
    }
    return results;
  }

  /* -------------------------------------------------------------- */
  /*  Private helpers                                               */
  /* -------------------------------------------------------------- */

  /**
   * Locate the `_bmad` directory by walking up from the workspace root.
   *
   * @param startDir - Starting directory.
   * @returns Absolute path to `_bmad`, or `null` if not found.
   */
  private findBmadDir(startDir: string): string | null {
    const candidate = path.join(startDir, '_bmad');
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    // Walk up one level (mono-repo scenario)
    const parent = path.dirname(startDir);
    if (parent !== startDir) {
      const parentCandidate = path.join(parent, '_bmad');
      if (fs.existsSync(parentCandidate)) {
        return parentCandidate;
      }
    }
    return null;
  }

  /**
   * Read and parse a CSV manifest file.
   *
   * @param filePath - Absolute path to the CSV file.
   * @returns Parsed records, or an empty array if the file is missing.
   */
  private async loadCsv<T extends { [key: string]: string }>(filePath: string): Promise<T[]> {
    try {
      let content = await fs.promises.readFile(filePath, 'utf8');
      // Strip UTF-8 BOM (common on Windows-generated CSV files)
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return parseCsv<T>(content);
    } catch {
      return [];
    }
  }

  /**
   * Detect installed module directories under `_bmad/`.
   *
   * @param bmadDir - Absolute path to `_bmad`.
   * @returns Array of module directory names.
   */
  private detectModules(bmadDir: string): string[] {
    try {
      return fs
        .readdirSync(bmadDir, { withFileTypes: true })
        .filter(
          (e) =>
            e.isDirectory() &&
            e.name !== '_config' &&
            e.name !== '_memory' &&
            e.name !== 'docs' &&
            !e.name.startsWith('.'),
        )
        .map((e) => e.name);
    } catch {
      return [];
    }
  }

  /**
   * Register a command derived from a `bmad-help.csv` row.
   *
   * @param entry - Parsed CSV row.
   * @param map   - Target command map.
   */
  private registerHelpEntry(
    entry: BmadHelpEntry,
    map: Map<string, BmadCommand>,
  ): void {
    const commandName = entry.command?.trim();
    if (!commandName) {
      // Agent-only entry (e.g. tech-writer commands) — skip static
      // registration; these are handled via agent activators or the
      // catch-all `/run` command.
      return;
    }

    const workflowFile = entry['workflow-file']?.trim() || '';
    const pattern = workflowFile ? detectPattern(workflowFile) : 'md-workflow';

    const cmd: BmadCommand = {
      slashName: commandName,
      cliSyntax: slashToCli(commandName),
      description: entry.description || entry.name || commandName,
      category: 'workflow',
      module: entry.module || 'core',
      filePath: workflowFile,
      agentName: entry['agent-name'] || '',
      agentTitle: entry['agent-title'] || '',
      pattern,
    };

    // First write wins — bmad-help.csv is authoritative
    if (!map.has(cmd.slashName)) {
      map.set(cmd.slashName, cmd);
    }
  }

  /**
   * Register an agent-activator command from `agent-manifest.csv`.
   *
   * The naming convention follows the BMAD standard:
   * ```
   * bmad-agent-<module>-<name>   (module agents)
   * bmad-agent-<name>            (core agents)
   * ```
   *
   * @param agent - Parsed CSV row.
   * @param map   - Target command map.
   */
  private registerAgentActivator(
    agent: AgentManifestEntry,
    map: Map<string, BmadCommand>,
  ): void {
    const mod = agent.module || 'core';
    const slashName =
      mod === 'core'
        ? `bmad-agent-${agent.name}`
        : `bmad-agent-${mod}-${agent.name}`;

    const cmd: BmadCommand = {
      slashName,
      cliSyntax: slashToCli(slashName),
      description:
        `${agent.icon || ''} ${agent.displayName || agent.name} — ${agent.title || agent.role || 'Agent'}`.trim(),
      category: 'agent',
      module: mod,
      filePath: agent.path || '',
      agentName: agent.name,
      agentTitle: `${agent.icon || ''} ${agent.title || ''}`.trim(),
      pattern: 'agent-activator',
    };

    if (!map.has(cmd.slashName)) {
      map.set(cmd.slashName, cmd);
    }
  }

  /**
   * Register a standalone task or tool from its manifest CSV.
   *
   * Naming: `bmad-<name>` (core) or `bmad-<module>-<name>`.
   *
   * @param entry    - Parsed CSV row.
   * @param category - `'task'` or `'tool'`.
   * @param map      - Target command map.
   */
  private registerTaskTool(
    entry: TaskToolManifestEntry,
    category: 'task' | 'tool',
    map: Map<string, BmadCommand>,
  ): void {
    const mod = entry.module || 'core';
    const slashName =
      mod === 'core'
        ? `bmad-${entry.name}`
        : `bmad-${mod}-${entry.name}`;

    const cmd: BmadCommand = {
      slashName,
      cliSyntax: slashToCli(slashName),
      description: entry.description || entry.displayName || entry.name,
      category,
      module: mod,
      filePath: entry.path || '',
      agentName: '',
      agentTitle: '',
      pattern: 'task',
    };

    // Don't overwrite commands already registered from bmad-help.csv
    if (!map.has(cmd.slashName)) {
      map.set(cmd.slashName, cmd);
    }
  }

  /**
   * Scan `.github/prompts/` and `.github/agents/` for official BMAD
   * Copilot prompt files generated by `bmad-method install --tools github-copilot`.
   *
   * Discovered files are recorded in `_state.promptFiles` and linked
   * back to matching commands via `BmadCommand.promptFilePath`.
   *
   * @param workspaceRoot - Absolute path to the workspace root.
   * @param commands      - The command map to annotate.
   */
  private scanCopilotPromptFiles(
    workspaceRoot: string,
    commands: Map<string, BmadCommand>,
  ): void {
    if (!this._state) return;

    const promptFiles = this._state.promptFiles;
    let foundAny = false;

    // Scan .github/prompts/*.prompt.md
    const promptsDir = path.join(workspaceRoot, '.github', 'prompts');
    if (fs.existsSync(promptsDir)) {
      try {
        for (const file of fs.readdirSync(promptsDir)) {
          if (file.startsWith('bmad') && file.endsWith('.prompt.md')) {
            // "bmad-bmm-create-prd.prompt.md" → "bmad-bmm-create-prd"
            const slashName = file.replace(/\.prompt\.md$/, '');
            const absPath = path.join(promptsDir, file);
            promptFiles.set(slashName, absPath);
            foundAny = true;

            // Link to existing command if present
            const cmd = commands.get(slashName);
            if (cmd) {
              cmd.promptFilePath = absPath;
            }
          }
        }
      } catch {
        // Ignore permission or access errors on .github/prompts/
      }
    }

    // Scan .github/agents/bmad-agent-*.md
    const agentsDir = path.join(workspaceRoot, '.github', 'agents');
    if (fs.existsSync(agentsDir)) {
      try {
        for (const file of fs.readdirSync(agentsDir)) {
          if (file.startsWith('bmad-agent') && file.endsWith('.md')) {
            // "bmad-agent-bmm-pm.md" → "bmad-agent-bmm-pm"
            const slashName = file.replace(/\.md$/, '');
            const absPath = path.join(agentsDir, file);
            promptFiles.set(slashName, absPath);
            foundAny = true;

            // Link to existing agent command if present
            const cmd = commands.get(slashName);
            if (cmd) {
              cmd.promptFilePath = absPath;
            }
          }
        }
      } catch {
        // Ignore permission or access errors on .github/agents/
      }
    }

    this._state.hasCopilotFiles = foundAny;
  }
}
