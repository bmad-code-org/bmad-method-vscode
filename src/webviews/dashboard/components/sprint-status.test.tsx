import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../store';
import { SprintStatus, SprintStatusSkeleton } from './sprint-status';
import type { SprintStatus as SprintStatusType } from '@shared/types/sprint-status';

const mockSprintStatus: SprintStatusType = {
  generated: '2026-01-27',
  project: 'bmad-extension',
  project_key: 'bmad-extension',
  tracking_system: 'file-system',
  story_location: '_bmad-output/implementation-artifacts',
  development_status: {
    'epic-1': 'in-progress',
    '1-1-project-init': 'done',
    '1-2-test-framework': 'done',
    '1-3-detection': 'done',
    'epic-1-retrospective': 'optional',
    'epic-2': 'in-progress',
    '2-1-shared-types': 'done',
    '2-2-sprint-parser': 'done',
    '2-3-epic-parser': 'in-progress',
    '2-4-story-parser': 'ready-for-dev',
    '2-5-file-watcher': 'backlog',
    '2-6-state-manager': 'backlog',
    'epic-2-retrospective': 'optional',
  },
};

describe('SprintStatus', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      loading: false,
      errors: [],
    });
  });

  test('displays project name when sprint data available', () => {
    render(<SprintStatus />);
    expect(screen.getByText('bmad-extension')).toBeInTheDocument();
  });

  test('renders progress bar with correct done/total counts', () => {
    render(<SprintStatus />);
    // 5 done out of 9 stories (epic keys and retrospective keys excluded)
    expect(screen.getByText('5/9 stories (56%)')).toBeInTheDocument();
  });

  test('renders status breakdown counts correctly', () => {
    render(<SprintStatus />);
    expect(screen.getByText('5 done')).toBeInTheDocument();
    expect(screen.getByText('1 in-progress')).toBeInTheDocument();
    expect(screen.getByText('1 ready')).toBeInTheDocument();
    expect(screen.getByText('2 backlog')).toBeInTheDocument();
  });

  test('renders progress bar with correct aria attributes', () => {
    render(<SprintStatus />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '56');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  test('renders empty state message when sprint is null', () => {
    useDashboardStore.setState({ sprint: null, loading: false });
    render(<SprintStatus />);
    expect(screen.getByText('No sprint data available')).toBeInTheDocument();
  });

  test('handles sprint with empty development_status gracefully', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {},
      },
      loading: false,
    });
    render(<SprintStatus />);
    expect(screen.getByText('bmad-extension')).toBeInTheDocument();
    expect(screen.getByText('0/0 stories (0%)')).toBeInTheDocument();
    expect(screen.getByText('0 done')).toBeInTheDocument();
  });

  test('renders review status count when stories are in review', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {
          '1-1-story': 'done',
          '1-2-story': 'review',
          '1-3-story': 'in-progress',
        },
      },
      loading: false,
    });
    render(<SprintStatus />);
    expect(screen.getByText('1 done')).toBeInTheDocument();
    expect(screen.getByText('1 review')).toBeInTheDocument();
    expect(screen.getByText('1 in-progress')).toBeInTheDocument();
  });

  test('does not render zero-count status categories (except done)', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {
          '1-1-story': 'done',
          '1-2-story': 'done',
        },
      },
      loading: false,
    });
    render(<SprintStatus />);
    expect(screen.getByText('2 done')).toBeInTheDocument();
    expect(screen.queryByText(/in-progress/)).not.toBeInTheDocument();
    expect(screen.queryByText(/ready/)).not.toBeInTheDocument();
    expect(screen.queryByText(/backlog/)).not.toBeInTheDocument();
  });
});

describe('SprintStatusSkeleton', () => {
  test('renders skeleton with correct test id', () => {
    render(<SprintStatusSkeleton />);
    expect(screen.getByTestId('sprint-status-skeleton')).toBeInTheDocument();
  });

  test('has animate-pulse class for loading animation', () => {
    render(<SprintStatusSkeleton />);
    const skeleton = screen.getByTestId('sprint-status-skeleton');
    expect(skeleton.className).toContain('animate-pulse');
  });
});
