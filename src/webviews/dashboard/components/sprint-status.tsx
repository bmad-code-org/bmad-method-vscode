import React from 'react';
import { useSprint } from '../store';
import { isStoryKey } from '@shared/types/sprint-status';
import type { DevelopmentStatusValue } from '@shared/types/sprint-status';

function computeStatusCounts(developmentStatus: Record<string, DevelopmentStatusValue>) {
  const storyEntries = Object.entries(developmentStatus).filter(([key]) => isStoryKey(key));
  const total = storyEntries.length;
  const done = storyEntries.filter(([, status]) => status === 'done').length;
  const inProgress = storyEntries.filter(([, status]) => status === 'in-progress').length;
  const review = storyEntries.filter(([, status]) => status === 'review').length;
  const readyForDev = storyEntries.filter(([, status]) => status === 'ready-for-dev').length;
  const backlog = storyEntries.filter(([, status]) => status === 'backlog').length;

  return { total, done, inProgress, review, readyForDev, backlog };
}

export function SprintStatusSkeleton(): React.ReactElement {
  return (
    <div data-testid="sprint-status-skeleton" className="flex animate-pulse flex-col gap-3">
      <div className="h-5 w-1/2 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-3 w-3/4 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-6 w-full rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="flex gap-4">
        <div className="h-3 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-3 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-3 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
    </div>
  );
}

export function SprintStatus(): React.ReactElement {
  const sprint = useSprint();

  if (!sprint) {
    return (
      <div
        data-testid="sprint-status-empty"
        className="text-sm text-[var(--vscode-descriptionForeground)]"
      >
        No sprint data available
      </div>
    );
  }

  const counts = computeStatusCounts(sprint.development_status);
  const progressPercent = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <div data-testid="sprint-status" className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-[var(--vscode-foreground)]">{sprint.project}</h2>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-[var(--vscode-descriptionForeground)]">
          <span>Sprint Progress</span>
          <span>
            {counts.done}/{counts.total} stories ({progressPercent}%)
          </span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--vscode-editor-inactiveSelectionBackground)]"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Sprint progress: ${counts.done} of ${counts.total} stories done`}
        >
          <div
            className="h-full rounded-full bg-[var(--vscode-testing-iconPassed)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="text-[var(--vscode-testing-iconPassed)]">{counts.done} done</span>
        {counts.inProgress > 0 && (
          <span className="text-[var(--vscode-foreground)]">{counts.inProgress} in-progress</span>
        )}
        {counts.review > 0 && (
          <span className="text-[var(--vscode-foreground)]">{counts.review} review</span>
        )}
        {counts.readyForDev > 0 && (
          <span className="text-[var(--vscode-descriptionForeground)]">
            {counts.readyForDev} ready
          </span>
        )}
        {counts.backlog > 0 && (
          <span className="text-[var(--vscode-descriptionForeground)]">
            {counts.backlog} backlog
          </span>
        )}
      </div>
    </div>
  );
}
