/**
 * @fileoverview Shared type definitions for the BMAD Copilot Adapter.
 *
 * All interfaces mirror the CSV manifest schemas produced by
 * `bmad-method` CLI v6 — no fields are invented.
 *
 * @module types
 */

/* ------------------------------------------------------------------ */
/*  bmad-help.csv row                                                 */
/* ------------------------------------------------------------------ */

/**
 * Represents a single row from the merged `bmad-help.csv` catalog.
 *
 * CSV header (16 columns):
 * ```
 * module, phase, name, code, sequence, workflow-file, command,
 * required, agent-name, agent-command, agent-display-name,
 * agent-title, options, description, output-location, outputs
 * ```
 */
export interface BmadHelpEntry {
  [key: string]: string;
  /** Module code the workflow belongs to (e.g. "bmm", "bmb"). Empty for universal/core tools. */
  module: string;
  /** Lifecycle phase (e.g. "1-discover", "2-define"). Empty for anytime tools. */
  phase: string;
  /** Human-readable workflow name (e.g. "Create PRD"). */
  name: string;
  /** Short mnemonic code (e.g. "CP"). */
  code: string;
  /** Numeric ordering within the phase. */
  sequence: string;
  /** Relative path to the workflow/task file (e.g. "_bmad/bmm/workflows/…"). */
  'workflow-file': string;
  /** Slash-command name without leading `/` (e.g. "bmad-bmm-create-prd"). Empty for agent-only commands. */
  command: string;
  /** Whether this workflow is required before proceeding ("true" / "false"). */
  required: string;
  /** Internal agent name (e.g. "pm"). */
  'agent-name': string;
  /** CLI-style agent command (e.g. "bmad:bmm:agent:pm"). */
  'agent-command': string;
  /** Display name of the agent persona (e.g. "Paige"). */
  'agent-display-name': string;
  /** Agent title with icon (e.g. "📋 Project Manager"). */
  'agent-title': string;
  /** Comma-separated option flags (e.g. "#yolo"). */
  options: string;
  /** One-line description of the workflow. */
  description: string;
  /** Variable path pattern for output artifacts. */
  'output-location': string;
  /** Expected output filenames/patterns. */
  outputs: string;
}

/* ------------------------------------------------------------------ */
/*  agent-manifest.csv row                                            */
/* ------------------------------------------------------------------ */

/**
 * Represents a single row from `agent-manifest.csv`.
 *
 * CSV header (11 columns):
 * ```
 * name, displayName, title, icon, capabilities, role,
 * identity, communicationStyle, principles, module, path
 * ```
 */
export interface AgentManifestEntry {
  [key: string]: string;
  /** Internal agent identifier (e.g. "pm"). */
  name: string;
  /** Public-facing persona name (e.g. "Paige"). */
  displayName: string;
  /** Short role title (e.g. "Project Manager"). */
  title: string;
  /** Emoji icon (e.g. "📋"). */
  icon: string;
  /** Comma-separated capability keywords. */
  capabilities: string;
  /** Persona role description. */
  role: string;
  /** Persona identity statement. */
  identity: string;
  /** Communication style tags. */
  communicationStyle: string;
  /** Core principles. */
  principles: string;
  /** Owning module code (e.g. "bmm", "core"). */
  module: string;
  /** Relative file path to compiled agent markdown. */
  path: string;
}

/* ------------------------------------------------------------------ */
/*  workflow-manifest.csv row                                         */
/* ------------------------------------------------------------------ */

/**
 * Represents a single row from `workflow-manifest.csv`.
 *
 * CSV header (4 columns): `name, description, module, path`
 */
export interface WorkflowManifestEntry {
  [key: string]: string;
  /** Workflow identifier (e.g. "create-prd"). */
  name: string;
  /** One-line description. */
  description: string;
  /** Owning module code. */
  module: string;
  /** Relative file path to the workflow definition. */
  path: string;
}

/* ------------------------------------------------------------------ */
/*  task-manifest.csv / tool-manifest.csv row                         */
/* ------------------------------------------------------------------ */

/**
 * Represents a single row from `task-manifest.csv` or `tool-manifest.csv`.
 *
 * CSV header (6 columns): `name, displayName, description, module, path, standalone`
 */
export interface TaskToolManifestEntry {
  [key: string]: string;
  /** Task/tool identifier. */
  name: string;
  /** Human-readable display name. */
  displayName: string;
  /** One-line description. */
  description: string;
  /** Owning module code. */
  module: string;
  /** Relative file path. */
  path: string;
  /** "true" if the task/tool can be invoked standalone. */
  standalone: string;
}

/* ------------------------------------------------------------------ */
/*  Internal command map                                              */
/* ------------------------------------------------------------------ */

/**
 * Describes a single BMAD command that has been resolved from the
 * manifests and is ready for Copilot Chat dispatch.
 */
export interface BmadCommand {
  /** Slash-command name as typed in Copilot Chat (without `/`). Example: "bmad-bmm-create-prd". */
  slashName: string;
  /** Original CLI colon-syntax. Example: "bmad:bmm:create-prd". */
  cliSyntax: string;
  /** One-line description shown to the user. */
  description: string;
  /** Category for grouping. */
  category: 'workflow' | 'agent' | 'task' | 'tool' | 'core';
  /** Module code ("bmm", "core", …). */
  module: string;
  /** Relative path to the workflow/agent/task file. */
  filePath: string;
  /** Agent name required to run this command (empty for standalone tasks). */
  agentName: string;
  /** Agent display title with icon. */
  agentTitle: string;
  /** The execution pattern to use. */
  pattern: PromptPattern;
  /**
   * Absolute path to the official `.prompt.md` or `.agent.md` file
   * generated by `bmad-method install --tools github-copilot`.
   * When present, this file is used as the primary execution source.
   */
  promptFilePath?: string;
}

/**
 * Prompt injection patterns — mirrors the four patterns used by the
 * official GitHub Copilot installer in `github-copilot.js`:
 *
 * - **A** — MD workflows: load and follow directly
 * - **B** — YAML workflows: load workflow.xml engine first, then config
 * - **C** — Agent-only (tech-writer style): load agent, invoke code
 * - **D** — Agent activator: load config, then agent file
 * - **task** — XML/MD tasks: load and execute directly
 */
export type PromptPattern = 'md-workflow' | 'yaml-workflow' | 'agent-only' | 'agent-activator' | 'task';

/* ------------------------------------------------------------------ */
/*  Registry state                                                    */
/* ------------------------------------------------------------------ */

/**
 * Snapshot of everything discovered during a BMAD scan.
 *
 * This is the canonical runtime state — all other layers read from it.
 */
export interface RegistryState {
  /** Absolute path to the `_bmad` directory. */
  bmadDir: string;
  /** Map of slash-name → BmadCommand. */
  commands: Map<string, BmadCommand>;
  /** Parsed rows from bmad-help.csv. */
  helpEntries: BmadHelpEntry[];
  /** Parsed rows from agent-manifest.csv. */
  agents: AgentManifestEntry[];
  /** Parsed rows from workflow-manifest.csv. */
  workflows: WorkflowManifestEntry[];
  /** Parsed rows from task-manifest.csv. */
  tasks: TaskToolManifestEntry[];
  /** Parsed rows from tool-manifest.csv. */
  tools: TaskToolManifestEntry[];
  /** Modules detected. */
  modules: string[];
  /**
   * Map of slash-command name → absolute path to the official
   * `.prompt.md` or `.agent.md` file in `.github/`.
   */
  promptFiles: Map<string, string>;
  /** `true` if `.github/prompts/` or `.github/agents/` contain BMAD files. */
  hasCopilotFiles: boolean;
  /** ISO timestamp of last scan. */
  lastScan: string;
}

/* ------------------------------------------------------------------ */
/*  Extension configuration                                           */
/* ------------------------------------------------------------------ */

/**
 * User-facing configuration surface from `contributes.configuration`.
 */
export interface BmadConfig {
  /** Override path to `_bmad` directory. Empty string = auto-detect. */
  bmadDir: string;
  /** Auto-scan on activation. */
  autoScan: boolean;
  /** Verbose logging. */
  verbose: boolean;
}
