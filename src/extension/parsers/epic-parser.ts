// Epic File Parser for BMAD Extension
// Parses epic-*.md files into Epic type with frontmatter and story extraction

import matter from 'gray-matter';
import type { Epic, EpicMetadata, EpicStoryEntry, ParseResult } from '../../shared/types';
import { parseSuccess, parseFailure } from '../../shared/types';
import { promises as fs } from 'node:fs';

/**
 * Regex patterns for parsing epic file content
 */
// Epic header: ## Epic 2: BMAD File Parsing & State Management
const EPIC_HEADER_REGEX = /^##\s+Epic\s+(\d+):\s+(.+)$/m;

// Story header: ### Story 2.1: Shared Types and Message Protocol
const STORY_HEADER_REGEX = /^###\s+Story\s+(\d+)\.(\d+):\s+(.+)$/gm;

// User story pattern: As a [role], I want [action], so that [benefit]
const USER_STORY_REGEX =
  /As\s+(?:a|an)\s+[^,]+,\s*\n?I\s+want\s+[^,]+,\s*\n?(?:so\s+that|So\s+that)\s+[^.]+/i;

/**
 * Convert title to kebab-case key for story identifiers
 *
 * @param title - The story title to convert (e.g., "Shared Types and Message Protocol")
 * @returns Kebab-case string suitable for use as a key (e.g., "shared-types-and-message-protocol")
 *
 * @example
 * toKebabCase("Shared Types and Message Protocol") // "shared-types-and-message-protocol"
 * toKebabCase("Handle Special (chars)!") // "handle-special-chars"
 */
function toKebabCase(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
}

/**
 * Extract epic description - the paragraph(s) after the epic header
 * until the next heading or end of content
 *
 * @param content - The markdown content (without frontmatter)
 * @param headerEndIndex - Character index where the epic header line ends
 * @returns The description text, trimmed of leading/trailing whitespace
 */
function extractEpicDescription(content: string, headerEndIndex: number): string {
  // Find content after the epic header line
  const afterHeader = content.slice(headerEndIndex);

  // Find the next heading (any level) or end of string
  const nextHeadingMatch = afterHeader.match(/^#+\s+/m);
  const descriptionEnd = nextHeadingMatch ? nextHeadingMatch.index! : afterHeader.length;

  // Get the description text and clean it up
  const description = afterHeader.slice(0, descriptionEnd).trim();

  // Remove any leading newlines and return
  return description.replace(/^\n+/, '').trim();
}

/**
 * Parse story entries from markdown content
 * Extracts story key, title, and optional description from user story text
 *
 * @param content - The markdown content (without frontmatter) to parse for story headings
 * @returns Array of EpicStoryEntry objects, one for each valid `### Story N.M: Title` heading found
 */
function parseStoryEntries(content: string): EpicStoryEntry[] {
  const stories: EpicStoryEntry[] = [];

  // Reset regex lastIndex for fresh iteration
  STORY_HEADER_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  const matches: Array<{ epicNum: number; storyNum: number; title: string; index: number }> = [];

  // Collect all story header matches first
  while ((match = STORY_HEADER_REGEX.exec(content)) !== null) {
    matches.push({
      epicNum: parseInt(match[1], 10),
      storyNum: parseInt(match[2], 10),
      title: match[3].trim(),
      index: match.index + match[0].length,
    });
  }

  // Process each story
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    // Calculate end boundary for this story's content section.
    // For the last story, use end of content. For others, estimate the start of the next
    // story header by subtracting: title length + ~20 chars for "### Story N.M: " prefix.
    // This ensures we don't accidentally include the next story's header in the content.
    const STORY_HEADER_PREFIX_LENGTH = 20; // Approximate length of "### Story N.M: "
    const nextIndex =
      i + 1 < matches.length
        ? matches[i + 1].index - matches[i + 1].title.length - STORY_HEADER_PREFIX_LENGTH
        : content.length;

    // Get content between this story header and the next (or end)
    const storyContent = content.slice(current.index, nextIndex);

    // Try to extract user story description
    const userStoryMatch = storyContent.match(USER_STORY_REGEX);
    const description = userStoryMatch ? userStoryMatch[0].trim() : undefined;

    // Generate story key: N-M-kebab-case-title
    const storyKey = `${current.epicNum}-${current.storyNum}-${toKebabCase(current.title)}`;

    stories.push({
      key: storyKey,
      title: current.title,
      description,
      status: 'backlog', // Default status, merged from sprint-status later
    });
  }

  return stories;
}

/**
 * Parse epic markdown file content into Epic structure
 *
 * @param content - Raw markdown content with optional frontmatter
 * @param filePath - File path for error messages and filePath field (optional)
 * @returns ParseResult<Epic> - never throws
 */
export function parseEpic(content: string, filePath?: string): ParseResult<Epic> {
  try {
    // Handle empty content
    if (!content || content.trim().length === 0) {
      return parseFailure('Invalid epic file: content is empty', { filePath: filePath || '' });
    }

    // Extract frontmatter and content using gray-matter
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Extract metadata from frontmatter (optional fields)
    const metadata: EpicMetadata = {
      stepsCompleted: Array.isArray(frontmatter.stepsCompleted)
        ? frontmatter.stepsCompleted
        : undefined,
      inputDocuments: Array.isArray(frontmatter.inputDocuments)
        ? frontmatter.inputDocuments
        : undefined,
    };

    // Parse epic header: ## Epic N: Title
    const epicHeaderMatch = markdownContent.match(EPIC_HEADER_REGEX);
    if (!epicHeaderMatch) {
      return parseFailure('Invalid epic file: missing epic header (expected "## Epic N: Title")', {
        metadata,
        filePath: filePath || '',
      });
    }

    const epicNumber = parseInt(epicHeaderMatch[1], 10);
    const epicTitle = epicHeaderMatch[2].trim();

    // Validate epic number is valid
    if (isNaN(epicNumber) || epicNumber < 1) {
      return parseFailure(`Invalid epic file: invalid epic number "${epicHeaderMatch[1]}"`, {
        metadata,
        filePath: filePath || '',
      });
    }

    // Extract epic description (paragraph after header)
    const headerEndIndex = epicHeaderMatch.index! + epicHeaderMatch[0].length;
    const epicDescription = extractEpicDescription(markdownContent, headerEndIndex);

    // Parse story headings
    const stories = parseStoryEntries(markdownContent);

    // Build successful Epic object
    const epic: Epic = {
      number: epicNumber,
      key: `epic-${epicNumber}`,
      title: epicTitle,
      description: epicDescription,
      metadata,
      stories,
      filePath: filePath || '',
      status: 'backlog', // Default status, merged from sprint-status later
    };

    return parseSuccess(epic);
  } catch (error) {
    // Handle unexpected errors - never throw
    const message = error instanceof Error ? error.message : 'Unknown error';
    return parseFailure(`Failed to parse epic file: ${message}`, { filePath: filePath || '' });
  }
}

/**
 * Regex to find all epic header positions in a consolidated file (global match)
 */
const EPIC_HEADER_GLOBAL_REGEX = /^##\s+Epic\s+\d+:\s+.+$/gm;

/**
 * Parse a consolidated markdown file containing multiple epics.
 * Splits content at each `## Epic N:` boundary and parses each section independently.
 *
 * @param content - Raw markdown content potentially containing multiple epics
 * @param filePath - File path for error messages and filePath field (optional)
 * @returns ParseResult<Epic[]> - array of all successfully parsed epics, never throws
 */
export function parseEpics(content: string, filePath?: string): ParseResult<Epic[]> {
  try {
    if (!content || content.trim().length === 0) {
      return parseFailure('Invalid epics file: content is empty');
    }

    // Strip frontmatter before splitting — frontmatter only applies to the file, not individual epics
    const { content: markdownContent } = matter(content);

    // Find all epic header positions
    EPIC_HEADER_GLOBAL_REGEX.lastIndex = 0;
    const headerPositions: number[] = [];
    let headerMatch: RegExpExecArray | null;
    while ((headerMatch = EPIC_HEADER_GLOBAL_REGEX.exec(markdownContent)) !== null) {
      headerPositions.push(headerMatch.index);
    }

    // If no epic headers found, try parsing as single epic (backwards compatible)
    if (headerPositions.length === 0) {
      const singleResult = parseEpic(content, filePath);
      if (singleResult.success) {
        return parseSuccess([singleResult.data]);
      }
      return parseFailure(singleResult.error);
    }

    // Split content into sections at each epic header
    const epics: Epic[] = [];
    for (let i = 0; i < headerPositions.length; i++) {
      const start = headerPositions[i];
      const end = i + 1 < headerPositions.length ? headerPositions[i + 1] : markdownContent.length;
      const section = markdownContent.slice(start, end);

      // Parse each section as a standalone epic (no frontmatter wrapper needed)
      const result = parseEpic(section, filePath);
      if (result.success) {
        epics.push(result.data);
      }
      // Silently skip sections that fail to parse (partial success is fine)
    }

    if (epics.length === 0) {
      return parseFailure('No valid epics found in file');
    }

    return parseSuccess(epics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return parseFailure(`Failed to parse epics file: ${message}`);
  }
}

/**
 * Parse epic file from disk
 *
 * @param filePath - Absolute path to epic markdown file
 * @returns Promise<ParseResult<Epic>> - never throws
 */
export async function parseEpicFile(filePath: string): Promise<ParseResult<Epic>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseEpic(content, filePath);
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error codes
      if ('code' in error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          return parseFailure(`Epic parser: file not found: ${filePath}`);
        }
        if (nodeError.code === 'EACCES') {
          return parseFailure(`Epic parser: permission denied: ${filePath}`);
        }
        if (nodeError.code === 'EISDIR') {
          return parseFailure(`Epic parser: path is a directory, not a file: ${filePath}`);
        }
      }
      return parseFailure(`Epic parser: failed to read file: ${error.message}`);
    }
    return parseFailure(`Epic parser: failed to read file: unknown error`);
  }
}
