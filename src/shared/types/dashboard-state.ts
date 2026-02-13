// Dashboard State Types for BMAD Extension
// Aggregates all state for the webview dashboard

import type { SprintStatus } from './sprint-status';
import type { Epic } from './epic';
import type { Story } from './story';
import type { ParseError } from './parse-result';
import type { AvailableWorkflow } from './workflow';
import type { BmadMetadata } from './bmad-metadata';

/**
 * Aggregated dashboard state sent from extension to webview
 * This is the primary state object for the BMAD dashboard
 */
export interface DashboardState {
  /** Sprint status data (null if not loaded or not found) */
  sprint: SprintStatus | null;
  /** List of all parsed epics */
  epics: Epic[];
  /** Currently active/in-progress story (null if none) */
  currentStory: Story | null;
  /** Collection of parse errors for display */
  errors: ParseError[];
  /** Whether data is currently being loaded */
  loading: boolean;
  /** Configured output root directory relative to workspace root (null if not yet resolved) */
  outputRoot: string | null;
  /** Available workflows based on current project state */
  workflows: AvailableWorkflow[];
  /** BMAD installation metadata (null if manifest not found) */
  bmadMetadata: BmadMetadata | null;
}

/**
 * Create an initial empty dashboard state
 */
export function createInitialDashboardState(): DashboardState {
  return {
    sprint: null,
    epics: [],
    currentStory: null,
    errors: [],
    loading: true,
    outputRoot: null,
    workflows: [],
    bmadMetadata: null,
  };
}
