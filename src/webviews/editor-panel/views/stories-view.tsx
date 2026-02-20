import React from 'react';
import { useEditorPanelStore, useStorySummaries, useEpics } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createShiftOpenHandler } from '../../shared/utils/document-link';
import { cn } from '../../shared/utils/cn';
import { getStoryStatusClasses, getStoryStatusLabel } from '../../shared/utils/status-styles';
import { KanbanBoard } from '../components/kanban-board';
import type { StorySummary } from '@shared/types/story';
import type { StoryStatusValue } from '@shared/types/sprint-status';
import type { ToExtension } from '@shared/messages';
import { Table2, LayoutGrid } from 'lucide-react';

const STATUS_OPTIONS: { value: StoryStatusValue | ''; label: string }[] = [
  { value: '', label: 'All Statuses' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'ready-for-dev', label: 'Ready for Dev' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

function useFilteredStories(
  storySummaries: StorySummary[],
  epicFilter: number | null,
  statusFilter: StoryStatusValue | null,
  searchText: string
): StorySummary[] {
  return React.useMemo(() => {
    let filtered = storySummaries;

    if (epicFilter !== null) {
      filtered = filtered.filter((s) => s.epicNumber === epicFilter);
    }

    if (statusFilter !== null) {
      filtered = filtered.filter((s) => s.status === statusFilter);
    }

    if (searchText.trim()) {
      const lower = searchText.trim().toLowerCase();
      filtered = filtered.filter((s) => s.title.toLowerCase().includes(lower));
    }

    return filtered.sort((a, b) => {
      if (a.epicNumber !== b.epicNumber) return a.epicNumber - b.epicNumber;
      if (a.storyNumber !== b.storyNumber) return a.storyNumber - b.storyNumber;
      return (a.storySuffix ?? '').localeCompare(b.storySuffix ?? '');
    });
  }, [storySummaries, epicFilter, statusFilter, searchText]);
}

export function StoriesView(): React.ReactElement {
  const currentRoute = useEditorPanelStore((s) => s.currentRoute);
  const navigateTo = useEditorPanelStore((s) => s.navigateTo);
  const storySummaries = useStorySummaries();
  const epics = useEpics();
  const vscodeApi = useVSCodeApi();

  // View-local filter state
  const [epicFilter, setEpicFilter] = React.useState<number | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<StoryStatusValue | null>(null);
  const [searchText, setSearchText] = React.useState('');
  const [viewMode, setViewMode] = React.useState<'table' | 'kanban'>(
    currentRoute.params?.mode === 'kanban' ? 'kanban' : 'table'
  );

  const filteredStories = useFilteredStories(storySummaries, epicFilter, statusFilter, searchText);

  return (
    <div data-testid="stories-view" className="flex flex-col gap-4 p-4">
      {/* Filter bar */}
      <div data-testid="stories-filter-bar" className="flex flex-wrap items-center gap-2">
        {/* Epic dropdown */}
        <select
          aria-label="Filter by epic"
          value={epicFilter === null ? '' : String(epicFilter)}
          onChange={(e) => setEpicFilter(e.target.value === '' ? null : Number(e.target.value))}
          className="rounded border border-[var(--vscode-dropdown-border)] bg-[var(--vscode-dropdown-background)] px-2 py-1 text-xs text-[var(--vscode-dropdown-foreground)]"
        >
          <option value="">All Epics</option>
          {epics.map((epic) => (
            <option key={epic.number} value={epic.number}>
              Epic {epic.number}: {epic.title}
            </option>
          ))}
        </select>

        {/* Status dropdown */}
        <select
          aria-label="Filter by status"
          value={statusFilter ?? ''}
          onChange={(e) =>
            setStatusFilter(e.target.value === '' ? null : (e.target.value as StoryStatusValue))
          }
          className="rounded border border-[var(--vscode-dropdown-border)] bg-[var(--vscode-dropdown-background)] px-2 py-1 text-xs text-[var(--vscode-dropdown-foreground)]"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Title search */}
        <input
          type="text"
          aria-label="Search stories by title"
          placeholder="Search stories..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="flex-1 rounded border border-[var(--vscode-input-border)] bg-[var(--vscode-input-background)] px-2 py-1 text-xs text-[var(--vscode-input-foreground)] placeholder:text-[var(--vscode-input-placeholderForeground)]"
        />

        {/* Table/Kanban toggle */}
        <div className="flex rounded border border-[var(--vscode-panel-border)]">
          <button
            type="button"
            aria-label="Table view"
            data-testid="toggle-table"
            onClick={() => setViewMode('table')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs',
              viewMode === 'table'
                ? 'bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]'
                : 'text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)]'
            )}
          >
            <Table2 size={14} />
            Table
          </button>
          <button
            type="button"
            aria-label="Kanban view"
            data-testid="toggle-kanban"
            onClick={() => setViewMode('kanban')}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs',
              viewMode === 'kanban'
                ? 'bg-[var(--vscode-list-activeSelectionBackground)] text-[var(--vscode-list-activeSelectionForeground)]'
                : 'text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)]'
            )}
          >
            <LayoutGrid size={14} />
            Kanban
          </button>
        </div>
      </div>

      {/* View content */}
      {viewMode === 'kanban' ? (
        <KanbanBoard stories={filteredStories} />
      ) : (
        <StoriesTable stories={filteredStories} navigateTo={navigateTo} vscodeApi={vscodeApi} />
      )}
    </div>
  );
}

function StoriesTable({
  stories,
  navigateTo,
  vscodeApi,
}: {
  stories: StorySummary[];
  navigateTo: (route: { view: 'stories'; params?: Record<string, string> }) => void;
  vscodeApi: { postMessage: (message: ToExtension) => void };
}): React.ReactElement {
  if (stories.length === 0) {
    return (
      <div data-testid="stories-table-empty" className="py-8 text-center">
        <p className="text-sm text-[var(--vscode-descriptionForeground)]">
          No stories match the current filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table data-testid="stories-table" className="w-full min-w-[600px] text-left text-xs">
        <thead>
          <tr className="border-b border-[var(--vscode-panel-border)] text-[var(--vscode-descriptionForeground)]">
            <th className="px-3 py-2 font-medium">Story ID</th>
            <th className="px-3 py-2 font-medium">Title</th>
            <th className="px-3 py-2 font-medium">Epic</th>
            <th className="px-3 py-2 font-medium">Status</th>
            <th className="px-3 py-2 font-medium">Tasks</th>
          </tr>
        </thead>
        <tbody>
          {stories.map((story) => {
            const totalItems = story.totalTasks + story.totalSubtasks;
            const completedItems = story.completedTasks + story.completedSubtasks;
            const progressPercent =
              totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return (
              <tr
                key={story.key}
                data-testid={`story-table-row-${story.key}`}
                role="button"
                tabIndex={0}
                className="cursor-pointer border-b border-[var(--vscode-panel-border)] transition-colors hover:bg-[var(--vscode-list-hoverBackground)]"
                onClick={createShiftOpenHandler(vscodeApi, story.filePath, () =>
                  navigateTo({ view: 'stories', params: { storyKey: story.key } })
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigateTo({ view: 'stories', params: { storyKey: story.key } });
                  }
                }}
              >
                <td className="px-3 py-2 whitespace-nowrap text-[var(--vscode-foreground)]">
                  {story.epicNumber}.{story.storyNumber}
                  {story.storySuffix ?? ''}
                </td>
                <td className="px-3 py-2 text-[var(--vscode-foreground)]">{story.title}</td>
                <td className="px-3 py-2 whitespace-nowrap text-[var(--vscode-descriptionForeground)]">
                  Epic {story.epicNumber}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className={cn('font-medium', getStoryStatusClasses(story.status))}>
                    {getStoryStatusLabel(story.status)}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-1 w-16 overflow-hidden rounded-full bg-[var(--vscode-editor-inactiveSelectionBackground)]"
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
                    <span className="text-[var(--vscode-descriptionForeground)]">
                      {story.completedTasks}/{story.totalTasks}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
