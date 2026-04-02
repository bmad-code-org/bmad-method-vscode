import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoryDetailView } from './story-detail-view';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';
import type { Story, StorySummary } from '@shared/types';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const MOCK_SUMMARY: StorySummary = {
  key: '3-2-feature',
  title: 'Core Feature',
  status: 'in-progress',
  epicNumber: 3,
  storyNumber: 2,
  totalTasks: 3,
  completedTasks: 1,
  totalSubtasks: 4,
  completedSubtasks: 2,
  filePath: 'impl/3-2-feature.md',
};

const MOCK_STORY: Story = {
  key: '3-2-feature',
  epicNumber: 3,
  storyNumber: 2,
  title: 'Core Feature',
  userStory: 'As a developer I want to build features so that users are happy',
  status: 'in-progress',
  filePath: 'impl/3-2-feature.md',
  totalTasks: 3,
  completedTasks: 1,
  totalSubtasks: 4,
  completedSubtasks: 2,
  acceptanceCriteria: [
    { number: 1, title: 'Feature renders correctly', content: 'Given... When... Then...' },
    { number: 2, title: 'Feature handles errors', content: 'Given... When... Then...' },
  ],
  tasks: [
    {
      number: 1,
      description: 'Set up component',
      completed: true,
      subtasks: [
        { id: '1.1', description: 'Create file', completed: true },
        { id: '1.2', description: 'Add imports', completed: true },
      ],
    },
    {
      number: 2,
      description: 'Implement logic',
      completed: false,
      subtasks: [
        { id: '2.1', description: 'Parse data', completed: false },
        { id: '2.2', description: 'Validate input', completed: false },
      ],
    },
    {
      number: 3,
      description: 'Add tests',
      completed: false,
      subtasks: [],
    },
  ],
};

function setupStoreWithStoryDetail(overrides?: Partial<Story>) {
  useEditorPanelStore.setState({
    ...createInitialEditorPanelState(),
    loading: false,
    currentRoute: { view: 'epics', params: { epicId: '3', storyKey: '3-2-feature' } },
    storySummaries: [MOCK_SUMMARY],
    storyDetail: { ...MOCK_STORY, ...overrides },
    storyDetailLoading: false,
  });
}

describe('StoryDetailView', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useEditorPanelStore.setState(createInitialEditorPanelState());
  });

  it('renders empty state when no storyKey in route', () => {
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      currentRoute: { view: 'epics', params: { epicId: '3' } },
    });
    render(<StoryDetailView />);
    expect(screen.getByTestId('story-detail-empty')).toBeInTheDocument();
    expect(screen.getByText('No story selected')).toBeInTheDocument();
  });

  it('renders skeleton while loading', () => {
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      currentRoute: { view: 'epics', params: { epicId: '3', storyKey: '3-2-feature' } },
      storySummaries: [MOCK_SUMMARY],
      storyDetailLoading: true,
      storyDetail: null,
    });
    render(<StoryDetailView />);
    expect(screen.getByTestId('story-detail-skeleton')).toBeInTheDocument();
  });

  it('renders error state when story fails to load', () => {
    // No matching summary means useEffect won't trigger loading,
    // so storyDetail=null + storyDetailLoading=false = error state
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      currentRoute: { view: 'epics', params: { epicId: '3', storyKey: '3-2-feature' } },
      storySummaries: [],
      storyDetailLoading: false,
      storyDetail: null,
    });
    render(<StoryDetailView />);
    expect(screen.getByTestId('story-detail-error')).toBeInTheDocument();
    expect(screen.getByText(/Failed to load story content/)).toBeInTheDocument();
  });

  it('renders story header with epic number, title, and status', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    expect(screen.getByTestId('story-detail-view')).toBeInTheDocument();
    expect(screen.getByText('Epic 3')).toBeInTheDocument();
    expect(screen.getByText(/Story 3\.2.*Core Feature/)).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('renders progress bar with correct values', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    const progressBar = screen.getByRole('progressbar');
    // (1+2) / (3+4) = 3/7 = 43%
    expect(progressBar).toHaveAttribute('aria-valuenow', '43');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders task and subtask counts', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    expect(screen.getByText('1/3 tasks, 2/4 subtasks')).toBeInTheDocument();
  });

  it('renders user story when present', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    expect(
      screen.getByText('As a developer I want to build features so that users are happy')
    ).toBeInTheDocument();
  });

  it('does not render user story section when empty', () => {
    setupStoreWithStoryDetail({ userStory: '' });
    render(<StoryDetailView />);
    expect(screen.queryByText('User Story')).not.toBeInTheDocument();
  });

  it('renders acceptance criteria', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    expect(screen.getByText('Feature renders correctly')).toBeInTheDocument();
    expect(screen.getByText('Feature handles errors')).toBeInTheDocument();
  });

  it('does not render acceptance criteria section when empty', () => {
    setupStoreWithStoryDetail({ acceptanceCriteria: [] });
    render(<StoryDetailView />);
    expect(screen.queryByText('Acceptance Criteria')).not.toBeInTheDocument();
  });

  it('renders task checklist with completed and incomplete tasks', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    expect(screen.getByText(/Task 1: Set up component/)).toBeInTheDocument();
    expect(screen.getByText(/Task 2: Implement logic/)).toBeInTheDocument();
    expect(screen.getByText(/Task 3: Add tests/)).toBeInTheDocument();
  });

  it('renders subtasks under their parent tasks', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    expect(screen.getByText(/1\.1: Create file/)).toBeInTheDocument();
    expect(screen.getByText(/1\.2: Add imports/)).toBeInTheDocument();
    expect(screen.getByText(/2\.1: Parse data/)).toBeInTheDocument();
    expect(screen.getByText(/2\.2: Validate input/)).toBeInTheDocument();
  });

  it('applies line-through styling to completed tasks', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    const task1 = screen.getByText(/Task 1: Set up component/);
    expect(task1.className).toContain('line-through');
  });

  it('does not apply line-through to incomplete tasks', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    const task2 = screen.getByText(/Task 2: Implement logic/);
    expect(task2.className).not.toContain('line-through');
  });

  it('opens raw file on shift+click of story title', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    const titleButton = screen.getByText(/Story 3\.2.*Core Feature/);
    fireEvent.click(titleButton, { shiftKey: true });
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPEN_DOCUMENT',
        payload: { path: 'impl/3-2-feature.md', forceTextEditor: true },
      })
    );
  });

  it('does not open file on normal click of story title', () => {
    setupStoreWithStoryDetail();
    render(<StoryDetailView />);
    const titleButton = screen.getByText(/Story 3\.2.*Core Feature/);
    fireEvent.click(titleButton);
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it('renders story with suffix correctly', () => {
    setupStoreWithStoryDetail({ storySuffix: 'a' });
    render(<StoryDetailView />);
    expect(screen.getByText(/Story 3\.2a.*Core Feature/)).toBeInTheDocument();
  });

  it('does not render tasks section when tasks array is empty', () => {
    setupStoreWithStoryDetail({ tasks: [], totalTasks: 0, completedTasks: 0 });
    render(<StoryDetailView />);
    expect(screen.queryByText('Tasks')).not.toBeInTheDocument();
  });

  it('requests document content on mount when summary has filePath', () => {
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      currentRoute: { view: 'epics', params: { epicId: '3', storyKey: '3-2-feature' } },
      storySummaries: [MOCK_SUMMARY],
      storyDetailLoading: false,
      storyDetail: null,
    });
    render(<StoryDetailView />);
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'REQUEST_DOCUMENT_CONTENT',
        payload: { path: 'impl/3-2-feature.md' },
      })
    );
  });
});
