import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EpicsView } from './epics-view';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

function setupStoreWithEpics() {
  useEditorPanelStore.setState({
    ...createInitialEditorPanelState(),
    loading: false,
    epics: [
      {
        number: 1,
        key: 'epic-1',
        title: 'Foundation',
        description: 'Project foundation',
        metadata: {},
        status: 'done',
        stories: [],
        filePath: 'epics.md',
      },
      {
        number: 2,
        key: 'epic-2',
        title: 'Core Features',
        description: 'Core feature development',
        metadata: {},
        status: 'in-progress',
        stories: [],
        filePath: 'epics.md',
      },
      {
        number: 3,
        key: 'epic-3',
        title: 'Polish',
        description: 'UX polish',
        metadata: {},
        status: 'backlog',
        stories: [],
        filePath: 'epics.md',
      },
    ],
    sprint: {
      generated: '2026-01-01',
      project: 'test',
      project_key: 'test',
      tracking_system: 'file-system',
      story_location: 'stories',
      development_status: {
        'epic-1': 'done',
        '1-1-setup': 'done',
        '1-2-init': 'done',
        'epic-2': 'in-progress',
        '2-1-feature-a': 'done',
        '2-2-feature-b': 'in-progress',
        'epic-3': 'backlog',
      },
    },
  });
}

describe('EpicsView', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useEditorPanelStore.setState(createInitialEditorPanelState());
  });

  it('renders empty state when no epics exist', () => {
    useEditorPanelStore.setState({ ...createInitialEditorPanelState(), loading: false });
    render(<EpicsView />);
    expect(screen.getByTestId('epics-view-empty')).toBeInTheDocument();
    expect(screen.getByText(/No epics found/)).toBeInTheDocument();
  });

  it('renders epic cards when epics are available', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    expect(screen.getByTestId('epics-view')).toBeInTheDocument();
    expect(screen.getByTestId('epic-card-1')).toBeInTheDocument();
    expect(screen.getByTestId('epic-card-2')).toBeInTheDocument();
    expect(screen.getByTestId('epic-card-3')).toBeInTheDocument();
  });

  it('displays epic number and title on each card', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    expect(screen.getByText('Foundation')).toBeInTheDocument();
    expect(screen.getByText('Core Features')).toBeInTheDocument();
    expect(screen.getByText('Polish')).toBeInTheDocument();
  });

  it('displays status labels on epic cards', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });

  it('displays story count on epic cards', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    // Epic 1 and Epic 2 both have 2 stories from sprint_status
    const storyCountLabels = screen.getAllByText('2 stories');
    expect(storyCountLabels.length).toBe(2);
    expect(screen.getByText('0 stories')).toBeInTheDocument();
  });

  it('applies muted styling to completed epics', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    const doneCard = screen.getByTestId('epic-card-1');
    expect(doneCard.className).toContain('opacity-60');
  });

  it('applies active styling to in-progress epics', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    const activeCard = screen.getByTestId('epic-card-2');
    expect(activeCard.className).toContain('ring-1');
  });

  it('navigates to epic detail on normal click', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    fireEvent.click(screen.getByTestId('epic-card-2'));
    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({ view: 'epics', params: { epicId: '2' } });
  });

  it('opens raw file on shift+click', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    fireEvent.click(screen.getByTestId('epic-card-2'), { shiftKey: true });
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPEN_DOCUMENT',
      })
    );
    const call = mockPostMessage.mock.calls[0][0] as { payload: { forceTextEditor: boolean } };
    expect(call.payload.forceTextEditor).toBe(true);
  });

  it('has responsive grid CSS classes', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    const grid = screen.getByTestId('epics-view').querySelector('.grid');
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });

  it('displays progress bar with correct aria attributes', () => {
    setupStoreWithEpics();
    render(<EpicsView />);
    const progressBars = screen.getAllByRole('progressbar');
    expect(progressBars.length).toBeGreaterThan(0);
    // Epic 1: 2/2 done = 100%
    expect(progressBars[0]).toHaveAttribute('aria-valuenow', '100');
  });
});
