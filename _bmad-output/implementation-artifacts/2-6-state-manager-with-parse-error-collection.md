# Story 2.6: State Manager with Parse Error Collection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a centralized state manager that aggregates parsed data and collects errors,
So that the dashboard displays consistent state and parsing warnings.

## Acceptance Criteria

1. **State Aggregation**
   - **Given** parsed data from all parsers (sprint status, epics, stories)
   - **When** the state manager aggregates results
   - **Then** it maintains a single `DashboardState` containing sprint, epics, currentStory, errors, and loading status

2. **Parse Error Collection**
   - **Given** parsers return errors
   - **When** the state manager processes results
   - **Then** errors are collected in the `errors` array for UI display (FR11)
   - **And** partial data is still available for graceful degradation (NFR7)

3. **Webview Notification**
   - **Given** file changes trigger re-parsing
   - **When** new parse results are available
   - **Then** the state manager notifies all active webviews via postMessage
   - **And** error state clears on next successful parse

4. **File Watcher Integration**
   - **Given** the FileWatcher emits a change event
   - **When** the state manager receives it
   - **Then** it re-parses only the affected files (selective re-parsing)
   - **And** updates the aggregated state accordingly

5. **Initial Load**
   - **Given** the extension activates in a BMAD workspace
   - **When** the state manager initializes
   - **Then** it performs a full parse of all BMAD artifacts
   - **And** sets `loading: false` when initial parse completes

## Tasks / Subtasks

- [ ] Task 1: Create StateManager Service Class (AC: #1, #5)
  - [ ] 1.1: Create `src/extension/services/state-manager.ts` with `StateManager` class
  - [ ] 1.2: Implement `vscode.Disposable` interface for proper cleanup
  - [ ] 1.3: Inject dependencies: `BmadDetector`, `FileWatcher` services
  - [ ] 1.4: Create private `_state: DashboardState` property initialized with `createInitialDashboardState()`
  - [ ] 1.5: Create private `_parsedStories: Map<string, Story>` for internal story tracking (not exposed in DashboardState)
  - [ ] 1.6: Expose read-only `state` getter for current state access
  - [ ] 1.7: Create `initialize()` method that performs full initial parse
  - [ ] 1.8: Add `_initializing: boolean` flag to prevent race conditions during init
  - [ ] 1.9: Create `dispose()` method for cleanup

- [ ] Task 2: Implement Full Parse Logic (AC: #1, #2)
  - [ ] 2.1: Create private `parseAll()` method that parses all BMAD artifacts
  - [ ] 2.2: Use `vscode.workspace.fs.readFile()` to read files (NOT Node.js fs)
  - [ ] 2.3: Call `parseSprintStatusFile()` for `_bmad-output/implementation-artifacts/sprint-status.yaml`
  - [ ] 2.4: Glob for epic files (`_bmad-output/planning-artifacts/epics.md`) and call `parseEpicFile()` for each
  - [ ] 2.5: Glob for story files (`_bmad-output/implementation-artifacts/*.md`) and call `parseStoryFile()` for each
  - [ ] 2.6: Filter story files: only parse files matching pattern `X-Y-*.md` (e.g., `2-6-state-manager.md`), exclude other .md files
  - [ ] 2.7: Store parsed stories in `_parsedStories` Map keyed by story key (e.g., "2-6-state-manager")
  - [ ] 2.8: Set `loading: false` after parse completes
  - [ ] 2.9: Use immutable state updates: `this._state = { ...this._state, sprint: result.data }`

- [ ] Task 3: Implement Error Collection (AC: #2)
  - [ ] 3.1: Create private `collectError()` method that adds a `ParseError` to state
  - [ ] 3.2: Convert `ParseFailure` results to `ParseError` objects with filePath context
  - [ ] 3.3: Deduplicate errors by filePath - replace existing error for same file instead of accumulating
  - [ ] 3.4: Clear error for a specific file on successful re-parse of that file
  - [ ] 3.5: Support partial data extraction from failed parses where available

- [ ] Task 4: Determine Current Story Logic (AC: #1)
  - [ ] 4.1: Create private `determineCurrentStory()` method
  - [ ] 4.2: From sprint status, find the first story with status `in-progress` or `ready-for-dev`
  - [ ] 4.3: Match story key to `_parsedStories` Map (internal, not DashboardState)
  - [ ] 4.4: Set `_state.currentStory` to matched story or null

- [ ] Task 5: Implement Webview Notification (AC: #3)
  - [ ] 5.1: Create VS Code `EventEmitter<DashboardState>` for state change events
  - [ ] 5.2: Expose `onStateChange` event for webview providers to subscribe
  - [ ] 5.3: Fire event after every state update with full state snapshot
  - [ ] 5.4: Create `notifyWebviews()` method (placeholder for Epic 3 integration)

- [ ] Task 6: Implement File Watcher Integration (AC: #4)
  - [ ] 6.1: Subscribe to `FileWatcher.onDidChange` in `initialize()`
  - [ ] 6.2: Create `handleFileChanges(event: FileChangeEvent)` method
  - [ ] 6.3: If `_initializing` is true, queue file changes and process after init completes
  - [ ] 6.4: Categorize changed files: sprint-status.yaml, epic files, story files
  - [ ] 6.5: Re-parse only changed files (selective re-parsing)
  - [ ] 6.6: Handle file deletions by removing data from state and `_parsedStories` Map
  - [ ] 6.7: Handle file creations by parsing new files
  - [ ] 6.8: Subscribe to `FileWatcher.onError` and add to errors array

- [ ] Task 7: Implement Manual Refresh (AC: #3)
  - [ ] 7.1: Create public `refresh()` method that triggers full re-parse
  - [ ] 7.2: Set `loading: true` during refresh
  - [ ] 7.3: Clear all errors before re-parse
  - [ ] 7.4: Fire state change event when refresh completes

- [ ] Task 8: Write Comprehensive Unit Tests (AC: #1, #2, #3, #4, #5)
  - [ ] 8.1: Create `src/extension/services/state-manager.test.ts`
  - [ ] 8.2: Test initial state matches `createInitialDashboardState()`
  - [ ] 8.3: Test `initialize()` performs full parse and sets loading to false
  - [ ] 8.4: Test successful parse populates sprint, epics, currentStory
  - [ ] 8.5: Test parse errors are collected in errors array
  - [ ] 8.6: Test error deduplication - same file error replaces previous error
  - [ ] 8.7: Test partial data is available when parse fails
  - [ ] 8.8: Test `onStateChange` event fires after state updates
  - [ ] 8.9: Test file watcher integration triggers selective re-parse
  - [ ] 8.10: Test file deletion removes data from state
  - [ ] 8.11: Test file creation adds data to state
  - [ ] 8.12: Test `refresh()` clears errors and re-parses all files
  - [ ] 8.13: Test error recovery on subsequent successful parse
  - [ ] 8.14: Test FileWatcher event during `initialize()` is queued and processed after init
  - [ ] 8.15: Test story file filtering - only X-Y-\*.md files are parsed as stories
  - [ ] 8.16: Mock VS Code APIs (workspace.fs, FileSystemWatcher)

- [ ] Task 9: Update Services Barrel Export (AC: #1)
  - [ ] 9.1: Update `src/extension/services/index.ts` to export StateManager class
  - [ ] 9.2: Export any new types (if needed)

- [ ] Task 10: Build and Lint Validation (AC: #1, #2, #3, #4, #5)
  - [ ] 10.1: Run `pnpm typecheck:extension` and verify no type errors
  - [ ] 10.2: Run `pnpm lint` and verify no linting errors
  - [ ] 10.3: Run `pnpm test` and verify all tests pass
  - [ ] 10.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `state-manager.ts`, `state-manager.test.ts`
   - WRONG: `StateManager.ts`, `stateManager.ts`

2. **Class/Function Naming**: PascalCase for classes, camelCase for functions

   ```typescript
   export class StateManager implements vscode.Disposable { ... }
   public initialize(): Promise<void> { ... }
   private parseAll(): Promise<void> { ... }
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, etc.

4. **VS Code API Usage**: Use `vscode.workspace.fs` (NOT Node.js fs module)
   - Ensures remote development compatibility
   - See existing `BmadDetector` service for reference pattern

5. **Event Emitter Pattern**: Use VS Code's `EventEmitter` class

   ```typescript
   import * as vscode from 'vscode';

   private readonly _onStateChange = new vscode.EventEmitter<DashboardState>();
   public readonly onStateChange = this._onStateChange.event;
   ```

6. **Disposable Pattern**: Implement `vscode.Disposable` interface

   ```typescript
   export class StateManager implements vscode.Disposable {
     private disposables: vscode.Disposable[] = [];

     public dispose(): void {
       this.disposables.forEach((d) => d.dispose());
       this.disposables = [];
     }
   }
   ```

7. **ParseResult Pattern**: Never throw from parsing - use result pattern
   ```typescript
   const result = await parseSprintStatusFile(filePath);
   if (result.success) {
     this._state.sprint = result.data;
   } else {
     this._state.errors.push({
       message: result.error,
       filePath: filePath.fsPath,
       recoverable: true,
     });
     // Use partial data if available
     if (result.partial) {
       this._state.sprint = result.partial as SprintStatus;
     }
   }
   ```

### Technical Specifications

**State Manager Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                     StateManager                            │
├─────────────────────────────────────────────────────────────┤
│  Dependencies:                                              │
│  - BmadDetector (provides paths)                            │
│  - FileWatcher (provides change events)                     │
│  - Parsers (sprint-status, epic, story)                     │
├─────────────────────────────────────────────────────────────┤
│  Internal State:                                            │
│  - _state: DashboardState (exposed via getter)              │
│  - _parsedStories: Map<string, Story> (internal only)       │
│  - _initializing: boolean (race condition guard)            │
│  - _pendingChanges: FileChangeEvent[] (queued during init)  │
│  - _onStateChange: EventEmitter<DashboardState>             │
├─────────────────────────────────────────────────────────────┤
│  Public API:                                                │
│  + initialize(): Promise<void>                              │
│  + refresh(): Promise<void>                                 │
│  + state: DashboardState (getter)                           │
│  + onStateChange: Event<DashboardState>                     │
│  + dispose(): void                                          │
├─────────────────────────────────────────────────────────────┤
│  Private Methods:                                           │
│  - parseAll(): Promise<void>                                │
│  - handleFileChanges(event: FileChangeEvent): Promise<void> │
│  - processPendingChanges(): Promise<void>                   │
│  - determineCurrentStory(): void                            │
│  - collectError(error: ParseError): void                    │
│  - clearErrorForFile(filePath: string): void                │
│  - notifyWebviews(): void                                   │
│  - isStoryFile(filePath: string): boolean                   │
└─────────────────────────────────────────────────────────────┘
```

**CRITICAL: Internal vs Exposed State**

The `DashboardState` interface does NOT include a `stories` array - only `currentStory`. The StateManager maintains an internal `_parsedStories: Map<string, Story>` for story lookup that is NOT exposed to webviews. This keeps the message payload small and focused.

```typescript
// DashboardState (exposed to webviews via postMessage)
interface DashboardState {
  sprint: SprintStatus | null;
  epics: Epic[];
  currentStory: Story | null;  // Only the active story
  errors: ParseError[];
  loading: boolean;
}

// Internal to StateManager (NOT in DashboardState)
private _parsedStories: Map<string, Story> = new Map();
```

**File Path Patterns**

```typescript
// Sprint status (single file)
const sprintStatusPath = 'implementation-artifacts/sprint-status.yaml';

// Epic files (pattern)
const epicPattern = 'planning-artifacts/epics.md';

// Story files (pattern) - MUST validate filename format
const storyPattern = 'implementation-artifacts/*.md';

// Story file validation regex - only files matching X-Y-name.md are stories
const STORY_FILE_REGEX = /^\d+-\d+-[\w-]+\.md$/;

function isStoryFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return STORY_FILE_REGEX.test(fileName);
}

// Examples:
// '2-6-state-manager-with-parse-error-collection.md' → true (story)
// 'sprint-status.yaml' → false (not .md)
// 'readme.md' → false (doesn't match X-Y-name pattern)
// 'notes.md' → false (doesn't match X-Y-name pattern)
```

**Race Condition Prevention**

```typescript
private _initializing = false;
private _pendingChanges: FileChangeEvent[] = [];

async initialize(): Promise<void> {
  this._initializing = true;
  try {
    await this.parseAll();
  } finally {
    this._initializing = false;
    // Process any changes that arrived during initialization
    await this.processPendingChanges();
  }
}

async handleFileChanges(event: FileChangeEvent): Promise<void> {
  // Queue changes if still initializing
  if (this._initializing) {
    this._pendingChanges.push(event);
    return;
  }
  // ... process changes
}

private async processPendingChanges(): Promise<void> {
  while (this._pendingChanges.length > 0) {
    const event = this._pendingChanges.shift()!;
    await this.handleFileChanges(event);
  }
}
```

**Selective Re-parsing Logic**

```typescript
async handleFileChanges(event: FileChangeEvent): Promise<void> {
  // Queue if initializing (see above)
  if (this._initializing) {
    this._pendingChanges.push(event);
    return;
  }

  for (const [filePath, changeType] of event.changes) {
    if (changeType === 'delete') {
      this.removeFromState(filePath);
    } else {
      // 'create' or 'change'
      if (filePath.endsWith('sprint-status.yaml')) {
        await this.parseSprintStatus(filePath);
      } else if (filePath.includes('epics')) {
        await this.parseEpic(filePath);
      } else if (this.isStoryFile(filePath)) {
        // Only parse files matching X-Y-name.md pattern
        await this.parseStory(filePath);
      }
      // Other .md files are ignored (not stories)
    }
  }
  this.determineCurrentStory();
  this.notifyWebviews();
}
```

**Current Story Determination Algorithm**

```typescript
determineCurrentStory(): void {
  if (!this._state.sprint) {
    this._state = { ...this._state, currentStory: null };
    return;
  }

  // Find first story with status 'in-progress' or 'ready-for-dev'
  const activeStatuses = ['in-progress', 'ready-for-dev'];
  const entries = Object.entries(this._state.sprint.developmentStatus);

  for (const [key, status] of entries) {
    // Skip epic entries (epic-X) and retrospectives
    if (key.startsWith('epic-') || key.includes('retrospective')) {
      continue;
    }

    if (activeStatuses.includes(status)) {
      // Find matching story in INTERNAL _parsedStories map (NOT DashboardState)
      const story = this._parsedStories.get(key);
      if (story) {
        this._state = { ...this._state, currentStory: story };
        return;
      }
    }
  }

  this._state = { ...this._state, currentStory: null };
}
```

**Error Deduplication Logic**

```typescript
// Errors are keyed by filePath to prevent accumulation
private collectError(error: ParseError): void {
  // Remove any existing error for this file
  const errors = this._state.errors.filter(e => e.filePath !== error.filePath);
  // Add the new error
  this._state = { ...this._state, errors: [...errors, error] };
}

private clearErrorForFile(filePath: string): void {
  const errors = this._state.errors.filter(e => e.filePath !== filePath);
  if (errors.length !== this._state.errors.length) {
    this._state = { ...this._state, errors };
  }
}
```

**Immutable State Updates**

Always use spread operator for state updates to prevent mutation bugs and enable easier debugging:

```typescript
// CORRECT: Immutable update
this._state = { ...this._state, sprint: result.data };

// WRONG: Direct mutation
this._state.sprint = result.data; // Don't do this!
```

### Party Mode Validation

**Review Participants:** Winston (Architect), Amelia (Developer), Quinn (QA Engineer)

**Issues Identified and Resolved:**

| Issue                                | Severity | Resolution                                                                        |
| ------------------------------------ | -------- | --------------------------------------------------------------------------------- |
| No `stories` array in DashboardState | **High** | Added internal `_parsedStories: Map<string, Story>` - only `currentStory` exposed |
| Race condition: init + file change   | Medium   | Added `_initializing` flag and `_pendingChanges` queue                            |
| Error deduplication                  | Medium   | Errors keyed by filePath, replaced not accumulated                                |
| Story file exclusion pattern         | Low      | Added `isStoryFile()` with regex `^\d+-\d+-[\w-]+\.md$`                           |
| Missing race condition tests         | Medium   | Added tests 8.14-8.16 for concurrency and filtering                               |
| State mutation risk                  | Low      | Documented immutable update pattern with spread operator                          |

**Key Design Decisions Validated:**

- Extension host remains single source of truth (Architecture compliant)
- Internal `_parsedStories` map keeps DashboardState payload minimal
- Immutable state updates prevent accidental mutations
- FileWatcher debounce (500ms) handles rapid changes; StateManager queues during init

### Project Structure Notes

**Files to Create:**

- `src/extension/services/state-manager.ts` - Main service implementation
- `src/extension/services/state-manager.test.ts` - Unit tests

**Files to Modify:**

- `src/extension/services/index.ts` - Add exports

**Dependencies (already exist - no new npm packages needed):**

- `BmadDetector` service (Story 1.3) - provides BMAD paths
- `FileWatcher` service (Story 2.5) - provides file change events
- Parser modules (Stories 2.2-2.4) - parse BMAD files
- Shared types (Story 2.1) - `DashboardState`, `ParseError`, etc.

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management] - Zustand for webviews, extension host as single source of truth
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling] - ParseResult pattern, graceful degradation
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.6] - Acceptance criteria
- [Source: src/extension/services/file-watcher.ts] - FileWatcher service implementation
- [Source: src/extension/services/bmad-detector.ts] - BmadDetector service pattern
- [Source: src/extension/parsers/index.ts] - Available parser exports
- [Source: src/shared/types/dashboard-state.ts] - DashboardState interface
- [Source: src/shared/types/parse-result.ts] - ParseResult<T> and ParseError types
- [Source: _bmad-output/planning-artifacts/prd.md#NFR5-7] - Reliability requirements

### Previous Story Intelligence

**From Story 2.5 (File Watcher Service):**

- Services implement `vscode.Disposable` for proper cleanup
- Use VS Code's `EventEmitter` for event-based communication
- Track both instance-level and operation-level disposables separately
- Never throw exceptions - use event-based error reporting
- Co-locate test files with source (`*.test.ts`)
- 28 tests provided comprehensive coverage - aim for similar thoroughness
- Use sinon for mocking VS Code APIs in tests

**From Story 2.4 (Story File Parser):**

- Parsers return `ParseResult<T>` - never throw
- Use `gray-matter` for frontmatter extraction
- Test files co-located with source
- 31 tests covered edge cases thoroughly

**Git Commit Patterns:**

- Recent commits follow `feat: X.Y: Story Title` format
- Files changed: implementation + tests + barrel exports

### Integration Points

**Upstream Dependencies:**

- `BmadDetector.getBmadPaths()` - provides outputRoot and other paths
- `FileWatcher.onDidChange` - triggers selective re-parsing
- `FileWatcher.onError` - triggers error collection
- `parseSprintStatusFile()`, `parseEpicFile()`, `parseStoryFile()` - parse BMAD artifacts

**Downstream Consumers (Epic 3: Dashboard):**

- Dashboard Zustand Store will subscribe to `StateManager.onStateChange`
- Webview providers will call `StateManager.state` for initial render
- Refresh command will call `StateManager.refresh()`

**Data Flow:**

```
Extension Activation
  → BmadDetector.detectBmadProject()
  → FileWatcher.start()
  → StateManager.initialize()
      → parseAll()
      → onStateChange fires
      → Dashboard receives STATE_UPDATE

File Change
  → FileWatcher.onDidChange fires
  → StateManager.handleFileChanges()
      → selective re-parse
      → onStateChange fires
      → Dashboard receives STATE_UPDATE
```

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
