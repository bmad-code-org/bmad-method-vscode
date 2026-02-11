import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../store';
import { EpicList, EpicListSkeleton } from './epic-list';
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
  development_status: {
    'epic-1': 'done',
    '1-1-project-initialization': 'done',
    '1-2-test-framework': 'done',
    '1-3-detection': 'done',
    '1-4-sidebar-panel': 'done',
    'epic-1-retrospective': 'optional',
    'epic-2': 'in-progress',
    '2-1-shared-types': 'done',
    '2-2-sprint-parser': 'done',
    '2-3-epic-parser': 'in-progress',
    'epic-2-retrospective': 'optional',
    'epic-3': 'backlog',
    '3-1-dashboard-store': 'backlog',
    'epic-3-retrospective': 'optional',
  },
};

describe('EpicList', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      epics: [],
      currentStory: null,
      errors: [],
      loading: false,
      outputRoot: '_bmad-output',
    });
  });

  test('renders all epics from sprint status development_status', () => {
    render(<EpicList />);
    expect(screen.getByText('Epic 1')).toBeInTheDocument();
    expect(screen.getByText('Epic 2')).toBeInTheDocument();
    expect(screen.getByText('Epic 3')).toBeInTheDocument();
  });

  test('renders correct story completion counts per epic', () => {
    render(<EpicList />);
    // Epic 1: 4/4 done, Epic 2: 2/3, Epic 3: 0/1
    expect(screen.getByText('4/4')).toBeInTheDocument();
    expect(screen.getByText('2/3')).toBeInTheDocument();
    expect(screen.getByText('0/1')).toBeInTheDocument();
  });

  test('visually highlights the in-progress epic', () => {
    render(<EpicList />);
    const epic2 = screen.getByTestId('epic-item-2');
    expect(epic2.className).toContain('border');
  });

  test('does not highlight non-in-progress epics', () => {
    render(<EpicList />);
    const epic1 = screen.getByTestId('epic-item-1');
    const epic3 = screen.getByTestId('epic-item-3');
    expect(epic1.className).not.toContain('border-l-2');
    expect(epic3.className).not.toContain('border-l-2');
  });

  test('renders empty state message when sprint is null', () => {
    useDashboardStore.setState({ sprint: null, loading: false });
    render(<EpicList />);
    expect(screen.getByText('No epics found')).toBeInTheDocument();
    expect(screen.getByTestId('epic-list-empty')).toBeInTheDocument();
  });

  test('renders empty state when sprint has no epic entries', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {},
      },
      loading: false,
    });
    render(<EpicList />);
    expect(screen.getByText('No epics found')).toBeInTheDocument();
  });

  test('clicking epic title sends OPEN_DOCUMENT message with correct path', () => {
    render(<EpicList />);
    fireEvent.click(screen.getByText('Epic 1'));
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPEN_DOCUMENT',
        payload: { path: '_bmad-output/planning-artifacts/epics.md' },
      })
    );
  });

  test('handles epics with all stories done (shows Done status)', () => {
    render(<EpicList />);
    // Epic 1 is 'done' status
    const epic1 = screen.getByTestId('epic-item-1');
    expect(epic1).toHaveTextContent('Done');
  });

  test('handles epics in backlog state (no stories started)', () => {
    render(<EpicList />);
    // Epic 3 is 'backlog' status with 0/1 stories
    const epic3 = screen.getByTestId('epic-item-3');
    expect(epic3).toHaveTextContent('Backlog');
    expect(epic3).toHaveTextContent('0/1');
  });

  test('counts review status stories as not done', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {
          'epic-1': 'in-progress',
          '1-1-story': 'done',
          '1-2-story': 'review',
          '1-3-story': 'ready-for-dev',
        },
      },
      loading: false,
    });
    render(<EpicList />);
    // Only 1 of 3 stories is done; review and ready-for-dev are NOT done
    expect(screen.getByText('1/3')).toBeInTheDocument();
  });

  test('shows epic title from epics data when available', () => {
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      epics: [
        {
          number: 1,
          key: 'epic-1',
          title: 'Project Foundation & Detection',
          description: '',
          metadata: {},
          stories: [],
          filePath: '',
          status: 'done',
        },
      ],
      loading: false,
    });
    render(<EpicList />);
    expect(screen.getByText('Project Foundation & Detection')).toBeInTheDocument();
    // Epics without data still fall back to "Epic N"
    expect(screen.getByText('Epic 2')).toBeInTheDocument();
  });

  test('displays In Progress status for active epics', () => {
    render(<EpicList />);
    const epic2 = screen.getByTestId('epic-item-2');
    expect(epic2).toHaveTextContent('In Progress');
  });

  test('highlights multiple in-progress epics', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {
          'epic-1': 'in-progress',
          '1-1-story': 'done',
          'epic-2': 'in-progress',
          '2-1-story': 'backlog',
        },
      },
      loading: false,
    });
    render(<EpicList />);
    const epic1 = screen.getByTestId('epic-item-1');
    const epic2 = screen.getByTestId('epic-item-2');
    expect(epic1.className).toContain('border');
    expect(epic2.className).toContain('border');
  });
});

describe('EpicListSkeleton', () => {
  test('renders skeleton with correct test id', () => {
    render(<EpicListSkeleton />);
    expect(screen.getByTestId('epic-list-skeleton')).toBeInTheDocument();
  });

  test('has animate-pulse class for loading animation', () => {
    render(<EpicListSkeleton />);
    const skeleton = screen.getByTestId('epic-list-skeleton');
    expect(skeleton.className).toContain('animate-pulse');
  });
});
