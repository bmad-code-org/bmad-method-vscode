import type { EpicStatusValue, StoryStatusValue } from '@shared/types/sprint-status';

/**
 * Get Tailwind CSS classes for a story status badge.
 */
export function getStoryStatusClasses(status: StoryStatusValue): string {
  switch (status) {
    case 'done':
      return 'text-[var(--vscode-testing-iconPassed)]';
    case 'in-progress':
      return 'text-[var(--vscode-textLink-foreground)]';
    case 'review':
      return 'text-[var(--vscode-editorWarning-foreground)]';
    default:
      return 'text-[var(--vscode-descriptionForeground)]';
  }
}

/**
 * Get human-readable label for a story status.
 */
export function getStoryStatusLabel(status: StoryStatusValue): string {
  switch (status) {
    case 'done':
      return 'Done';
    case 'in-progress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'ready-for-dev':
      return 'Ready';
    default:
      return 'Backlog';
  }
}

/**
 * Get Tailwind CSS classes for an epic status badge.
 */
export function getEpicStatusClasses(status: EpicStatusValue): string {
  switch (status) {
    case 'done':
      return 'text-[var(--vscode-testing-iconPassed)]';
    case 'in-progress':
      return 'text-[var(--vscode-textLink-foreground)]';
    default:
      return 'text-[var(--vscode-descriptionForeground)]';
  }
}

/**
 * Get human-readable label for an epic status.
 */
export function getEpicStatusLabel(status: EpicStatusValue): string {
  switch (status) {
    case 'done':
      return 'Done';
    case 'in-progress':
      return 'In Progress';
    default:
      return 'Backlog';
  }
}
