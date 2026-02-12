import React from 'react';
import { useCurrentStory } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createOpenDocumentMessage } from '@shared/messages';
import { calculateStoryProgress } from '@shared/types/story';
import type { StoryStatusValue } from '@shared/types/sprint-status';
import { cn } from '../../shared/utils/cn';

function getStatusLabel(status: StoryStatusValue): string {
  switch (status) {
    case 'ready-for-dev':
      return 'Ready for Dev';
    case 'in-progress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Done';
    default:
      return 'Backlog';
  }
}

export function ActiveStoryCardSkeleton(): React.ReactElement {
  return (
    <div data-testid="active-story-card-skeleton" className="flex animate-pulse flex-col gap-2">
      <div className="h-3 w-20 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-4 w-3/4 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-2 w-full rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="flex items-center justify-between">
        <div className="h-3 w-20 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-4 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
    </div>
  );
}

export function ActiveStoryCard(): React.ReactElement {
  const currentStory = useCurrentStory();
  const vscodeApi = useVSCodeApi();

  if (!currentStory) {
    return (
      <div data-testid="active-story-card-empty" className="flex flex-col gap-2">
        <h3 className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">
          Active Story
        </h3>
        <span className="text-sm text-[var(--vscode-descriptionForeground)]">No active story</span>
      </div>
    );
  }

  const progressPercent = calculateStoryProgress(currentStory);
  const isDone = currentStory.status === 'done';
  const isActive = currentStory.status === 'in-progress';

  return (
    <div
      data-testid="active-story-card"
      className={cn(
        'flex flex-col gap-2 rounded px-2 py-1.5',
        isActive &&
          'border-l-2 border-[var(--vscode-focusBorder)] bg-[var(--vscode-list-activeSelectionBackground)]/10'
      )}
    >
      <h3 className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">
        Active Story
      </h3>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-[var(--vscode-descriptionForeground)]">
          Epic {currentStory.epicNumber}
        </span>
        <button
          type="button"
          className="text-left text-sm text-[var(--vscode-textLink-foreground)] hover:underline"
          onClick={(e) =>
            vscodeApi.postMessage(createOpenDocumentMessage(currentStory.filePath, e.shiftKey))
          }
        >
          Story {currentStory.epicNumber}.{currentStory.storyNumber}: {currentStory.title}
        </button>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-[var(--vscode-descriptionForeground)]">
          <span>Tasks</span>
          <span>
            {currentStory.completedTasks}/{currentStory.totalTasks} tasks done
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--vscode-editor-inactiveSelectionBackground)]"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Story progress: ${progressPercent}% complete (${currentStory.completedTasks} of ${currentStory.totalTasks} tasks, ${currentStory.completedSubtasks} of ${currentStory.totalSubtasks} subtasks)`}
        >
          <div
            className="h-full rounded-full bg-[var(--vscode-testing-iconPassed)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--vscode-descriptionForeground)]">
          {currentStory.completedSubtasks}/{currentStory.totalSubtasks} subtasks
        </span>
        <span
          className={cn(
            'rounded px-1.5 py-0.5 text-xs',
            isDone && 'text-[var(--vscode-testing-iconPassed)]',
            isActive && 'text-[var(--vscode-foreground)]',
            !isDone && !isActive && 'text-[var(--vscode-descriptionForeground)]'
          )}
        >
          {getStatusLabel(currentStory.status)}
        </span>
      </div>
    </div>
  );
}
