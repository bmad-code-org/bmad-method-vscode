# Story 2.4: Story File Parser

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want reliable parsing of story markdown files,
So that the extension can extract tasks and completion status.

## Acceptance Criteria

1. **Valid Story File Parsing**
   - **Given** a valid story file with frontmatter
   - **When** the parser processes it
   - **Then** it returns `ParseResult<Story>` with `success: true` and extracted data (FR8)
   - **And** it extracts story title, status, and task completion from frontmatter

2. **Malformed/Missing File Handling**
   - **Given** a malformed story file or missing frontmatter
   - **When** the parser processes it
   - **Then** it returns `ParseResult<Story>` with `success: false` and descriptive error (FR10)
   - **And** the parser never throws an exception (NFR5)

3. **Comprehensive Unit Tests**
   - **Given** the story parser
   - **When** unit tests are run
   - **Then** tests cover valid frontmatter, invalid frontmatter, and missing file scenarios

## Tasks / Subtasks

- [ ] Task 1: Create Story Parser Module (AC: #1, #2)
  - [ ] 1.1: Create `src/extension/parsers/story-parser.ts` with `parseStory()` function
  - [ ] 1.2: Use existing `gray-matter` dependency (already installed in Story 2.3)
  - [ ] 1.3: Parse H1 heading to extract story title: `# Story N.M: Title`
  - [ ] 1.4: Parse inline status from H1 line or Status field in content
  - [ ] 1.5: Parse user story statement (As a... I want... So that...)
  - [ ] 1.6: Return `ParseResult<Story>` using factory functions from shared types
  - [ ] 1.7: Never throw - wrap all operations in try/catch returning ParseFailure on error

- [ ] Task 2: Implement Acceptance Criteria Parsing (AC: #1)
  - [ ] 2.1: Parse `## Acceptance Criteria` section
  - [ ] 2.2: Extract numbered criteria with titles (e.g., `1. **Valid Story File Parsing**`)
  - [ ] 2.3: Extract Given/When/Then content for each criterion
  - [ ] 2.4: Store in `AcceptanceCriterion[]` array
  - [ ] 2.5: Handle criteria without Given/When/Then format gracefully

- [ ] Task 3: Implement Task/Subtask Parsing (AC: #1)
  - [ ] 3.1: Parse `## Tasks / Subtasks` section
  - [ ] 3.2: Extract tasks from checkbox items: `- [x] Task 1: Description (AC: #1, #2)`
  - [ ] 3.3: Detect task completion status from `[x]` vs `[ ]`
  - [ ] 3.4: Parse acceptance criteria references from `(AC: #N, #M)` pattern
  - [ ] 3.5: Extract subtasks from indented checkbox items: `  - [x] 1.1: Description`
  - [ ] 3.6: Calculate totalTasks, completedTasks, totalSubtasks, completedSubtasks counts
  - [ ] 3.7: Handle malformed task lists gracefully

- [ ] Task 4: Implement Story Key and Number Extraction (AC: #1)
  - [ ] 4.1: Parse story key from filename (e.g., `2-4-story-file-parser.md` -> `2-4-story-file-parser`)
  - [ ] 4.2: Extract epicNumber and storyNumber from key (e.g., 2 and 4)
  - [ ] 4.3: Validate key format matches `N-N-kebab-case-name` pattern
  - [ ] 4.4: Fallback to parsing from H1 heading if filename not available

- [ ] Task 5: Create File Reading Wrapper (AC: #1, #2)
  - [ ] 5.1: Create `parseStoryFile(filePath: string)` async function
  - [ ] 5.2: Handle file not found gracefully with appropriate error message
  - [ ] 5.3: Handle file read errors (permission denied, etc.) gracefully
  - [ ] 5.4: Use Node.js fs/promises for async file reading

- [ ] Task 6: Write Comprehensive Unit Tests (AC: #3)
  - [ ] 6.1: Create `src/extension/parsers/story-parser.test.ts`
  - [ ] 6.2: Test valid story file with all sections (header, AC, tasks)
  - [ ] 6.3: Test story file with partial tasks completed
  - [ ] 6.4: Test story file with no tasks (empty task list)
  - [ ] 6.5: Test story file with malformed task checkboxes
  - [ ] 6.6: Test story file without acceptance criteria section
  - [ ] 6.7: Test parsing from filename vs content
  - [ ] 6.8: Test empty file and files with only header
  - [ ] 6.9: Test file reading errors (ENOENT, EACCES, EISDIR)
  - [ ] 6.10: Use fixture data based on actual story file structure

- [ ] Task 7: Update Parser Barrel Export (AC: #1)
  - [ ] 7.1: Update `src/extension/parsers/index.ts` to export parseStory and parseStoryFile
  - [ ] 7.2: Re-export Story type for consumer convenience

- [ ] Task 8: Build and Lint Validation (AC: #1, #2, #3)
  - [ ] 8.1: Run `pnpm typecheck:extension` and verify no type errors
  - [ ] 8.2: Run `pnpm lint` and verify no linting errors
  - [ ] 8.3: Run `pnpm test` and verify all tests pass
  - [ ] 8.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `story-parser.ts`, `story-parser.test.ts`
   - WRONG: `StoryParser.ts`, `storyParser.ts`

2. **Function Naming**: camelCase
   ```typescript
   export function parseStory(content: string, filePath?: string): ParseResult<Story> { ... }
   export async function parseStoryFile(filePath: string): Promise<ParseResult<Story>> { ... }
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, etc.

4. **Never Throw Pattern**: ParseResult<T> is MANDATORY
   - ALL parsing functions return `ParseResult<T>`
   - NEVER throw exceptions - wrap in try/catch
   - Use `parseSuccess()` and `parseFailure()` factory functions from shared types
   - This is CRITICAL for NFR5-7 (reliability requirements)

5. **Import Shared Types**:
   ```typescript
   import type { Story, StoryTask, StorySubtask, AcceptanceCriterion, ParseResult } from '@shared/types';
   import { parseSuccess, parseFailure } from '@shared/types';
   ```

### Technical Specifications

**Parsing Library: gray-matter (already installed)**
- Use `matter()` function to extract frontmatter and content
- Returns `{ data: object, content: string }` structure
- Note: Story files may NOT have frontmatter - handle gracefully

**Expected Story File Structure (from actual story files):**
```markdown
# Story 2.4: Story File Parser

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want reliable parsing of story markdown files,
So that the extension can extract tasks and completion status.

## Acceptance Criteria

1. **Valid Story File Parsing**
   - **Given** a valid story file with frontmatter
   - **When** the parser processes it
   - **Then** it returns `ParseResult<Story>` with `success: true`

2. **Malformed/Missing File Handling**
   - **Given** a malformed story file
   - **When** the parser processes it
   - **Then** it returns `ParseResult<Story>` with `success: false`

## Tasks / Subtasks

- [x] Task 1: Create Story Parser Module (AC: #1, #2)
  - [x] 1.1: Create `src/extension/parsers/story-parser.ts`
  - [x] 1.2: Use existing `gray-matter` dependency
  - [ ] 1.3: Implement parsing logic

- [ ] Task 2: Write Tests (AC: #3)
  - [ ] 2.1: Create test file
  - [ ] 2.2: Add test cases

## Dev Notes

...additional content...
```

### Existing Story Type Definition (from Story 2.1)

```typescript
// From src/shared/types/story.ts

interface StorySubtask {
  id: string;           // e.g., "1.1", "1.2"
  description: string;  // Subtask description
  completed: boolean;   // Whether the subtask is complete
}

interface StoryTask {
  number: number;           // e.g., 1, 2, 3
  description: string;      // Task description
  completed: boolean;       // Whether the task is complete
  acceptanceCriteria?: number[];  // Related AC numbers
  subtasks: StorySubtask[]; // Subtasks within this task
}

interface AcceptanceCriterion {
  number: number;    // Criterion number (1-indexed)
  title: string;     // Criterion title
  content: string;   // Full criterion text including Given/When/Then
}

interface Story {
  key: string;            // e.g., "2-4-story-file-parser"
  epicNumber: number;     // e.g., 2
  storyNumber: number;    // e.g., 4
  title: string;          // Story title from H1 heading
  userStory: string;      // "As a... I want... So that..."
  acceptanceCriteria: AcceptanceCriterion[];
  tasks: StoryTask[];
  filePath: string;       // Relative path to story file
  status: StoryStatusValue;  // Current status
  totalTasks: number;
  completedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
}
```

### Regex Patterns for Parsing

```typescript
// Story header: # Story 2.4: Story File Parser
const STORY_HEADER_REGEX = /^#\s+Story\s+(\d+)\.(\d+):\s+(.+)$/m;

// Status line: Status: ready-for-dev
const STATUS_LINE_REGEX = /^Status:\s*(\S+)/m;

// User story pattern (multiline)
const USER_STORY_REGEX = /As\s+(?:a|an)\s+.+?,\s*\n?I\s+want\s+.+?,\s*\n?(?:so\s+that|So\s+that)\s+.+?(?=\n\n|\n##|$)/is;

// Acceptance criterion header: 1. **Valid Story File Parsing**
const AC_HEADER_REGEX = /^(\d+)\.\s+\*\*(.+?)\*\*/gm;

// Task checkbox: - [x] Task 1: Description (AC: #1, #2)
const TASK_REGEX = /^-\s+\[([ xX])\]\s+Task\s+(\d+):\s*(.+?)(?:\s*\(AC:\s*([^)]+)\))?$/gm;

// Subtask checkbox:   - [x] 1.1: Description
const SUBTASK_REGEX = /^\s+-\s+\[([ xX])\]\s+(\d+\.\d+):\s*(.+)$/gm;

// Story key from filename: 2-4-story-file-parser.md
const FILENAME_KEY_REGEX = /^(\d+)-(\d+)-(.+)\.md$/;
```

### Implementation Pattern

```typescript
import matter from 'gray-matter';
import type { Story, StoryTask, StorySubtask, AcceptanceCriterion, ParseResult, StoryStatusValue } from '@shared/types';
import { parseSuccess, parseFailure } from '@shared/types';
import { promises as fs } from 'node:fs';
import path from 'node:path';

/**
 * Parse story markdown file content into Story structure
 *
 * @param content - Raw markdown content with optional frontmatter
 * @param filePath - File path for error messages and key extraction (optional)
 * @returns ParseResult<Story> - never throws
 */
export function parseStory(content: string, filePath?: string): ParseResult<Story> {
  try {
    // Extract frontmatter and content (note: story files may not have frontmatter)
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Parse story header: # Story N.M: Title
    const headerMatch = markdownContent.match(STORY_HEADER_REGEX);
    if (!headerMatch) {
      return parseFailure(
        'Story parser: Invalid story file - missing header (expected "# Story N.M: Title")',
        { filePath }
      );
    }

    const epicNumber = parseInt(headerMatch[1], 10);
    const storyNumber = parseInt(headerMatch[2], 10);
    const title = headerMatch[3].trim();

    // Generate story key from filename or content
    const key = extractStoryKey(filePath, epicNumber, storyNumber, title);

    // Parse status (from Status: line or default to 'backlog')
    const status = extractStatus(markdownContent);

    // Parse user story
    const userStory = extractUserStory(markdownContent);

    // Parse acceptance criteria
    const acceptanceCriteria = extractAcceptanceCriteria(markdownContent);

    // Parse tasks and subtasks
    const tasks = extractTasks(markdownContent);

    // Calculate completion stats
    const { totalTasks, completedTasks, totalSubtasks, completedSubtasks } = calculateTaskStats(tasks);

    const story: Story = {
      key,
      epicNumber,
      storyNumber,
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
    return parseFailure(`Story parser: Failed to parse story file: ${message}`);
  }
}
```

### Task Completion Calculation

```typescript
/**
 * Calculate task completion statistics
 */
function calculateTaskStats(tasks: StoryTask[]): {
  totalTasks: number;
  completedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
} {
  let totalTasks = tasks.length;
  let completedTasks = tasks.filter(t => t.completed).length;
  let totalSubtasks = 0;
  let completedSubtasks = 0;

  for (const task of tasks) {
    totalSubtasks += task.subtasks.length;
    completedSubtasks += task.subtasks.filter(s => s.completed).length;
  }

  return { totalTasks, completedTasks, totalSubtasks, completedSubtasks };
}
```

### Project Structure for Story 2.4

```
src/extension/parsers/
├── index.ts                  # UPDATE - Add story-parser exports
├── sprint-status.ts          # EXISTS - Reference for pattern
├── sprint-status.test.ts     # EXISTS - Reference for test patterns
├── epic-parser.ts            # EXISTS - Reference for gray-matter usage
├── epic-parser.test.ts       # EXISTS - Reference for test patterns
├── story-parser.ts           # NEW - Parser implementation
└── story-parser.test.ts      # NEW - Unit tests
```

### Testing Requirements

**Test Framework**: Vitest (extension parsers use Vitest, not @vscode/test-electron)

**Test File Location**: `src/extension/parsers/story-parser.test.ts` (co-located)

**Fixture Pattern (based on actual story files in implementation-artifacts):**
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseStory, parseStoryFile } from './story-parser';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const VALID_STORY_CONTENT = `# Story 2.4: Story File Parser

Status: ready-for-dev

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

describe('parseStory', () => {
  it('parses valid story file with all sections', () => {
    const result = parseStory(VALID_STORY_CONTENT, '2-4-story-file-parser.md');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.epicNumber).toBe(2);
      expect(result.data.storyNumber).toBe(4);
      expect(result.data.title).toBe('Story File Parser');
      expect(result.data.status).toBe('ready-for-dev');
      expect(result.data.tasks).toHaveLength(2);
      expect(result.data.totalTasks).toBe(2);
      expect(result.data.completedTasks).toBe(1);
      expect(result.data.totalSubtasks).toBe(5);
      expect(result.data.completedSubtasks).toBe(2);
    }
  });

  it('extracts acceptance criteria correctly', () => {
    const result = parseStory(VALID_STORY_CONTENT);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.acceptanceCriteria).toHaveLength(2);
      expect(result.data.acceptanceCriteria[0].title).toBe('Valid Story File Parsing');
      expect(result.data.acceptanceCriteria[0].number).toBe(1);
    }
  });

  it('returns failure for missing story header', () => {
    const content = `# Not a valid story header

Some content here.
`;
    const result = parseStory(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('missing header');
    }
  });

  it('handles story with no tasks gracefully', () => {
    const content = `# Story 1.1: Empty Story

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
    const result = parseStory(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tasks).toHaveLength(0);
      expect(result.data.totalTasks).toBe(0);
    }
  });

  it('defaults status to backlog when not specified', () => {
    const content = `# Story 1.1: No Status Story

## Story

As a user, I want something, So that something happens.
`;
    const result = parseStory(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('backlog');
    }
  });
});
```

### Previous Story Intelligence (Story 2.3)

**Critical Learnings:**

1. **gray-matter Works**: Story 2.3 established gray-matter usage pattern - already installed, use same import
2. **Factory Functions**: Use `parseSuccess()` and `parseFailure()` from `@shared/types` - don't construct objects manually
3. **Error Prefix**: Use "Story parser:" prefix for all error messages (consistent with "Epic parser:" pattern from 2.3)
4. **31 tests**: Story 2.3 added 31 tests - aim for similar comprehensive coverage
5. **TypeScript Boundary**: Parser is in extension context - can import from `@shared/types` but NOT from `src/webviews/`
6. **Path Alias**: Use `@shared/types` import path (configured in tsconfig.extension.json)
7. **Graceful Degradation**: Return partial data when possible - extract what can be extracted
8. **JSDoc Documentation**: Add JSDoc to all exported functions and internal helpers

**Stack Versions (from Story 2.3):**
- TypeScript 5.9.3
- Vitest 4.0.18
- pnpm (package manager)
- gray-matter 4.0.3

### Git Intelligence

**Recent Commits:**
```
a152b03 feat: 2-3-epic-file-parser
209ed1d feat: 2-2-sprint-status-parser
6e2123e feat: 2-1-shared-types-and-message-protocol
76f3a5f feat: 1-4-sidebar-panel-registration
cb6456f feat: 1-3-bmad-project-detection
```

**Commit Convention**: `feat: 2-4-story-file-parser`

### Epic 2 Context

This is Story 2.4 in Epic 2 (BMAD File Parsing & State Management). The parser created here will be used by:
- Story 2.6: State Manager (aggregates parsed stories into DashboardState)
- Epic 3: Dashboard State Visibility (displays story card with task progress)

**Parallel Development Note**: Stories 2.4 (this story), and 2.5 (File Watcher) can be developed in parallel.

### Dependencies - Already Installed

`gray-matter` was installed in Story 2.3. No new dependencies needed.

**Verify installation:**
```bash
pnpm list gray-matter
```

### Error Message Guidelines

Follow architecture pattern for error messages:
- Sentence case, user-friendly
- Include context: "Story parser: Invalid story file - missing header (expected '# Story N.M: Title')"
- Use "Story parser:" prefix for consistency
- Never expose stack traces to UI
- Be specific about what failed and what was expected

### Graceful Degradation (NFR7)

When partial data is available, return it:
```typescript
// If tasks parsing fails but header is valid:
return parseFailure(
  'Story parser: Failed to parse tasks section',
  {
    key,
    epicNumber,
    storyNumber,
    title,
    status,
    userStory,
    filePath,
    // tasks omitted - that's what failed
  }
);
```

This allows the dashboard to show "Story 2.4: Story File Parser" even if task parsing failed.

### Status Value Validation

Valid status values from sprint-status types:
```typescript
type StoryStatusValue = 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
```

Use `isStoryStatus()` type guard from `@shared/types` if validating status.

### Edge Cases to Handle

1. **Empty file**: Return failure with descriptive error
2. **Only header, no content**: Return success with empty tasks/AC
3. **Malformed checkbox syntax**: Skip malformed tasks, continue parsing
4. **Missing Status line**: Default to 'backlog'
5. **Missing user story**: Set to empty string, don't fail
6. **Nested subtasks deeper than expected**: Only parse immediate subtasks
7. **Tasks without AC references**: acceptanceCriteria array should be empty/undefined
8. **Story without ## Tasks section**: Return empty tasks array

### Project Structure Notes

- Alignment with unified project structure (paths, modules, naming)
- Follows kebab-case file naming convention
- Test file co-located with source
- Uses path alias @shared/types for shared type imports

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Parsing-Stack] - gray-matter library selection
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling] - ParseResult<T> pattern
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.4] - Acceptance criteria
- [Source: src/shared/types/story.ts] - Story, StoryTask, StorySubtask, AcceptanceCriterion interfaces
- [Source: src/shared/types/parse-result.ts] - ParseResult<T> type and factory functions
- [Source: src/extension/parsers/epic-parser.ts] - Reference implementation for gray-matter usage
- [Source: _bmad-output/implementation-artifacts/2-3-epic-file-parser.md] - Previous story learnings
- [Source: _bmad-output/implementation-artifacts/2-2-sprint-status-parser.md] - Reference story file structure

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

