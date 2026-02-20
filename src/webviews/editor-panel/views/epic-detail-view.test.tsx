import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EpicDetailView } from './epic-detail-view';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';
import type { StorySummary } from '@shared/types';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const MOCK_SUMMARIES: StorySummary[] = [
  {
    key: '3-1-setup',
    title: 'Project Setup',
    status: 'done',
    epicNumber: 3,
    storyNumber: 1,
    totalTasks: 4,
    completedTasks: 4,
    totalSubtasks: 8,
    completedSubtasks: 8,
    filePath: 'impl/3-1-setup.md',
  },
  {
    key: '3-2-feature',
    title: 'Core Feature',
    status: 'in-progress',
    epicNumber: 3,
    storyNumber: 2,
    totalTasks: 6,
    completedTasks: 3,
    totalSubtasks: 10,
    completedSubtasks: 5,
    filePath: 'impl/3-2-feature.md',
  },
  {
    key: '4-1-other',
    title: 'Other Epic Story',
    status: 'backlog',
    epicNumber: 4,
    storyNumber: 1,
    totalTasks: 2,
    completedTasks: 0,
    totalSubtasks: 0,
    completedSubtasks: 0,
    filePath: 'impl/4-1-other.md',
  },
];

function setupStoreWithEpicDetail() {
  useEditorPanelStore.setState({
    ...createInitialEditorPanelState(),
    loading: false,
    currentRoute: { view: 'epics', params: { epicId: '3' } },
    breadcrumbs: [
      { label: 'Dashboard', route: { view: 'dashboard' } },
      { label: 'Epics', route: { view: 'epics' } },
      { label: 'Epic 3: Parsing', route: { view: 'epics', params: { epicId: '3' } } },
    ],
    epics: [
      {
        number: 3,
        key: 'epic-3',
        title: 'Parsing',
        description: 'File parsing implementation',
        metadata: {},
        status: 'in-progress',
        stories: [],
        filePath: 'epics.md',
      },
    ],
    storySummaries: MOCK_SUMMARIES,
  });
}

describe('EpicDetailView', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useEditorPanelStore.setState(createInitialEditorPanelState());
  });

  it('renders empty state when epic is not found', () => {
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      currentRoute: { view: 'epics', params: { epicId: '999' } },
    });
    render(<EpicDetailView />);
    expect(screen.getByTestId('epic-detail-empty')).toBeInTheDocument();
    expect(screen.getByText('Epic not found')).toBeInTheDocument();
  });

  it('renders the epic header with title and status', () => {
    setupStoreWithEpicDetail();
    render(<EpicDetailView />);
    expect(screen.getByTestId('epic-detail-view')).toBeInTheDocument();
    expect(screen.getByText('Epic 3: Parsing')).toBeInTheDocument();
    // Both epic and story 3-2 show "In Progress", so use getAllByText
    const inProgressLabels = screen.getAllByText('In Progress');
    expect(inProgressLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the epic description', () => {
    setupStoreWithEpicDetail();
    render(<EpicDetailView />);
    expect(screen.getByText('File parsing implementation')).toBeInTheDocument();
  });

  it('displays only stories belonging to this epic', () => {
    setupStoreWithEpicDetail();
    render(<EpicDetailView />);
    expect(screen.getByTestId('story-row-3-1-setup')).toBeInTheDocument();
    expect(screen.getByTestId('story-row-3-2-feature')).toBeInTheDocument();
    expect(screen.queryByTestId('story-row-4-1-other')).not.toBeInTheDocument();
  });

  it('displays story title, status, and task progress', () => {
    setupStoreWithEpicDetail();
    render(<EpicDetailView />);
    expect(screen.getByText(/Project Setup/)).toBeInTheDocument();
    expect(screen.getByText(/Core Feature/)).toBeInTheDocument();
    expect(screen.getByText('4/4 tasks')).toBeInTheDocument();
    expect(screen.getByText('3/6 tasks')).toBeInTheDocument();
  });

  it('navigates to story detail on normal click', () => {
    setupStoreWithEpicDetail();
    render(<EpicDetailView />);
    fireEvent.click(screen.getByTestId('story-row-3-2-feature'));
    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({
      view: 'epics',
      params: { epicId: '3', storyKey: '3-2-feature' },
    });
  });

  it('opens raw file on shift+click', () => {
    setupStoreWithEpicDetail();
    render(<EpicDetailView />);
    fireEvent.click(screen.getByTestId('story-row-3-1-setup'), { shiftKey: true });
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPEN_DOCUMENT',
        payload: { path: 'impl/3-1-setup.md', forceTextEditor: true },
      })
    );
  });

  it('shows empty state when epic has no stories', () => {
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      loading: false,
      currentRoute: { view: 'epics', params: { epicId: '3' } },
      epics: [
        {
          number: 3,
          key: 'epic-3',
          title: 'Empty',
          description: '',
          metadata: {},
          status: 'backlog',
          stories: [],
          filePath: 'epics.md',
        },
      ],
      storySummaries: [],
    });
    render(<EpicDetailView />);
    expect(screen.getByTestId('epic-detail-no-stories')).toBeInTheDocument();
    expect(screen.getByText(/No stories found/)).toBeInTheDocument();
  });

  it('renders progress bars with correct aria attributes', () => {
    setupStoreWithEpicDetail();
    render(<EpicDetailView />);
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBe(2);
  });
});
