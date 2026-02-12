/**
 * Represents a BMAD workflow that can be executed from the dashboard
 */
export interface AvailableWorkflow {
  /** Unique workflow identifier (e.g., 'sprint-planning', 'create-story', 'dev-story') */
  id: string;
  /** Human-readable display name (e.g., 'Sprint Planning', 'Create Story') */
  name: string;
  /** Command to execute in terminal (e.g., 'claude /bmad-bmm-sprint-planning') */
  command: string;
  /** Brief description of what the workflow does */
  description: string;
  /** Whether this is the primary/recommended workflow for current state */
  isPrimary: boolean;
}
