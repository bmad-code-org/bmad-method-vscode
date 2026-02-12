import React from 'react';
import { useSprint, useEpics, useOutputRoot } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createOpenDocumentMessage } from '@shared/messages';
import { isEpicKey, isStoryKey, isEpicStatus } from '@shared/types/sprint-status';
import type { DevelopmentStatusValue, EpicStatusValue } from '@shared/types/sprint-status';
import type { Epic } from '@shared/types/epic';
import { cn } from '../../shared/utils/cn';

interface EpicSummary {
  number: number;
  key: string;
  status: EpicStatusValue;
  totalStories: number;
  doneStories: number;
}

function deriveEpicSummaries(
  developmentStatus: Record<string, DevelopmentStatusValue>
): EpicSummary[] {
  const epicMap = new Map<number, EpicSummary>();

  // First pass: find all epic entries
  for (const [key, status] of Object.entries(developmentStatus)) {
    if (isEpicKey(key)) {
      const epicNum = parseInt(key.replace('epic-', ''), 10);
      epicMap.set(epicNum, {
        number: epicNum,
        key,
        status: isEpicStatus(status) ? status : 'backlog',
        totalStories: 0,
        doneStories: 0,
      });
    }
  }

  // Second pass: count stories per epic
  for (const [key, status] of Object.entries(developmentStatus)) {
    if (isStoryKey(key)) {
      const epicNum = parseInt(key.split('-')[0], 10);
      const epic = epicMap.get(epicNum);
      if (epic) {
        epic.totalStories++;
        if (status === 'done') {
          epic.doneStories++;
        }
      }
    }
  }

  return Array.from(epicMap.values()).sort((a, b) => a.number - b.number);
}

function getEpicTitle(epicNum: number, epicsData: Epic[]): string {
  for (const epic of epicsData) {
    if (epic.number === epicNum) {
      return epic.title;
    }
  }
  return `Epic ${epicNum}`;
}

function getStatusLabel(summary: EpicSummary): string {
  if (summary.status === 'done') return 'Done';
  if (summary.status === 'in-progress') return 'In Progress';
  return 'Backlog';
}

export function EpicListSkeleton(): React.ReactElement {
  return (
    <div data-testid="epic-list-skeleton" className="flex animate-pulse flex-col gap-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 rounded p-2">
          <div className="h-4 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
          <div className="h-3 w-24 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
          <div className="ml-auto h-3 w-12 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        </div>
      ))}
    </div>
  );
}

export function EpicList(): React.ReactElement {
  const sprint = useSprint();
  const epicsData = useEpics();
  const vscodeApi = useVSCodeApi();
  const outputRoot = useOutputRoot() ?? '_bmad-output';

  if (!sprint) {
    return (
      <div
        data-testid="epic-list-empty"
        className="text-sm text-[var(--vscode-descriptionForeground)]"
      >
        No epics found
      </div>
    );
  }

  const summaries = deriveEpicSummaries(sprint.development_status);

  if (summaries.length === 0) {
    return (
      <div
        data-testid="epic-list-empty"
        className="text-sm text-[var(--vscode-descriptionForeground)]"
      >
        No epics found
      </div>
    );
  }

  return (
    <div data-testid="epic-list" className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">Epics</h3>
      {summaries.map((summary) => {
        const isActive = summary.status === 'in-progress';
        const isDone = summary.status === 'done';
        const title = getEpicTitle(summary.number, epicsData);
        const progressPercent =
          summary.totalStories > 0
            ? Math.round((summary.doneStories / summary.totalStories) * 100)
            : 0;

        return (
          <div
            key={summary.key}
            data-testid={`epic-item-${summary.number}`}
            className={cn(
              'flex flex-col gap-1 rounded px-2 py-1.5',
              isActive &&
                'border-l-2 border-[var(--vscode-focusBorder)] bg-[var(--vscode-list-activeSelectionBackground)]/10'
            )}
          >
            <div className="flex items-center justify-between">
              <button
                type="button"
                className="text-left text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
                onClick={(e) =>
                  vscodeApi.postMessage(
                    createOpenDocumentMessage(
                      `${outputRoot}/planning-artifacts/epics.md`,
                      e.shiftKey
                    )
                  )
                }
              >
                {title}
              </button>
              <span
                className={cn(
                  'text-xs',
                  isDone
                    ? 'text-[var(--vscode-testing-iconPassed)]'
                    : 'text-[var(--vscode-descriptionForeground)]'
                )}
              >
                {getStatusLabel(summary)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--vscode-editor-inactiveSelectionBackground)]"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${title}: ${summary.doneStories} of ${summary.totalStories} stories done`}
              >
                <div
                  className="h-full rounded-full bg-[var(--vscode-testing-iconPassed)] transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                {summary.doneStories}/{summary.totalStories}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
