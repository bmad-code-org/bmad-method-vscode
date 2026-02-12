import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../store';
import { ActiveStoryCard, ActiveStoryCardSkeleton } from './active-story-card';
import type { Story } from '@shared/types/story';
import type { SprintStatus } from '@shared/types/sprint-status';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const mockSprintStatus: SprintStatus = {
  generated: '2026-01-27',
  project: 'bmad-extension',
  project_key: 'bmad-extension',
  tracking_system: 'file-system',
  story_location: '_bmad-output/implementation-artifacts',
  development_status: {},
};

const mockStory: Story = {
  key: '3-4-active-story-card-with-task-progress',
  epicNumber: 3,
  storyNumber: 4,
  title: 'Active Story Card with Task Progress',
  userStory: 'As a developer, I want to view the current active story with task progress',
  acceptanceCriteria: [],
  tasks: [],
  filePath: '_bmad-output/implementation-artifacts/3-4-active-story-card-with-task-progress.md',
  status: 'in-progress',
  totalTasks: 7,
  completedTasks: 4,
  totalSubtasks: 18,
  completedSubtasks: 12,
};

describe('ActiveStoryCard', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      epics: [],
      currentStory: mockStory,
      errors: [],
      loading: false,
      outputRoot: '_bmad-output',
    });
  });

  test('renders story title with epic context', () => {
    render(<ActiveStoryCard />);
    expect(screen.getByText('Epic 3')).toBeInTheDocument();
    expect(screen.getByText('Story 3.4: Active Story Card with Task Progress')).toBeInTheDocument();
  });

  test('renders task completion progress count', () => {
    render(<ActiveStoryCard />);
    expect(screen.getByText('4/7 tasks done')).toBeInTheDocument();
  });

  test('renders progress bar with correct aria attributes', () => {
    render(<ActiveStoryCard />);
    const progressBar = screen.getByRole('progressbar');
    // (4+12)/(7+18) = 16/25 = 64%
    expect(progressBar).toHaveAttribute('aria-valuenow', '64');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute(
      'aria-label',
      'Story progress: 64% complete (4 of 7 tasks, 12 of 18 subtasks)'
    );
  });

  test('renders subtask completion count', () => {
    render(<ActiveStoryCard />);
    expect(screen.getByText('12/18 subtasks')).toBeInTheDocument();
  });

  test('renders story status badge with correct text', () => {
    render(<ActiveStoryCard />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  test('handles ready-for-dev status value', () => {
    useDashboardStore.setState({
      currentStory: { ...mockStory, status: 'ready-for-dev' },
    });
    render(<ActiveStoryCard />);
    expect(screen.getByText('Ready for Dev')).toBeInTheDocument();
  });

  test('handles review status value', () => {
    useDashboardStore.setState({
      currentStory: { ...mockStory, status: 'review' },
    });
    render(<ActiveStoryCard />);
    expect(screen.getByText('Review')).toBeInTheDocument();
  });

  test('handles done status value', () => {
    useDashboardStore.setState({
      currentStory: { ...mockStory, status: 'done' },
    });
    render(<ActiveStoryCard />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  test('handles backlog status value', () => {
    useDashboardStore.setState({
      currentStory: { ...mockStory, status: 'backlog' },
    });
    render(<ActiveStoryCard />);
    expect(screen.getByText('Backlog')).toBeInTheDocument();
  });

  test('visually highlights the in-progress story card with border', () => {
    render(<ActiveStoryCard />);
    const card = screen.getByTestId('active-story-card');
    expect(card.className).toContain('border-l-2');
  });

  test('does not highlight non-in-progress story card', () => {
    useDashboardStore.setState({
      currentStory: { ...mockStory, status: 'review' },
    });
    render(<ActiveStoryCard />);
    const card = screen.getByTestId('active-story-card');
    expect(card.className).not.toContain('border-l-2');
  });

  test('renders empty state when currentStory is null', () => {
    useDashboardStore.setState({ currentStory: null });
    render(<ActiveStoryCard />);
    expect(screen.getByText('No active story')).toBeInTheDocument();
    expect(screen.getByTestId('active-story-card-empty')).toBeInTheDocument();
  });

  test('empty state includes section heading', () => {
    useDashboardStore.setState({ currentStory: null });
    render(<ActiveStoryCard />);
    expect(screen.getByText('Active Story')).toBeInTheDocument();
  });

  test('clicking story title sends OPEN_DOCUMENT message with correct filePath', () => {
    render(<ActiveStoryCard />);
    fireEvent.click(screen.getByText('Story 3.4: Active Story Card with Task Progress'));
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPEN_DOCUMENT',
        payload: {
          path: '_bmad-output/implementation-artifacts/3-4-active-story-card-with-task-progress.md',
        },
      })
    );
  });

  test('renders correctly when story has zero tasks (0% progress)', () => {
    useDashboardStore.setState({
      currentStory: {
        ...mockStory,
        totalTasks: 0,
        completedTasks: 0,
        totalSubtasks: 0,
        completedSubtasks: 0,
      },
    });
    render(<ActiveStoryCard />);
    expect(screen.getByText('0/0 tasks done')).toBeInTheDocument();
    expect(screen.getByText('0/0 subtasks')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '0');
  });

  test('renders correctly when all tasks and subtasks are complete (100% progress)', () => {
    useDashboardStore.setState({
      currentStory: {
        ...mockStory,
        totalTasks: 7,
        completedTasks: 7,
        totalSubtasks: 18,
        completedSubtasks: 18,
        status: 'done',
      },
    });
    render(<ActiveStoryCard />);
    expect(screen.getByText('7/7 tasks done')).toBeInTheDocument();
    expect(screen.getByText('18/18 subtasks')).toBeInTheDocument();
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '100');
  });
});

describe('ActiveStoryCardSkeleton', () => {
  test('renders skeleton with correct test id', () => {
    render(<ActiveStoryCardSkeleton />);
    expect(screen.getByTestId('active-story-card-skeleton')).toBeInTheDocument();
  });

  test('has animate-pulse class for loading animation', () => {
    render(<ActiveStoryCardSkeleton />);
    const skeleton = screen.getByTestId('active-story-card-skeleton');
    expect(skeleton.className).toContain('animate-pulse');
  });
});
