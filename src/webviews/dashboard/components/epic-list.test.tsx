import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../store';
import { EpicList, EpicListSkeleton } from './epic-list';
import type { SprintStatus } from '@shared/types/sprint-status';
import type { Epic } from '@shared/types/epic';

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

const mockEpicsWithStories: Epic[] = [
  {
    number: 1,
    key: 'epic-1',
    title: 'Project Foundation',
    description: '',
    metadata: {},
    stories: [
      { key: '1-1-project-initialization', title: 'Project Initialization', status: 'done' },
      { key: '1-2-test-framework', title: 'Test Framework', status: 'done' },
      { key: '1-3-detection', title: 'Detection', status: 'done' },
      { key: '1-4-sidebar-panel', title: 'Sidebar Panel', status: 'done' },
    ],
    filePath: '',
    status: 'done',
  },
  {
    number: 2,
    key: 'epic-2',
    title: 'File Parsing',
    description: '',
    metadata: {},
    stories: [
      { key: '2-1-shared-types', title: 'Shared Types', status: 'done' },
      { key: '2-2-sprint-parser', title: 'Sprint Parser', status: 'done' },
      { key: '2-3-epic-parser', title: 'Epic Parser', status: 'in-progress' },
    ],
    filePath: '',
    status: 'in-progress',
  },
  {
    number: 3,
    key: 'epic-3',
    title: 'Dashboard',
    description: '',
    metadata: {},
    stories: [],
    filePath: '',
    status: 'backlog',
  },
];

/** Helper to reveal done epics by clicking the toggle */
function showCompletedEpics(): void {
  fireEvent.click(screen.getByTestId('toggle-done-epics'));
}

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

  test('renders non-done epics by default (done epics hidden)', () => {
    render(<EpicList />);
    // Epic 2 (in-progress) and Epic 3 (backlog) visible
    expect(screen.getByText('Epic 2')).toBeInTheDocument();
    expect(screen.getByText('Epic 3')).toBeInTheDocument();
    // Epic 1 (done) should be hidden
    expect(screen.queryByText('Epic 1')).not.toBeInTheDocument();
  });

  test('renders all epics after showing completed', () => {
    render(<EpicList />);
    showCompletedEpics();
    expect(screen.getByText('Epic 1')).toBeInTheDocument();
    expect(screen.getByText('Epic 2')).toBeInTheDocument();
    expect(screen.getByText('Epic 3')).toBeInTheDocument();
  });

  test('renders correct story completion counts per epic', () => {
    render(<EpicList />);
    showCompletedEpics();
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
    showCompletedEpics();
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

  test('clicking epic title toggles expand/collapse instead of opening document', () => {
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      epics: mockEpicsWithStories,
      outputRoot: '_bmad-output',
    });
    render(<EpicList />);
    // Show done epics first so we can click Project Foundation (epic 1, done)
    showCompletedEpics();
    // Click should toggle expand, not send OPEN_DOCUMENT
    fireEvent.click(screen.getByText('Project Foundation'));
    expect(mockPostMessage).not.toHaveBeenCalled();
    // Stories should now be visible
    expect(screen.getByText('Project Initialization')).toBeInTheDocument();
  });

  test('shift+clicking epic title sends OPEN_DOCUMENT with forceTextEditor true', () => {
    render(<EpicList />);
    // Use Epic 2 (not done, visible by default)
    fireEvent.click(screen.getByText('Epic 2'), { shiftKey: true });
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'OPEN_DOCUMENT',
        payload: { path: '_bmad-output/planning-artifacts/epics.md', forceTextEditor: true },
      })
    );
  });

  test('handles epics with all stories done (shows Done status)', () => {
    render(<EpicList />);
    showCompletedEpics();
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
    showCompletedEpics();
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

describe('EpicList expand/collapse', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      epics: mockEpicsWithStories,
      currentStory: null,
      errors: [],
      loading: false,
      outputRoot: '_bmad-output',
    });
  });

  test('clicking an epic toggles the expanded state and shows stories', () => {
    render(<EpicList />);
    showCompletedEpics();
    // Initially no stories visible
    expect(screen.queryByText('Project Initialization')).not.toBeInTheDocument();
    // Click to expand
    fireEvent.click(screen.getByText('Project Foundation'));
    expect(screen.getByText('Project Initialization')).toBeInTheDocument();
    expect(screen.getByText('Test Framework')).toBeInTheDocument();
    // Click again to collapse
    fireEvent.click(screen.getByText('Project Foundation'));
    expect(screen.queryByText('Project Initialization')).not.toBeInTheDocument();
  });

  test('stories display correct titles and statuses', () => {
    render(<EpicList />);
    // Expand epic 2 which has mixed statuses
    fireEvent.click(screen.getByText('File Parsing'));
    expect(screen.getByText('Shared Types')).toBeInTheDocument();
    expect(screen.getByText('Sprint Parser')).toBeInTheDocument();
    expect(screen.getByText('Epic Parser')).toBeInTheDocument();
    // Check status labels from sprint development_status
    const storiesContainer = screen.getByTestId('epic-2-stories');
    expect(storiesContainer).toHaveTextContent('Done');
    expect(storiesContainer).toHaveTextContent('In Progress');
  });

  test('clicking a story title sends OPEN_DOCUMENT message with correct story file path', () => {
    render(<EpicList />);
    showCompletedEpics();
    fireEvent.click(screen.getByText('Project Foundation'));
    fireEvent.click(screen.getByText('Project Initialization'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: {
        path: '_bmad-output/implementation-artifacts/1-1-project-initialization.md',
        forceTextEditor: undefined,
      },
    });
  });

  test('expanded epic shows chevron-down, collapsed shows chevron-right', () => {
    render(<EpicList />);
    showCompletedEpics();
    const epicButton = screen.getByText('Project Foundation').closest('button')!;
    // Collapsed: should have ChevronRight icon (path starts with m9 18)
    const collapsedSvg = epicButton.querySelector('svg')!;
    expect(collapsedSvg).toBeInTheDocument();
    const collapsedPath = collapsedSvg.querySelector('path')!.getAttribute('d')!;
    expect(collapsedPath).toContain('m9 18');
    expect(epicButton.getAttribute('aria-expanded')).toBe('false');
    // Expand
    fireEvent.click(epicButton);
    expect(epicButton.getAttribute('aria-expanded')).toBe('true');
    // Expanded: should have ChevronDown icon (path starts with m6 9)
    const expandedSvg = epicButton.querySelector('svg')!;
    const expandedPath = expandedSvg.querySelector('path')!.getAttribute('d')!;
    expect(expandedPath).toContain('m6 9');
    // Verify the icons actually changed
    expect(expandedPath).not.toBe(collapsedPath);
  });

  test('empty state shown for epics with no stories', () => {
    render(<EpicList />);
    // Epic 3 has no stories
    fireEvent.click(screen.getByText('Dashboard'));
    expect(screen.getByText('No stories found')).toBeInTheDocument();
  });

  test('multiple epics can be expanded independently', () => {
    render(<EpicList />);
    showCompletedEpics();
    // Expand epic 1
    fireEvent.click(screen.getByText('Project Foundation'));
    expect(screen.getByText('Project Initialization')).toBeInTheDocument();
    // Expand epic 2
    fireEvent.click(screen.getByText('File Parsing'));
    expect(screen.getByText('Shared Types')).toBeInTheDocument();
    // Both should still be expanded
    expect(screen.getByText('Project Initialization')).toBeInTheDocument();
    expect(screen.getByText('Shared Types')).toBeInTheDocument();
  });

  test('aria-expanded attribute correctly reflects expand state', () => {
    render(<EpicList />);
    showCompletedEpics();
    const epicButton = screen.getByText('Project Foundation').closest('button')!;
    expect(epicButton.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(epicButton);
    expect(epicButton.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(epicButton);
    expect(epicButton.getAttribute('aria-expanded')).toBe('false');
  });

  test('story status is resolved from sprint development_status over epic parser status', () => {
    // Set up a case where sprint status differs from epic parser status
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {
          ...mockSprintStatus.development_status,
          '2-3-epic-parser': 'review', // Sprint says review, epic parser says in-progress
        },
      },
      epics: mockEpicsWithStories,
    });
    render(<EpicList />);
    fireEvent.click(screen.getByText('File Parsing'));
    const storiesContainer = screen.getByTestId('epic-2-stories');
    expect(storiesContainer).toHaveTextContent('Review');
  });

  test('done stories show line-through styling and check icon', () => {
    render(<EpicList />);
    showCompletedEpics();
    fireEvent.click(screen.getByText('Project Foundation'));
    // All stories in epic 1 are done — check the first story's title span
    const storyTitle = screen.getByText('Project Initialization');
    expect(storyTitle.className).toContain('line-through');
    expect(storyTitle.className).toContain('text-[var(--vscode-descriptionForeground)]');
    // Check icon should be present (sibling within the same parent)
    const storyButton = storyTitle.closest('button')!;
    expect(storyButton.querySelector('svg')).toBeInTheDocument();
  });

  test('in-progress stories show correct color class without line-through', () => {
    render(<EpicList />);
    fireEvent.click(screen.getByText('File Parsing'));
    // Epic Parser is in-progress
    const storyTitle = screen.getByText('Epic Parser');
    expect(storyTitle.className).not.toContain('line-through');
    expect(storyTitle.className).toContain('text-[var(--vscode-foreground)]');
    // Status label "In Progress" should have the link color
    const storiesContainer = screen.getByTestId('epic-2-stories');
    const inProgressLabels = storiesContainer.querySelectorAll('span');
    const statusLabel = Array.from(inProgressLabels).find(
      (el) => el.textContent === 'In Progress' && el.className.includes('shrink-0')
    )!;
    expect(statusLabel.className).toContain('text-[var(--vscode-textLink-foreground)]');
  });

  test('story list container has accessible role and label', () => {
    render(<EpicList />);
    showCompletedEpics();
    fireEvent.click(screen.getByText('Project Foundation'));
    const storiesContainer = screen.getByTestId('epic-1-stories');
    expect(storiesContainer.getAttribute('role')).toBe('group');
    expect(storiesContainer.getAttribute('aria-label')).toBe('Stories in Project Foundation');
  });

  test('invalid status values from sprint are ignored in favor of epic parser status', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {
          ...mockSprintStatus.development_status,
          // Simulate an 'optional' value leaking into a story key lookup
          '2-3-epic-parser': 'optional' as 'in-progress',
        },
      },
      epics: mockEpicsWithStories,
    });
    render(<EpicList />);
    fireEvent.click(screen.getByText('File Parsing'));
    const storiesContainer = screen.getByTestId('epic-2-stories');
    // 'optional' is not a valid StoryStatusValue, so it should fall back to epic parser status ('in-progress')
    expect(storiesContainer).toHaveTextContent('In Progress');
  });

  test('epic with stories in sprint status but none in epic data shows empty state', () => {
    // Epic 3 has '3-1-dashboard-store' in development_status but stories: [] in epic data
    render(<EpicList />);
    fireEvent.click(screen.getByText('Dashboard'));
    // Summary shows 0/1 (from development_status count)
    const epic3 = screen.getByTestId('epic-item-3');
    expect(epic3).toHaveTextContent('0/1');
    // But expanded story list shows empty state (from epic data)
    expect(screen.getByText('No stories found')).toBeInTheDocument();
  });
});

describe('EpicList done epic filtering', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({
      sprint: mockSprintStatus,
      epics: mockEpicsWithStories,
      currentStory: null,
      errors: [],
      loading: false,
      outputRoot: '_bmad-output',
    });
  });

  test('done epics are hidden by default', () => {
    render(<EpicList />);
    // Epic 1 is done — should not be visible
    expect(screen.queryByTestId('epic-item-1')).not.toBeInTheDocument();
    // Non-done epics should be visible
    expect(screen.getByTestId('epic-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('epic-item-3')).toBeInTheDocument();
  });

  test('toggle button shows "Show completed (N)" with count of done epics', () => {
    render(<EpicList />);
    const toggle = screen.getByTestId('toggle-done-epics');
    expect(toggle).toHaveTextContent('Show completed (1)');
  });

  test('clicking toggle reveals done epics with muted styling', () => {
    render(<EpicList />);
    showCompletedEpics();
    const epic1 = screen.getByTestId('epic-item-1');
    expect(epic1).toBeInTheDocument();
    expect(epic1.className).toContain('text-[var(--vscode-disabledForeground)]');
  });

  test('clicking toggle again hides done epics', () => {
    render(<EpicList />);
    showCompletedEpics();
    expect(screen.getByTestId('epic-item-1')).toBeInTheDocument();
    // Click again to hide
    fireEvent.click(screen.getByTestId('toggle-done-epics'));
    expect(screen.queryByTestId('epic-item-1')).not.toBeInTheDocument();
  });

  test('toggle text changes to "Hide completed" when done epics are shown', () => {
    render(<EpicList />);
    showCompletedEpics();
    expect(screen.getByTestId('toggle-done-epics')).toHaveTextContent('Hide completed');
  });

  test('scroll container has max-height constraint', () => {
    render(<EpicList />);
    const scrollContainer = screen.getByTestId('epic-list-scroll-container');
    expect(scrollContainer.className).toContain('max-h-[280px]');
    expect(scrollContainer.className).toContain('overflow-y-auto');
  });

  test('toggle and scroll container have correct data-testid attributes', () => {
    render(<EpicList />);
    expect(screen.getByTestId('toggle-done-epics')).toBeInTheDocument();
    expect(screen.getByTestId('epic-list-scroll-container')).toBeInTheDocument();
  });

  test('no toggle renders when zero done epics exist', () => {
    useDashboardStore.setState({
      sprint: {
        ...mockSprintStatus,
        development_status: {
          'epic-1': 'in-progress',
          '1-1-story': 'backlog',
          'epic-2': 'backlog',
          '2-1-story': 'backlog',
        },
      },
      loading: false,
    });
    render(<EpicList />);
    expect(screen.queryByTestId('toggle-done-epics')).not.toBeInTheDocument();
  });

  test('toggle has appropriate aria-label', () => {
    render(<EpicList />);
    const toggle = screen.getByTestId('toggle-done-epics');
    expect(toggle.getAttribute('aria-label')).toBe('Show 1 completed epics');
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
