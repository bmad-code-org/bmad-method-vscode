/**
 * Represents a BMAD workflow that can be executed from the dashboard
 */
export interface AvailableWorkflow {
  /** Unique workflow identifier (e.g., 'sprint-planning', 'create-story', 'dev-story') */
  id: string;
  /** Human-readable display name (e.g., 'Sprint Planning', 'Create Story') */
  name: string;
  /** BMAD slash command without CLI prefix (e.g., '/bmad-bmm-sprint-planning'). The CLI prefix (e.g., 'claude') is prepended at execution time from bmad.cliPrefix setting. */
  command: string;
  /** Brief description of what the workflow does */
  description: string;
  /** Whether this is the primary/recommended workflow for current state */
  isPrimary: boolean;
}
