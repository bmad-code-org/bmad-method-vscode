import React, { useState, useCallback } from 'react';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
import { useSprint, useEpics, useOutputRoot } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createOpenDocumentMessage } from '@shared/messages';
import { isEpicKey, isStoryKey, isEpicStatus, isStoryStatus } from '@shared/types/sprint-status';
import type {
  DevelopmentStatusValue,
  EpicStatusValue,
  StoryStatusValue,
} from '@shared/types/sprint-status';
import type { Epic, EpicStoryEntry } from '@shared/types/epic';
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

function getStoriesForEpic(
  epicNum: number,
  epicsData: Epic[],
  developmentStatus: Record<string, DevelopmentStatusValue>
): (EpicStoryEntry & { resolvedStatus: StoryStatusValue })[] {
  const epic = epicsData.find((e) => e.number === epicNum);
  if (!epic?.stories?.length) return [];

  return epic.stories.map((story) => {
    const raw = developmentStatus[story.key];
    return {
      ...story,
      resolvedStatus:
        (raw !== undefined && isStoryStatus(raw) ? raw : undefined) ?? story.status ?? 'backlog',
    };
  });
}

function getStoryStatusLabel(status: StoryStatusValue): string {
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
  const [expandedEpics, setExpandedEpics] = useState<Set<number>>(new Set());

  const toggleEpic = useCallback((epicNum: number) => {
    setExpandedEpics((prev) => {
      const next = new Set(prev);
      if (next.has(epicNum)) {
        next.delete(epicNum);
      } else {
        next.add(epicNum);
      }
      return next;
    });
  }, []);

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
        const isExpanded = expandedEpics.has(summary.number);
        const progressPercent =
          summary.totalStories > 0
            ? Math.round((summary.doneStories / summary.totalStories) * 100)
            : 0;
        const stories = getStoriesForEpic(summary.number, epicsData, sprint.development_status);

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
                aria-expanded={isExpanded}
                className="flex items-center gap-1 text-left text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
                onClick={(e) => {
                  if (e.shiftKey) {
                    vscodeApi.postMessage(
                      createOpenDocumentMessage(`${outputRoot}/planning-artifacts/epics.md`, true)
                    );
                  } else {
                    toggleEpic(summary.number);
                  }
                }}
              >
                {isExpanded ? (
                  <ChevronDown size={14} className="shrink-0" />
                ) : (
                  <ChevronRight size={14} className="shrink-0" />
                )}
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
            {isExpanded && (
              <div
                role="group"
                aria-label={`Stories in ${title}`}
                className="animate-expand-in flex flex-col gap-0.5 pt-1 pl-4"
                data-testid={`epic-${summary.number}-stories`}
              >
                {stories.length > 0 ? (
                  stories.map((story) => (
                    <button
                      key={story.key}
                      type="button"
                      className="flex items-center justify-between gap-2 rounded px-1 py-0.5 text-left text-xs hover:bg-[var(--vscode-list-hoverBackground)]"
                      onClick={() =>
                        vscodeApi.postMessage(
                          createOpenDocumentMessage(
                            `${outputRoot}/implementation-artifacts/${story.key}.md`
                          )
                        )
                      }
                    >
                      <span className="flex items-center gap-1 truncate">
                        {story.resolvedStatus === 'done' && (
                          <Check
                            size={12}
                            aria-hidden="true"
                            className="shrink-0 text-[var(--vscode-testing-iconPassed)]"
                          />
                        )}
                        <span
                          className={cn(
                            'truncate',
                            story.resolvedStatus === 'done'
                              ? 'text-[var(--vscode-descriptionForeground)] line-through'
                              : 'text-[var(--vscode-foreground)]'
                          )}
                        >
                          {story.title}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 text-xs',
                          story.resolvedStatus === 'done' &&
                            'text-[var(--vscode-testing-iconPassed)]',
                          story.resolvedStatus === 'in-progress' &&
                            'text-[var(--vscode-textLink-foreground)]',
                          story.resolvedStatus === 'review' &&
                            'text-[var(--vscode-editorWarning-foreground)]',
                          (story.resolvedStatus === 'backlog' ||
                            story.resolvedStatus === 'ready-for-dev') &&
                            'text-[var(--vscode-descriptionForeground)]'
                        )}
                      >
                        {getStoryStatusLabel(story.resolvedStatus)}
                      </span>
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                    No stories found
                  </span>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
