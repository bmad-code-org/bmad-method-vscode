import React from 'react';
import { useEditorPanelStore } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createShiftOpenHandler } from '../../shared/utils/document-link';
import { cn } from '../../shared/utils/cn';
import { getStoryStatusClasses } from '../../shared/utils/status-styles';
import type { StorySummary } from '@shared/types/story';
import type { StoryStatusValue } from '@shared/types/sprint-status';

const KANBAN_COLUMNS: { status: StoryStatusValue; label: string }[] = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'ready-for-dev', label: 'Ready for Dev' },
  { status: 'in-progress', label: 'In Progress' },
  { status: 'review', label: 'Review' },
  { status: 'done', label: 'Done' },
];

interface KanbanBoardProps {
  stories: StorySummary[];
}

export function KanbanBoard({ stories }: KanbanBoardProps): React.ReactElement {
  const navigateTo = useEditorPanelStore((s) => s.navigateTo);
  const vscodeApi = useVSCodeApi();

  const columnStories = React.useMemo(() => {
    const map = new Map<StoryStatusValue, StorySummary[]>();
    for (const col of KANBAN_COLUMNS) {
      map.set(col.status, []);
    }
    for (const story of stories) {
      const list = map.get(story.status);
      if (list) {
        list.push(story);
      }
    }
    return map;
  }, [stories]);

  return (
    <div data-testid="kanban-board" className="flex flex-col gap-3 overflow-x-auto md:flex-row">
      {KANBAN_COLUMNS.map((col) => {
        const colStories = columnStories.get(col.status) ?? [];
        return (
          <div
            key={col.status}
            data-testid={`kanban-column-${col.status}`}
            className="flex min-w-[140px] flex-1 flex-col gap-2"
          >
            {/* Column header */}
            <div className="flex items-center justify-between rounded bg-[var(--vscode-sideBar-background)] px-2 py-1">
              <span className={cn('text-xs font-semibold', getStoryStatusClasses(col.status))}>
                {col.label}
              </span>
              <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                {colStories.length}
              </span>
            </div>

            {/* Cards or empty state */}
            {colStories.length === 0 ? (
              <div className="px-2 py-4 text-center">
                <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                  No stories
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                {colStories.map((story) => (
                  <button
                    key={story.key}
                    type="button"
                    aria-label={`${story.title}, Epic ${story.epicNumber}, ${story.completedTasks} of ${story.totalTasks} tasks`}
                    data-testid={`kanban-card-${story.key}`}
                    className={cn(
                      'rounded border border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)] px-3 py-2 text-left',
                      'hover:bg-[var(--vscode-list-hoverBackground)]',
                      'transition-colors'
                    )}
                    onClick={createShiftOpenHandler(vscodeApi, story.filePath, () =>
                      navigateTo({ view: 'stories', params: { storyKey: story.key } })
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="line-clamp-2 text-xs font-medium text-[var(--vscode-foreground)]">
                        {story.title}
                      </span>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-[var(--vscode-descriptionForeground)]">
                          Epic {story.epicNumber}
                        </span>
                        <span className="text-[10px] text-[var(--vscode-descriptionForeground)]">
                          {story.completedTasks}/{story.totalTasks} tasks
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
