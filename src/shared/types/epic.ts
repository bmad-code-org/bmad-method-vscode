// Epic Types for BMAD Extension
// Represents epic file data from epic-*.md files

import type { EpicStatusValue } from './sprint-status';

/**
 * Metadata from epic file frontmatter
 */
export interface EpicMetadata {
  /** Workflow steps that have been completed */
  stepsCompleted?: string[];
  /** Input documents referenced by the epic */
  inputDocuments?: string[];
}

/**
 * A story entry within an epic file
 */
export interface EpicStoryEntry {
  /** Story key (e.g., "1-1-project-initialization") */
  key: string;
  /** Story title */
  title: string;
  /** Brief description of the story */
  description?: string;
  /** Status from sprint-status.yaml (if available) */
  status?: 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
}

/**
 * Epic data structure representing a parsed epic file
 */
export interface Epic {
  /** Epic number (e.g., 1, 2, 3) */
  number: number;
  /** Epic key (e.g., "epic-1") */
  key: string;
  /** Epic title from H2 heading */
  title: string;
  /** Epic description text */
  description: string;
  /** Frontmatter metadata */
  metadata: EpicMetadata;
  /** Stories defined in this epic */
  stories: EpicStoryEntry[];
  /** File path relative to project root */
  filePath: string;
  /** Current status from sprint-status.yaml */
  status: EpicStatusValue;
}
