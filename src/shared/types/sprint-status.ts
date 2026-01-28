// Sprint Status Types for BMAD Extension
// Matches the structure of sprint-status.yaml files

/**
 * Valid status values for epics in sprint-status.yaml
 */
export type EpicStatusValue = 'backlog' | 'in-progress' | 'done';

/**
 * Valid status values for stories in sprint-status.yaml
 */
export type StoryStatusValue = 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';

/**
 * Retrospective status values
 */
export type RetrospectiveStatusValue = 'optional' | 'done';

/**
 * Combined status type for development_status entries
 */
export type DevelopmentStatusValue = EpicStatusValue | StoryStatusValue | RetrospectiveStatusValue;

/**
 * Sprint status data structure matching sprint-status.yaml
 */
export interface SprintStatus {
  /** Date the sprint status was generated (ISO date string) */
  generated: string;
  /** Project name */
  project: string;
  /** Unique project identifier */
  project_key: string;
  /** Tracking system type (currently always 'file-system') */
  tracking_system: 'file-system';
  /** Path to story files relative to project root */
  story_location: string;
  /**
   * Development status for epics, stories, and retrospectives
   * Keys follow patterns:
   * - epic-N: Epic status
   * - N-N-story-name: Story status
   * - epic-N-retrospective: Retrospective status
   */
  development_status: Record<string, DevelopmentStatusValue>;
}

/**
 * Type guard to check if a status value is valid for an epic.
 *
 * NOTE: Epic status values ('backlog', 'in-progress', 'done') are a subset of story status values.
 * Use `isEpicKey()` to determine if a development_status entry is an epic vs story.
 * This guard only validates if the value is acceptable for an epic status field.
 */
export function isEpicStatus(status: DevelopmentStatusValue): status is EpicStatusValue {
  return status === 'backlog' || status === 'in-progress' || status === 'done';
}

/**
 * Type guard to check if a status value is valid for a story.
 *
 * NOTE: All epic status values are also valid story status values.
 * Use `isStoryKey()` to determine if a development_status entry is a story vs epic.
 * This guard only validates if the value is acceptable for a story status field.
 */
export function isStoryStatus(status: DevelopmentStatusValue): status is StoryStatusValue {
  return (
    status === 'backlog' ||
    status === 'ready-for-dev' ||
    status === 'in-progress' ||
    status === 'review' ||
    status === 'done'
  );
}

/**
 * Type guard to check if a status value is valid for a retrospective.
 *
 * NOTE: 'done' is valid for retrospectives, epics, and stories.
 * Use `isRetrospectiveKey()` to determine if a development_status entry is a retrospective.
 * This guard only validates if the value is acceptable for a retrospective status field.
 */
export function isRetrospectiveStatus(
  status: DevelopmentStatusValue
): status is RetrospectiveStatusValue {
  return status === 'optional' || status === 'done';
}

/**
 * Check if a key represents an epic in development_status (pattern: epic-N)
 *
 * @example
 * isEpicKey('epic-1')     // true
 * isEpicKey('epic-12')    // true
 * isEpicKey('1-1-story')  // false
 */
export function isEpicKey(key: string): boolean {
  return /^epic-\d+$/.test(key);
}

/**
 * Check if a key represents a story in development_status (pattern: N-N-name)
 *
 * @example
 * isStoryKey('1-1-project-init')  // true
 * isStoryKey('2-3-auth-flow')     // true
 * isStoryKey('epic-1')            // false
 */
export function isStoryKey(key: string): boolean {
  return /^\d+-\d+-[\w-]+$/.test(key);
}

/**
 * Check if a key represents a retrospective in development_status (pattern: epic-N-retrospective)
 *
 * @example
 * isRetrospectiveKey('epic-1-retrospective')  // true
 * isRetrospectiveKey('epic-1')                // false
 */
export function isRetrospectiveKey(key: string): boolean {
  return /^epic-\d+-retrospective$/.test(key);
}
