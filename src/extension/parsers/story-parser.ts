// Story File Parser for BMAD Extension
// Parses N-N-story-name.md files into Story type with task/subtask extraction

import matter from 'gray-matter';
import type {
  Story,
  StoryTask,
  AcceptanceCriterion,
  ParseResult,
  StoryStatusValue,
} from '../../shared/types';
import { parseSuccess, parseFailure, isStoryStatus } from '../../shared/types';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Regex patterns for parsing story file content
 */
// Story header: # Story 2.4: Story File Parser (also handles split stories like 5.5a)
const STORY_HEADER_REGEX = /^#\s+Story\s+(\d+)\.(\d+)([a-z]?):\s+(.+)$/m;

// Status line: Status: ready-for-dev
const STATUS_LINE_REGEX = /^Status:\s*(\S+)/m;

// User story pattern (multiline) - captures "As a... I want... So that..."
const USER_STORY_REGEX =
  /As\s+(?:a|an)\s+[^,]+,\s*\n?I\s+want\s+[^,]+,\s*\n?(?:so\s+that|So\s+that)\s+[^.]+\./is;

// Acceptance criterion header: 1. **Valid Story File Parsing**
// Note: Using non-global regex pattern - matchAll() creates fresh iterator each call
const AC_HEADER_PATTERN = /^(\d+)\.\s+\*\*(.+?)\*\*/gm;

// Story key from filename: 2-4-story-file-parser.md (also handles 5-5a-title.md)
const FILENAME_KEY_REGEX = /^(\d+)-(\d+[a-z]?)-(.+)\.md$/;

/**
 * Convert title to kebab-case key for story identifiers
 *
 * @param title - The story title to convert (e.g., "Story File Parser")
 * @returns Kebab-case string suitable for use as a key (e.g., "story-file-parser")
 */
function toKebabCase(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and') // Convert & to and
    .replace(/\./g, '-') // Convert dots to dashes (e.g., package.json → package-json)
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
}

/**
 * Extract story key from filename or generate from content
 *
 * @param filePath - File path for key extraction (optional)
 * @param epicNumber - Epic number from header
 * @param storyNumber - Story number from header
 * @param storySuffix - Optional letter suffix for split stories (e.g., "a", "b")
 * @param title - Story title for fallback key generation
 * @returns Story key string (e.g., "2-4-story-file-parser" or "5-5a-editor-panel")
 */
function extractStoryKey(
  filePath: string | undefined,
  epicNumber: number,
  storyNumber: number,
  storySuffix: string,
  title: string
): string {
  // Try to extract from filename first
  if (filePath) {
    const filename = path.basename(filePath);
    const match = filename.match(FILENAME_KEY_REGEX);
    if (match) {
      // Return key without .md extension
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
  }

  // Fallback: generate from epic/story numbers and title
  return `${epicNumber}-${storyNumber}${storySuffix}-${toKebabCase(title)}`;
}

/**
 * Extract status from story content
 *
 * @param content - Markdown content to parse
 * @returns Story status value, defaults to 'backlog' if not found or invalid
 */
function extractStatus(content: string): StoryStatusValue {
  const match = content.match(STATUS_LINE_REGEX);
  if (match) {
    const statusValue = match[1].toLowerCase();
    if (isStoryStatus(statusValue)) {
      return statusValue;
    }
  }
  return 'backlog'; // Default status
}

/**
 * Extract user story statement from content
 *
 * @param content - Markdown content to parse
 * @returns User story text or empty string if not found
 */
function extractUserStory(content: string): string {
  const match = content.match(USER_STORY_REGEX);
  return match ? match[0].trim() : '';
}

/**
 * Extract acceptance criteria section content
 *
 * @param content - Full markdown content
 * @returns Content of the Acceptance Criteria section or empty string
 */
function extractAcceptanceCriteriaSection(content: string): string {
  // Use negative lookahead to capture content until the next ## heading
  const regex = /^##\s+Acceptance\s+Criteria\s*\n((?:(?!^##\s).)*)/ms;
  const sectionMatch = content.match(regex);
  return sectionMatch ? sectionMatch[1] : '';
}

/**
 * Extract acceptance criteria from story content
 *
 * @param content - Markdown content to parse
 * @returns Array of AcceptanceCriterion objects
 */
function extractAcceptanceCriteria(content: string): AcceptanceCriterion[] {
  const criteria: AcceptanceCriterion[] = [];
  const acSection = extractAcceptanceCriteriaSection(content);

  if (!acSection) {
    return criteria;
  }

  // Use matchAll() which creates a fresh iterator - avoids global regex lastIndex state issues
  const matches: Array<{ number: number; title: string; index: number; matchLength: number }> = [];

  for (const match of acSection.matchAll(AC_HEADER_PATTERN)) {
    matches.push({
      number: parseInt(match[1], 10),
      title: match[2].trim(),
      index: match.index,
      matchLength: match[0].length,
    });
  }

  // Extract content for each criterion
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index + current.matchLength;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index : acSection.length;
    const criterionContent = acSection.slice(startIndex, endIndex).trim();

    criteria.push({
      number: current.number,
      title: current.title,
      content: criterionContent,
    });
  }

  return criteria;
}

/**
 * Extract tasks and subtasks section content
 *
 * @param content - Full markdown content
 * @returns Content of the Tasks / Subtasks section or empty string
 */
function extractTasksSection(content: string): string {
  // Use negative lookahead to capture content until the next ## heading
  const regex = /^##\s+Tasks\s*\/?\s*Subtasks\s*\n((?:(?!^##\s).)*)/ms;
  const sectionMatch = content.match(regex);
  return sectionMatch ? sectionMatch[1] : '';
}

/**
 * Parse AC references from task description
 *
 * @param acString - String like "#1, #2" or "1, 2"
 * @returns Array of AC numbers
 */
function parseAcReferences(acString: string | undefined): number[] | undefined {
  if (!acString) return undefined;

  const numbers: number[] = [];
  const matches = acString.matchAll(/#?(\d+)/g);

  for (const match of matches) {
    numbers.push(parseInt(match[1], 10));
  }

  return numbers.length > 0 ? numbers : undefined;
}

/**
 * Extract tasks and subtasks from story content
 *
 * @param content - Markdown content to parse
 * @returns Array of StoryTask objects with nested subtasks
 */
function extractTasks(content: string): StoryTask[] {
  const tasks: StoryTask[] = [];
  const tasksSection = extractTasksSection(content);

  if (!tasksSection) {
    return tasks;
  }

  // Split into lines for processing
  const lines = tasksSection.split('\n');

  let currentTask: StoryTask | null = null;

  // Task regex: - [x] Task 1: Description (AC: #1, #2)
  const taskRegex = /^-\s+\[([ xX])\]\s+Task\s+(\d+):\s*(.+?)(?:\s*\(AC:\s*([^)]+)\))?$/;

  for (const line of lines) {
    // Check for task line (not indented)
    const taskMatch = line.match(taskRegex);
    if (taskMatch) {
      // Save previous task if exists
      if (currentTask) {
        tasks.push(currentTask);
      }

      currentTask = {
        number: parseInt(taskMatch[2], 10),
        description: taskMatch[3].trim(),
        completed: taskMatch[1].toLowerCase() === 'x',
        acceptanceCriteria: parseAcReferences(taskMatch[4]),
        subtasks: [],
      };
      continue;
    }

    // Check for subtask line (indented)
    const subtaskMatch = line.match(/^\s+-\s+\[([ xX])\]\s+(\d+\.\d+):\s*(.+)$/);
    if (subtaskMatch && currentTask) {
      currentTask.subtasks.push({
        id: subtaskMatch[2],
        description: subtaskMatch[3].trim(),
        completed: subtaskMatch[1].toLowerCase() === 'x',
      });
    }
  }

  // Don't forget the last task
  if (currentTask) {
    tasks.push(currentTask);
  }

  return tasks;
}

/**
 * Calculate task completion statistics
 *
 * @param tasks - Array of tasks with subtasks
 * @returns Object with total and completed counts for tasks and subtasks
 */
function calculateTaskStats(tasks: StoryTask[]): {
  totalTasks: number;
  completedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
} {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  let totalSubtasks = 0;
  let completedSubtasks = 0;

  for (const task of tasks) {
    totalSubtasks += task.subtasks.length;
    completedSubtasks += task.subtasks.filter((s) => s.completed).length;
  }

  return { totalTasks, completedTasks, totalSubtasks, completedSubtasks };
}

/**
 * Parse story markdown file content into Story structure
 *
 * @param content - Raw markdown content with optional frontmatter
 * @param filePath - File path for error messages and key extraction (optional)
 * @returns ParseResult<Story> - never throws
 */
export function parseStory(content: string, filePath?: string): ParseResult<Story> {
  try {
    // Handle empty content
    if (!content || content.trim().length === 0) {
      return parseFailure('Story parser: Invalid story file - content is empty', {
        filePath: filePath || '',
      });
    }

    // Extract frontmatter and content using gray-matter
    // Note: Story files may not have frontmatter, gray-matter handles this gracefully
    const { content: markdownContent } = matter(content);

    // Parse story header: # Story N.M: Title
    const headerMatch = markdownContent.match(STORY_HEADER_REGEX);
    if (!headerMatch) {
      return parseFailure(
        'Story parser: Invalid story file - missing header (expected "# Story N.M: Title")',
        { filePath: filePath || '' }
      );
    }

    const epicNumber = parseInt(headerMatch[1], 10);
    const storyNumber = parseInt(headerMatch[2], 10);
    const storySuffix = headerMatch[3] || ''; // optional letter suffix (e.g., "a", "b")
    const title = headerMatch[4].trim();

    // Validate numbers are valid
    if (isNaN(epicNumber) || epicNumber < 1) {
      return parseFailure(`Story parser: Invalid epic number "${headerMatch[1]}"`, {
        filePath: filePath || '',
      });
    }
    if (isNaN(storyNumber) || storyNumber < 1) {
      return parseFailure(`Story parser: Invalid story number "${headerMatch[2]}"`, {
        filePath: filePath || '',
      });
    }

    // Generate story key from filename or content
    const key = extractStoryKey(filePath, epicNumber, storyNumber, storySuffix, title);

    // Parse status (from Status: line or default to 'backlog')
    const status = extractStatus(markdownContent);

    // Parse user story
    const userStory = extractUserStory(markdownContent);

    // Parse acceptance criteria
    const acceptanceCriteria = extractAcceptanceCriteria(markdownContent);

    // Parse tasks and subtasks
    const tasks = extractTasks(markdownContent);

    // Calculate completion stats
    const { totalTasks, completedTasks, totalSubtasks, completedSubtasks } =
      calculateTaskStats(tasks);

    const story: Story = {
      key,
      epicNumber,
      storyNumber,
      storySuffix: storySuffix || undefined,
      title,
      userStory,
      acceptanceCriteria,
      tasks,
      filePath: filePath || '',
      status,
      totalTasks,
      completedTasks,
      totalSubtasks,
      completedSubtasks,
    };

    return parseSuccess(story);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return parseFailure(`Story parser: Failed to parse story file: ${message}`, {
      filePath: filePath || '',
    });
  }
}

/**
 * Parse story file from disk
 *
 * @param filePath - Absolute path to story markdown file
 * @returns Promise<ParseResult<Story>> - never throws
 */
export async function parseStoryFile(filePath: string): Promise<ParseResult<Story>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseStory(content, filePath);
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error codes
      if ('code' in error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          return parseFailure(`Story parser: file not found: ${filePath}`);
        }
        if (nodeError.code === 'EACCES') {
          return parseFailure(`Story parser: permission denied: ${filePath}`);
        }
        if (nodeError.code === 'EISDIR') {
          return parseFailure(`Story parser: path is a directory, not a file: ${filePath}`);
        }
      }
      return parseFailure(`Story parser: failed to read file: ${error.message}`);
    }
    return parseFailure(`Story parser: failed to read file: unknown error`);
  }
}
