# Story 2.2: Sprint Status Parser

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want reliable parsing of sprint-status.yaml files,
So that the extension can extract workflow state for dashboard display.

## Acceptance Criteria

1. **Valid YAML Parsing**
   - **Given** a valid sprint-status.yaml file
   - **When** the parser processes it
   - **Then** it returns `ParseResult<SprintStatus>` with `success: true` and extracted data (FR6)

2. **Malformed/Missing File Handling**
   - **Given** a malformed or missing sprint-status.yaml file
   - **When** the parser processes it
   - **Then** it returns `ParseResult<SprintStatus>` with `success: false` and descriptive error message (FR10)
   - **And** the parser never throws an exception (NFR5)
   - **And** partial data is returned when possible for graceful degradation (NFR7)

3. **Comprehensive Unit Tests**
   - **Given** the sprint-status parser
   - **When** unit tests are run
   - **Then** tests cover valid YAML, invalid YAML, missing file, and partial data scenarios

## Tasks / Subtasks

- [x] Task 1: Create Sprint Status Parser Module (AC: #1, #2)
  - [x] 1.1: Create `src/extension/parsers/sprint-status.ts` with `parseSprintStatus()` function
  - [x] 1.2: Install `js-yaml` dependency via `pnpm add js-yaml` and `pnpm add -D @types/js-yaml`
  - [x] 1.3: Implement YAML parsing using js-yaml library
  - [x] 1.4: Return `ParseResult<SprintStatus>` using type guards from shared types
  - [x] 1.5: Never throw - wrap all operations in try/catch returning ParseFailure on error
  - [x] 1.6: Extract partial data when possible (e.g., project name even if development_status is malformed)

- [x] Task 2: Implement Content Validation (AC: #1, #2)
  - [x] 2.1: Validate required fields: generated, project, project_key, tracking_system, story_location, development_status
  - [x] 2.2: Validate development_status entries match expected key patterns (epic-N, N-N-name, epic-N-retrospective)
  - [x] 2.3: Validate status values are valid (EpicStatusValue, StoryStatusValue, RetrospectiveStatusValue)
  - [x] 2.4: Return descriptive error messages indicating which field failed validation
  - [x] 2.5: Support partial parsing - return valid fields even when some are invalid

- [x] Task 3: Create File Reading Wrapper (AC: #1, #2)
  - [x] 3.1: Create `parseSprintStatusFile(filePath: string)` function that reads file and parses content
  - [x] 3.2: Handle file not found gracefully with appropriate error message
  - [x] 3.3: Handle file read errors (permission denied, etc.) gracefully
  - [x] 3.4: Use Node.js fs/promises for async file reading

- [x] Task 4: Write Comprehensive Unit Tests (AC: #3)
  - [x] 4.1: Create `src/extension/parsers/sprint-status.test.ts`
  - [x] 4.2: Test valid YAML with all fields correctly formatted
  - [x] 4.3: Test invalid YAML syntax (malformed, missing colons, bad indentation)
  - [x] 4.4: Test missing required fields (each field individually)
  - [x] 4.5: Test invalid status values (e.g., "invalid-status")
  - [x] 4.6: Test invalid key patterns (e.g., "bad-key-format")
  - [x] 4.7: Test partial data extraction on partial failures
  - [x] 4.8: Test empty file
  - [x] 4.9: Test file with only comments
  - [x] 4.10: Use fixture data based on actual sprint-status.yaml structure

- [x] Task 5: Create Parser Barrel Export (AC: #1)
  - [x] 5.1: Create `src/extension/parsers/index.ts` barrel export
  - [x] 5.2: Export parseSprintStatus and parseSprintStatusFile functions

- [x] Task 6: Build and Lint Validation (AC: #1, #2, #3)
  - [x] 6.1: Run `pnpm typecheck:extension` and verify no type errors
  - [x] 6.2: Run `pnpm lint` and verify no linting errors
  - [x] 6.3: Run `pnpm test` and verify all tests pass
  - [x] 6.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and Story 2.1 learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `sprint-status.ts`, `sprint-status.test.ts`
   - WRONG: `SprintStatus.ts`, `sprintStatus.ts`

2. **Function Naming**: camelCase

   ```typescript
   export function parseSprintStatus(content: string): ParseResult<SprintStatus> { ... }
   export async function parseSprintStatusFile(filePath: string): Promise<ParseResult<SprintStatus>> { ... }
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm add js-yaml`
   - `pnpm add -D @types/js-yaml`
   - `pnpm build`, `pnpm test`, etc.

4. **Never Throw Pattern**: ParseResult<T> is MANDATORY
   - ALL parsing functions return `ParseResult<T>`
   - NEVER throw exceptions - wrap in try/catch
   - Use `parseSuccess()` and `parseFailure()` factory functions from shared types
   - This is CRITICAL for NFR5-7 (reliability requirements)

5. **Import Shared Types**:
   ```typescript
   import type { SprintStatus, ParseResult } from '@shared/types';
   import {
     parseSuccess,
     parseFailure,
     isEpicKey,
     isStoryKey,
     isRetrospectiveKey,
   } from '@shared/types';
   ```

### Technical Specifications

**Parsing Library: js-yaml**

- Use `yaml.load()` for parsing (NOT `yaml.safeLoad()` which is deprecated)
- Wrap in try/catch to handle YAML syntax errors
- Returns `unknown` type - must validate and type-narrow

**Expected SprintStatus Structure (from sprint-status.yaml):**

```yaml
generated: 2026-01-27
project: bmad-extension
project_key: bmad-extension
tracking_system: file-system
story_location: _bmad-output/implementation-artifacts

development_status:
  # Epic entries: epic-N
  epic-1: in-progress
  epic-2: backlog

  # Story entries: N-N-name
  1-1-project-initialization-from-starter-template: done
  1-2-test-framework-configuration: done

  # Retrospective entries: epic-N-retrospective
  epic-1-retrospective: optional
```

**Type Guards Available from Story 2.1:**

```typescript
// Key pattern validators
isEpicKey(key: string): boolean       // matches 'epic-N'
isStoryKey(key: string): boolean      // matches 'N-N-name'
isRetrospectiveKey(key: string): boolean  // matches 'epic-N-retrospective'

// Status value validators
isEpicStatus(status): status is EpicStatusValue
isStoryStatus(status): status is StoryStatusValue
isRetrospectiveStatus(status): status is RetrospectiveStatusValue

// Parse result helpers
parseSuccess<T>(data: T): ParseSuccess<T>
parseFailure<T>(error: string, partial?: Partial<T>): ParseFailure<T>
isParseSuccess<T>(result): result is ParseSuccess<T>
isParseFailure<T>(result): result is ParseFailure<T>
```

### Implementation Pattern

```typescript
import yaml from 'js-yaml';
import type { SprintStatus, ParseResult } from '@shared/types';
import {
  parseSuccess,
  parseFailure,
  isEpicKey,
  isStoryKey,
  isRetrospectiveKey,
} from '@shared/types';

/**
 * Parse sprint-status.yaml content into SprintStatus
 *
 * @param content - Raw YAML content as string
 * @returns ParseResult<SprintStatus> - never throws
 */
export function parseSprintStatus(content: string): ParseResult<SprintStatus> {
  try {
    // Parse YAML
    const raw = yaml.load(content);

    // Validate and type-narrow
    if (!raw || typeof raw !== 'object') {
      return parseFailure('Invalid YAML: expected object');
    }

    // Extract and validate fields...
    // Return parseSuccess(sprintStatus) or parseFailure(error, partial)
  } catch (error) {
    // Handle YAML syntax errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    return parseFailure(`YAML parse error: ${message}`);
  }
}
```

### Project Structure for Story 2.2

```
src/extension/parsers/
├── index.ts                  # NEW - Barrel export
├── sprint-status.ts          # NEW - Parser implementation
└── sprint-status.test.ts     # NEW - Unit tests
```

### Testing Requirements

**Test Framework**: Vitest (extension tests use Vitest, not @vscode/test-electron)

**Test File Location**: `src/extension/parsers/sprint-status.test.ts` (co-located)

**Fixture Pattern**:

```typescript
import { describe, it, expect } from 'vitest';
import { parseSprintStatus } from './sprint-status';

const VALID_SPRINT_STATUS = `
generated: 2026-01-27
project: test-project
project_key: test-project
tracking_system: file-system
story_location: _bmad-output/implementation-artifacts

development_status:
  epic-1: in-progress
  1-1-first-story: done
  1-2-second-story: backlog
  epic-1-retrospective: optional
`;

describe('parseSprintStatus', () => {
  it('parses valid sprint-status.yaml', () => {
    const result = parseSprintStatus(VALID_SPRINT_STATUS);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.project).toBe('test-project');
      expect(result.data.development_status['epic-1']).toBe('in-progress');
    }
  });

  it('returns failure for malformed YAML', () => {
    const result = parseSprintStatus('invalid: yaml: content:');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain('YAML');
    }
  });

  // More tests...
});
```

### Previous Story Intelligence (Story 2.1)

**Critical Learnings:**

1. **Type Guards Work**: Story 2.1 established `isEpicKey()`, `isStoryKey()`, `isRetrospectiveKey()` and status validators - USE THEM
2. **Factory Functions**: Use `parseSuccess()` and `parseFailure()` from `@shared/types` - don't construct objects manually
3. **Test Pattern**: 84 tests passed in Story 2.1 - follow same Vitest patterns
4. **TypeScript Boundary**: Parser is in extension context - can import from `@shared/types` but NOT from `src/webviews/`

**Stack Versions (from Story 2.1):**

- TypeScript 5.9.3
- Vitest 4.0.18
- pnpm (package manager)

### Git Intelligence

**Recent Commits:**

```
76f3a5f feat: 1-4-sidebar-panel-registration
cb6456f feat: 1-3-bmad-project-detection
b37f122 feat: 1-2-test-framework-configuration
560dade feat: 1-1-project-initialization-from-starter-template
```

**Commit Convention**: `feat: 2-2-sprint-status-parser`

### Epic 2 Context

This is Story 2.2 in Epic 2 (BMAD File Parsing & State Management). The parser created here will be used by:

- Story 2.5: File Watcher Service (triggers re-parse on file changes)
- Story 2.6: State Manager (aggregates parsed data into DashboardState)

**Parallel Development Note**: Stories 2.3 (Epic Parser), 2.4 (Story Parser), and 2.5 (File Watcher) can be developed in parallel with this story since they're independent.

### Dependencies to Install

```bash
pnpm add js-yaml
pnpm add -D @types/js-yaml
```

**Note**: Check if js-yaml is already installed before adding.

### Error Message Guidelines

Follow architecture pattern for error messages:

- Sentence case, user-friendly
- Include context: "Failed to parse sprint-status.yaml: missing required field 'project'"
- Never expose stack traces to UI
- Be specific: "Invalid status 'foo' for story '1-1-name', expected one of: backlog, ready-for-dev, in-progress, review, done"

### Graceful Degradation (NFR7)

When partial data is available, return it:

```typescript
// If development_status is malformed but header fields are valid:
return parseFailure('Invalid development_status: expected object', {
  generated: raw.generated,
  project: raw.project,
  project_key: raw.project_key,
  tracking_system: raw.tracking_system,
  story_location: raw.story_location,
  // development_status omitted - that's what failed
});
```

This allows the dashboard to show "Project: bmad-extension" even if story status parsing failed.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Parsing-Stack] - js-yaml library selection
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling] - ParseResult<T> pattern
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.2] - Acceptance criteria
- [Source: _bmad-output/implementation-artifacts/sprint-status.yaml] - Real sprint-status.yaml structure
- [Source: src/shared/types/sprint-status.ts] - SprintStatus interface and type guards
- [Source: src/shared/types/parse-result.ts] - ParseResult<T> type and factory functions
- [Source: _bmad-output/implementation-artifacts/2-1-shared-types-and-message-protocol.md] - Previous story learnings

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation proceeded without issues.

### Completion Notes List

- Implemented `parseSprintStatus()` function that parses YAML content and validates against SprintStatus type
- Implemented `parseSprintStatusFile()` async wrapper for reading files from disk
- Added special handling for js-yaml's Date parsing (bare dates like `2026-01-27` are parsed as Date objects)
- Created comprehensive validation for all status types (epic, story, retrospective)
- Partial data extraction implemented - returns valid fields even when some validation fails
- 45 unit tests covering all acceptance criteria scenarios (increased from 36 after code review)
- Updated vitest.config.ts to include parser tests (extension/parsers uses Vitest, not @vscode/test-electron)
- Added path aliases to tsconfig.extension.json for @shared/\* imports
- All 129 project tests pass, lint passes, build passes

### File List

**New Files:**

- src/extension/parsers/sprint-status.ts - Sprint status YAML parser implementation
- src/extension/parsers/sprint-status.test.ts - 45 comprehensive unit tests

**Modified Files:**

- src/extension/parsers/index.ts - Updated barrel export with parser functions
- src/shared/types/sprint-status.ts - Updated type guards to accept string input for flexible validation
- package.json - Added js-yaml dependency
- pnpm-lock.yaml - Lock file updated
- tsconfig.extension.json - Added baseUrl and @shared/\* path alias
- vitest.config.ts - Updated to include extension/parsers tests
- \_bmad-output/implementation-artifacts/sprint-status.yaml - Status updated to review

## Change Log

| Date       | Change                                                                                                               | Author          |
| ---------- | -------------------------------------------------------------------------------------------------------------------- | --------------- |
| 2026-01-29 | Code review fixes: Updated type guards to accept string, added 9 new tests for file reading and interleaved comments | Claude Opus 4.5 |
| 2026-01-29 | Story implementation complete - Sprint status parser with full validation and 36 tests                               | Claude Opus 4.5 |
