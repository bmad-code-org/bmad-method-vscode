import { describe, test, expect } from 'vitest';
import { getNextAction } from './get-next-action';
import type { SprintStatus } from '@shared/types/sprint-status';
import type { Story } from '@shared/types/story';

const mockSprint: SprintStatus = {
  generated: '2026-01-27',
  project: 'bmad-extension',
  project_key: 'bmad-extension',
  tracking_system: 'file-system',
  story_location: '_bmad-output/implementation-artifacts',
  development_status: {
    'epic-1': 'in-progress',
    '1-1-project-init': 'done',
    '1-2-test-framework': 'done',
    'epic-1-retrospective': 'optional',
    'epic-2': 'backlog',
    '2-1-shared-types': 'backlog',
  },
};

function createStory(overrides: Partial<Story> = {}): Story {
  return {
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
    ...overrides,
  };
}

describe('getNextAction', () => {
  test('returns sprint-planning when sprint is null', () => {
    const result = getNextAction(null, null);
    expect(result.type).toBe('sprint-planning');
    expect(result.label).toBe('Run Sprint Planning');
    expect(result.description).toBeTruthy();
  });

  test('returns dev-story continue when current story is in-progress', () => {
    const story = createStory({ status: 'in-progress' });
    const result = getNextAction(mockSprint, story);
    expect(result.type).toBe('dev-story');
    expect(result.label).toBe('Continue Story 3.5');
    expect(result.storyKey).toBe('3-5-next-action-recommendation');
    expect(result.description).toContain('in progress');
  });

  test('returns code-review when current story is in review', () => {
    const story = createStory({ status: 'review' });
    const result = getNextAction(mockSprint, story);
    expect(result.type).toBe('code-review');
    expect(result.label).toBe('Run Code Review');
    expect(result.storyKey).toBe('3-5-next-action-recommendation');
    expect(result.description).toContain('3.5');
  });

  test('returns dev-story start when current story is ready-for-dev', () => {
    const story = createStory({ status: 'ready-for-dev' });
    const result = getNextAction(mockSprint, story);
    expect(result.type).toBe('dev-story');
    expect(result.label).toBe('Start Dev Story 3.5');
    expect(result.storyKey).toBe('3-5-next-action-recommendation');
    expect(result.description).toContain('ready for development');
  });

  test('returns create-story when no active story and backlog stories exist', () => {
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {
        'epic-1': 'in-progress',
        '1-1-project-init': 'done',
        '1-2-test-framework': 'backlog',
      },
    };
    const result = getNextAction(sprint, null);
    expect(result.type).toBe('create-story');
    expect(result.label).toBe('Create Next Story');
  });

  test('returns retrospective when all stories in one epic are done but others remain', () => {
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {
        'epic-1': 'done',
        '1-1-project-init': 'done',
        '1-2-test-framework': 'done',
        'epic-2': 'in-progress',
        '2-1-shared-types': 'in-progress',
      },
    };
    const result = getNextAction(sprint, null);
    expect(result.type).toBe('retrospective');
    expect(result.label).toContain('Retrospective');
    expect(result.label).toContain('Epic 1');
    expect(result.description).toContain('Epic 1');
  });

  test('returns sprint-complete when single epic has all stories done and no other epics', () => {
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {
        'epic-1': 'done',
        '1-1-project-init': 'done',
        '1-2-test-framework': 'done',
        'epic-1-retrospective': 'done',
      },
    };
    const result = getNextAction(sprint, null);
    expect(result.type).toBe('sprint-complete');
    expect(result.label).toBe('Sprint Complete');
    expect(result.description).toContain('retrospective');
  });

  test('returns sprint-complete when all stories across all epics are done', () => {
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {
        'epic-1': 'done',
        '1-1-project-init': 'done',
        '1-2-test-framework': 'done',
        'epic-2': 'done',
        '2-1-shared-types': 'done',
        '2-2-sprint-parser': 'done',
      },
    };
    const result = getNextAction(sprint, null);
    expect(result.type).toBe('sprint-complete');
    expect(result.label).toBe('Sprint Complete');
  });

  test('returns create-story when development_status is empty', () => {
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {},
    };
    const result = getNextAction(sprint, null);
    expect(result.type).toBe('create-story');
    expect(result.label).toBe('Create Next Story');
    expect(result.description).toContain('No stories found');
  });

  test('returns create-story when only epic keys exist (no story keys)', () => {
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {
        'epic-1': 'backlog',
        'epic-2': 'backlog',
      },
    };
    const result = getNextAction(sprint, null);
    expect(result.type).toBe('create-story');
  });

  test('prioritizes in-progress story over other states', () => {
    const story = createStory({ status: 'in-progress' });
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {
        'epic-1': 'in-progress',
        '1-1-project-init': 'done',
        '1-2-test-framework': 'backlog',
      },
    };
    const result = getNextAction(sprint, story);
    expect(result.type).toBe('dev-story');
    expect(result.label).toContain('Continue');
  });

  test('uses correct epic.story number format in labels', () => {
    const story = createStory({
      epicNumber: 2,
      storyNumber: 3,
      status: 'in-progress',
    });
    const result = getNextAction(mockSprint, story);
    expect(result.label).toBe('Continue Story 2.3');
  });

  test('returns create-story fallback when stories in non-terminal states but no currentStory', () => {
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {
        'epic-1': 'in-progress',
        '1-1-project-init': 'in-progress',
        '1-2-test-framework': 'review',
      },
    };
    const result = getNextAction(sprint, null);
    expect(result.type).toBe('create-story');
    expect(result.description).toContain('Check sprint status');
  });

  test('returns retrospective for earliest completed epic', () => {
    const sprint: SprintStatus = {
      ...mockSprint,
      development_status: {
        'epic-1': 'done',
        '1-1-project-init': 'done',
        '1-2-test-framework': 'done',
        'epic-2': 'in-progress',
        '2-1-shared-types': 'done',
        '2-2-sprint-parser': 'in-progress',
      },
    };
    const result = getNextAction(sprint, null);
    expect(result.type).toBe('retrospective');
    expect(result.label).toContain('Epic 1');
  });
});
