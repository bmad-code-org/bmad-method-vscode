import type { Story, StoryTask, StorySubtask, AcceptanceCriterion } from '@shared/types';
import { isStoryStatus } from '@shared/types';
import type { StoryStatusValue } from '@shared/types/sprint-status';

const STORY_HEADER_REGEX = /^#\s+Story\s+(\d+)\.(\d+)([a-z]?):\s+(.+)$/m;
const STATUS_LINE_REGEX = /^Status:\s*(\S+)/m;
const USER_STORY_REGEX =
  /As\s+(?:a|an)\s+[^,]+,\s*\n?I\s+want\s+[^,]+,\s*\n?(?:so\s+that|So\s+that)\s+[^.]+\./is;
const AC_HEADER_PATTERN = /^(\d+)\.\s+\*\*(.+?)\*\*/gm;

function extractStatus(content: string): StoryStatusValue {
  const match = content.match(STATUS_LINE_REGEX);
  if (match) {
    const statusValue = match[1].toLowerCase();
    if (isStoryStatus(statusValue)) return statusValue;
  }
  return 'backlog';
}

function extractUserStory(content: string): string {
  const match = content.match(USER_STORY_REGEX);
  return match ? match[0].trim() : '';
}

function extractAcceptanceCriteriaSection(content: string): string {
  const regex = /^##\s+Acceptance\s+Criteria\s*\n((?:(?!^##\s).)*)/ms;
  const match = content.match(regex);
  return match ? match[1] : '';
}

function extractAcceptanceCriteria(content: string): AcceptanceCriterion[] {
  const criteria: AcceptanceCriterion[] = [];
  const acSection = extractAcceptanceCriteriaSection(content);
  if (!acSection) return criteria;

  const matches: Array<{ number: number; title: string; index: number; matchLength: number }> = [];
  for (const match of acSection.matchAll(AC_HEADER_PATTERN)) {
    matches.push({
      number: parseInt(match[1], 10),
      title: match[2].trim(),
      index: match.index,
      matchLength: match[0].length,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index + current.matchLength;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : acSection.length;
    criteria.push({
      number: current.number,
      title: current.title,
      content: acSection.slice(startIndex, endIndex).trim(),
    });
  }

  return criteria;
}

function extractTasksSection(content: string): string {
  const regex = /^##\s+Tasks\s*\/?\s*Subtasks\s*\n((?:(?!^##\s).)*)/ms;
  const match = content.match(regex);
  return match ? match[1] : '';
}

function parseAcReferences(acString: string | undefined): number[] | undefined {
  if (!acString) return undefined;
  const numbers: number[] = [];
  for (const match of acString.matchAll(/#?(\d+)/g)) {
    numbers.push(parseInt(match[1], 10));
  }
  return numbers.length > 0 ? numbers : undefined;
}

function extractTasks(content: string): StoryTask[] {
  const tasks: StoryTask[] = [];
  const tasksSection = extractTasksSection(content);
  if (!tasksSection) return tasks;

  const lines = tasksSection.split('\n');
  let currentTask: StoryTask | null = null;
  const taskRegex = /^-\s+\[([ xX])\]\s+Task\s+(\d+):\s*(.+?)(?:\s*\(AC:\s*([^)]+)\))?$/;

  for (const line of lines) {
    const taskMatch = line.match(taskRegex);
    if (taskMatch) {
      if (currentTask) tasks.push(currentTask);
      currentTask = {
        number: parseInt(taskMatch[2], 10),
        description: taskMatch[3].trim(),
        completed: taskMatch[1].toLowerCase() === 'x',
        acceptanceCriteria: parseAcReferences(taskMatch[4]),
        subtasks: [],
      };
      continue;
    }

    const subtaskMatch = line.match(/^\s+-\s+\[([ xX])\]\s+(\d+\.\d+):\s*(.+)$/);
    if (subtaskMatch && currentTask) {
      currentTask.subtasks.push({
        id: subtaskMatch[2],
        description: subtaskMatch[3].trim(),
        completed: subtaskMatch[1].toLowerCase() === 'x',
      } satisfies StorySubtask);
    }
  }

  if (currentTask) tasks.push(currentTask);
  return tasks;
}

/**
 * Browser-safe story content parser. Extracts story data from raw markdown content.
 * Does NOT use Node.js APIs — suitable for webview context.
 */
export function parseStoryContent(content: string, filePath: string): Story | null {
  // Strip frontmatter if present
  let markdownContent = content;
  if (content.startsWith('---')) {
    const endIdx = content.indexOf('---', 3);
    if (endIdx !== -1) {
      markdownContent = content.slice(endIdx + 3).trim();
    }
  }

  const headerMatch = markdownContent.match(STORY_HEADER_REGEX);
  if (!headerMatch) return null;

  const epicNumber = parseInt(headerMatch[1], 10);
  const storyNumber = parseInt(headerMatch[2], 10);
  const storySuffix = headerMatch[3] || undefined;
  const title = headerMatch[4].trim();

  // Extract key from filePath filename
  const fileNameMatch = filePath.match(/(\d+-\d+[a-z]?-[\w-]+)\.md$/);
  const key = fileNameMatch
    ? fileNameMatch[1]
    : `${epicNumber}-${storyNumber}${storySuffix ?? ''}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const status = extractStatus(markdownContent);
  const userStory = extractUserStory(markdownContent);
  const acceptanceCriteria = extractAcceptanceCriteria(markdownContent);
  const tasks = extractTasks(markdownContent);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  let totalSubtasks = 0;
  let completedSubtasks = 0;
  for (const task of tasks) {
    totalSubtasks += task.subtasks.length;
    completedSubtasks += task.subtasks.filter((s) => s.completed).length;
  }

  return {
    key,
    epicNumber,
    storyNumber,
    storySuffix,
    title,
    userStory,
    acceptanceCriteria,
    tasks,
    filePath,
    status,
    totalTasks,
    completedTasks,
    totalSubtasks,
    completedSubtasks,
  };
}
