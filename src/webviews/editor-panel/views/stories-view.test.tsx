import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StoriesView } from './stories-view';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';
import type { StorySummary } from '@shared/types/story';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const MOCK_SUMMARIES: StorySummary[] = [
  {
    key: '1-1-setup',
    title: 'Project Setup',
    status: 'done',
    epicNumber: 1,
    storyNumber: 1,
    totalTasks: 4,
    completedTasks: 4,
    totalSubtasks: 8,
    completedSubtasks: 8,
    filePath: 'impl/1-1-setup.md',
  },
  {
    key: '1-2-config',
    title: 'Configuration',
    status: 'done',
    epicNumber: 1,
    storyNumber: 2,
    totalTasks: 3,
    completedTasks: 3,
    totalSubtasks: 6,
    completedSubtasks: 6,
    filePath: 'impl/1-2-config.md',
  },
  {
    key: '2-1-feature-a',
    title: 'Feature Alpha',
    status: 'in-progress',
    epicNumber: 2,
    storyNumber: 1,
    totalTasks: 5,
    completedTasks: 2,
    totalSubtasks: 10,
    completedSubtasks: 4,
    filePath: 'impl/2-1-feature-a.md',
  },
  {
    key: '2-2-feature-b',
    title: 'Feature Beta',
    status: 'ready-for-dev',
    epicNumber: 2,
    storyNumber: 2,
    totalTasks: 3,
    completedTasks: 0,
    totalSubtasks: 6,
    completedSubtasks: 0,
    filePath: 'impl/2-2-feature-b.md',
  },
  {
    key: '3-1-review-item',
    title: 'Review Item',
    status: 'review',
    epicNumber: 3,
    storyNumber: 1,
    totalTasks: 4,
    completedTasks: 4,
    totalSubtasks: 8,
    completedSubtasks: 7,
    filePath: 'impl/3-1-review-item.md',
  },
];

const MOCK_EPICS = [
  {
    number: 1,
    key: 'epic-1',
    title: 'Foundation',
    description: '',
    metadata: {},
    status: 'done' as const,
    stories: [],
    filePath: 'epics.md',
  },
  {
    number: 2,
    key: 'epic-2',
    title: 'Features',
    description: '',
    metadata: {},
    status: 'in-progress' as const,
    stories: [],
    filePath: 'epics.md',
  },
  {
    number: 3,
    key: 'epic-3',
    title: 'Polish',
    description: '',
    metadata: {},
    status: 'in-progress' as const,
    stories: [],
    filePath: 'epics.md',
  },
];

function setupStoreWithStories(overrides?: Record<string, unknown>) {
  useEditorPanelStore.setState({
    ...createInitialEditorPanelState(),
    loading: false,
    currentRoute: { view: 'stories' },
    storySummaries: MOCK_SUMMARIES,
    epics: MOCK_EPICS,
    ...overrides,
  });
}

describe('StoriesView', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      loading: false,
    });
  });

  it('renders table view by default with all story data', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    expect(screen.getByTestId('stories-view')).toBeInTheDocument();
    expect(screen.getByTestId('stories-filter-bar')).toBeInTheDocument();
    expect(screen.getByTestId('stories-table')).toBeInTheDocument();

    // All stories rendered
    expect(screen.getByTestId('story-table-row-1-1-setup')).toBeInTheDocument();
    expect(screen.getByTestId('story-table-row-1-2-config')).toBeInTheDocument();
    expect(screen.getByTestId('story-table-row-2-1-feature-a')).toBeInTheDocument();
    expect(screen.getByTestId('story-table-row-2-2-feature-b')).toBeInTheDocument();
    expect(screen.getByTestId('story-table-row-3-1-review-item')).toBeInTheDocument();
  });

  it('renders table headers', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    expect(screen.getByText('Story ID')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Epic')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });

  it('renders story ID, title, epic context, and status', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    expect(screen.getByText('Project Setup')).toBeInTheDocument();
    expect(screen.getByText('Feature Alpha')).toBeInTheDocument();

    // Status labels (may appear in both filter dropdown options and table cells)
    const doneLabels = screen.getAllByText('Done');
    expect(doneLabels.length).toBeGreaterThanOrEqual(2);
    const inProgressLabels = screen.getAllByText('In Progress');
    expect(inProgressLabels.length).toBeGreaterThanOrEqual(2); // dropdown option + table cell
    const readyLabels = screen.getAllByText('Ready for Dev');
    expect(readyLabels.length).toBeGreaterThanOrEqual(2); // dropdown option + table cell
    const reviewLabels = screen.getAllByText('Review');
    expect(reviewLabels.length).toBeGreaterThanOrEqual(2); // dropdown option + table cell
  });

  it('renders task progress with progress bars', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(5);
  });

  it('filters by epic dropdown', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    const epicDropdown = screen.getByLabelText('Filter by epic');
    fireEvent.change(epicDropdown, { target: { value: '2' } });

    // Only epic 2 stories visible
    expect(screen.getByTestId('story-table-row-2-1-feature-a')).toBeInTheDocument();
    expect(screen.getByTestId('story-table-row-2-2-feature-b')).toBeInTheDocument();
    expect(screen.queryByTestId('story-table-row-1-1-setup')).not.toBeInTheDocument();
    expect(screen.queryByTestId('story-table-row-3-1-review-item')).not.toBeInTheDocument();
  });

  it('filters by status dropdown', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    const statusDropdown = screen.getByLabelText('Filter by status');
    fireEvent.change(statusDropdown, { target: { value: 'done' } });

    expect(screen.getByTestId('story-table-row-1-1-setup')).toBeInTheDocument();
    expect(screen.getByTestId('story-table-row-1-2-config')).toBeInTheDocument();
    expect(screen.queryByTestId('story-table-row-2-1-feature-a')).not.toBeInTheDocument();
  });

  it('filters by title search text', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    const searchInput = screen.getByLabelText('Search stories by title');
    fireEvent.change(searchInput, { target: { value: 'Feature' } });

    expect(screen.getByTestId('story-table-row-2-1-feature-a')).toBeInTheDocument();
    expect(screen.getByTestId('story-table-row-2-2-feature-b')).toBeInTheDocument();
    expect(screen.queryByTestId('story-table-row-1-1-setup')).not.toBeInTheDocument();
  });

  it('preserves filters when toggling to kanban mode', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    // Apply epic filter
    const epicDropdown = screen.getByLabelText('Filter by epic');
    fireEvent.change(epicDropdown, { target: { value: '2' } });

    // Toggle to kanban
    fireEvent.click(screen.getByTestId('toggle-kanban'));

    // Kanban board renders with filtered stories
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    // Epic 2 stories should appear in kanban
    expect(screen.getByTestId('kanban-card-2-1-feature-a')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-card-2-2-feature-b')).toBeInTheDocument();
    // Epic 1 stories should not appear
    expect(screen.queryByTestId('kanban-card-1-1-setup')).not.toBeInTheDocument();
  });

  it('click row navigates to story detail', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    fireEvent.click(screen.getByTestId('story-table-row-2-1-feature-a'));

    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({
      view: 'stories',
      params: { storyKey: '2-1-feature-a' },
    });
  });

  it('modifier-click opens raw file', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    fireEvent.click(screen.getByTestId('story-table-row-2-1-feature-a'), { shiftKey: true });

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPEN_DOCUMENT',
        payload: { path: 'impl/2-1-feature-a.md', forceTextEditor: true },
      })
    );
  });

  it('empty state when no stories match filters', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    const searchInput = screen.getByLabelText('Search stories by title');
    fireEvent.change(searchInput, { target: { value: 'nonexistent story xyz' } });

    expect(screen.getByTestId('stories-table-empty')).toBeInTheDocument();
    expect(screen.getByText('No stories match the current filters')).toBeInTheDocument();
  });

  it('empty state when no stories at all', () => {
    setupStoreWithStories({ storySummaries: [] });
    render(<StoriesView />);

    expect(screen.getByTestId('stories-table-empty')).toBeInTheDocument();
    expect(screen.getByText('No stories match the current filters')).toBeInTheDocument();
  });

  it('responsive: verify overflow-x-auto class on table container', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    const table = screen.getByTestId('stories-table');
    const container = table.parentElement!;
    expect(container.className).toContain('overflow-x-auto');
  });

  it('starts in kanban mode when params.mode === kanban', () => {
    setupStoreWithStories({
      currentRoute: { view: 'stories', params: { mode: 'kanban' } },
    });
    render(<StoriesView />);

    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    expect(screen.queryByTestId('stories-table')).not.toBeInTheDocument();
  });

  it('toggles between table and kanban', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    // Initially table
    expect(screen.getByTestId('stories-table')).toBeInTheDocument();
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();

    // Switch to kanban
    fireEvent.click(screen.getByTestId('toggle-kanban'));
    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    expect(screen.queryByTestId('stories-table')).not.toBeInTheDocument();

    // Switch back to table
    fireEvent.click(screen.getByTestId('toggle-table'));
    expect(screen.getByTestId('stories-table')).toBeInTheDocument();
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();
  });

  it('resets epic filter when selecting All Epics', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    const epicDropdown = screen.getByLabelText('Filter by epic');
    fireEvent.change(epicDropdown, { target: { value: '1' } });

    // Only epic 1 stories
    expect(screen.queryByTestId('story-table-row-2-1-feature-a')).not.toBeInTheDocument();

    // Reset
    fireEvent.change(epicDropdown, { target: { value: '' } });

    // All stories visible again
    expect(screen.getByTestId('story-table-row-2-1-feature-a')).toBeInTheDocument();
  });

  it('combines multiple filters', () => {
    setupStoreWithStories();
    render(<StoriesView />);

    // Filter by epic 2 AND status in-progress
    fireEvent.change(screen.getByLabelText('Filter by epic'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Filter by status'), {
      target: { value: 'in-progress' },
    });

    expect(screen.getByTestId('story-table-row-2-1-feature-a')).toBeInTheDocument();
    expect(screen.queryByTestId('story-table-row-2-2-feature-b')).not.toBeInTheDocument();
    expect(screen.queryByTestId('story-table-row-1-1-setup')).not.toBeInTheDocument();
  });
});
