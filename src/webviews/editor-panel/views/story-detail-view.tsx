import React, { useEffect } from 'react';
import {
  useEditorPanelStore,
  useStoryDetail,
  useStoryDetailLoading,
  useStorySummaries,
} from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createOpenDocumentMessage } from '@shared/messages';
import { createRequestDocumentContentMessage } from '@shared/messages';
import { cn } from '../../shared/utils/cn';
import { getStoryStatusClasses, getStoryStatusLabel } from '../../shared/utils/status-styles';
import { Check } from 'lucide-react';

function StoryDetailSkeleton(): React.ReactElement {
  return (
    <div data-testid="story-detail-skeleton" className="flex animate-pulse flex-col gap-4 p-4">
      <div className="flex flex-col gap-1">
        <div className="h-3 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-5 w-3/4 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-3 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="h-3 w-full rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-3 w-5/6 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-3 w-4/6 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
      <div className="flex flex-col gap-1">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
            <div className="h-3 w-2/3 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StoryDetailView(): React.ReactElement {
  const currentRoute = useEditorPanelStore((s) => s.currentRoute);
  const setStoryDetailLoading = useEditorPanelStore((s) => s.setStoryDetailLoading);
  const clearStoryDetail = useEditorPanelStore((s) => s.clearStoryDetail);
  const storyDetail = useStoryDetail();
  const storyDetailLoading = useStoryDetailLoading();
  const storySummaries = useStorySummaries();
  const vscodeApi = useVSCodeApi();

  const storyKey = currentRoute.params?.storyKey;

  // Find the summary to get the file path for loading
  const summary = React.useMemo(
    () => storySummaries.find((s) => s.key === storyKey),
    [storySummaries, storyKey]
  );

  // Load story detail on mount when needed
  useEffect(() => {
    if (!summary?.filePath) return;
    // If we already have the correct story loaded, skip
    if (storyDetail?.key === storyKey) return;

    setStoryDetailLoading(true);
    vscodeApi.postMessage(createRequestDocumentContentMessage(summary.filePath));

    return () => {
      clearStoryDetail();
    };
  }, [storyKey, summary?.filePath]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!storyKey) {
    return (
      <div data-testid="story-detail-empty" className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-[var(--vscode-descriptionForeground)]">No story selected</p>
      </div>
    );
  }

  if (storyDetailLoading) {
    return <StoryDetailSkeleton />;
  }

  if (!storyDetail) {
    return (
      <div data-testid="story-detail-error" className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-[var(--vscode-descriptionForeground)]">
          Failed to load story content
        </p>
      </div>
    );
  }

  const totalItems = storyDetail.totalTasks + storyDetail.totalSubtasks;
  const completedItems = storyDetail.completedTasks + storyDetail.completedSubtasks;
  const progressPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div data-testid="story-detail-view" className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[var(--vscode-descriptionForeground)]">
          Epic {storyDetail.epicNumber}
        </span>
        <button
          type="button"
          className="text-left text-base font-semibold text-[var(--vscode-foreground)] hover:underline"
          onClick={(e) => {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
              vscodeApi.postMessage(createOpenDocumentMessage(storyDetail.filePath, true));
            }
          }}
        >
          Story {storyDetail.epicNumber}.{storyDetail.storyNumber}
          {storyDetail.storySuffix ?? ''}: {storyDetail.title}
        </button>
        <span className={cn('text-xs font-medium', getStoryStatusClasses(storyDetail.status))}>
          {getStoryStatusLabel(storyDetail.status)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-[var(--vscode-descriptionForeground)]">
          <span>Progress</span>
          <span>{progressPercent}%</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-[var(--vscode-editor-inactiveSelectionBackground)]"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Story progress: ${completedItems} of ${totalItems} items done`}
        >
          <div
            className="h-full rounded-full bg-[var(--vscode-testing-iconPassed)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs text-[var(--vscode-descriptionForeground)]">
          {storyDetail.completedTasks}/{storyDetail.totalTasks} tasks,{' '}
          {storyDetail.completedSubtasks}/{storyDetail.totalSubtasks} subtasks
        </span>
      </div>

      {/* User Story */}
      {storyDetail.userStory && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">
            User Story
          </h3>
          <p className="text-sm text-[var(--vscode-foreground)] italic">{storyDetail.userStory}</p>
        </div>
      )}

      {/* Acceptance Criteria */}
      {storyDetail.acceptanceCriteria.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">
            Acceptance Criteria
          </h3>
          <ol className="flex flex-col gap-2 pl-4 text-sm text-[var(--vscode-foreground)]">
            {storyDetail.acceptanceCriteria.map((ac) => (
              <li key={ac.number} className="list-decimal">
                <span className="font-medium">{ac.title}</span>
                {ac.content && (
                  <pre className="mt-1 whitespace-pre-wrap text-xs text-(--vscode-descriptionForeground)">
                    {ac.content}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Task checklist */}
      {storyDetail.tasks.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">Tasks</h3>
          <div className="flex flex-col gap-1">
            {storyDetail.tasks.map((task) => (
              <div key={task.number} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs',
                      task.completed
                        ? 'border-[var(--vscode-testing-iconPassed)] bg-[var(--vscode-testing-iconPassed)] text-[var(--vscode-editor-background)]'
                        : 'border-[var(--vscode-panel-border)]'
                    )}
                  >
                    {task.completed && <Check size={10} />}
                  </span>
                  <span
                    className={cn(
                      'text-sm',
                      task.completed
                        ? 'text-[var(--vscode-descriptionForeground)] line-through'
                        : 'text-[var(--vscode-foreground)]'
                    )}
                  >
                    Task {task.number}: {task.description}
                  </span>
                </div>
                {task.subtasks.length > 0 && (
                  <div className="ml-6 flex flex-col gap-0.5">
                    {task.subtasks.map((sub) => (
                      <div key={sub.id} className="flex items-center gap-2">
                        <span
                          className={cn(
                            'flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border text-xs',
                            sub.completed
                              ? 'border-[var(--vscode-testing-iconPassed)] bg-[var(--vscode-testing-iconPassed)] text-[var(--vscode-editor-background)]'
                              : 'border-[var(--vscode-panel-border)]'
                          )}
                        >
                          {sub.completed && <Check size={8} />}
                        </span>
                        <span
                          className={cn(
                            'text-xs',
                            sub.completed
                              ? 'text-[var(--vscode-descriptionForeground)] line-through'
                              : 'text-[var(--vscode-foreground)]'
                          )}
                        >
                          {sub.id}: {sub.description}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
