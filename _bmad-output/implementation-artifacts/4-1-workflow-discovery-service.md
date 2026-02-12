# Story 4.1: Workflow Discovery Service

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the extension to determine which workflows are available based on project state,
So that only relevant actions are displayed.

## Acceptance Criteria

1. **Workflow Discovery from Project State**
   - **Given** the extension has parsed BMAD project state
   - **When** the workflow discovery service runs
   - **Then** it identifies available workflows based on current sprint/epic/story state (FR15)
   - **And** it returns a list of workflow descriptors with id, display name, command, and description

2. **BMAD Installation Detection**
   - **Given** a BMAD installation exists in the workspace (`_bmad/` directory)
   - **When** workflows are discovered
   - **Then** the service detects available BMAD workflows from the installation
   - **And** only workflows that exist in the installation are returned as available

3. **State-Based Workflow Mapping**
   - **Given** the workflow state mapping:

   | Project State | Available Workflows |
   |---------------|---------------------|
   | No sprint-status.yaml exists | `sprint-planning` |
   | Sprint active, no stories started | `create-story` |
   | Story status: ready-for-dev | `dev-story` |
   | Story status: in-progress | `dev-story` (continue) |
   | Story status: review | `code-review`, `create-story` |
   | All stories in epic complete | `retrospective`, `create-story` (next epic) |
   | Sprint complete (all done) | `retrospective` |

   - **When** workflows are discovered
   - **Then** the available workflows match this state mapping

4. **Reactive Updates**
   - **Given** the project state changes (e.g., sprint-status.yaml updated, story file created)
   - **When** the StateManager fires a state change event
   - **Then** the workflow discovery service recomputes available workflows
   - **And** fires its own change event with updated workflow list

5. **DashboardState Integration**
   - **Given** the workflow discovery service computes available workflows
   - **When** the StateManager state is updated
   - **Then** the `DashboardState.workflows` field contains the current available workflows
   - **And** the webview receives the updated workflows via `STATE_UPDATE` message

6. **Graceful Degradation**
   - **Given** partial or missing BMAD data (e.g., no sprint status, no epics)
   - **When** workflows are discovered
   - **Then** the service returns a sensible default (e.g., `sprint-planning` if no sprint data)
   - **And** the service never throws an exception

## Tasks / Subtasks

- [x] Task 1: Define AvailableWorkflow type (AC: #1, #5)
  - [x] 1.1: Add `AvailableWorkflow` interface to `src/shared/types/` with `id`, `name`, `command`, `description`, `isPrimary` fields
  - [x] 1.2: Add `workflows: AvailableWorkflow[]` field to `DashboardState` interface
  - [x] 1.3: Update `createInitialDashboardState()` to include `workflows: []`
  - [x] 1.4: Export new types from `src/shared/types/index.ts` barrel

- [x] Task 2: Create WorkflowDiscoveryService (AC: #1, #2, #3, #6)
  - [x] 2.1: Create `src/extension/services/workflow-discovery.ts` with `WorkflowDiscoveryService` class implementing `vscode.Disposable`
  - [x] 2.2: Constructor accepts `BmadDetector` for path resolution
  - [x] 2.3: Implement `discoverWorkflows(state: DashboardState): AvailableWorkflow[]` pure function method that computes available workflows from current state
  - [x] 2.4: Implement state-based workflow mapping logic per AC #3 state table
  - [x] 2.5: Implement BMAD installation detection - scan `_bmad/bmm/workflows/4-implementation/` directory for available workflow folders
  - [x] 2.6: Filter computed workflows against actually-installed workflows (only return workflows that exist on disk)
  - [x] 2.7: Mark the primary/recommended workflow with `isPrimary: true`
  - [x] 2.8: Handle graceful degradation - return sensible defaults for missing/partial data

- [x] Task 3: Integrate with StateManager (AC: #4, #5)
  - [x] 3.1: Add `WorkflowDiscoveryService` dependency to `StateManager` constructor (optional parameter for backward compatibility)
  - [x] 3.2: After `determineCurrentStory()` in `parseAll()`, call `workflowDiscovery.discoverWorkflows(this._state)` and set `this._state.workflows`
  - [x] 3.3: After `determineCurrentStory()` in `handleFileChanges()`, also recompute workflows
  - [x] 3.4: Workflows are included in `STATE_UPDATE` message automatically since they're part of `DashboardState`

- [x] Task 4: Update Zustand Store (AC: #5)
  - [x] 4.1: Add `workflows: AvailableWorkflow[]` to `DashboardStore` interface and initial state
  - [x] 4.2: Update `updateState` action to include `workflows` from incoming state
  - [x] 4.3: Add `useWorkflows` selector hook
  - [x] 4.4: Export `useWorkflows` from store module

- [x] Task 5: Update extension.ts activation (AC: #1, #2)
  - [x] 5.1: Create `WorkflowDiscoveryService` instance in `activate()` after `BmadDetector`
  - [x] 5.2: Pass `WorkflowDiscoveryService` to `StateManager` constructor
  - [x] 5.3: Add `WorkflowDiscoveryService` to `context.subscriptions` for cleanup

- [x] Task 6: Update barrel exports (AC: #1)
  - [x] 6.1: Export `WorkflowDiscoveryService` from `src/extension/services/index.ts`
  - [x] 6.2: Ensure all new types are exported from `src/shared/types/index.ts`

- [x] Task 7: Write unit tests for WorkflowDiscoveryService (AC: #1, #2, #3, #6)
  - [x] 7.1: Create `src/extension/services/workflow-discovery.test.ts`
  - [x] 7.2: Test: no sprint data returns `sprint-planning` workflow
  - [x] 7.3: Test: sprint active with all backlog stories returns `create-story`
  - [x] 7.4: Test: story with `ready-for-dev` status returns `dev-story`
  - [x] 7.5: Test: story with `in-progress` status returns `dev-story` (continue)
  - [x] 7.6: Test: story with `review` status returns `code-review` and `create-story`
  - [x] 7.7: Test: all stories in an epic complete returns `retrospective` and `create-story`
  - [x] 7.8: Test: all stories in sprint complete returns `retrospective`
  - [x] 7.9: Test: workflows filtered against installed workflows
  - [x] 7.10: Test: primary workflow is correctly marked
  - [x] 7.11: Test: graceful degradation with partial/missing data

- [x] Task 8: Write unit tests for DashboardState integration (AC: #5)
  - [x] 8.1: Add tests to `src/extension/services/state-manager.test.ts` verifying workflows are populated in state
  - [x] 8.2: Test that `STATE_UPDATE` messages include `workflows` field

- [x] Task 9: Write unit tests for Zustand store workflow support (AC: #5)
  - [x] 9.1: Add tests in store test file verifying `workflows` state updates correctly
  - [x] 9.2: Test `useWorkflows` selector returns current workflows

- [x] Task 10: Build and Lint Validation (AC: #1-#6)
  - [x] 10.1: Run `pnpm typecheck` and verify no type errors
  - [x] 10.2: Run `pnpm lint` and verify no linting errors
  - [x] 10.3: Run `pnpm test` and verify all tests pass (existing + new)
  - [x] 10.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical: This is an Extension Host Service + Shared Types Story

**This story creates the workflow discovery ENGINE only.** Stories 4.2-4.4 will create the UI components (CTA buttons), terminal execution, and clipboard copy. This story focuses on:

1. **Shared type definitions** - `AvailableWorkflow` interface, `DashboardState` extension
2. **Extension host service** - `WorkflowDiscoveryService` class with pure computation logic
3. **StateManager integration** - Workflows computed as part of state updates
4. **Zustand store readiness** - Store can receive and expose workflow data

### Architecture Compliance

**MANDATORY patterns from Architecture Document and all previous story learnings:**

1. **File Naming**: kebab-case
   - CORRECT: `workflow-discovery.ts`, `workflow-discovery.test.ts`
   - WRONG: `WorkflowDiscovery.ts`, `workflowDiscovery.ts`

2. **Component/Class Naming**: PascalCase
   ```typescript
   export class WorkflowDiscoveryService implements vscode.Disposable { ... }
   ```

3. **Package Manager**: `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

4. **Message Protocol**: Use existing `STATE_UPDATE` message - workflows are part of `DashboardState`
   - Do NOT create a separate message type for workflows
   - Workflows travel as part of the existing state snapshot

5. **Error Pattern**: Never throw from service methods - return empty array `[]` on failure
   - Follow `ParseResult<T>` philosophy but since this service returns arrays, just return `[]`

6. **File I/O**: Use `vscode.workspace.fs` API (NOT Node.js `fs`)
   - Required for remote development compatibility
   - Follow `StateManager.readFile()` and `StateManager.readDirectory()` patterns

7. **Zustand Store**: Extend existing store, use selector hooks
   ```typescript
   export const useWorkflows = () => useDashboardStore((s) => s.workflows);
   ```

8. **Testing**:
   - Extension host tests: Mocha + Sinon (for files using VS Code API)
   - Shared type tests: Vitest
   - Webview tests: Vitest + @testing-library/react
   - Co-locate tests next to source

9. **Disposable Pattern**: Implement `vscode.Disposable` for all services
   ```typescript
   dispose(): void {
     for (const d of this.disposables) {
       d.dispose();
     }
   }
   ```

10. **Imports**:
    - `@shared/types` for shared type imports
    - Relative imports for local files within same context
    - Never import extension code from webview or vice versa

### Technical Specifications

**AvailableWorkflow Interface** (`src/shared/types/workflow.ts`):

```typescript
/**
 * Represents a BMAD workflow that can be executed from the dashboard
 */
export interface AvailableWorkflow {
  /** Unique workflow identifier (e.g., 'sprint-planning', 'create-story', 'dev-story') */
  id: string;
  /** Human-readable display name (e.g., 'Sprint Planning', 'Create Story') */
  name: string;
  /** Command to execute in terminal (e.g., 'claude /bmad-bmm-sprint-planning') */
  command: string;
  /** Brief description of what the workflow does */
  description: string;
  /** Whether this is the primary/recommended workflow for current state */
  isPrimary: boolean;
}
```

**DashboardState Extension** (`src/shared/types/dashboard-state.ts`):

```typescript
export interface DashboardState {
  sprint: SprintStatus | null;
  epics: Epic[];
  currentStory: Story | null;
  errors: ParseError[];
  loading: boolean;
  outputRoot: string | null;
  /** Available workflows based on current project state */
  workflows: AvailableWorkflow[];
}
```

**WorkflowDiscoveryService** (`src/extension/services/workflow-discovery.ts`):

```typescript
import * as vscode from 'vscode';
import type { BmadDetector } from './bmad-detector';
import type { DashboardState, AvailableWorkflow } from '../../shared/types';
import { isStoryKey, isEpicKey, isStoryStatus } from '../../shared/types/sprint-status';

/**
 * Known BMAD implementation workflow definitions.
 * These map to folders under _bmad/bmm/workflows/4-implementation/
 */
const WORKFLOW_DEFINITIONS: Record<string, Omit<AvailableWorkflow, 'isPrimary'>> = {
  'sprint-planning': {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    command: 'claude /bmad-bmm-sprint-planning',
    description: 'Set up sprint tracking and plan story execution order',
  },
  'create-story': {
    id: 'create-story',
    name: 'Create Story',
    command: 'claude /bmad-bmm-create-story',
    description: 'Create the next user story with comprehensive dev context',
  },
  'dev-story': {
    id: 'dev-story',
    name: 'Dev Story',
    command: 'claude /bmad-bmm-dev-story',
    description: 'Start or continue story implementation',
  },
  'code-review': {
    id: 'code-review',
    name: 'Code Review',
    command: 'claude /bmad-bmm-code-review',
    description: 'Run code review on completed story',
  },
  'retrospective': {
    id: 'retrospective',
    name: 'Retrospective',
    command: 'claude /bmad-bmm-retrospective',
    description: 'Review what went well and what to improve',
  },
  'correct-course': {
    id: 'correct-course',
    name: 'Correct Course',
    command: 'claude /bmad-bmm-correct-course',
    description: 'Adjust sprint plan based on learnings',
  },
};

/**
 * Mapping of workflow IDs to their folder names under _bmad/bmm/workflows/4-implementation/
 */
const WORKFLOW_FOLDER_MAP: Record<string, string> = {
  'sprint-planning': 'sprint-planning',
  'create-story': 'create-story',
  'dev-story': 'dev-story',
  'code-review': 'code-review',
  'retrospective': 'retrospective',
  'correct-course': 'correct-course',
};

export class WorkflowDiscoveryService implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private installedWorkflows: Set<string> | null = null;

  constructor(private readonly bmadDetector: BmadDetector) {}

  /**
   * Discover installed workflows by scanning _bmad/bmm/workflows/4-implementation/
   * Caches result after first scan. Call invalidateCache() to force re-scan.
   */
  async discoverInstalledWorkflows(): Promise<Set<string>> {
    if (this.installedWorkflows !== null) {
      return this.installedWorkflows;
    }

    const paths = this.bmadDetector.getBmadPaths();
    if (!paths) {
      this.installedWorkflows = new Set();
      return this.installedWorkflows;
    }

    const workflowsDir = vscode.Uri.joinPath(
      paths.bmadRoot,
      'bmm',
      'workflows',
      '4-implementation'
    );

    try {
      const entries = await this.readDirectory(workflowsDir);
      this.installedWorkflows = new Set(
        entries
          .filter(([, type]) => type === vscode.FileType.Directory)
          .map(([name]) => name)
          .filter((name) => Object.values(WORKFLOW_FOLDER_MAP).includes(name))
      );
    } catch {
      this.installedWorkflows = new Set();
    }

    return this.installedWorkflows;
  }

  /**
   * Compute available workflows based on current dashboard state.
   * Pure logic - does not perform I/O (installed workflows must be pre-scanned).
   */
  discoverWorkflows(state: DashboardState): AvailableWorkflow[] {
    const installed = this.installedWorkflows ?? new Set<string>();
    const candidates = this.computeWorkflowCandidates(state);

    // Filter to only installed workflows
    return candidates
      .filter((w) => installed.has(WORKFLOW_FOLDER_MAP[w.id] ?? w.id))
      .map((w) => ({ ...w }));
  }

  /**
   * Compute which workflows SHOULD be available based on state,
   * without checking installation.
   */
  private computeWorkflowCandidates(state: DashboardState): AvailableWorkflow[] {
    // Implementation follows the state mapping table from AC #3
    // ... (see full logic in tasks)
  }

  invalidateCache(): void {
    this.installedWorkflows = null;
  }

  protected async readDirectory(
    uri: vscode.Uri
  ): Promise<[string, vscode.FileType][]> {
    try {
      return await vscode.workspace.fs.readDirectory(uri);
    } catch {
      return [];
    }
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
```

**State Mapping Logic** (core of `computeWorkflowCandidates`):

The discovery logic should reuse the same analysis pattern as `get-next-action.ts` but return ALL available workflows (not just the next action). The logic:

1. **No sprint data** → `[sprint-planning (primary)]`
2. **Sprint exists, current story in-progress** → `[dev-story (primary), correct-course]`
3. **Sprint exists, current story in review** → `[code-review (primary), create-story]`
4. **Sprint exists, current story ready-for-dev** → `[dev-story (primary)]`
5. **Sprint exists, no active story, backlog stories exist** → `[create-story (primary), correct-course]`
6. **Sprint exists, all stories in an epic done** → `[retrospective (primary), create-story]`
7. **Sprint exists, ALL stories done** → `[retrospective (primary)]`
8. **Sprint exists, no stories at all** → `[create-story (primary)]`

The `isPrimary` flag should be set on exactly one workflow per result set - the most recommended action.

**Integration with StateManager** (`src/extension/services/state-manager.ts`):

```typescript
// Constructor change:
constructor(
  private readonly bmadDetector: BmadDetector,
  private readonly fileWatcher: FileWatcher,
  private readonly workflowDiscovery?: WorkflowDiscoveryService
) { ... }

// In parseAll(), after determineCurrentStory():
private async parseAll(): Promise<void> {
  // ... existing parsing code ...
  this.determineCurrentStory();

  // Compute available workflows
  if (this.workflowDiscovery) {
    this._state = {
      ...this._state,
      workflows: this.workflowDiscovery.discoverWorkflows(this._state),
    };
  }

  // Mark loading complete
  this._state = { ...this._state, loading: false };
  this._onStateChange.fire(this._state);
}
```

**Extension Activation** (`src/extension/extension.ts`):

```typescript
// After detector, before stateManager:
const workflowDiscovery = new WorkflowDiscoveryService(detector);
await workflowDiscovery.discoverInstalledWorkflows();

const stateManager = new StateManager(detector, fileWatcher, workflowDiscovery);
// ...
context.subscriptions.push(
  // ... existing ...
  workflowDiscovery
);
```

**Zustand Store** (`src/webviews/dashboard/store.ts`):

```typescript
// Add to DashboardStore:
workflows: AvailableWorkflow[];

// Add to initial state:
workflows: [],

// Update updateState action:
updateState: (state) => set({
  // ... existing fields ...
  workflows: state.workflows ?? [],
}),

// New selector:
export const useWorkflows = () => useDashboardStore((s) => s.workflows);
```

### Key Existing Code Locations

| Purpose | File | Key Exports/APIs |
|---------|------|-----------------|
| BMAD detector | `src/extension/services/bmad-detector.ts` | `BmadDetector`, `getBmadPaths()` |
| State manager | `src/extension/services/state-manager.ts` | `StateManager`, `onStateChange`, `state` |
| File watcher | `src/extension/services/file-watcher.ts` | `FileWatcher` |
| Dashboard provider | `src/extension/providers/dashboard-view-provider.ts` | `DashboardViewProvider` |
| Extension entry | `src/extension/extension.ts` | `activate()` |
| Service barrel | `src/extension/services/index.ts` | Re-exports all services |
| Dashboard state type | `src/shared/types/dashboard-state.ts` | `DashboardState`, `createInitialDashboardState()` |
| Sprint status types | `src/shared/types/sprint-status.ts` | `SprintStatus`, `isStoryKey()`, `isEpicKey()`, status type guards |
| Story types | `src/shared/types/story.ts` | `Story`, `StoryStatusValue` |
| Types barrel | `src/shared/types/index.ts` | Re-exports all shared types |
| Message protocol | `src/shared/messages.ts` | `ToWebviewType`, `createStateUpdateMessage()` |
| Zustand store | `src/webviews/dashboard/store.ts` | `useDashboardStore`, `useWorkflows` (to add) |
| Next action utility | `src/webviews/dashboard/utils/get-next-action.ts` | `getNextAction()` - reference for state logic |
| Commands barrel | `src/extension/commands/index.ts` | Currently empty placeholder |

### Project Structure Notes

**Files to Create:**
- `src/shared/types/workflow.ts` - AvailableWorkflow interface
- `src/extension/services/workflow-discovery.ts` - WorkflowDiscoveryService class
- `src/extension/services/workflow-discovery.test.ts` - Service unit tests

**Files to Modify:**
- `src/shared/types/dashboard-state.ts` - Add `workflows` field to DashboardState
- `src/shared/types/index.ts` - Export new workflow types
- `src/extension/services/state-manager.ts` - Integrate WorkflowDiscoveryService
- `src/extension/services/index.ts` - Export WorkflowDiscoveryService
- `src/extension/extension.ts` - Instantiate and wire WorkflowDiscoveryService
- `src/webviews/dashboard/store.ts` - Add workflows state and selector

**Files to NOT Modify (read-only references):**
- `src/shared/messages.ts` - No new message types needed; workflows travel via existing `STATE_UPDATE`
- `src/extension/providers/dashboard-view-provider.ts` - No changes needed; already sends `STATE_UPDATE`
- `src/webviews/dashboard/hooks/use-message-handler.ts` - No changes needed; already processes `STATE_UPDATE`
- `src/webviews/dashboard/utils/get-next-action.ts` - Reference only for state logic patterns

**Dependencies (all already installed - NO new packages):**
- `vscode` ^1.96.0 (for `workspace.fs`, `FileType`, `Disposable`, `Uri`)
- `react` ^19.2.0
- `zustand` ^5.0.0
- `vitest` ^4.0.18
- `mocha`, `sinon`, `@vscode/test-cli` (for extension host tests)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1] - Story acceptance criteria and workflow state mapping
- [Source: _bmad-output/planning-artifacts/architecture.md#Workflow-Execution] - Terminal execution patterns, workflow discovery requirements
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management] - Zustand patterns, state shape, extension as single source of truth
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - STATE_UPDATE message, discriminated unions
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns] - kebab-case files, PascalCase classes
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns] - Project organization, service location
- [Source: _bmad-output/planning-artifacts/prd.md#FR12-15] - Workflow action functional requirements
- [Source: src/extension/services/state-manager.ts] - StateManager class, parseAll(), determineCurrentStory()
- [Source: src/extension/services/bmad-detector.ts] - BmadDetector, getBmadPaths(), DetectionResult
- [Source: src/extension/extension.ts] - Extension activation flow, service creation order
- [Source: src/shared/types/dashboard-state.ts] - DashboardState interface, createInitialDashboardState()
- [Source: src/shared/types/sprint-status.ts] - SprintStatus, isStoryKey(), isEpicKey(), status type guards
- [Source: src/shared/messages.ts] - ToWebviewType.STATE_UPDATE, createStateUpdateMessage()
- [Source: src/webviews/dashboard/store.ts] - Zustand store, selector hooks pattern
- [Source: src/webviews/dashboard/utils/get-next-action.ts] - State analysis logic reference (same sprint status analysis patterns)
- [Source: _bmad/bmm/workflows/4-implementation/] - Installed BMAD workflow directories: code-review, correct-course, create-story, dev-story, retrospective, sprint-planning, sprint-status

### Previous Story Intelligence

**From Story 3.6 (Manual Refresh Command) - FINAL story in Epic 3:**
- 305 tests total using Vitest + Mocha
- All validation gates passed: typecheck, lint, test, build
- Dashboard renders components in order: Header (title + RefreshButton) > SprintStatus > EpicList > ActiveStoryCard > NextActionRecommendation > PlanningArtifactLinks
- Package manager: `pnpm`
- `useVSCodeApi()` hook pattern for webview-to-extension communication
- Store uses selector hooks (`useLoading()`, `useSprint()`, etc.) for efficient re-renders
- VS Code theme CSS variables via Tailwind arbitrary values for styling
- Test patterns: `useDashboardStore.setState()` for store mocking, `vi.mock()` for module mocking
- Components use `data-testid` for test targeting

**From Story 3.5 (Next Action Recommendation):**
- `get-next-action.ts` contains the state analysis logic that this story's workflow discovery should parallel
- The `NextAction` type includes `type`, `label`, `description`, `storyKey` - similar to `AvailableWorkflow`
- State analysis pattern: check sprint → check currentStory status → analyze development_status entries → compute result

**From Story 2.6 (State Manager):**
- StateManager uses `protected readFile()` and `protected readDirectory()` methods for testability
- Test pattern: Create `TestableStateManager` subclass that overrides protected methods
- Mock pattern for BmadDetector and FileWatcher: `sinon.createSandbox()`, `sinon.SinonStubbedInstance`
- State changes fire `onStateChange` event

**From Story 2.5 (File Watcher):**
- Services implement `vscode.Disposable` with disposables array pattern
- `vscode.workspace.fs` used instead of Node.js `fs` for remote dev compatibility

**Git Intelligence:**
- Recent commits follow `feat: N-N-story-name` pattern
- All stories pass typecheck, lint, test, build before commit
- Epic 3 (Dashboard State Visibility) is complete - Epic 4 starts now
- Codebase has 305 tests passing, all gates green

### BMAD Workflow Installation Reference

The following BMAD implementation workflows exist in `_bmad/bmm/workflows/4-implementation/`:

| Folder Name | Workflow ID | CLI Command |
|-------------|-------------|-------------|
| `sprint-planning` | sprint-planning | `claude /bmad-bmm-sprint-planning` |
| `create-story` | create-story | `claude /bmad-bmm-create-story` |
| `dev-story` | dev-story | `claude /bmad-bmm-dev-story` |
| `code-review` | code-review | `claude /bmad-bmm-code-review` |
| `retrospective` | retrospective | `claude /bmad-bmm-retrospective` |
| `correct-course` | correct-course | `claude /bmad-bmm-correct-course` |
| `sprint-status` | sprint-status | `claude /bmad-bmm-sprint-status` |

Note: The `sprint-status` workflow is a status display utility and may or may not be relevant to offer as a CTA action. Consider including it as a secondary action or omitting it in favor of the dashboard's built-in display.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Created `AvailableWorkflow` interface in `src/shared/types/workflow.ts` with all specified fields (id, name, command, description, isPrimary)
- Extended `DashboardState` with `workflows: AvailableWorkflow[]` field and updated `createInitialDashboardState()` to include `workflows: []`
- Created `WorkflowDiscoveryService` class implementing `vscode.Disposable` with:
  - `discoverInstalledWorkflows()`: Scans `_bmad/bmm/workflows/4-implementation/` for installed workflow folders with caching and `invalidateCache()` support
  - `discoverWorkflows(state)`: Pure function computing available workflows from DashboardState based on the AC #3 state mapping table
  - State mapping logic parallels `get-next-action.ts` but returns ALL available workflows with `isPrimary` flag
  - Graceful degradation: returns sensible defaults for missing/partial data, never throws
  - Installation filtering: only returns workflows that exist on disk
- Integrated `WorkflowDiscoveryService` into `StateManager` as optional constructor parameter for backward compatibility
  - Workflows recomputed in both `parseAll()` and `handleFileChanges()` after `determineCurrentStory()`
  - Workflows travel via existing `STATE_UPDATE` message as part of `DashboardState`
- Updated Zustand store with `workflows` state, `updateState` action, and `useWorkflows` selector hook
- Updated `extension.ts` to create `WorkflowDiscoveryService`, scan installed workflows, pass to `StateManager`, and register for disposal
- Updated barrel exports in `src/extension/services/index.ts` and `src/shared/types/index.ts`
- Fixed existing test files (`messages.test.ts`, `store.test.ts`, `use-message-handler.test.ts`) to include new `workflows` field in `DashboardState` literals
- Test results: 309 Vitest tests + 90 Mocha extension tests = 399 total (was 305 + 86 = 391, added 8 new tests)
- All validation gates pass: typecheck, lint, test, build

### File List

**New Files:**
- src/shared/types/workflow.ts
- src/extension/services/workflow-discovery.ts
- src/extension/services/workflow-discovery.test.ts

**Modified Files:**
- src/shared/types/dashboard-state.ts
- src/shared/types/index.ts
- src/extension/services/state-manager.ts
- src/extension/services/state-manager.test.ts
- src/extension/services/index.ts
- src/extension/extension.ts
- src/webviews/dashboard/store.ts
- src/webviews/dashboard/store.test.ts
- src/shared/messages.test.ts
- src/webviews/dashboard/hooks/use-message-handler.test.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-02-12: Implemented Workflow Discovery Service - added AvailableWorkflow type, WorkflowDiscoveryService class with state-based mapping and installation detection, StateManager integration, Zustand store support, and comprehensive tests (309 Vitest + 90 Mocha = 399 total)
- 2026-02-12: Code Review (AI) - Fixed 7 issues (3 Medium, 4 Low): removed redundant WORKFLOW_FOLDER_MAP abstraction, added sprint-status exclusion documentation, documented sprint-complete vs retrospective divergence from get-next-action.ts, removed redundant file header comment, refactored test lifecycle to use beforeEach/afterEach, added comment on status guard behavior, removed dead code ?? fallback in store. All gates pass: typecheck, lint, 399 tests, build.
