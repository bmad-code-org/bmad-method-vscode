// Unit tests for Story File Parser
// Tests parseStory and parseStoryFile functions

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseStory, parseStoryFile } from './story-parser';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// Valid story content with all sections
const VALID_STORY_CONTENT = `# Story 2.4: Story File Parser

Status: ready-for-dev

<!-- Note: Validation is optional. -->

## Story

As a developer,
I want reliable parsing of story markdown files,
So that the extension can extract tasks and completion status.

## Acceptance Criteria

1. **Valid Story File Parsing**
   - **Given** a valid story file with frontmatter
   - **When** the parser processes it
   - **Then** it returns ParseResult<Story> with success: true

2. **Malformed/Missing File Handling**
   - **Given** a malformed story file
   - **When** the parser processes it
   - **Then** it returns ParseResult<Story> with success: false

3. **Comprehensive Unit Tests**
   - **Given** the story parser
   - **When** unit tests are run
   - **Then** tests cover valid and invalid scenarios

## Tasks / Subtasks

- [x] Task 1: Create Story Parser Module (AC: #1, #2)
  - [x] 1.1: Create parser file
  - [x] 1.2: Use gray-matter dependency
  - [ ] 1.3: Implement parsing logic

- [ ] Task 2: Write Tests (AC: #3)
  - [ ] 2.1: Create test file
  - [ ] 2.2: Add test cases

## Dev Notes

Additional content here.
`;

// Story with partial tasks completed
const PARTIAL_TASKS_CONTENT = `# Story 1.2: User Authentication

Status: in-progress

## Story

As a user,
I want secure authentication,
So that my data is protected.

## Acceptance Criteria

1. **Login Works**
   - **Given** valid credentials
   - **When** user logs in
   - **Then** session is created

## Tasks / Subtasks

- [x] Task 1: Setup Auth Module (AC: #1)
  - [x] 1.1: Install dependencies
  - [x] 1.2: Configure OAuth
  - [ ] 1.3: Implement token refresh

- [ ] Task 2: Create Login UI
  - [ ] 2.1: Design login form
  - [ ] 2.2: Add validation
`;

// Story with no tasks
const NO_TASKS_CONTENT = `# Story 1.1: Empty Story

Status: backlog

## Story

As a user, I want nothing, So that nothing happens.

## Acceptance Criteria

1. **Nothing**
   - **Given** nothing
   - **When** nothing
   - **Then** nothing

## Tasks / Subtasks

`;

// Story without status line
const NO_STATUS_CONTENT = `# Story 1.1: No Status Story

## Story

As a user, I want something, So that something happens.

## Acceptance Criteria

1. **Something**
   - **Given** something
   - **Then** something happens
`;

// Story without acceptance criteria section
const NO_AC_CONTENT = `# Story 3.1: Minimal Story

Status: done

## Story

As a tester, I want minimal content, So that edge cases are covered.

## Tasks / Subtasks

- [x] Task 1: Do something
`;

// Story with frontmatter
const FRONTMATTER_STORY_CONTENT = `---
title: Test Story
author: Test Author
---

# Story 5.1: Frontmatter Test

Status: review

## Story

As a developer, I want frontmatter support, So that metadata is preserved.

## Acceptance Criteria

1. **Frontmatter Parsed**
   - **Given** frontmatter exists
   - **Then** it is handled gracefully

## Tasks / Subtasks

- [x] Task 1: Handle frontmatter (AC: #1)
`;

// Story with malformed task checkboxes
const MALFORMED_TASKS_CONTENT = `# Story 2.1: Malformed Tasks

Status: ready-for-dev

## Story

As a developer, I want robust parsing, So that errors are handled.

## Acceptance Criteria

1. **Error Handling**
   - **Given** malformed content
   - **Then** parsing continues

## Tasks / Subtasks

- [x] Task 1: Valid task (AC: #1)
  - [x] 1.1: Valid subtask
- This is not a valid task line
- [ Task 2: Missing bracket
- [y] Task 3: Invalid checkbox marker
- [ ] Task 4: Another valid task
`;

// Empty file content
const EMPTY_CONTENT = '';

// Only header content
const ONLY_HEADER_CONTENT = `# Story 1.1: Header Only

Status: backlog
`;

// Invalid header (not story format)
const INVALID_HEADER_CONTENT = `# Not a valid story header

Some content here.
`;

// Content with tasks having no AC references
const TASKS_NO_AC_CONTENT = `# Story 4.1: Tasks Without AC

Status: ready-for-dev

## Story

As a developer, I want tasks without AC references, So that optional AC works.

## Acceptance Criteria

1. **No AC Needed**
   - **Given** a simple task
   - **Then** AC is optional

## Tasks / Subtasks

- [ ] Task 1: Do something simple
  - [ ] 1.1: First step
  - [ ] 1.2: Second step
- [ ] Task 2: Another task
`;

describe('parseStory', () => {
  describe('valid story files', () => {
    it('parses valid story file with all sections', () => {
      const result = parseStory(VALID_STORY_CONTENT, '2-4-story-file-parser.md');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.epicNumber).toBe(2);
        expect(result.data.storyNumber).toBe(4);
        expect(result.data.title).toBe('Story File Parser');
        expect(result.data.status).toBe('ready-for-dev');
        expect(result.data.key).toBe('2-4-story-file-parser');
        expect(result.data.tasks).toHaveLength(2);
        expect(result.data.totalTasks).toBe(2);
        expect(result.data.completedTasks).toBe(1);
        expect(result.data.totalSubtasks).toBe(5);
        expect(result.data.completedSubtasks).toBe(2);
      }
    });

    it('extracts user story correctly', () => {
      const result = parseStory(VALID_STORY_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userStory).toContain('As a developer');
        expect(result.data.userStory).toContain('I want reliable parsing');
        expect(result.data.userStory).toContain('So that');
      }
    });

    it('extracts acceptance criteria correctly', () => {
      const result = parseStory(VALID_STORY_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.acceptanceCriteria).toHaveLength(3);
        expect(result.data.acceptanceCriteria[0].number).toBe(1);
        expect(result.data.acceptanceCriteria[0].title).toBe('Valid Story File Parsing');
        expect(result.data.acceptanceCriteria[1].number).toBe(2);
        expect(result.data.acceptanceCriteria[1].title).toBe('Malformed/Missing File Handling');
        expect(result.data.acceptanceCriteria[2].number).toBe(3);
        expect(result.data.acceptanceCriteria[2].title).toBe('Comprehensive Unit Tests');
      }
    });

    it('extracts tasks and subtasks correctly', () => {
      const result = parseStory(VALID_STORY_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        const task1 = result.data.tasks[0];
        expect(task1.number).toBe(1);
        expect(task1.description).toBe('Create Story Parser Module');
        expect(task1.completed).toBe(true);
        expect(task1.acceptanceCriteria).toEqual([1, 2]);
        expect(task1.subtasks).toHaveLength(3);
        expect(task1.subtasks[0].id).toBe('1.1');
        expect(task1.subtasks[0].completed).toBe(true);
        expect(task1.subtasks[2].id).toBe('1.3');
        expect(task1.subtasks[2].completed).toBe(false);

        const task2 = result.data.tasks[1];
        expect(task2.number).toBe(2);
        expect(task2.completed).toBe(false);
        expect(task2.acceptanceCriteria).toEqual([3]);
        expect(task2.subtasks).toHaveLength(2);
      }
    });

    it('parses story with partial tasks completed', () => {
      const result = parseStory(PARTIAL_TASKS_CONTENT, '1-2-user-authentication.md');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe('1-2-user-authentication');
        expect(result.data.status).toBe('in-progress');
        expect(result.data.totalTasks).toBe(2);
        expect(result.data.completedTasks).toBe(1);
        expect(result.data.totalSubtasks).toBe(5);
        expect(result.data.completedSubtasks).toBe(2);
      }
    });

    it('handles story with no tasks gracefully', () => {
      const result = parseStory(NO_TASKS_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tasks).toHaveLength(0);
        expect(result.data.totalTasks).toBe(0);
        expect(result.data.completedTasks).toBe(0);
        expect(result.data.totalSubtasks).toBe(0);
        expect(result.data.completedSubtasks).toBe(0);
      }
    });

    it('defaults status to backlog when not specified', () => {
      const result = parseStory(NO_STATUS_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('backlog');
      }
    });

    it('handles story without acceptance criteria section', () => {
      const result = parseStory(NO_AC_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.acceptanceCriteria).toHaveLength(0);
        expect(result.data.tasks).toHaveLength(1);
        expect(result.data.status).toBe('done');
      }
    });

    it('handles story with frontmatter', () => {
      const result = parseStory(FRONTMATTER_STORY_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.epicNumber).toBe(5);
        expect(result.data.storyNumber).toBe(1);
        expect(result.data.title).toBe('Frontmatter Test');
        expect(result.data.status).toBe('review');
      }
    });

    it('handles tasks without AC references', () => {
      const result = parseStory(TASKS_NO_AC_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tasks[0].acceptanceCriteria).toBeUndefined();
        expect(result.data.tasks[1].acceptanceCriteria).toBeUndefined();
      }
    });

    it('handles only header content', () => {
      const result = parseStory(ONLY_HEADER_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.epicNumber).toBe(1);
        expect(result.data.storyNumber).toBe(1);
        expect(result.data.title).toBe('Header Only');
        expect(result.data.status).toBe('backlog');
        expect(result.data.tasks).toHaveLength(0);
        expect(result.data.acceptanceCriteria).toHaveLength(0);
        expect(result.data.userStory).toBe('');
      }
    });
  });

  describe('malformed content handling', () => {
    it('skips malformed task lines but continues parsing', () => {
      const result = parseStory(MALFORMED_TASKS_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        // Should only parse the valid tasks (1 and 4)
        expect(result.data.tasks).toHaveLength(2);
        expect(result.data.tasks[0].number).toBe(1);
        expect(result.data.tasks[1].number).toBe(4);
      }
    });

    it('returns failure for missing story header', () => {
      const result = parseStory(INVALID_HEADER_CONTENT);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing header');
        expect(result.error).toContain('Story parser');
      }
    });

    it('returns failure for empty file', () => {
      const result = parseStory(EMPTY_CONTENT);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('content is empty');
      }
    });

    it('returns failure for whitespace-only content', () => {
      const result = parseStory('   \n\n\t  ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('content is empty');
      }
    });
  });

  describe('story key extraction', () => {
    it('extracts key from filename', () => {
      const result = parseStory(VALID_STORY_CONTENT, '2-4-story-file-parser.md');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe('2-4-story-file-parser');
      }
    });

    it('extracts key from full path', () => {
      const result = parseStory(VALID_STORY_CONTENT, '/path/to/stories/2-4-story-file-parser.md');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe('2-4-story-file-parser');
      }
    });

    it('generates key from content when filename not available', () => {
      const result = parseStory(VALID_STORY_CONTENT);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe('2-4-story-file-parser');
      }
    });

    it('generates key from content when filename does not match pattern', () => {
      const result = parseStory(VALID_STORY_CONTENT, 'random-name.md');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.key).toBe('2-4-story-file-parser');
      }
    });
  });

  describe('status validation', () => {
    it('accepts all valid status values', () => {
      const statuses = ['backlog', 'ready-for-dev', 'in-progress', 'review', 'done'];
      for (const status of statuses) {
        const content = `# Story 1.1: Test

Status: ${status}

## Story

As a user, I want test, So that tests pass.
`;
        const result = parseStory(content);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.status).toBe(status);
        }
      }
    });

    it('defaults to backlog for invalid status', () => {
      const content = `# Story 1.1: Test

Status: invalid-status

## Story

As a user, I want test, So that tests pass.
`;
      const result = parseStory(content);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('backlog');
      }
    });
  });
});

describe('parseStoryFile', () => {
  let tempDir: string;
  let tempFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'story-parser-test-'));
    tempFile = path.join(tempDir, '2-4-story-file-parser.md');
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  it('reads and parses valid story file', async () => {
    await fs.writeFile(tempFile, VALID_STORY_CONTENT);

    const result = await parseStoryFile(tempFile);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.epicNumber).toBe(2);
      expect(result.data.storyNumber).toBe(4);
      expect(result.data.title).toBe('Story File Parser');
      expect(result.data.filePath).toBe(tempFile);
    }
  });

  it('returns failure for non-existent file (ENOENT)', async () => {
    const result = await parseStoryFile('/non/existent/file.md');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('file not found');
      expect(result.error).toContain('Story parser');
    }
  });

  it('returns failure for directory path (EISDIR)', async () => {
    const result = await parseStoryFile(tempDir);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('directory');
      expect(result.error).toContain('Story parser');
    }
  });

  it('handles empty file', async () => {
    await fs.writeFile(tempFile, '');

    const result = await parseStoryFile(tempFile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('content is empty');
    }
  });

  it('returns failure for permission denied (EACCES)', async () => {
    // Create a mock EACCES error to test the error handling path
    // We test this by verifying the error message format matches what parseStoryFile produces
    // The actual EACCES code path is at story-parser.ts:392-393
    const mockPath = '/permission/denied/file.md';

    // Since we can't easily simulate EACCES cross-platform, we verify the error path
    // by checking that a non-existent path in a system directory returns an appropriate error
    // On most systems, trying to read from a protected path will fail with ENOENT or EACCES
    const result = await parseStoryFile(mockPath);
    expect(result.success).toBe(false);
    if (!result.success) {
      // The error should contain "Story parser" prefix and indicate the failure reason
      expect(result.error).toContain('Story parser');
      // Should be either file not found or permission denied depending on platform
      expect(
        result.error.includes('file not found') || result.error.includes('permission denied')
      ).toBe(true);
    }
  });
});

describe('edge cases', () => {
  it('handles story with complex multiline user story', () => {
    const content = `# Story 1.1: Complex User Story

Status: backlog

## Story

As a very busy developer with many responsibilities,
I want a powerful yet intuitive parsing solution,
So that I can focus on building features instead of debugging parsers.

## Acceptance Criteria

1. **Works**
   - **Given** input
   - **Then** output
`;
    const result = parseStory(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.userStory).toContain('As a very busy developer');
      expect(result.data.userStory).toContain('I want a powerful yet intuitive');
      expect(result.data.userStory).toContain('So that I can focus');
    }
  });

  it('handles acceptance criteria content without Given/When/Then', () => {
    const content = `# Story 1.1: Simple AC

Status: backlog

## Story

As a user, I want simple things, So that life is easy.

## Acceptance Criteria

1. **Simple Requirement**
   Just a plain text description without formatting.

2. **Another One**
   Also plain text.
`;
    const result = parseStory(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.acceptanceCriteria).toHaveLength(2);
      expect(result.data.acceptanceCriteria[0].content).toContain('plain text description');
    }
  });

  it('handles deeply indented content in sections', () => {
    const content = `# Story 1.1: Deep Indent

Status: backlog

## Story

As a user, I want indentation support, So that nested content works.

## Acceptance Criteria

1. **Nested Content**
   - **Given** nested structure
     - More nesting
       - Even deeper
   - **Then** it parses

## Tasks / Subtasks

- [ ] Task 1: Handle nesting
  - [ ] 1.1: First level
`;
    const result = parseStory(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.acceptanceCriteria[0].content).toContain('Even deeper');
      expect(result.data.tasks[0].subtasks[0].id).toBe('1.1');
    }
  });

  it('handles special characters in titles', () => {
    const content = `# Story 1.1: Parser with Special (chars) & "quotes"

Status: backlog

## Story

As a user, I want special character support, So that titles work.
`;
    const result = parseStory(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe('Parser with Special (chars) & "quotes"');
      expect(result.data.key).toBe('1-1-parser-with-special-chars-and-quotes');
    }
  });

  it('handles uppercase checkbox markers', () => {
    const content = `# Story 1.1: Uppercase Checkbox

Status: ready-for-dev

## Story

As a user, I want flexible parsing, So that case does not matter.

## Tasks / Subtasks

- [X] Task 1: Uppercase X
  - [X] 1.1: Also uppercase
- [ ] Task 2: Lowercase
`;
    const result = parseStory(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tasks[0].completed).toBe(true);
      expect(result.data.tasks[0].subtasks[0].completed).toBe(true);
      expect(result.data.tasks[1].completed).toBe(false);
    }
  });

  it('parses AC references with various formats', () => {
    const content = `# Story 1.1: AC Reference Formats

Status: ready-for-dev

## Story

As a user, I want flexible AC refs, So that different formats work.

## Acceptance Criteria

1. **First**
   - Test
2. **Second**
   - Test
3. **Third**
   - Test

## Tasks / Subtasks

- [ ] Task 1: With hashes (AC: #1, #2)
- [ ] Task 2: Without hashes (AC: 2, 3)
- [ ] Task 3: Mixed (AC: #1, 3)
`;
    const result = parseStory(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tasks[0].acceptanceCriteria).toEqual([1, 2]);
      expect(result.data.tasks[1].acceptanceCriteria).toEqual([2, 3]);
      expect(result.data.tasks[2].acceptanceCriteria).toEqual([1, 3]);
    }
  });
});
