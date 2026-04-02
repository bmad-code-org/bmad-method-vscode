import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KanbanBoard } from './kanban-board';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';
import type { StorySummary } from '@shared/types/story';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const MOCK_STORIES: StorySummary[] = [
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
  {
    key: '3-2-backlog-item',
    title: 'Backlog Item',
    status: 'backlog',
    epicNumber: 3,
    storyNumber: 2,
    totalTasks: 2,
    completedTasks: 0,
    totalSubtasks: 4,
    completedSubtasks: 0,
    filePath: 'impl/3-2-backlog-item.md',
  },
];

describe('KanbanBoard', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      loading: false,
    });
  });

  it('renders all 5 status columns with correct headers and counts', () => {
    render(<KanbanBoard stories={MOCK_STORIES} />);

    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-backlog')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-ready-for-dev')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-review')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-done')).toBeInTheDocument();

    // Column labels
    expect(screen.getByText('Backlog')).toBeInTheDocument();
    expect(screen.getByText('Ready for Dev')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('places story cards in correct columns by status', () => {
    render(<KanbanBoard stories={MOCK_STORIES} />);

    // Backlog column
    const backlogCol = screen.getByTestId('kanban-column-backlog');
    expect(backlogCol).toContainElement(screen.getByTestId('kanban-card-3-2-backlog-item'));

    // Ready for dev column
    const readyCol = screen.getByTestId('kanban-column-ready-for-dev');
    expect(readyCol).toContainElement(screen.getByTestId('kanban-card-2-2-feature-b'));

    // In progress column
    const inProgressCol = screen.getByTestId('kanban-column-in-progress');
    expect(inProgressCol).toContainElement(screen.getByTestId('kanban-card-2-1-feature-a'));

    // Review column
    const reviewCol = screen.getByTestId('kanban-column-review');
    expect(reviewCol).toContainElement(screen.getByTestId('kanban-card-3-1-review-item'));

    // Done column
    const doneCol = screen.getByTestId('kanban-column-done');
    expect(doneCol).toContainElement(screen.getByTestId('kanban-card-1-1-setup'));
  });

  it('empty columns show "No stories" text', () => {
    // Only in-progress story
    const stories: StorySummary[] = [MOCK_STORIES[1]]; // 2-1-feature-a (in-progress)
    render(<KanbanBoard stories={stories} />);

    // Columns without stories should show "No stories"
    const noStoriesTexts = screen.getAllByText('No stories');
    expect(noStoriesTexts.length).toBe(4); // backlog, ready-for-dev, review, done
  });

  it('card click navigates to story detail', () => {
    render(<KanbanBoard stories={MOCK_STORIES} />);

    fireEvent.click(screen.getByTestId('kanban-card-2-1-feature-a'));

    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({
      view: 'stories',
      params: { storyKey: '2-1-feature-a' },
    });
  });

  it('modifier-click on card opens raw file', () => {
    render(<KanbanBoard stories={MOCK_STORIES} />);

    fireEvent.click(screen.getByTestId('kanban-card-2-1-feature-a'), { shiftKey: true });

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPEN_DOCUMENT',
        payload: { path: 'impl/2-1-feature-a.md', forceTextEditor: true },
      })
    );
  });

  it('displays story title, epic context, task count on cards', () => {
    render(<KanbanBoard stories={MOCK_STORIES} />);

    // Story title
    expect(screen.getByText('Feature Alpha')).toBeInTheDocument();

    // Epic context - multiple "Epic N" labels across cards
    const epic2Labels = screen.getAllByText('Epic 2');
    expect(epic2Labels.length).toBe(2); // Feature Alpha + Feature Beta

    // Task count
    expect(screen.getByText('2/5 tasks')).toBeInTheDocument(); // Feature Alpha
    expect(screen.getByText('0/3 tasks')).toBeInTheDocument(); // Feature Beta
    expect(screen.getByText('0/2 tasks')).toBeInTheDocument(); // Backlog Item
    const fourOfFourTasks = screen.getAllByText('4/4 tasks');
    expect(fourOfFourTasks.length).toBe(2); // Project Setup (done) + Review Item (review)
  });

  it('responsive: verify column layout classes', () => {
    render(<KanbanBoard stories={MOCK_STORIES} />);

    const board = screen.getByTestId('kanban-board');
    expect(board.className).toContain('flex-col');
    expect(board.className).toContain('md:flex-row');
    expect(board.className).toContain('overflow-x-auto');
  });

  it('renders all columns even when stories array is empty', () => {
    render(<KanbanBoard stories={[]} />);

    expect(screen.getByTestId('kanban-column-backlog')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-ready-for-dev')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-review')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-done')).toBeInTheDocument();

    const noStoriesTexts = screen.getAllByText('No stories');
    expect(noStoriesTexts.length).toBe(5);
  });
});
