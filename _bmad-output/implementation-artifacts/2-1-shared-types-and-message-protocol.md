# Story 2.1: Shared Types and Message Protocol

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want shared TypeScript types for BMAD data structures and the message protocol,
So that type safety is enforced across extension host and webview boundaries.

## Acceptance Criteria

1. **Shared BMAD Data Types Created**
   - **Given** the project structure from Epic 1
   - **When** shared types are created
   - **Then** `/src/shared/types/` contains interfaces for SprintStatus, Epic, Story, and ParseResult<T>

2. **Message Protocol Types Defined**
   - **Given** the shared types module
   - **When** message types are created
   - **Then** `/src/shared/messages.ts` contains ToWebview and ToExtension discriminated union types
   - **And** All message types use SCREAMING_SNAKE_CASE naming convention

3. **TypeScript Boundary Enforcement**
   - **Given** the separate tsconfig files for extension and webview
   - **When** TypeScript compilation runs
   - **Then** compilation fails if webview imports from extension directory or vice versa
   - **And** both contexts can import from `/src/shared/` without errors

## Tasks / Subtasks

- [x] Task 1: Create BMAD Data Type Interfaces (AC: #1)
  - [x] 1.1: Create `src/shared/types/sprint-status.ts` with `SprintStatus` interface matching sprint-status.yaml structure
  - [x] 1.2: Create `src/shared/types/epic.ts` with `Epic` interface for epic frontmatter and metadata
  - [x] 1.3: Create `src/shared/types/story.ts` with `Story` interface for story frontmatter and task tracking
  - [x] 1.4: Create `src/shared/types/parse-result.ts` with `ParseResult<T>` discriminated union type
  - [x] 1.5: Create `src/shared/types/dashboard-state.ts` with `DashboardState` interface aggregating all state
  - [x] 1.6: Update `src/shared/types/index.ts` barrel export to export all new types

- [x] Task 2: Create Message Protocol Types (AC: #2)
  - [x] 2.1: Replace placeholder content in `src/shared/messages.ts` with full message protocol
  - [x] 2.2: Define `ToWebview` discriminated union with STATE_UPDATE, DOCUMENT_CONTENT, ERROR message types
  - [x] 2.3: Define `ToExtension` discriminated union with OPEN_DOCUMENT, EXECUTE_WORKFLOW, COPY_COMMAND, REFRESH message types
  - [x] 2.4: Add type guard functions for message type narrowing (e.g., `isStateUpdateMessage()`)
  - [x] 2.5: Ensure all message types use SCREAMING_SNAKE_CASE naming

- [x] Task 3: Write Unit Tests for Types (AC: #1, #2)
  - [x] 3.1: Create `src/shared/types/parse-result.test.ts` testing ParseResult type guards
  - [x] 3.2: Create `src/shared/messages.test.ts` testing message type guards
  - [x] 3.3: Test type narrowing works correctly with discriminated unions
  - [x] 3.4: Run `pnpm test` and verify all tests pass

- [x] Task 4: Verify TypeScript Boundary Enforcement (AC: #3)
  - [x] 4.1: Run `pnpm typecheck:extension` and verify shared types are accessible
  - [x] 4.2: Run `pnpm typecheck:webview` and verify shared types are accessible
  - [x] 4.3: Verify `tsconfig.extension.json` excludes `src/webviews/**/*`
  - [x] 4.4: Verify `tsconfig.webview.json` excludes `src/extension/**/*`

- [x] Task 5: Build and Lint Validation (AC: #1, #2, #3)
  - [x] 5.1: Run `pnpm build` and verify no compilation errors
  - [x] 5.2: Run `pnpm lint` and verify no linting errors
  - [x] 5.3: Run `pnpm typecheck` and verify no type errors
  - [x] 5.4: Run `pnpm test` and verify all tests pass

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `sprint-status.ts`, `parse-result.ts`, `dashboard-state.ts`
   - WRONG: `SprintStatus.ts`, `ParseResult.ts`

2. **Type/Interface Naming**: PascalCase

   ```typescript
   export interface SprintStatus { ... }
   export type ParseResult<T> = { ... }
   ```

3. **Message Type Constants**: SCREAMING_SNAKE_CASE

   ```typescript
   type: 'STATE_UPDATE';
   type: 'OPEN_DOCUMENT';
   type: 'EXECUTE_WORKFLOW';
   ```

4. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, etc.

5. **Never Throw Pattern**: ParseResult<T> is the foundation for Epic 2 parsers
   - Parsers return `ParseResult<T>` instead of throwing exceptions
   - This is CRITICAL for NFR5-7 (reliability requirements)

### Technical Specifications

**ParseResult<T> Pattern (Architecture Doc Section: Error Handling):**

```typescript
type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; partial?: Partial<T> };
```

This discriminated union enables:

- Type narrowing after checking `success` property
- Partial data recovery for graceful degradation (NFR7)
- No exceptions in parsing code (NFR5)

**DashboardState Interface (Architecture Doc Section: State Management):**

```typescript
interface DashboardState {
  sprint: SprintStatus | null;
  epics: Epic[];
  currentStory: Story | null;
  errors: ParseError[];
  loading: boolean;
}
```

**Message Protocol (Architecture Doc Section: Message Protocol):**

Extension → Webview (ToWebview):

```typescript
type ToWebview =
  | { type: 'STATE_UPDATE'; payload: DashboardState }
  | { type: 'DOCUMENT_CONTENT'; payload: { path: string; content: string; frontmatter: unknown } }
  | { type: 'ERROR'; payload: { message: string; recoverable: boolean } };
```

Webview → Extension (ToExtension):

```typescript
type ToExtension =
  | { type: 'OPEN_DOCUMENT'; payload: { path: string } }
  | { type: 'EXECUTE_WORKFLOW'; payload: { command: string } }
  | { type: 'COPY_COMMAND'; payload: { command: string } }
  | { type: 'REFRESH' };
```

### BMAD File Structures to Model

**sprint-status.yaml Structure:**

```yaml
generated: 2026-01-27
project: bmad-extension
project_key: bmad-extension
tracking_system: file-system
story_location: _bmad-output/implementation-artifacts

development_status:
  epic-1: in-progress
  1-1-story-name: done
  1-2-story-name: ready-for-dev
  # etc.
```

Key fields for SprintStatus interface:

- `generated`: Date string
- `project`: Project name
- `project_key`: Unique identifier
- `tracking_system`: 'file-system' literal
- `story_location`: Path to story files
- `development_status`: Record<string, EpicStatus | StoryStatus>

**Epic Status Values:**

- `backlog`, `in-progress`, `done`

**Story Status Values:**

- `backlog`, `ready-for-dev`, `in-progress`, `review`, `done`

**Epic File Frontmatter (epic-\*.md):**

```yaml
---
stepsCompleted: [...]
inputDocuments: [...]
---
```

The epic content itself contains:

- Epic title (H2 heading)
- Epic description
- Story list with acceptance criteria

**Story File Frontmatter:**

```yaml
---
status: ready-for-dev | in-progress | review | done
---
```

Story content contains:

- User story statement
- Acceptance criteria
- Tasks with checkbox completion status `- [ ]` or `- [x]`

### Project Structure for Story 2.1

```
src/shared/
├── types/
│   ├── index.ts              # Barrel export (EXISTS - update)
│   ├── sprint-status.ts      # NEW - SprintStatus interface
│   ├── epic.ts               # NEW - Epic interface
│   ├── story.ts              # NEW - Story interface
│   ├── parse-result.ts       # NEW - ParseResult<T> type
│   ├── parse-result.test.ts  # NEW - Type guard tests
│   └── dashboard-state.ts    # NEW - DashboardState interface
└── messages.ts               # EXISTS - Replace placeholder with full protocol
└── messages.test.ts          # NEW - Message type guard tests
```

### Previous Story Intelligence (Epic 1)

**Critical Learnings from Story 1.4:**

1. **TypeScript Boundary Enforcement Already Works**: The tsconfig files correctly separate extension and webview contexts:
   - `tsconfig.extension.json` includes `src/extension/**/*` and `src/shared/**/*`
   - `tsconfig.webview.json` includes `src/webviews/**/*` and `src/shared/**/*`
   - Both exclude the other's directory

2. **Existing Shared Module Structure**:
   - `src/shared/types/index.ts` exists but only re-exports messages
   - `src/shared/messages.ts` has placeholder content with `BaseMessage` interface

3. **Test Pattern Established**: Use Vitest with pattern `*.test.ts` co-located with source

4. **Package Manager**: Project uses pnpm exclusively

**Stack Versions (from Story 1.4):**

- TypeScript 5.9.3
- React 19.2.4
- Zustand 5.0.10
- Vitest 4.0.18

**Existing DetectionResult Pattern (from bmad-detector.ts):**
The existing code uses a discriminated union pattern that should be consistent with ParseResult:

```typescript
export type DetectionResult =
  | { detected: true; bmadRoot: vscode.Uri; outputRoot: vscode.Uri | null }
  | {
      detected: false;
      reason: 'no-workspace' | 'not-found' | 'not-directory' | 'error';
      message?: string;
    };
```

This validates the discriminated union approach is already used in the codebase.

### Git Intelligence

**Recent Commits:**

```
76f3a5f feat: 1-4-sidebar-panel-registration
cb6456f feat: 1-3-bmad-project-detection
3817979 chore: BMAD udpdate
b37f122 feat: 1-2-test-framework-configuration
560dade feat: 1-1-project-initialization-from-starter-template
```

**Commit Convention**: `feat: 2-1-shared-types-and-message-protocol`

### Epic 2 Context

This is the **first story in Epic 2** (BMAD File Parsing & State Management). The types created here will be used by:

- Story 2.2: Sprint Status Parser (uses SprintStatus, ParseResult)
- Story 2.3: Epic File Parser (uses Epic, ParseResult)
- Story 2.4: Story File Parser (uses Story, ParseResult)
- Story 2.5: File Watcher Service (triggers re-parse)
- Story 2.6: State Manager (uses DashboardState, message protocol)

**Dependency Note**: Stories 2.2, 2.3, 2.4, and 2.5 can be developed in parallel AFTER this story completes because they all depend on the shared types.

### Testing Requirements

**Test Framework**: Vitest (shared types can be tested with Vitest since they're pure TypeScript)

**Test Focus**: Type guards and discriminated union narrowing

**Example Test Pattern:**

```typescript
import { describe, it, expect } from 'vitest';
import type { ParseResult } from './parse-result';
import { isParseSuccess, isParseError } from './parse-result';

describe('ParseResult type guards', () => {
  it('narrows success result correctly', () => {
    const result: ParseResult<string> = { success: true, data: 'test' };
    if (isParseSuccess(result)) {
      // TypeScript knows result.data exists here
      expect(result.data).toBe('test');
    }
  });

  it('narrows error result correctly', () => {
    const result: ParseResult<string> = { success: false, error: 'failed' };
    if (isParseError(result)) {
      // TypeScript knows result.error exists here
      expect(result.error).toBe('failed');
    }
  });
});
```

### File Structure Requirements

**Files to Create:**

```
src/shared/types/sprint-status.ts      # SprintStatus, EpicStatusValue, StoryStatusValue
src/shared/types/epic.ts               # Epic, EpicMetadata
src/shared/types/story.ts              # Story, StoryTask
src/shared/types/parse-result.ts       # ParseResult<T>, ParseError, type guards
src/shared/types/parse-result.test.ts  # Type guard tests
src/shared/types/dashboard-state.ts    # DashboardState
src/shared/messages.test.ts            # Message type guard tests
```

**Files to Modify:**

```
src/shared/types/index.ts              # Update barrel exports
src/shared/messages.ts                 # Replace placeholder with full protocol
```

**Files NOT to Modify:**

```
src/extension/**/*                     # No extension code changes
src/webviews/**/*                      # No webview code changes
package.json                           # No new dependencies needed
```

### Implementation Notes

**Type Safety Priority**: This story establishes the type foundation for the entire Epic 2 parsing system. The types MUST be:

- Accurate to actual BMAD file structures
- Flexible enough to handle schema variations (graceful degradation)
- Include `partial` field in ParseResult for partial data recovery

**No VS Code API Usage**: All types in `/src/shared/` must be pure TypeScript without VS Code API imports. The extension context uses `vscode.Uri` but shared types should use `string` for paths.

**Serialization Consideration**: All shared types must be JSON-serializable since they cross the postMessage boundary. No `Date` objects, `Map`, `Set`, or functions in type definitions.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling] - ParseResult<T> pattern definition
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management] - DashboardState interface
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - ToWebview and ToExtension types
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-&-Consistency-Rules] - Naming conventions
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.1] - Acceptance criteria
- [Source: _bmad-output/implementation-artifacts/sprint-status.yaml] - Real sprint-status.yaml structure reference
- [Source: src/extension/services/bmad-detector.ts] - Existing discriminated union pattern
- [Source: src/shared/messages.ts] - Placeholder to replace
- [Web: TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html) - TypeScript handbook reference

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No debug issues encountered during implementation

### Completion Notes List

- Created comprehensive BMAD data type interfaces following architecture specifications
- Implemented ParseResult<T> discriminated union with type guards and factory functions for "never throw" pattern
- Created SprintStatus interface with status value types (EpicStatusValue, StoryStatusValue, RetrospectiveStatusValue)
- Created Epic interface with EpicMetadata and EpicStoryEntry types
- Created Story interface with StoryTask, StorySubtask, and AcceptanceCriterion types
- Created DashboardState interface aggregating all state types
- Implemented full message protocol with ToWebview and ToExtension discriminated unions
- Added type guard functions for all message types (isStateUpdateMessage, isDocumentContentMessage, etc.)
- Added factory functions for creating messages (createStateUpdateMessage, createErrorMessage, etc.)
- All message types use SCREAMING_SNAKE_CASE naming convention as required
- Created comprehensive unit tests (46 new tests) for ParseResult and message type guards
- All 55 tests pass (including 9 pre-existing tests)
- TypeScript boundary enforcement verified - shared types accessible from both extension and webview contexts
- All types are JSON-serializable (no Date objects, Map, Set, or functions)
- No VS Code API imports in shared types (pure TypeScript)

### File List

**Files Created:**

- src/shared/types/sprint-status.ts
- src/shared/types/sprint-status.test.ts
- src/shared/types/epic.ts
- src/shared/types/story.ts
- src/shared/types/story.test.ts
- src/shared/types/parse-result.ts
- src/shared/types/parse-result.test.ts
- src/shared/types/dashboard-state.ts
- src/shared/messages.test.ts

**Files Modified:**

- src/shared/types/index.ts (updated barrel exports)
- src/shared/messages.ts (replaced placeholder with full message protocol)

### Change Log

- 2026-01-28: Story 2.1 implementation complete - Shared types and message protocol established
- 2026-01-28: Code review fixes applied - Added 29 new tests, improved JSDoc, fixed barrel export architecture

## Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.5
**Date:** 2026-01-28
**Outcome:** APPROVED (after fixes)

### Review Summary

All acceptance criteria verified as implemented. Code review identified 1 HIGH, 4 MEDIUM, and 2 LOW issues - all HIGH and MEDIUM issues fixed during review.

### Issues Found and Resolved

| ID  | Severity | Issue                                                               | Resolution                                                            |
| --- | -------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| H1  | HIGH     | Barrel export re-exported messages, creating architectural coupling | Removed `export * from '../messages'` from types/index.ts             |
| M2  | MEDIUM   | Type guard JSDoc was misleading about semantic behavior             | Added clarifying JSDoc explaining guards check validity, not identity |
| M3  | MEDIUM   | Missing tests for sprint-status type guards (6 functions untested)  | Added sprint-status.test.ts with 20 tests                             |
| M4  | MEDIUM   | Missing tests for calculateStoryProgress                            | Added story.test.ts with 9 tests                                      |

### Test Coverage After Review

- **Before:** 55 tests passing
- **After:** 84 tests passing (+29 tests)
- All typecheck passes
- All lint passes

### Verification

```
pnpm test    → 84 passed (6 test files)
pnpm typecheck → extension ✓, webview ✓
pnpm lint    → 0 errors
```
