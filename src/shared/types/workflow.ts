/**
 * Categorization of a workflow's importance in the current context.
 * - 'primary': The single most important next action (shown in NextActionRecommendation)
 * - 'mandatory': Important follow-up that should not be skipped (shown prominently in CTA)
 * - 'optional': Recommended but skippable follow-up (shown with secondary styling in CTA)
 */
export type WorkflowKind = 'primary' | 'mandatory' | 'optional';

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
  /** Categorization of this workflow's importance in the current context */
  kind: WorkflowKind;
}
