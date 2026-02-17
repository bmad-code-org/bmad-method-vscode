import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../store';
import {
  NextActionRecommendation,
  NextActionRecommendationSkeleton,
} from './next-action-recommendation';
import type { Story } from '@shared/types/story';
import type { SprintStatus } from '@shared/types/sprint-status';
import type { AvailableWorkflow } from '@shared/types';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const mockPrimaryWorkflow: AvailableWorkflow = {
  id: 'dev-story',
  name: 'Dev Story',
  command: '/bmad-bmm-dev-story',
  description: 'Implement the next story',
  isPrimary: true,
};

const mockSecondaryWorkflow: AvailableWorkflow = {
  id: 'correct-course',
  name: 'Correct Course',
  command: '/bmad-bmm-correct-course',
  description: 'Adjust sprint plan',
  isPrimary: false,
};

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
    mockPostMessage.mockClear();
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      epics: [],
      currentStory: mockStory,
      workflows: [mockPrimaryWorkflow, mockSecondaryWorkflow],
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

  test('renders sprint-planning when sprint is null and all planning artifacts exist', () => {
    useDashboardStore.setState({
      sprint: null,
      currentStory: null,
      planningArtifacts: {
        hasProductBrief: false,
        hasPrd: true,
        hasArchitecture: true,
        hasEpics: true,
      },
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Run Sprint Planning');
  });

  test('renders create-prd when no planning artifacts exist', () => {
    useDashboardStore.setState({
      sprint: null,
      currentStory: null,
      planningArtifacts: {
        hasProductBrief: false,
        hasPrd: false,
        hasArchitecture: false,
        hasEpics: false,
      },
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Create PRD');
  });

  test('renders create-architecture when PRD exists but no architecture', () => {
    useDashboardStore.setState({
      sprint: null,
      currentStory: null,
      planningArtifacts: {
        hasProductBrief: false,
        hasPrd: true,
        hasArchitecture: false,
        hasEpics: false,
      },
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Create Architecture');
  });

  test('renders create-epics when PRD and architecture exist but no epics', () => {
    useDashboardStore.setState({
      sprint: null,
      currentStory: null,
      planningArtifacts: {
        hasProductBrief: false,
        hasPrd: true,
        hasArchitecture: true,
        hasEpics: false,
      },
    });
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Create Epics & Stories');
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

  test('play button renders and sends EXECUTE_WORKFLOW message with correct command', () => {
    render(<NextActionRecommendation />);
    const playButton = screen.getByTestId('next-action-execute');
    expect(playButton).toBeInTheDocument();
    fireEvent.click(playButton);
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });
  });

  test('copy button renders and sends COPY_COMMAND message with correct command', () => {
    render(<NextActionRecommendation />);
    const copyButton = screen.getByTestId('next-action-copy');
    expect(copyButton).toBeInTheDocument();
    fireEvent.click(copyButton);
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'COPY_COMMAND',
      payload: { command: '/bmad-bmm-dev-story' },
    });
  });

  test('play and copy buttons do NOT render when workflows is empty', () => {
    useDashboardStore.setState({ workflows: [] });
    render(<NextActionRecommendation />);
    expect(screen.queryByTestId('next-action-execute')).not.toBeInTheDocument();
    expect(screen.queryByTestId('next-action-copy')).not.toBeInTheDocument();
  });

  test('play and copy buttons do NOT render when no primary workflow exists', () => {
    useDashboardStore.setState({ workflows: [mockSecondaryWorkflow] });
    render(<NextActionRecommendation />);
    expect(screen.queryByTestId('next-action-execute')).not.toBeInTheDocument();
    expect(screen.queryByTestId('next-action-copy')).not.toBeInTheDocument();
  });

  test('buttons have correct data-testid attributes', () => {
    render(<NextActionRecommendation />);
    expect(screen.getByTestId('next-action-execute')).toBeInTheDocument();
    expect(screen.getByTestId('next-action-copy')).toBeInTheDocument();
  });

  test('buttons have correct aria-label attributes', () => {
    render(<NextActionRecommendation />);
    expect(screen.getByLabelText('Execute Dev Story')).toBeInTheDocument();
    expect(screen.getByLabelText('Copy Dev Story command')).toBeInTheDocument();
  });

  test('play button has title with workflow description', () => {
    render(<NextActionRecommendation />);
    const playButton = screen.getByTestId('next-action-execute');
    expect(playButton).toHaveAttribute('title', 'Implement the next story');
  });

  test('copy button has title showing full command', () => {
    render(<NextActionRecommendation />);
    const copyButton = screen.getByTestId('next-action-copy');
    expect(copyButton).toHaveAttribute('title', 'Copy: /bmad-bmm-dev-story');
  });

  test('play/copy buttons use primary workflow command even when next action type differs', () => {
    // Simulate edge case: story is in review (next action = code-review)
    // but primary workflow is still dev-story (stale/mismatched state)
    useDashboardStore.setState({
      currentStory: { ...mockStory, status: 'review' },
    });
    render(<NextActionRecommendation />);
    // Next action label should reflect review state
    expect(screen.getByTestId('next-action-label')).toHaveTextContent('Run Code Review');
    // But buttons still use whatever the primary workflow is
    fireEvent.click(screen.getByTestId('next-action-execute'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });
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
