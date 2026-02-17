# Story 2.3: Epic File Parser

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want reliable parsing of epic markdown files (epic-\*.md),
So that the extension can extract epic metadata and story lists.

## Acceptance Criteria

1. **Valid Epic File Parsing**
   - **Given** a valid epic file with frontmatter
   - **When** the parser processes it
   - **Then** it returns `ParseResult<Epic>` with `success: true` and extracted metadata (FR7)
   - **And** it extracts epic title, status, and story references from frontmatter

2. **Malformed/Missing File Handling**
   - **Given** a malformed epic file or missing frontmatter
   - **When** the parser processes it
   - **Then** it returns `ParseResult<Epic>` with `success: false` and descriptive error (FR10)
   - **And** the parser never throws an exception (NFR5)

3. **Comprehensive Unit Tests**
   - **Given** the epic parser
   - **When** unit tests are run
   - **Then** tests cover valid frontmatter, invalid frontmatter, and missing file scenarios

## Tasks / Subtasks

- [x] Task 1: Create Epic Parser Module (AC: #1, #2)
  - [x] 1.1: Install `gray-matter` dependency via `pnpm add gray-matter` and `pnpm add -D @types/gray-matter`
  - [x] 1.2: Create `src/extension/parsers/epic-parser.ts` with `parseEpic()` function
  - [x] 1.3: Implement frontmatter extraction using gray-matter library
  - [x] 1.4: Parse markdown content to extract epic title from H2 heading (`## Epic N: Title`)
  - [x] 1.5: Parse markdown content to extract epic description (paragraph after H2)
  - [x] 1.6: Parse markdown content to extract story entries from `### Story N.M: Title` headings
  - [x] 1.7: Return `ParseResult<Epic>` using factory functions from shared types
  - [x] 1.8: Never throw - wrap all operations in try/catch returning ParseFailure on error

- [x] Task 2: Implement Content Validation (AC: #1, #2)
  - [x] 2.1: Validate frontmatter exists and is an object (gray-matter returns empty object if missing)
  - [x] 2.2: Extract `stepsCompleted` array from frontmatter (optional field)
  - [x] 2.3: Extract `inputDocuments` array from frontmatter (optional field)
  - [x] 2.4: Validate epic number can be parsed from filename or heading
  - [x] 2.5: Generate epic key in format `epic-N` from extracted number
  - [x] 2.6: Return descriptive error messages indicating which validation failed
  - [x] 2.7: Support partial parsing - return valid fields even when some are invalid

- [x] Task 3: Implement Story Extraction (AC: #1)
  - [x] 3.1: Parse H3 story headings (`### Story N.M: Title`) using regex
  - [x] 3.2: Extract story key in format `N-M-kebab-case-title` from heading
  - [x] 3.3: Extract story title from heading
  - [x] 3.4: Extract story description from user story text (As a... I want... so that...)
  - [x] 3.5: Return array of `EpicStoryEntry` objects for each parsed story
  - [x] 3.6: Handle stories with no description gracefully

- [x] Task 4: Create File Reading Wrapper (AC: #1, #2)
  - [x] 4.1: Create `parseEpicFile(filePath: string)` async function that reads file and parses content
  - [x] 4.2: Handle file not found gracefully with appropriate error message
  - [x] 4.3: Handle file read errors (permission denied, etc.) gracefully
  - [x] 4.4: Use Node.js fs/promises for async file reading

- [x] Task 5: Write Comprehensive Unit Tests (AC: #3)
  - [x] 5.1: Create `src/extension/parsers/epic-parser.test.ts`
  - [x] 5.2: Test valid epic file with complete frontmatter and all stories
  - [x] 5.3: Test epic file with missing frontmatter (should still parse markdown content)
  - [x] 5.4: Test epic file with invalid frontmatter syntax
  - [x] 5.5: Test epic file with no stories (just epic header)
  - [x] 5.6: Test epic file with malformed story headings
  - [x] 5.7: Test partial data extraction on partial failures
  - [x] 5.8: Test empty file
  - [x] 5.9: Test file reading errors (ENOENT, EACCES, EISDIR)
  - [x] 5.10: Use fixture data based on actual epics.md structure from planning-artifacts

- [x] Task 6: Update Parser Barrel Export (AC: #1)
  - [x] 6.1: Update `src/extension/parsers/index.ts` to export parseEpic and parseEpicFile

- [x] Task 7: Build and Lint Validation (AC: #1, #2, #3)
  - [x] 7.1: Run `pnpm typecheck:extension` and verify no type errors
  - [x] 7.2: Run `pnpm lint` and verify no linting errors
  - [x] 7.3: Run `pnpm test` and verify all tests pass
  - [x] 7.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `epic-parser.ts`, `epic-parser.test.ts`
   - WRONG: `EpicParser.ts`, `epicParser.ts`

2. **Function Naming**: camelCase

   ```typescript
   export function parseEpic(content: string, filePath?: string): ParseResult<Epic> { ... }
   export async function parseEpicFile(filePath: string): Promise<ParseResult<Epic>> { ... }
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm add gray-matter`
   - `pnpm add -D @types/gray-matter`
   - `pnpm build`, `pnpm test`, etc.

4. **Never Throw Pattern**: ParseResult<T> is MANDATORY
   - ALL parsing functions return `ParseResult<T>`
   - NEVER throw exceptions - wrap in try/catch
   - Use `parseSuccess()` and `parseFailure()` factory functions from shared types
   - This is CRITICAL for NFR5-7 (reliability requirements)

5. **Import Shared Types**:
   ```typescript
   import type { Epic, EpicMetadata, EpicStoryEntry, ParseResult } from '@shared/types';
   import { parseSuccess, parseFailure } from '@shared/types';
   ```

### Technical Specifications

**Parsing Library: gray-matter**

- Use `matter()` function to extract frontmatter and content
- Returns `{ data: object, content: string }` structure
- Handles missing frontmatter gracefully (returns empty `data` object)
- Handles YAML frontmatter errors - catch and return ParseFailure

**Expected Epic File Structure (from epics.md):**

```markdown
---
stepsCompleted: [step-01, step-02, step-03]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

## Epic 2: BMAD File Parsing & State Management

Developer has reliable parsing of all BMAD artifacts with graceful handling of malformed files...

### Story 2.1: Shared Types and Message Protocol

As a developer,
I want shared TypeScript types for BMAD data structures...
So that type safety is enforced across extension host and webview boundaries.

**Acceptance Criteria:**
...
```

**Key Parsing Requirements:**

- Epic number extracted from H2 heading: `## Epic N: Title` → number = N
- Epic key generated as: `epic-${number}`
- Story number extracted from H3 heading: `### Story N.M: Title` → key = `N-M-kebab-case-title`
- Story title extracted from heading after colon
- Story description extracted from "As a... I want... so that..." text

### Existing Types to Use (from Story 2.1)

```typescript
// From src/shared/types/epic.ts
interface EpicMetadata {
  stepsCompleted?: string[];
  inputDocuments?: string[];
}

interface EpicStoryEntry {
  key: string; // e.g., "2-1-shared-types"
  title: string; // e.g., "Shared Types and Message Protocol"
  description?: string; // e.g., "As a developer, I want..."
  status?: StoryStatusValue; // From sprint-status (merged later)
}

interface Epic {
  number: number; // e.g., 2
  key: string; // e.g., "epic-2"
  title: string; // e.g., "BMAD File Parsing & State Management"
  description: string; // Epic description paragraph
  metadata: EpicMetadata;
  stories: EpicStoryEntry[];
  filePath: string; // Relative path to epic file
  status: EpicStatusValue; // From sprint-status (merged later)
}
```

**Note**: The `status` field on Epic and EpicStoryEntry is populated externally by merging data from sprint-status.yaml. The parser should NOT attempt to extract status - set a default value of `'backlog'`.

### Implementation Pattern

```typescript
import matter from 'gray-matter';
import type { Epic, EpicMetadata, EpicStoryEntry, ParseResult } from '@shared/types';
import { parseSuccess, parseFailure } from '@shared/types';
import { promises as fs } from 'node:fs';

/**
 * Parse epic markdown file content into Epic structure
 *
 * @param content - Raw markdown content with optional frontmatter
 * @param filePath - File path for error messages and filePath field (optional)
 * @returns ParseResult<Epic> - never throws
 */
export function parseEpic(content: string, filePath?: string): ParseResult<Epic> {
  try {
    // Extract frontmatter and content
    const { data: frontmatter, content: markdownContent } = matter(content);

    // Extract metadata from frontmatter
    const metadata: EpicMetadata = {
      stepsCompleted: Array.isArray(frontmatter.stepsCompleted)
        ? frontmatter.stepsCompleted
        : undefined,
      inputDocuments: Array.isArray(frontmatter.inputDocuments)
        ? frontmatter.inputDocuments
        : undefined,
    };

    // Parse epic header: ## Epic N: Title
    const epicHeaderMatch = markdownContent.match(/^##\s+Epic\s+(\d+):\s+(.+)$/m);
    if (!epicHeaderMatch) {
      return parseFailure('Invalid epic file: missing epic header (expected "## Epic N: Title")', {
        metadata,
        filePath,
      });
    }

    const epicNumber = parseInt(epicHeaderMatch[1], 10);
    const epicTitle = epicHeaderMatch[2].trim();

    // Extract description (paragraph after header)
    // ... implementation details

    // Parse story headings: ### Story N.M: Title
    const stories = parseStoryHeadings(markdownContent);

    const epic: Epic = {
      number: epicNumber,
      key: `epic-${epicNumber}`,
      title: epicTitle,
      description: epicDescription,
      metadata,
      stories,
      filePath: filePath || '',
      status: 'backlog', // Default - merged from sprint-status later
    };

    return parseSuccess(epic);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return parseFailure(`Failed to parse epic file: ${message}`);
  }
}
```

### Regex Patterns for Parsing

```typescript
// Epic header: ## Epic 2: BMAD File Parsing & State Management
const EPIC_HEADER_REGEX = /^##\s+Epic\s+(\d+):\s+(.+)$/m;

// Story header: ### Story 2.1: Shared Types and Message Protocol
const STORY_HEADER_REGEX = /^###\s+Story\s+(\d+)\.(\d+):\s+(.+)$/gm;

// User story pattern: As a [role], I want [action], so that [benefit]
const USER_STORY_REGEX =
  /As\s+(?:a|an)\s+([^,]+),\s*\n?I\s+want\s+([^,]+),\s*\n?(?:so\s+that|So\s+that)\s+([^.]+)/i;
```

### Project Structure for Story 2.3

```
src/extension/parsers/
├── index.ts                  # UPDATE - Add epic-parser exports
├── sprint-status.ts          # EXISTS - Reference for pattern
├── sprint-status.test.ts     # EXISTS - Reference for test patterns
├── epic-parser.ts            # NEW - Parser implementation
└── epic-parser.test.ts       # NEW - Unit tests
```

### Testing Requirements

**Test Framework**: Vitest (extension parsers use Vitest, not @vscode/test-electron)

**Test File Location**: `src/extension/parsers/epic-parser.test.ts` (co-located)

**Fixture Pattern (based on actual epics.md structure):**

```typescript
import { describe, it, expect } from 'vitest';
import { parseEpic, parseEpicFile } from './epic-parser';

const VALID_EPIC_CONTENT = `---
stepsCompleted: [step-01, step-02]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
---

## Epic 2: BMAD File Parsing & State Management

Developer has reliable parsing of all BMAD artifacts.

### Story 2.1: Shared Types and Message Protocol

As a developer,
I want shared TypeScript types for BMAD data structures,
So that type safety is enforced across extension host and webview boundaries.

### Story 2.2: Sprint Status Parser

As a developer,
I want reliable parsing of sprint-status.yaml files,
So that the extension can extract workflow state.
`;

describe('parseEpic', () => {
  it('parses valid epic file with frontmatter', () => {
    const result = parseEpic(VALID_EPIC_CONTENT, 'epics.md');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.number).toBe(2);
      expect(result.data.key).toBe('epic-2');
      expect(result.data.title).toBe('BMAD File Parsing & State Management');
      expect(result.data.stories).toHaveLength(2);
      expect(result.data.stories[0].key).toBe('2-1-shared-types-and-message-protocol');
    }
  });

  it('parses epic file without frontmatter', () => {
    const content = `## Epic 1: Project Foundation

Description here.

### Story 1.1: Initialize Project

As a developer,
I want the project initialized,
So that I can start coding.
`;
    const result = parseEpic(content);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.metadata.stepsCompleted).toBeUndefined();
      expect(result.data.stories).toHaveLength(1);
    }
  });

  it('returns failure for missing epic header', () => {
    const content = `---
stepsCompleted: [step-01]
---

# Not an epic header

Some content.
`;
    const result = parseEpic(content);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('missing epic header');
    }
  });
});
```

### Previous Story Intelligence (Story 2.2)

**Critical Learnings:**

1. **Type Guards Work**: Story 2.1 and 2.2 established the pattern - use existing type guards and factory functions
2. **Factory Functions**: Use `parseSuccess()` and `parseFailure()` from `@shared/types` - don't construct objects manually
3. **Test Pattern**: 45 tests in Story 2.2, 84 total in Story 2.1 - follow same Vitest patterns
4. **TypeScript Boundary**: Parser is in extension context - can import from `@shared/types` but NOT from `src/webviews/`
5. **Path Alias**: Use `@shared/types` import path (configured in tsconfig.extension.json)
6. **Graceful Degradation**: Return partial data when possible - extract what can be extracted
7. **js-yaml Date handling**: Be aware gray-matter uses js-yaml internally for YAML parsing

**Stack Versions (from Story 2.2):**

- TypeScript 5.9.3
- Vitest 4.0.18
- pnpm (package manager)
- js-yaml (used internally by gray-matter)

### Git Intelligence

**Recent Commits:**

```
209ed1d feat: 2-2-sprint-status-parser
6e2123e feat: 2-1-shared-types-and-message-protocol
76f3a5f feat: 1-4-sidebar-panel-registration
```

**Commit Convention**: `feat: 2-3-epic-file-parser`

### Epic 2 Context

This is Story 2.3 in Epic 2 (BMAD File Parsing & State Management). The parser created here will be used by:

- Story 2.6: State Manager (aggregates parsed epics into DashboardState)
- Epic 3: Dashboard State Visibility (displays epic list and progress)

**Parallel Development Note**: Stories 2.3 (this story), 2.4 (Story Parser), and 2.5 (File Watcher) can be developed in parallel since they are independent parsers.

### Dependencies to Install

```bash
pnpm add gray-matter
pnpm add -D @types/gray-matter
```

**Note**: Check if gray-matter is already installed before adding.

### Error Message Guidelines

Follow architecture pattern for error messages:

- Sentence case, user-friendly
- Include context: "Invalid epic file: missing epic header (expected '## Epic N: Title')"
- Never expose stack traces to UI
- Be specific about what failed and what was expected

### Graceful Degradation (NFR7)

When partial data is available, return it:

```typescript
// If frontmatter is valid but markdown parsing fails:
return parseFailure('Failed to parse story headings: invalid format', {
  number: epicNumber,
  key: `epic-${epicNumber}`,
  title: epicTitle,
  metadata,
  filePath,
  // stories omitted - that's what failed
});
```

This allows the dashboard to show "Epic 2: BMAD File Parsing" even if story list parsing failed.

### kebab-case Title Conversion

For generating story keys from titles:

```typescript
/**
 * Convert title to kebab-case key
 * "Shared Types and Message Protocol" → "shared-types-and-message-protocol"
 */
function toKebabCase(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/-+/g, '-') // Collapse multiple dashes
    .replace(/^-|-$/g, ''); // Trim leading/trailing dashes
}

// Story key format: N-M-kebab-title
const storyKey = `${epicNum}-${storyNum}-${toKebabCase(title)}`;
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Parsing-Stack] - gray-matter library selection
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling] - ParseResult<T> pattern
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.3] - Acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md] - Real epic file structure reference
- [Source: src/shared/types/epic.ts] - Epic, EpicMetadata, EpicStoryEntry interfaces
- [Source: src/shared/types/parse-result.ts] - ParseResult<T> type and factory functions
- [Source: src/extension/parsers/sprint-status.ts] - Reference implementation pattern
- [Source: _bmad-output/implementation-artifacts/2-2-sprint-status-parser.md] - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No blocking issues encountered during implementation

### Completion Notes List

- ✅ Installed gray-matter v4.0.3 (note: @types/gray-matter doesn't exist as gray-matter ships its own types)
- ✅ Created epic-parser.ts following established patterns from sprint-status.ts
- ✅ Implemented parseEpic() with frontmatter extraction via gray-matter library
- ✅ Implemented story extraction from `### Story N.M: Title` headings with kebab-case key generation
- ✅ Implemented parseEpicFile() async wrapper with proper error handling (ENOENT, EACCES, EISDIR)
- ✅ All parsing functions return ParseResult<Epic> and never throw (NFR5 compliance)
- ✅ Partial data extraction on failure for graceful degradation (NFR7 compliance)
- ✅ Created comprehensive test suite with 29 passing tests
- ✅ Tests follow same pattern as sprint-status.test.ts (real filesystem operations, no mocking)
- ✅ All 158 tests pass (29 new + 129 existing)
- ✅ TypeScript type checking passes
- ✅ ESLint passes (after auto-fix for Prettier formatting)
- ✅ Build succeeds

### File List

**New Files:**

- src/extension/parsers/epic-parser.ts
- src/extension/parsers/epic-parser.test.ts

**Modified Files:**

- src/extension/parsers/index.ts (added epic-parser exports)
- package.json (added gray-matter dependency)
- pnpm-lock.yaml (updated with gray-matter and its dependencies)

### Senior Developer Review (AI)

**Reviewed:** 2026-01-29
**Reviewer:** Claude Opus 4.5 (Adversarial Code Review)

**Issues Found & Fixed:**

1. ✅ [MEDIUM] Documented magic number -20 in story content extraction
2. ✅ [MEDIUM] Added large file performance boundary test
3. ✅ [MEDIUM] Standardized error message format (all parse errors use "Epic parser:" prefix)
4. ✅ [MEDIUM] Added type re-exports to barrel (Epic, EpicMetadata, EpicStoryEntry)
5. ✅ [MEDIUM] Made filesystem test more robust with conditional skip
6. ✅ [LOW] Added JSDoc to internal helper functions (toKebabCase, extractEpicDescription, parseStoryEntries)

**Verification:**

- All 160+ tests passing
- TypeScript build clean
- ESLint clean

## Change Log

- 2026-01-29: Implemented Epic File Parser (Story 2.3) - Added parseEpic() and parseEpicFile() functions with comprehensive test coverage (29 tests)
- 2026-01-29: Code Review Fixes - Added JSDoc documentation, documented magic number, standardized error messages, added type re-exports, added performance tests (31 tests total)
