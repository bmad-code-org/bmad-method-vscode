/**
 * @fileoverview BMAD Runtime — Legacy prompt builder (DEPRECATED).
 *
 * @deprecated This module is a **fallback only**. It is used when the
 * workspace was installed without `--tools github-copilot`, meaning
 * `.github/prompts/*.prompt.md` and `.github/agents/*.agent.md` files
 * do not exist.
 *
 * The preferred path is the **Prompt File Executor** in
 * {@link ChatBridge}, which reads official prompt files and passes
 * them directly to the Copilot LLM without any transformation.
 *
 * When `.github/prompts/` files are present, this module is never
 * invoked.
 *
 * **Original Responsibilities** (retained for fallback)
 * 1. Read the target workflow / agent / task file from disk.
 * 2. Assemble a prompt using patterns derived from the official BMAD
 *    GitHub Copilot installer (`github-copilot.js`).
 * 3. Return the composed prompt string.
 *
 * @module bmadRuntime
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { BmadCommand, RegistryState } from './types.js';

/* ------------------------------------------------------------------ */
/*  Constants                                                         */
/* ------------------------------------------------------------------ */

/** Placeholder used in BMAD files that resolves to workspace root. */
const PROJECT_ROOT_TOKEN = '{project-root}';

/**
 * Default BMAD folder name. The installer always creates `_bmad/`.
 */
const BMAD_FOLDER_NAME = '_bmad';

/* ------------------------------------------------------------------ */
/*  BmadRuntime                                                       */
/* ------------------------------------------------------------------ */

/**
 * Composes prompts that mirror the official BMAD Copilot prompt
 * templates without modifying any BMAD files.
 *
 * Each prompt pattern corresponds to a pattern from the official
 * `github-copilot.js` installer:
 *
 * | Pattern          | Official pattern | When used                          |
 * |------------------|------------------|------------------------------------|
 * | md-workflow      | A                | `.md` workflow files               |
 * | yaml-workflow    | B                | `.yaml` workflows via engine       |
 * | task             | A-variant        | `.xml` / `.md` task files          |
 * | agent-only       | C                | Tech-writer style agent commands   |
 * | agent-activator  | D                | Load agent persona directly        |
 *
 * @deprecated Use the Prompt File Executor path in {@link ChatBridge}
 * instead. This class is only retained as a fallback for workspaces
 * installed without `--tools github-copilot`.
 */
export class BmadRuntime {
  /** The workspace root for `{project-root}` resolution. */
  private readonly workspaceRoot: string;
  /** Reference to the registry state. */
  private readonly registryState: RegistryState;

  /**
   * Create a BmadRuntime bound to a workspace and registry state.
   *
   * @param workspaceRoot  - Absolute path to the VS Code workspace root.
   * @param registryState  - Fully populated {@link RegistryState} from the registry scan.
   */
  constructor(workspaceRoot: string, registryState: RegistryState) {
    this.workspaceRoot = workspaceRoot;
    this.registryState = registryState;
  }

  /* -------------------------------------------------------------- */
  /*  Public API                                                    */
  /* -------------------------------------------------------------- */

  /**
   * Build the complete prompt for a given {@link BmadCommand}.
   *
   * The returned string is ready to be prepended to the LLM message
   * array as a system/user prompt.
   *
   * @param command   - The resolved BMAD command.
   * @param userInput - The user's free-text from the chat input.
   * @returns The assembled prompt string.
   */
  buildPrompt(command: BmadCommand, userInput: string): string {
    switch (command.pattern) {
      case 'md-workflow':
        return this.buildMdWorkflowPrompt(command, userInput);
      case 'yaml-workflow':
        return this.buildYamlWorkflowPrompt(command, userInput);
      case 'task':
        return this.buildTaskPrompt(command, userInput);
      case 'agent-activator':
        return this.buildAgentActivatorPrompt(command, userInput);
      case 'agent-only':
        return this.buildAgentOnlyPrompt(command, userInput);
      default:
        return this.buildFallbackPrompt(command, userInput);
    }
  }

  /**
   * Build the contextual help prompt that mimics `/bmad-help`.
   *
   * Reads the BMAD help task and injects the bmad-help.csv catalog
   * as context, matching the official help task execution flow.
   *
   * @param userInput - Optional topic or question from the user.
   * @returns Assembled help prompt.
   */
  buildHelpPrompt(userInput: string): string {
    const bmadDir = this.registryState.bmadDir;
    const helpTaskPath = path.join(bmadDir, 'core', 'tasks', 'help.md');
    const helpCsvPath = path.join(bmadDir, '_config', 'bmad-help.csv');

    let helpTask = '';
    if (fs.existsSync(helpTaskPath)) {
      helpTask = this.readAndResolve(helpTaskPath);
    }

    let helpCsv = '';
    if (fs.existsSync(helpCsvPath)) {
      helpCsv = fs.readFileSync(helpCsvPath, 'utf8');
    }

    const configPrompt = this.buildConfigLoadLine();
    const commandListing = this.buildCommandListing();

    return [
      `# BMAD Help — Runtime Context`,
      '',
      configPrompt,
      '',
      '## Help Task Instructions',
      '',
      helpTask || '*Help task file not found. Providing catalog-only guidance.*',
      '',
      '## BMAD Help Catalog (bmad-help.csv)',
      '',
      '```csv',
      helpCsv || 'No bmad-help.csv found.',
      '```',
      '',
      '## Available Slash Commands',
      '',
      commandListing,
      '',
      '## User Query',
      '',
      userInput || 'Show me what workflows and next steps are available.',
    ].join('\n');
  }

  /**
   * Build a prompt listing all installed agents.
   *
   * @returns Formatted agent listing prompt.
   */
  buildAgentListingPrompt(): string {
    const { agents } = this.registryState;
    if (agents.length === 0) {
      return 'No BMAD agents are currently installed.';
    }

    const lines = ['# Installed BMAD Agents\n'];
    const byModule = new Map<string, typeof agents>();
    for (const a of agents) {
      const mod = a.module || 'core';
      if (!byModule.has(mod)) {
        byModule.set(mod, []);
      }
      byModule.get(mod)!.push(a);
    }

    for (const [mod, group] of byModule) {
      lines.push(`## Module: ${mod.toUpperCase()}\n`);
      lines.push('| Agent | Persona | Title | Capabilities |');
      lines.push('|---|---|---|---|');
      for (const a of group) {
        const icon = a.icon || '';
        lines.push(
          `| ${a.name} | ${a.displayName} | ${icon} ${a.title} | ${a.capabilities} |`,
        );
      }
      lines.push('');
    }

    lines.push(
      '\n> To activate an agent, use `/bmad-agent-<module>-<name>` ' +
        '(e.g. `/bmad-agent-bmm-pm`).',
    );
    return lines.join('\n');
  }

  /**
   * Build a prompt listing all installed workflows.
   *
   * @returns Formatted workflow listing prompt.
   */
  buildWorkflowListingPrompt(): string {
    const { workflows, helpEntries } = this.registryState;
    if (workflows.length === 0 && helpEntries.length === 0) {
      return 'No BMAD workflows are currently installed.';
    }

    const lines = ['# Installed BMAD Workflows\n'];

    // Use help entries for richer data when available
    if (helpEntries.length > 0) {
      const byPhase = new Map<string, typeof helpEntries>();
      for (const h of helpEntries) {
        const phase = h.phase || 'anytime';
        if (!byPhase.has(phase)) {
          byPhase.set(phase, []);
        }
        byPhase.get(phase)!.push(h);
      }

      for (const [phase, group] of byPhase) {
        lines.push(`## Phase: ${phase}\n`);
        lines.push('| Command | Name | Agent | Required | Description |');
        lines.push('|---|---|---|---|---|');
        for (const h of group) {
          const cmd = h.command
            ? `\`/${h.command}\``
            : `*${h.code || 'n/a'}*`;
          const req = h.required === 'true' ? '✅' : '';
          lines.push(
            `| ${cmd} | ${h.name} | ${h['agent-title'] || h['agent-name'] || ''} | ${req} | ${h.description} |`,
          );
        }
        lines.push('');
      }
    } else {
      // Fallback to workflow-manifest only
      lines.push('| Name | Module | Description |');
      lines.push('|---|---|---|');
      for (const w of workflows) {
        lines.push(`| ${w.name} | ${w.module} | ${w.description} |`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Build a prompt listing all installed tasks and tools.
   *
   * @returns Formatted task/tool listing prompt.
   */
  buildTaskListingPrompt(): string {
    const { tasks, tools } = this.registryState;
    if (tasks.length === 0 && tools.length === 0) {
      return 'No BMAD tasks or tools are currently installed.';
    }

    const lines = ['# Installed BMAD Tasks & Tools\n'];

    if (tasks.length > 0) {
      lines.push('## Tasks\n');
      lines.push('| Name | Module | Description |');
      lines.push('|---|---|---|');
      for (const t of tasks) {
        lines.push(`| ${t.name} | ${t.module} | ${t.description} |`);
      }
      lines.push('');
    }

    if (tools.length > 0) {
      lines.push('## Tools\n');
      lines.push('| Name | Module | Description |');
      lines.push('|---|---|---|');
      for (const t of tools) {
        lines.push(`| ${t.name} | ${t.module} | ${t.description} |`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Build a status summary of the current BMAD installation.
   *
   * ⚠️ **SECURITY WARNING**: This function includes config.yaml excerpts
   * (up to 500 chars per module) in the status output sent to the LLM.
   * Ensure config files do not contain sensitive information.
   *
   * @returns Formatted status prompt.
   */
  buildStatusPrompt(): string {
    const s = this.registryState;
    const lines = [
      '# BMAD Installation Status\n',
      `- **BMAD Directory**: \`${s.bmadDir}\``,
      `- **Modules installed**: ${s.modules.join(', ') || 'none'}`,
      `- **Agents**: ${s.agents.length}`,
      `- **Workflows**: ${s.workflows.length}`,
      `- **Tasks**: ${s.tasks.length}`,
      `- **Tools**: ${s.tools.length}`,
      `- **Total commands**: ${s.commands.size}`,
      `- **Last scan**: ${s.lastScan}`,
    ];

    // Module config preview
    for (const mod of s.modules) {
      const configPath = path.join(s.bmadDir, mod, 'config.yaml');
      if (fs.existsSync(configPath)) {
        const excerpt = fs.readFileSync(configPath, 'utf8').slice(0, 500);
        lines.push(`\n### ${mod}/config.yaml (excerpt)\n`);
        lines.push('```yaml');
        lines.push(excerpt);
        lines.push('```');
      }
    }

    return lines.join('\n');
  }

  /* -------------------------------------------------------------- */
  /*  Pattern-specific prompt builders                              */
  /* -------------------------------------------------------------- */

  /**
   * Pattern A — MD workflows: load config, then follow the `.md` file
   * directly. Mirrors the official GitHub Copilot installer Pattern A.
   *
   * @param command   - Resolved command.
   * @param userInput - User's free text.
   * @returns Composed prompt.
   */
  private buildMdWorkflowPrompt(command: BmadCommand, userInput: string): string {
    const configLine = this.buildConfigLoadLine();
    const workflowContent = this.tryReadWorkflowFile(command.filePath);

    return [
      `# BMAD Workflow: ${command.description}`,
      `> Command: \`/${command.slashName}\` → CLI: \`${command.cliSyntax}\``,
      '',
      configLine,
      '',
      `## Instructions`,
      '',
      `Load and follow the workflow at ${this.resolveProjectRoot(command.filePath)}`,
      '',
      workflowContent
        ? `## Workflow Content\n\n${workflowContent}`
        : `*Could not read workflow file: ${command.filePath}*`,
      '',
      userInput ? `## User Input\n\n${userInput}` : '',
    ].join('\n');
  }

  /**
   * Pattern B — YAML workflows: load the workflow.xml engine, then
   * pass the `.yaml` config to it. Mirrors the official Pattern B.
   *
   * @param command   - Resolved command.
   * @param userInput - User's free text.
   * @returns Composed prompt.
   */
  private buildYamlWorkflowPrompt(command: BmadCommand, userInput: string): string {
    const configLine = this.buildConfigLoadLine();
    const bmadDir = this.registryState.bmadDir;
    const enginePath = path.join(bmadDir, 'core', 'tasks', 'workflow.xml');
    let engineContent = '';
    if (fs.existsSync(enginePath)) {
      engineContent = this.readAndResolve(enginePath);
    }
    const workflowConfig = this.tryReadWorkflowFile(command.filePath);

    return [
      `# BMAD Workflow (YAML Engine): ${command.description}`,
      `> Command: \`/${command.slashName}\` → CLI: \`${command.cliSyntax}\``,
      '',
      configLine,
      '',
      '## Step 1: Workflow Engine',
      '',
      `Load the workflow engine at ${this.resolveProjectRoot('_bmad/core/tasks/workflow.xml')}`,
      '',
      engineContent
        ? `### workflow.xml\n\n\`\`\`xml\n${engineContent}\n\`\`\``
        : '*Could not read workflow.xml engine.*',
      '',
      '## Step 2: Workflow Configuration',
      '',
      `Load and execute the workflow configuration at ${this.resolveProjectRoot(command.filePath)} using the engine from step 1.`,
      '',
      workflowConfig
        ? `### Workflow YAML\n\n\`\`\`yaml\n${workflowConfig}\n\`\`\``
        : `*Could not read workflow config: ${command.filePath}*`,
      '',
      userInput ? `## User Input\n\n${userInput}` : '',
    ].join('\n');
  }

  /**
   * Pattern A-variant — Tasks (XML/MD): load and execute directly.
   * Mirrors the task handling from the official installer.
   *
   * @param command   - Resolved command.
   * @param userInput - User's free text.
   * @returns Composed prompt.
   */
  private buildTaskPrompt(command: BmadCommand, userInput: string): string {
    const configLine = this.buildConfigLoadLine();
    const taskContent = this.tryReadWorkflowFile(command.filePath);

    return [
      `# BMAD Task: ${command.description}`,
      `> Command: \`/${command.slashName}\` → CLI: \`${command.cliSyntax}\``,
      '',
      configLine,
      '',
      `## Instructions`,
      '',
      `Load and execute the task at ${this.resolveProjectRoot(command.filePath)}`,
      '',
      taskContent
        ? `## Task Content\n\n${taskContent}`
        : `*Could not read task file: ${command.filePath}*`,
      '',
      userInput ? `## User Input\n\n${userInput}` : '',
    ].join('\n');
  }

  /**
   * Pattern D — Agent activator: load config, then activate the agent
   * persona. Mirrors the official Pattern D.
   *
   * @param command   - Resolved command.
   * @param userInput - User's free text.
   * @returns Composed prompt.
   */
  private buildAgentActivatorPrompt(command: BmadCommand, userInput: string): string {
    const configLine = this.buildConfigLoadLine();
    const agentContent = this.tryReadWorkflowFile(command.filePath);

    return [
      `# BMAD Agent Activation: ${command.agentTitle || command.agentName}`,
      `> Command: \`/${command.slashName}\` → CLI: \`${command.cliSyntax}\``,
      '',
      configLine,
      '',
      '## Instructions',
      '',
      `Load the full agent file from ${this.resolveProjectRoot(command.filePath)} and activate the persona.`,
      '',
      agentContent
        ? `## Agent Definition\n\n${agentContent}`
        : `*Could not read agent file: ${command.filePath}*`,
      '',
      userInput
        ? `## User Request\n\n${userInput}`
        : `Greet the user and present your capabilities.`,
    ].join('\n');
  }

  /**
   * Pattern C — Agent-only commands: load agent, invoke by code.
   * Used for tech-writer style commands with no standalone workflow file.
   *
   * @param command   - Resolved command.
   * @param userInput - User's free text.
   * @returns Composed prompt.
   */
  private buildAgentOnlyPrompt(command: BmadCommand, userInput: string): string {
    const configLine = this.buildConfigLoadLine();

    return [
      `# BMAD Agent Command: ${command.description}`,
      `> Command: \`/${command.slashName}\` → CLI: \`${command.cliSyntax}\``,
      '',
      configLine,
      '',
      '## Instructions',
      '',
      `1. Activate agent: ${command.agentName}`,
      `2. Execute the "${command.description}" action.`,
      '',
      userInput ? `## User Input\n\n${userInput}` : '',
    ].join('\n');
  }

  /**
   * Fallback prompt for commands whose pattern could not be determined.
   *
   * @param command   - Resolved command.
   * @param userInput - User's free text.
   * @returns Composed prompt.
   */
  private buildFallbackPrompt(command: BmadCommand, userInput: string): string {
    const content = this.tryReadWorkflowFile(command.filePath);

    return [
      `# BMAD: ${command.description}`,
      `> Command: \`/${command.slashName}\``,
      '',
      content || `*No file content available for: ${command.filePath}*`,
      '',
      userInput ? `## User Input\n\n${userInput}` : '',
    ].join('\n');
  }

  /* -------------------------------------------------------------- */
  /*  Utility methods                                               */
  /* -------------------------------------------------------------- */

  /**
   * Build the standard config-load line that prefixes most prompts.
   * Mirrors: "Load {project-root}/_bmad/bmm/config.yaml and store ALL
   * fields as session variables".
   *
   * Checks multiple config paths in priority order.
   *
   * ⚠️ **SECURITY WARNING**: This function reads the entire config.yaml
   * and includes it in the LLM prompt. **Never store sensitive data**
   * (API keys, passwords, secrets) in BMAD config files. Use environment
   * variables or secure credential stores instead.
   *
   * @returns Config-load instruction string.
   */
  private buildConfigLoadLine(): string {
    const bmadDir = this.registryState.bmadDir;
    const candidates = ['bmm/config.yaml', 'core/config.yaml'];

    for (const rel of candidates) {
      const abs = path.join(bmadDir, rel);
      if (fs.existsSync(abs)) {
        const content = fs.readFileSync(abs, 'utf8');
        return [
          `## Session Configuration`,
          '',
          `Load the following configuration and store ALL fields as session variables:`,
          '',
          '```yaml',
          content,
          '```',
        ].join('\n');
      }
    }

    return '> *No module config.yaml found. Session variables unavailable.*';
  }

  /**
   * Attempt to read a workflow/agent/task file from the `_bmad`
   * directory, resolving `{project-root}` tokens.
   *
   * @param relativePath - Path relative to workspace root (may start with `_bmad/`).
   * @returns File content with tokens resolved, or empty string on failure.
   */
  private tryReadWorkflowFile(relativePath: string): string {
    if (!relativePath) {
      return '';
    }

    // Normalise: strip leading {project-root}/ if present
    let cleanPath = relativePath.replace(/^\{project-root\}\//, '');
    // Also strip leading _bmad/ to avoid double-pathing
    // Check for _bmad/ or _bmad\ (not just _bmad prefix like _bmad_v2)
    if (!cleanPath.startsWith(BMAD_FOLDER_NAME + '/') && !cleanPath.startsWith(BMAD_FOLDER_NAME + '\\')) {
      cleanPath = path.join(BMAD_FOLDER_NAME, cleanPath);
    }

    const absPath = path.join(this.workspaceRoot, cleanPath);

    if (!fs.existsSync(absPath)) {
      // Try the raw path as fallback
      const rawAbs = path.join(this.workspaceRoot, relativePath);
      if (fs.existsSync(rawAbs)) {
        return this.readAndResolve(rawAbs);
      }
      return '';
    }

    return this.readAndResolve(absPath);
  }

  /**
   * Read a file and replace `{project-root}` with the actual workspace
   * root path.
   *
   * @param absPath - Absolute path to the file.
   * @returns File content with tokens resolved.
   */
  private readAndResolve(absPath: string): string {
    const content = fs.readFileSync(absPath, 'utf8');
    return content.replaceAll(PROJECT_ROOT_TOKEN, this.workspaceRoot);
  }

  /**
   * Prepend `{project-root}/` to a relative path for display purposes.
   *
   * @param relativePath - Relative file path.
   * @returns Path with `{project-root}` prefix.
   */
  private resolveProjectRoot(relativePath: string): string {
    if (relativePath.startsWith(PROJECT_ROOT_TOKEN)) {
      return relativePath;
    }
    return `${PROJECT_ROOT_TOKEN}/${relativePath}`;
  }

  /**
   * Build a compact listing of all registered slash commands,
   * grouped by category.
   *
   * @returns Formatted Markdown command listing.
   */
  private buildCommandListing(): string {
    const { commands } = this.registryState;
    const byCategory = new Map<string, BmadCommand[]>();

    for (const cmd of commands.values()) {
      if (!byCategory.has(cmd.category)) {
        byCategory.set(cmd.category, []);
      }
      byCategory.get(cmd.category)!.push(cmd);
    }

    const lines: string[] = [];
    const order: Array<BmadCommand['category']> = [
      'workflow',
      'agent',
      'task',
      'tool',
      'core',
    ];

    for (const cat of order) {
      const group = byCategory.get(cat);
      if (!group || group.length === 0) {
        continue;
      }
      lines.push(`### ${cat.charAt(0).toUpperCase() + cat.slice(1)}s\n`);
      for (const cmd of group) {
        lines.push(`- \`/${cmd.slashName}\` — ${cmd.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }
}
