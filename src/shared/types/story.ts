// Story Types for BMAD Extension
// Represents story file data from N-N-story-name.md files

import type { StoryStatusValue } from './sprint-status';

/**
 * A subtask within a story task
 */
export interface StorySubtask {
  /** Subtask ID (e.g., "1.1", "1.2") */
  id: string;
  /** Subtask description */
  description: string;
  /** Whether the subtask is complete */
  completed: boolean;
}

/**
 * A task within a story
 */
export interface StoryTask {
  /** Task number (e.g., 1, 2, 3) */
  number: number;
  /** Task description */
  description: string;
  /** Whether the task is complete */
  completed: boolean;
  /** Related acceptance criteria numbers */
  acceptanceCriteria?: number[];
  /** Subtasks within this task */
  subtasks: StorySubtask[];
}

/**
 * An acceptance criterion for a story
 */
export interface AcceptanceCriterion {
  /** Criterion number (1-indexed) */
  number: number;
  /** Criterion title */
  title: string;
  /** Full criterion text including Given/When/Then */
  content: string;
}

/**
 * Story data structure representing a parsed story file
 */
export interface Story {
  /** Story key (e.g., "2-1-shared-types-and-message-protocol") */
  key: string;
  /** Epic number this story belongs to */
  epicNumber: number;
  /** Story number within the epic */
  storyNumber: number;
  /** Optional letter suffix for split stories (e.g., "a", "b", "c") */
  storySuffix?: string;
  /** Story title from H1 heading */
  title: string;
  /** User story statement (As a... I want... So that...) */
  userStory: string;
  /** Acceptance criteria list */
  acceptanceCriteria: AcceptanceCriterion[];
  /** Tasks with completion status */
  tasks: StoryTask[];
  /** File path relative to project root */
  filePath: string;
  /** Current status */
  status: StoryStatusValue;
  /** Total number of tasks */
  totalTasks: number;
  /** Number of completed tasks */
  completedTasks: number;
  /** Total number of subtasks across all tasks */
  totalSubtasks: number;
  /** Number of completed subtasks */
  completedSubtasks: number;
}

/**
 * Lightweight story summary for DashboardState (no heavy content fields)
 */
export interface StorySummary {
  /** Story key (e.g., "2-1-shared-types-and-message-protocol") */
  key: string;
  /** Story title */
  title: string;
  /** Current status */
  status: StoryStatusValue;
  /** Epic number this story belongs to */
  epicNumber: number;
  /** Story number within the epic */
  storyNumber: number;
  /** Optional letter suffix for split stories */
  storySuffix?: string;
  /** Total number of tasks */
  totalTasks: number;
  /** Number of completed tasks */
  completedTasks: number;
  /** Total number of subtasks */
  totalSubtasks: number;
  /** Number of completed subtasks */
  completedSubtasks: number;
  /** File path relative to project root */
  filePath: string;
}

/**
 * Calculate completion percentage for a story
 */
export function calculateStoryProgress(story: Story): number {
  const totalItems = story.totalTasks + story.totalSubtasks;
  if (totalItems === 0) return 0;
  const completedItems = story.completedTasks + story.completedSubtasks;
  return Math.round((completedItems / totalItems) * 100);
}
