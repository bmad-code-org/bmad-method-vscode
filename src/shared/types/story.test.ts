import { describe, it, expect } from 'vitest';
import { type Story, calculateStoryProgress } from './story';

describe('calculateStoryProgress', () => {
  const createStory = (overrides: Partial<Story> = {}): Story => ({
    key: '1-1-test-story',
    epicNumber: 1,
    storyNumber: 1,
    title: 'Test Story',
    userStory: 'As a user...',
    acceptanceCriteria: [],
    tasks: [],
    filePath: '_bmad-output/implementation-artifacts/1-1-test-story.md',
    status: 'in-progress',
    totalTasks: 0,
    completedTasks: 0,
    totalSubtasks: 0,
    completedSubtasks: 0,
    ...overrides,
  });

  it('returns 0 when there are no tasks or subtasks', () => {
    const story = createStory({
      totalTasks: 0,
      completedTasks: 0,
      totalSubtasks: 0,
      completedSubtasks: 0,
    });
    expect(calculateStoryProgress(story)).toBe(0);
  });

  it('returns 0 when no tasks are completed', () => {
    const story = createStory({
      totalTasks: 5,
      completedTasks: 0,
      totalSubtasks: 0,
      completedSubtasks: 0,
    });
    expect(calculateStoryProgress(story)).toBe(0);
  });

  it('returns 100 when all tasks are completed', () => {
    const story = createStory({
      totalTasks: 5,
      completedTasks: 5,
      totalSubtasks: 0,
      completedSubtasks: 0,
    });
    expect(calculateStoryProgress(story)).toBe(100);
  });

  it('calculates correct percentage for partial task completion', () => {
    const story = createStory({
      totalTasks: 4,
      completedTasks: 2,
      totalSubtasks: 0,
      completedSubtasks: 0,
    });
    expect(calculateStoryProgress(story)).toBe(50);
  });

  it('includes subtasks in the calculation', () => {
    const story = createStory({
      totalTasks: 2,
      completedTasks: 1,
      totalSubtasks: 8,
      completedSubtasks: 4,
    });
    // Total items = 2 + 8 = 10
    // Completed items = 1 + 4 = 5
    // Progress = 5/10 = 50%
    expect(calculateStoryProgress(story)).toBe(50);
  });

  it('rounds to nearest integer', () => {
    const story = createStory({
      totalTasks: 3,
      completedTasks: 1,
      totalSubtasks: 0,
      completedSubtasks: 0,
    });
    // 1/3 = 33.33...% -> rounds to 33%
    expect(calculateStoryProgress(story)).toBe(33);
  });

  it('rounds up at 0.5', () => {
    const story = createStory({
      totalTasks: 2,
      completedTasks: 1,
      totalSubtasks: 2,
      completedSubtasks: 1,
    });
    // 2/4 = 50% (exact)
    expect(calculateStoryProgress(story)).toBe(50);
  });

  it('handles only subtasks (no top-level tasks)', () => {
    const story = createStory({
      totalTasks: 0,
      completedTasks: 0,
      totalSubtasks: 10,
      completedSubtasks: 7,
    });
    expect(calculateStoryProgress(story)).toBe(70);
  });

  it('handles large numbers correctly', () => {
    const story = createStory({
      totalTasks: 100,
      completedTasks: 75,
      totalSubtasks: 400,
      completedSubtasks: 300,
    });
    // Total = 500, Completed = 375
    // 375/500 = 75%
    expect(calculateStoryProgress(story)).toBe(75);
  });
});
