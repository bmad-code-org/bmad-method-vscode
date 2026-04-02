import React from 'react';
import { useEditorPanelStore, useEpics, useStorySummaries } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createShiftOpenHandler } from '../../shared/utils/document-link';
import { cn } from '../../shared/utils/cn';
import {
  getStoryStatusClasses,
  getStoryStatusLabel,
  getEpicStatusClasses,
  getEpicStatusLabel,
} from '../../shared/utils/status-styles';

export function EpicDetailView(): React.ReactElement {
  const currentRoute = useEditorPanelStore((s) => s.currentRoute);
  const navigateTo = useEditorPanelStore((s) => s.navigateTo);
  const epics = useEpics();
  const storySummaries = useStorySummaries();
  const vscodeApi = useVSCodeApi();

  const epicId = currentRoute.params?.epicId;
  const epicNumber = epicId ? parseInt(epicId, 10) : NaN;
  const epic = epics.find((e) => e.number === epicNumber);

  const epicStories = React.useMemo(() => {
    return storySummaries
      .filter((s) => s.epicNumber === epicNumber)
      .sort((a, b) => {
        if (a.storyNumber !== b.storyNumber) return a.storyNumber - b.storyNumber;
        return (a.storySuffix ?? '').localeCompare(b.storySuffix ?? '');
      });
  }, [storySummaries, epicNumber]);

  if (!epic) {
    return (
      <div data-testid="epic-detail-empty" className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-[var(--vscode-descriptionForeground)]">Epic not found</p>
      </div>
    );
  }

  return (
    <div data-testid="epic-detail-view" className="flex flex-col gap-4 p-4">
      {/* Epic header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--vscode-foreground)]">
            Epic {epic.number}: {epic.title}
          </h2>
          <span className={cn('text-xs font-medium', getEpicStatusClasses(epic.status))}>
            {getEpicStatusLabel(epic.status)}
          </span>
        </div>
        {epic.description && (
          <p className="text-xs text-[var(--vscode-descriptionForeground)]">{epic.description}</p>
        )}
      </div>

      {/* Stories list */}
      {epicStories.length === 0 ? (
        <div data-testid="epic-detail-no-stories" className="py-4 text-center">
          <p className="text-sm text-[var(--vscode-descriptionForeground)]">
            No stories found for this epic
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {epicStories.map((story) => {
            const totalItems = story.totalTasks + story.totalSubtasks;
            const completedItems = story.completedTasks + story.completedSubtasks;
            const progressPercent =
              totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return (
              <button
                key={story.key}
                type="button"
                data-testid={`story-row-${story.key}`}
                className={cn(
                  'flex items-center justify-between gap-3 rounded px-3 py-2 text-left',
                  'hover:bg-[var(--vscode-list-hoverBackground)]',
                  'transition-colors'
                )}
                onClick={createShiftOpenHandler(vscodeApi, story.filePath, () =>
                  navigateTo({
                    view: 'epics',
                    params: { epicId: String(epic.number), storyKey: story.key },
                  })
                )}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[var(--vscode-foreground)]">
                      {story.epicNumber}.{story.storyNumber}
                      {story.storySuffix ?? ''}: {story.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1 w-24 overflow-hidden rounded-full bg-[var(--vscode-editor-inactiveSelectionBackground)]"
                      role="progressbar"
                      aria-valuenow={progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${story.title}: ${completedItems} of ${totalItems} items done`}
                    >
                      <div
                        className="h-full rounded-full bg-[var(--vscode-testing-iconPassed)] transition-all"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                      {story.completedTasks}/{story.totalTasks} tasks
                    </span>
                  </div>
                </div>
                <span className={cn('shrink-0 text-xs', getStoryStatusClasses(story.status))}>
                  {getStoryStatusLabel(story.status)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
