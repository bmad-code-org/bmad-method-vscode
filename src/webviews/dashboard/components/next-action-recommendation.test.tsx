import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../store';
import {
  NextActionRecommendation,
  NextActionRecommendationSkeleton,
} from './next-action-recommendation';
import type { Story } from '@shared/types/story';
import type { SprintStatus } from '@shared/types/sprint-status';

const mockSprintStatus: SprintStatus = {
  generated: '2026-01-27',
  project: 'bmad-extension',
  project_key: 'bmad-extension',
  tracking_system: 'file-system',
  story_location: '_bmad-output/implementation-artifacts',
  development_status: {
    'epic-1': 'in-progress',
    '1-1-project-init': 'done',
    '1-2-test-framework': 'backlog',
  },
};

const mockStory: Story = {
  key: '3-5-next-action-recommendation',
  epicNumber: 3,
  storyNumber: 5,
  title: 'Next Action Recommendation',
  userStory: 'As a developer, I want to see the next recommended action',
  acceptanceCriteria: [],
  tasks: [],
  filePath: '_bmad-output/implementation-artifacts/3-5-next-action-recommendation.md',
  status: 'in-progress',
  totalTasks: 7,
  completedTasks: 3,
  totalSubtasks: 20,
  completedSubtasks: 10,
};

describe('NextActionRecommendation', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      epics: [],
      currentStory: mockStory,
      errors: [],
      loading: false,
      outputRoot: '_bmad-output',
    });
  });

  test('renders recommendation label and description', () => {
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Continue Story 3.5');
    expect(screen.getByTestId('next-action-description')).toHaveTextContent('in progress');
  });

  test('renders section heading', () => {
    render(<NextActionRecommendation />);
    expect(screen.getByText('Next Action')).toBeInTheDocument();
  });

  test('renders different recommendation for review state', () => {
    useDashboardStore.setState({
      currentStory: { ...mockStory, status: 'review' },
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Run Code Review');
  });

  test('renders different recommendation for ready-for-dev state', () => {
    useDashboardStore.setState({
      currentStory: { ...mockStory, status: 'ready-for-dev' },
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Start Dev Story 3.5');
  });

  test('renders sprint-planning when sprint is null', () => {
    useDashboardStore.setState({
      sprint: null,
      currentStory: null,
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Run Sprint Planning');
  });

  test('renders create-story when no active story and backlog exists', () => {
    useDashboardStore.setState({
      currentStory: null,
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Create Next Story');
  });

  test('renders with correct data-testid attributes', () => {
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-recommendation')).toBeInTheDocument();
    expect(screen.getByTestId('next-action-icon')).toBeInTheDocument();
    expect(screen.getByTestId('next-action-label')).toBeInTheDocument();
    expect(screen.getByTestId('next-action-description')).toBeInTheDocument();
  });

  test('renders icon for action type', () => {
    render(<NextActionRecommendation />);
    const icon = screen.getByTestId('next-action-icon');
    expect(icon.textContent).toBeTruthy();
  });

  test('renders retrospective when epic is fully complete', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {
          'epic-1': 'done',
          '1-1-project-init': 'done',
          '1-2-test-framework': 'done',
          'epic-2': 'in-progress',
          '2-1-shared-types': 'in-progress',
        },
      },
      currentStory: null,
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Retrospective');
  });
});

describe('NextActionRecommendationSkeleton', () => {
  test('renders skeleton with correct test id', () => {
    render(<NextActionRecommendationSkeleton />);
    expect(screen.getByTestId('next-action-recommendation-skeleton')).toBeInTheDocument();
  });

  test('has animate-pulse class for loading animation', () => {
    render(<NextActionRecommendationSkeleton />);
    const skeleton = screen.getByTestId('next-action-recommendation-skeleton');
    expect(skeleton.className).toContain('animate-pulse');
  });
});
