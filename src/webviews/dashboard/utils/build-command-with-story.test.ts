import { describe, test, expect } from 'vitest';
import type { Story } from '@shared/types/story';
import { buildCommandWithStory } from './build-command-with-story';

const makeStory = (overrides: Partial<Story> = {}): Story => ({
  key: '1-2-test-story',
  epicNumber: 1,
  storyNumber: 2,
  title: 'Test Story',
  userStory: '',
  acceptanceCriteria: [],
  tasks: [],
  totalTasks: 0,
  completedTasks: 0,
  totalSubtasks: 0,
  completedSubtasks: 0,
  filePath: '_bmad-output/epics/epic-1/1-2-test-story.md',
  status: 'in-progress',
  ...overrides,
});

describe('buildCommandWithStory', () => {
  test('appends story ref for dev-story workflow', () => {
    const result = buildCommandWithStory('/bmad-bmm-dev-story', makeStory(), 'dev-story');
    expect(result).toBe('/bmad-bmm-dev-story story 1.2');
  });

  test('appends story ref for code-review workflow', () => {
    const result = buildCommandWithStory('/bmad-bmm-code-review', makeStory(), 'code-review');
    expect(result).toBe('/bmad-bmm-code-review story 1.2');
  });

  test('does NOT append story ref for create-story workflow', () => {
    const result = buildCommandWithStory('/bmad-bmm-create-story', makeStory(), 'create-story');
    expect(result).toBe('/bmad-bmm-create-story');
  });

  test('includes story suffix when present', () => {
    const story = makeStory({ storySuffix: 'a' });
    const result = buildCommandWithStory('/bmad-bmm-dev-story', story, 'dev-story');
    expect(result).toBe('/bmad-bmm-dev-story story 1.2a');
  });

  test('returns command unchanged when story is null', () => {
    const result = buildCommandWithStory('/bmad-bmm-dev-story', null, 'dev-story');
    expect(result).toBe('/bmad-bmm-dev-story');
  });

  test('returns command unchanged when story is undefined', () => {
    const result = buildCommandWithStory('/bmad-bmm-dev-story', undefined, 'dev-story');
    expect(result).toBe('/bmad-bmm-dev-story');
  });

  test('returns command unchanged for unknown workflow', () => {
    const result = buildCommandWithStory(
      '/bmad-bmm-sprint-planning',
      makeStory(),
      'sprint-planning'
    );
    expect(result).toBe('/bmad-bmm-sprint-planning');
  });
});
