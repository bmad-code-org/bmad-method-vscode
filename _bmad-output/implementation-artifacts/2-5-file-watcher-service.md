# Story 2.5: File Watcher Service

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a file watcher that monitors BMAD artifact changes,
So that the dashboard can auto-update when files change.

## Acceptance Criteria

1. **File Watcher Initialization**
   - **Given** the extension is active in a BMAD workspace
   - **When** the file watcher is initialized
   - **Then** it watches `_bmad-output/**/*.yaml` and `_bmad-output/**/*.md` patterns

2. **Debounced Change Detection**
   - **Given** a BMAD file changes in the workspace
   - **When** the file watcher detects the change
   - **Then** it debounces changes for 500ms to batch rapid updates
   - **And** it triggers a re-parse of affected files

3. **Graceful Error Recovery**
   - **Given** a file system error occurs
   - **When** the file watcher encounters it
   - **Then** it recovers gracefully and enables manual refresh (NFR6)

4. **Resource Efficiency**
   - **Given** file watching is active
   - **When** the extension monitors for changes
   - **Then** CPU usage stays below 1% and memory below 50MB under normal operation (NFR3)

## Tasks / Subtasks

- [x] Task 1: Create FileWatcher Service Class (AC: #1, #3)
  - [x] 1.1: Create `src/extension/services/file-watcher.ts` with `FileWatcher` class
  - [x] 1.2: Inject `BmadDetector` dependency to get `outputRoot` path
  - [x] 1.3: Create `start()` method that initializes VS Code FileSystemWatcher instances
  - [x] 1.4: Watch pattern: `_bmad-output/**/*.yaml` for sprint status files
  - [x] 1.5: Watch pattern: `_bmad-output/**/*.md` for epic and story files
  - [x] 1.6: Use `vscode.workspace.createFileSystemWatcher()` API
  - [x] 1.7: Create `stop()` method to dispose watchers on deactivation
  - [x] 1.8: Create `dispose()` method for proper cleanup (implements Disposable)

- [x] Task 2: Implement Debounce Logic (AC: #2)
  - [x] 2.1: Create debounce utility or use existing library (500ms delay per Architecture)
  - [x] 2.2: Batch all file change events within debounce window
  - [x] 2.3: Track changed file paths to enable selective re-parsing later
  - [x] 2.4: Use `setTimeout` with proper cleanup for debounce implementation
  - [x] 2.5: Clear pending debounce on new changes to reset the 500ms window

- [x] Task 3: Implement Event Emission Pattern (AC: #2)
  - [x] 3.1: Create `onChange` event using VS Code `EventEmitter<FileChangeEvent>`
  - [x] 3.2: Define `FileChangeEvent` interface: `{ changes: Map<string, FileChangeType> }` where `FileChangeType = 'create' | 'change' | 'delete'`
    - _Design Note: Map-based interface is superior to original spec because it supports per-file type granularity in batched events (e.g., one event can contain creates, changes, and deletes simultaneously)_
  - [x] 3.3: Fire event after debounce completes with batched changes
  - [x] 3.4: Include change type to allow consumers to handle creates/deletes differently

- [x] Task 4: Handle File System Errors (AC: #3)
  - [x] 4.1: Wrap watcher creation in try/catch
  - [x] 4.2: Create `onError` event emitter for error notification
  - [x] 4.3: Log errors but never crash the extension
  - [x] 4.4: Expose `isHealthy()` method to check watcher status
  - [x] 4.5: Support manual re-initialization via `restart()` method

- [x] Task 5: Add Lifecycle Management (AC: #1, #3)
  - [x] 5.1: Track watcher state: 'stopped' | 'starting' | 'running' | 'error'
  - [x] 5.2: Expose `state` property for status queries
  - [x] 5.3: Prevent double-start (idempotent start() calls)
  - [x] 5.4: Handle case where `outputRoot` is null (no _bmad-output/ directory)
  - [x] 5.5: Re-initialize watcher if outputRoot becomes available later

- [x] Task 6: Write Comprehensive Unit Tests (AC: #1, #2, #3, #4)
  - [x] 6.1: Create `src/extension/services/file-watcher.test.ts`
  - [x] 6.2: Test watcher initialization with valid outputRoot
  - [x] 6.3: Test watcher initialization when outputRoot is null
  - [x] 6.4: Test debounce batches rapid changes into single event
  - [x] 6.5: Test change event includes all affected paths
  - [x] 6.6: Test error handling on watcher creation failure
  - [x] 6.7: Test proper disposal cleans up watchers
  - [x] 6.8: Test idempotent start() behavior
  - [x] 6.9: Test restart() after error state
  - [x] 6.10: Mock VS Code FileSystemWatcher API

- [x] Task 7: Update Services Barrel Export (AC: #1)
  - [x] 7.1: Update `src/extension/services/index.ts` to export FileWatcher class
  - [x] 7.2: Export FileChangeEvent type

- [x] Task 8: Build and Lint Validation (AC: #1, #2, #3, #4)
  - [x] 8.1: Run `pnpm typecheck:extension` and verify no type errors
  - [x] 8.2: Run `pnpm lint` and verify no linting errors
  - [x] 8.3: Run `pnpm test` and verify all tests pass
  - [x] 8.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `file-watcher.ts`, `file-watcher.test.ts`
   - WRONG: `FileWatcher.ts`, `fileWatcher.ts`

2. **Class/Function Naming**: PascalCase for classes, camelCase for functions
   ```typescript
   export class FileWatcher implements vscode.Disposable { ... }
   public start(): void { ... }
   public stop(): void { ... }
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, etc.

4. **VS Code API Usage**: Use `vscode.workspace.fs` and `vscode.workspace.createFileSystemWatcher()`
   - NOT Node.js fs module (for remote development compatibility)
   - See existing `BmadDetector` service for reference pattern

5. **Event Emitter Pattern**: Use VS Code's `EventEmitter` class
   ```typescript
   import * as vscode from 'vscode';

   private readonly _onDidChange = new vscode.EventEmitter<FileChangeEvent>();
   public readonly onDidChange = this._onDidChange.event;
   ```

6. **Disposable Pattern**: Implement `vscode.Disposable` interface
   ```typescript
   export class FileWatcher implements vscode.Disposable {
     private disposables: vscode.Disposable[] = [];

     public dispose(): void {
       this.disposables.forEach(d => d.dispose());
       this.disposables = [];
     }
   }
   ```

### Technical Specifications

**VS Code FileSystemWatcher API**

```typescript
// Create a watcher for the glob pattern
const watcher = vscode.workspace.createFileSystemWatcher(
  new vscode.RelativePattern(outputRoot, '**/*.yaml')
);

// Subscribe to events
watcher.onDidCreate(uri => { /* handle create */ });
watcher.onDidChange(uri => { /* handle change */ });
watcher.onDidDelete(uri => { /* handle delete */ });

// Dispose when done
watcher.dispose();
```

**Debounce Implementation Pattern**

```typescript
private debounceTimer: NodeJS.Timeout | undefined;
private pendingChanges: Map<string, FileChangeType> = new Map();

private handleChange(uri: vscode.Uri, type: FileChangeType): void {
  // Accumulate changes
  this.pendingChanges.set(uri.fsPath, type);

  // Reset debounce timer
  if (this.debounceTimer) {
    clearTimeout(this.debounceTimer);
  }

  this.debounceTimer = setTimeout(() => {
    this.flushChanges();
  }, 500); // 500ms debounce per Architecture
}

private flushChanges(): void {
  const changes = Array.from(this.pendingChanges.entries());
  this.pendingChanges.clear();
  this._onDidChange.fire({ changes });
}
```

**Watch Patterns (from Architecture)**

- `_bmad-output/**/*.yaml` - Sprint status files
- `_bmad-output/**/*.md` - Epic and story markdown files

### Performance Considerations (NFR3)

- FileSystemWatcher is VS Code's native mechanism - lightweight by design
- Debounce batches events, reducing callback frequency
- No polling implementation needed unless FSWatcher proves unreliable
- Memory overhead: Only store pending changes during debounce window

### Error Handling Pattern

```typescript
// Never crash on watcher errors - emit event instead
try {
  this.yamlWatcher = vscode.workspace.createFileSystemWatcher(/* ... */);
} catch (err) {
  this._state = 'error';
  this._onError.fire({
    message: `Failed to create file watcher: ${err instanceof Error ? err.message : 'Unknown error'}`,
    recoverable: true
  });
}
```

### Project Structure Notes

**Files to Create:**
- `src/extension/services/file-watcher.ts` - Main service implementation
- `src/extension/services/file-watcher.test.ts` - Unit tests

**Files to Modify:**
- `src/extension/services/index.ts` - Add exports

**Dependencies:**
- `BmadDetector` service (already exists) - provides `outputRoot` path
- No new npm packages required - uses VS Code API only

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#File-Watching] - Watch patterns and 500ms debounce
- [Source: _bmad-output/planning-artifacts/architecture.md#Error-Handling] - Graceful recovery pattern
- [Source: _bmad-output/planning-artifacts/epics.md#Story-2.5] - Acceptance criteria
- [Source: src/extension/services/bmad-detector.ts] - Reference service implementation pattern
- [Source: _bmad-output/implementation-artifacts/2-4-story-file-parser.md] - Previous story patterns
- [Source: _bmad-output/planning-artifacts/prd.md#NFR3] - Resource limits (<1% CPU, <50MB memory)
- [Source: _bmad-output/planning-artifacts/prd.md#NFR6] - Error recovery requirement

### Previous Story Intelligence

**From Story 2.4 (Story File Parser):**
- Use existing patterns from `BmadDetector` service as reference
- Services implement `vscode.Disposable` for proper cleanup
- Never throw exceptions - use event-based error reporting
- Test files co-located with source (`*.test.ts`)
- 31 tests provided comprehensive coverage - aim for similar thoroughness

**Git Commit Patterns:**
- Recent commits follow `feat: X.Y: Story Title` format
- Files changed: implementation + tests + barrel exports + story status

### Integration Points

**Downstream Consumers (Story 2.6: State Manager):**
- State Manager will subscribe to `onDidChange` event
- Will use `affectedPaths` to selectively re-parse changed files
- Will use `isHealthy()` to show degraded state in UI

**Initialization Flow:**
```
Extension activates
  → BmadDetector.detectBmadProject()
  → FileWatcher.start(outputRoot)
  → StateManager subscribes to FileWatcher.onDidChange
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- No blocking errors encountered during implementation

### Completion Notes List

- Implemented FileWatcher service with full VS Code FileSystemWatcher API integration
- 500ms debounce logic correctly batches rapid file changes
- Event emission pattern using VS Code's EventEmitter for onChange and onError events
- Full lifecycle management with state tracking: 'stopped' | 'starting' | 'running' | 'error'
- Graceful error recovery via restart() method
- Idempotent start() to prevent double initialization
- Handles missing outputRoot gracefully (stays in stopped state)
- 30 comprehensive unit tests covering all acceptance criteria
- Added sinon and @types/sinon for proper test mocking
- Updated .vscode-test.mjs to only run mocha-based tests (services) to avoid vitest/mocha conflict

### File List

- src/extension/services/file-watcher.ts (created) - FileWatcher service implementation
- src/extension/services/file-watcher.test.ts (created) - 30 comprehensive unit tests
- src/extension/services/index.ts (modified) - Added FileWatcher exports
- package.json (modified) - Added sinon, @types/sinon dev dependencies
- pnpm-lock.yaml (modified) - Updated lockfile for new dependencies
- .vscode-test.mjs (modified) - Fixed test file pattern to avoid vitest/mocha conflict

### Change Log

- 2026-02-04: Code Review #2 - Fixed pendingChanges not cleared on stop(), added test for same-file event type coalescing, improved test subscription disposal, removed setStateForTesting from production code - 62 passing tests (30 FileWatcher)
- 2026-02-03: Code Review Fixes - Fixed memory leak in disposal, added event subscription tracking, added test for late outputRoot availability, refactored test helper pattern - 28 passing tests
- 2026-02-02: Implemented Story 2.5: File Watcher Service - All 8 tasks completed with 21 passing tests
