# Story 3.1: Dashboard Zustand Store and Message Handler

Status: approved

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the dashboard webview to receive and store state from the extension host,
So that React components can reactively display project state.

## Acceptance Criteria

1. **Zustand Store Implementation**
   - **Given** the sidebar panel from Epic 1
   - **When** the Zustand store is implemented
   - **Then** `/src/webviews/dashboard/store.ts` contains a DashboardState store
   - **And** the store supports loading and error states
   - **And** state updates trigger React re-renders

2. **Message Handler Hook**
   - **Given** the extension host sends a STATE_UPDATE message
   - **When** the dashboard receives it
   - **Then** `use-message-handler.ts` hook processes STATE_UPDATE messages from extension host
   - **And** the Zustand store updates with the new state snapshot
   - **And** the update completes within 500ms (NFR2)

3. **Initial Render Performance**
   - **Given** the extension activates in a BMAD workspace
   - **When** the dashboard initially renders
   - **Then** rendering completes within 1 second (NFR1)

4. **Extension Host Integration**
   - **Given** the DashboardViewProvider exists from Story 1.4
   - **When** the StateManager fires `onStateChange`
   - **Then** the DashboardViewProvider forwards the state to the webview via `postMessage`
   - **And** webview-to-extension messages (REFRESH, OPEN_DOCUMENT, etc.) are forwarded to the StateManager

## Tasks / Subtasks

- [x] Task 1: Create Dashboard Zustand Store (AC: #1)
  - [x] 1.1: Create `src/webviews/dashboard/store.ts` with Zustand `create` function
  - [x] 1.2: Define `DashboardStore` interface extending `DashboardState` with actions
  - [x] 1.3: Add `updateState(state: DashboardState)` action to replace full state snapshot
  - [x] 1.4: Add `setLoading(loading: boolean)` action
  - [x] 1.5: Add `setError(error: string)` action for local webview errors
  - [x] 1.6: Initialize store with `createInitialDashboardState()` from shared types
  - [x] 1.7: Export typed selector hooks for individual state slices (useSprint, useEpics, useCurrentStory, useErrors, useLoading)

- [x] Task 2: Create VS Code API Hook (AC: #2)
  - [x] 2.1: Create `src/webviews/shared/hooks/use-vscode-api.ts` with `useVSCodeApi()` hook
  - [x] 2.2: Wrap `acquireVsCodeApi()` in a singleton pattern (VS Code API can only be acquired once)
  - [x] 2.3: Return typed `postMessage` function for sending `ToExtension` messages
  - [x] 2.4: Export from `src/webviews/shared/hooks/index.ts`

- [x] Task 3: Create Message Handler Hook (AC: #2, #3)
  - [x] 3.1: Create `src/webviews/dashboard/hooks/use-message-handler.ts`
  - [x] 3.2: Register `window.addEventListener('message', handler)` on mount
  - [x] 3.3: Clean up listener on unmount via `useEffect` cleanup
  - [x] 3.4: Handle `STATE_UPDATE` messages by calling `updateState()` on Zustand store
  - [x] 3.5: Handle `ERROR` messages by calling `setError()` on Zustand store
  - [x] 3.6: Ignore unknown message types gracefully
  - [x] 3.7: Export from `src/webviews/dashboard/hooks/index.ts`

- [x] Task 4: Update DashboardViewProvider for Bidirectional Communication (AC: #4)
  - [x] 4.1: Add `StateManager` dependency to `DashboardViewProvider` constructor
  - [x] 4.2: Subscribe to `StateManager.onStateChange` and forward state via `webview.postMessage()` using `createStateUpdateMessage()`
  - [x] 4.3: Implement `handleMessage()` to process `ToExtension` messages from webview
  - [x] 4.4: Handle REFRESH messages by calling `StateManager.refresh()`
  - [x] 4.5: Handle OPEN_DOCUMENT messages (placeholder for Epic 5)
  - [x] 4.6: Handle EXECUTE_WORKFLOW and COPY_COMMAND messages (placeholder for Epic 4)
  - [x] 4.7: Send initial state when webview becomes visible (`onDidChangeVisibility`)

- [x] Task 5: Update Extension Entry Point (AC: #4)
  - [x] 5.1: Update `src/extension/extension.ts` to create `FileWatcher` and `StateManager` instances
  - [x] 5.2: Pass `StateManager` to `DashboardViewProvider` constructor
  - [x] 5.3: Call `FileWatcher.start()` and `StateManager.initialize()` during activation
  - [x] 5.4: Update `bmad.refresh` command to call `StateManager.refresh()` instead of provider refresh
  - [x] 5.5: Add all services to `context.subscriptions` for proper disposal

- [x] Task 6: Wire Dashboard Component to Store (AC: #1, #2)
  - [x] 6.1: Update `src/webviews/dashboard/index.tsx` to call `useMessageHandler()` hook
  - [x] 6.2: Send initial REFRESH message to extension on mount to request state
  - [x] 6.3: Conditionally render Placeholder or loading skeleton based on store state
  - [x] 6.4: Add `data-testid` attributes for testing

- [x] Task 7: Write Unit Tests (AC: #1, #2, #3, #4)
  - [x] 7.1: Create `src/webviews/dashboard/store.test.ts` - test Zustand store actions
  - [x] 7.2: Test `updateState` replaces full state snapshot
  - [x] 7.3: Test `setLoading` toggles loading flag
  - [x] 7.4: Test `setError` adds error to state
  - [x] 7.5: Test initial state matches `createInitialDashboardState()`
  - [x] 7.6: Test selector hooks return correct slices
  - [x] 7.7: Create `src/webviews/dashboard/hooks/use-message-handler.test.ts`
  - [x] 7.8: Test STATE_UPDATE messages update Zustand store
  - [x] 7.9: Test ERROR messages set error state
  - [x] 7.10: Test unknown message types are ignored
  - [x] 7.11: Test cleanup removes event listener on unmount
  - [x] 7.12: Create `src/webviews/shared/hooks/use-vscode-api.test.ts`
  - [x] 7.13: Test singleton behavior of acquireVsCodeApi
  - [x] 7.14: Test postMessage sends correctly typed messages

- [x] Task 8: Build and Lint Validation (AC: #1, #2, #3, #4)
  - [x] 8.1: Run `pnpm typecheck` and verify no type errors across extension AND webview
  - [x] 8.2: Run `pnpm lint` and verify no linting errors
  - [x] 8.3: Run `pnpm test` and verify all tests pass (existing + new)
  - [x] 8.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `store.ts`, `use-message-handler.ts`, `use-vscode-api.ts`
   - WRONG: `Store.ts`, `useMessageHandler.ts`, `useVscodeApi.ts`

2. **Class/Function Naming**: PascalCase for components, camelCase for functions/hooks
   ```typescript
   export function useDashboardStore() { ... }    // hook
   export function useMessageHandler() { ... }     // hook
   export function Dashboard(): React.ReactElement { ... } // component
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, etc.

4. **Message Protocol**: Use types from `@shared/messages` (or relative `../../shared/messages`)
   - NEVER create new message types - use existing `ToWebview`, `ToExtension` unions
   - Use factory functions: `createStateUpdateMessage()`, `createRefreshMessage()`
   - Use type guards: `isStateUpdateMessage()`, `isErrorMessage()`

5. **State Updates**: Replace entire state snapshot (never merge/patch)
   - Extension host is single source of truth
   - Webviews are read-only consumers (actions go back via messages)

6. **VS Code API in Webview**: Use `acquireVsCodeApi()` (singleton, can only be called ONCE)
   ```typescript
   // CRITICAL: acquireVsCodeApi() can only be called once per webview lifecycle
   // Must be wrapped in singleton pattern
   const vscodeApi = acquireVsCodeApi();
   ```

7. **Zustand 5.x API**: Project uses zustand ^5.0.0 (NOT v4)
   ```typescript
   import { create } from 'zustand';

   // Zustand 5 pattern: create<Type>()(set => ...)
   // Note: Double parentheses required for TypeScript generics in v5
   const useDashboardStore = create<DashboardStore>()((set) => ({
     // state
     sprint: null,
     epics: [],
     // actions
     updateState: (state) => set(state),
   }));
   ```

### Technical Specifications

**Zustand Store Architecture**

```typescript
import { create } from 'zustand';
import type { DashboardState } from '@shared/types';
import { createInitialDashboardState } from '@shared/types';

interface DashboardStore extends DashboardState {
  /** Replace entire state with new snapshot from extension host */
  updateState: (state: DashboardState) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set local webview error */
  setError: (message: string) => void;
}

export const useDashboardStore = create<DashboardStore>()((set) => ({
  ...createInitialDashboardState(),

  updateState: (state: DashboardState) =>
    set({
      sprint: state.sprint,
      epics: state.epics,
      currentStory: state.currentStory,
      errors: state.errors,
      loading: state.loading,
    }),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (message: string) =>
    set((prev) => ({
      errors: [...prev.errors, { message, recoverable: true }],
    })),
}));

// Selector hooks for individual state slices (prevents unnecessary re-renders)
export const useSprint = () => useDashboardStore((s) => s.sprint);
export const useEpics = () => useDashboardStore((s) => s.epics);
export const useCurrentStory = () => useDashboardStore((s) => s.currentStory);
export const useErrors = () => useDashboardStore((s) => s.errors);
export const useLoading = () => useDashboardStore((s) => s.loading);
```

**VS Code API Hook**

```typescript
// src/webviews/shared/hooks/use-vscode-api.ts
import type { ToExtension } from '@shared/messages';

// VS Code webview API type (subset needed)
interface VSCodeApi {
  postMessage: (message: ToExtension) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

// Singleton - acquireVsCodeApi() can only be called once
let vscodeApi: VSCodeApi | undefined;

function getVSCodeApi(): VSCodeApi {
  if (!vscodeApi) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vscodeApi = (window as any).acquireVsCodeApi();
  }
  return vscodeApi!;
}

export function useVSCodeApi(): VSCodeApi {
  return getVSCodeApi();
}
```

**Message Handler Hook**

```typescript
// src/webviews/dashboard/hooks/use-message-handler.ts
import { useEffect } from 'react';
import { useDashboardStore } from '../store';
import { ToWebviewType } from '@shared/messages';
import type { ToWebview } from '@shared/messages';

export function useMessageHandler(): void {
  const updateState = useDashboardStore((s) => s.updateState);
  const setError = useDashboardStore((s) => s.setError);

  useEffect(() => {
    const handler = (event: MessageEvent<ToWebview>) => {
      const message = event.data;
      switch (message.type) {
        case ToWebviewType.STATE_UPDATE:
          updateState(message.payload);
          break;
        case ToWebviewType.ERROR:
          setError(message.payload.message);
          break;
        // DOCUMENT_CONTENT handled by document-viewer (Epic 5)
        default:
          // Ignore unknown message types gracefully
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [updateState, setError]);
}
```

**DashboardViewProvider Updates**

```typescript
// Key changes to src/extension/providers/dashboard-view-provider.ts

constructor(
  private readonly extensionUri: vscode.Uri,
  private readonly detectionResult: DetectionResult,
  private readonly stateManager: StateManager  // NEW dependency
) {}

// In resolveWebviewView():
// Subscribe to state changes and forward to webview
this.stateManager.onStateChange((state) => {
  if (this.view) {
    this.view.webview.postMessage(createStateUpdateMessage(state));
  }
});

// Send initial state when webview becomes visible
webviewView.onDidChangeVisibility(() => {
  if (webviewView.visible) {
    this.view!.webview.postMessage(
      createStateUpdateMessage(this.stateManager.state)
    );
  }
});

// Handle messages from webview
private handleMessage(message: unknown): void {
  const msg = message as ToExtension;
  switch (msg.type) {
    case ToExtensionType.REFRESH:
      void this.stateManager.refresh();
      break;
    case ToExtensionType.OPEN_DOCUMENT:
      // Placeholder for Epic 5
      break;
    case ToExtensionType.EXECUTE_WORKFLOW:
    case ToExtensionType.COPY_COMMAND:
      // Placeholder for Epic 4
      break;
  }
}
```

**Extension Entry Point Updates**

```typescript
// Key changes to src/extension/extension.ts

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const detector = new BmadDetector();
  const detectionResult = await detector.detectBmadProject();

  if (detectionResult.detected) {
    // Create services
    const fileWatcher = new FileWatcher(detector);
    const stateManager = new StateManager(detector, fileWatcher);

    // Start services
    fileWatcher.start();
    await stateManager.initialize();

    // Register dashboard with StateManager dependency
    const dashboardProvider = new DashboardViewProvider(
      context.extensionUri, detectionResult, stateManager
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        DashboardViewProvider.viewType, dashboardProvider
      ),
      vscode.commands.registerCommand('bmad.refresh', () => {
        void stateManager.refresh();
      }),
      fileWatcher,
      stateManager
    );
  } else {
    // Non-BMAD workspace - register provider without state manager
    const dashboardProvider = new DashboardViewProvider(
      context.extensionUri, detectionResult
    );
    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        DashboardViewProvider.viewType, dashboardProvider
      )
    );
  }
}
```

**CRITICAL: TypeScript Path Aliases**

Check how imports resolve in the webview context. The project may use path aliases like `@shared/` or relative paths. Look at existing webview imports for the correct pattern:
- If the project uses `@shared/messages` → use that
- If the project uses `../../shared/messages` → use relative paths
- Check `tsconfig.webview.json` for path aliases

**CRITICAL: VS Code API Type Declaration**

The webview context needs `acquireVsCodeApi` to be available. Check if there's a type declaration file (e.g., `vscode-webview.d.ts` or similar) that declares this global. If not, you'll need to create one or use a type assertion.

### Performance Requirements

- **NFR1**: Dashboard initial render within 1 second - Zustand store is synchronous, so state updates are instant. The bottleneck is the webview loading time, not store initialization.
- **NFR2**: State updates within 500ms - Zustand's `set()` is synchronous with React batched rendering. State update + re-render will be well under 500ms.

### Testing Strategy

**Zustand Store Tests (Vitest):**
```typescript
import { useDashboardStore } from './store';

// Zustand stores can be tested by calling getState() and setState()
// No React rendering needed for pure store logic tests
const store = useDashboardStore;

test('updateState replaces full state', () => {
  store.getState().updateState(newState);
  expect(store.getState().sprint).toEqual(newState.sprint);
});
```

**Message Handler Tests (Vitest + @testing-library/react):**
```typescript
// Use renderHook from @testing-library/react
// Mock window.addEventListener/removeEventListener
// Simulate MessageEvent with STATE_UPDATE payload
```

**VS Code API Tests (Vitest):**
```typescript
// Mock window.acquireVsCodeApi as a global
// Test singleton pattern - multiple calls return same instance
// Test postMessage forwards to vscodeApi.postMessage
```

### Project Structure Notes

**Files to Create:**
- `src/webviews/dashboard/store.ts` - Zustand store
- `src/webviews/dashboard/store.test.ts` - Store unit tests
- `src/webviews/dashboard/hooks/use-message-handler.ts` - Message handler hook
- `src/webviews/dashboard/hooks/use-message-handler.test.ts` - Hook tests
- `src/webviews/shared/hooks/use-vscode-api.ts` - VS Code API hook
- `src/webviews/shared/hooks/use-vscode-api.test.ts` - Hook tests

**Files to Modify:**
- `src/extension/providers/dashboard-view-provider.ts` - Add StateManager integration
- `src/extension/extension.ts` - Wire up FileWatcher + StateManager + Provider
- `src/webviews/dashboard/index.tsx` - Connect Dashboard to store
- `src/webviews/dashboard/hooks/index.ts` - Export useMessageHandler
- `src/webviews/shared/hooks/index.ts` - Export useVSCodeApi

**Dependencies (already installed - no new packages):**
- `zustand` ^5.0.0 (already in package.json)
- `react` 19.2.0 (already installed)
- `@testing-library/react` (already installed for webview tests)

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management] - Zustand for webviews, extension host single source of truth
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - ToWebview/ToExtension discriminated unions
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns] - Dashboard directory structure with store.ts, hooks/
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns] - Loading states (skeleton UI, not spinner), error recovery
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1] - Acceptance criteria
- [Source: src/shared/messages.ts] - Complete message protocol with factories and type guards
- [Source: src/shared/types/dashboard-state.ts] - DashboardState interface and createInitialDashboardState()
- [Source: src/extension/services/state-manager.ts] - StateManager with onStateChange event
- [Source: src/extension/providers/dashboard-view-provider.ts] - Current DashboardViewProvider (needs StateManager dependency)
- [Source: src/extension/extension.ts] - Current activation logic (needs FileWatcher + StateManager wiring)
- [Source: src/webviews/dashboard/index.tsx] - Current Dashboard component (renders Placeholder)
- [Source: _bmad-output/planning-artifacts/prd.md#NFR1] - 1s initial render requirement
- [Source: _bmad-output/planning-artifacts/prd.md#NFR2] - 500ms update requirement

### Previous Story Intelligence

**From Story 2.6 (State Manager with Parse Error Collection):**
- StateManager exposes `onStateChange: Event<DashboardState>` for webview notification
- StateManager exposes `state` getter for initial state access
- StateManager exposes `refresh()` method for manual re-parse
- `DashboardState` contains: sprint, epics, currentStory, errors, loading
- Internal `_parsedStories: Map<string, Story>` is NOT exposed to webviews - only `currentStory`
- Uses immutable state updates via spread operator
- Implements `vscode.Disposable` for cleanup

**From Story 2.5 (File Watcher Service):**
- FileWatcher needs `start()` called after construction
- Uses sinon for mocking VS Code APIs in tests
- 30 comprehensive tests - aim for similar coverage
- Services implement `vscode.Disposable` for proper cleanup
- Use VS Code's `EventEmitter` for event-based communication

**From Story 1.4 (Sidebar Panel Registration):**
- `DashboardViewProvider` currently takes `(extensionUri, detectionResult)` - needs `stateManager` added
- `handleMessage()` is currently a no-op placeholder - needs implementation
- `refresh()` currently reloads webview HTML - should instead trigger StateManager.refresh()
- Webview HTML loads from `out/webview/index.js` and `out/webview/index.css`

**Git Intelligence:**
- Recent commits follow `feat: X-Y: Story Title` or `feat: X-Y-story-name` format
- Package manager: `pnpm` (NOT npm)
- Test frameworks: Vitest for webview, mocha for extension host
- Existing tests: 62+ passing across all stories
- Build commands: `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

### Integration Points

**Upstream Dependencies:**
- `StateManager.onStateChange` - provides state updates to forward to webview
- `StateManager.state` - provides initial state for webview
- `StateManager.refresh()` - triggered by webview REFRESH messages
- `createStateUpdateMessage()` from `src/shared/messages.ts` - factory for STATE_UPDATE messages
- `DashboardState` from `src/shared/types/dashboard-state.ts` - shared state interface

**Downstream Consumers (Stories 3.2-3.6):**
- Story 3.2 (Sprint Status Display): Will use `useSprint()` selector from store
- Story 3.3 (Epic List): Will use `useEpics()` selector from store
- Story 3.4 (Story Card): Will use `useCurrentStory()` selector from store
- Story 3.5 (Next Action): Will use multiple selectors from store
- Story 3.6 (Manual Refresh): Will use `useVSCodeApi()` to send REFRESH message

**Data Flow (Complete Pipeline):**
```
Extension Activation
  -> BmadDetector.detectBmadProject()
  -> FileWatcher.start()
  -> StateManager.initialize()
      -> parseAll()
      -> onStateChange fires
  -> DashboardViewProvider receives state
      -> webview.postMessage(STATE_UPDATE)
  -> Webview receives message
      -> useMessageHandler processes it
      -> Zustand store.updateState(state)
      -> React components re-render

User Clicks Refresh
  -> Webview postMessage(REFRESH)
  -> DashboardViewProvider.handleMessage()
  -> StateManager.refresh()
      -> parseAll()
      -> onStateChange fires
  -> DashboardViewProvider forwards state
  -> Webview store updates
  -> React re-renders
```

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed Epic type in store tests (missing `key`, `description`, `metadata` fields) caught by typecheck
- Fixed ESLint `@typescript-eslint/no-unsafe-*` errors on `acquireVsCodeApi()` calls with eslint-disable comments
- Prettier auto-fixed formatting in extension.ts and dashboard-view-provider.ts

### Completion Notes List

- Task 1: Created Zustand store with DashboardStore interface, updateState/setLoading/setError actions, and 5 selector hooks. 12 unit tests pass.
- Task 2: Created useVSCodeApi hook with singleton pattern wrapping acquireVsCodeApi(). Exported from shared hooks index. 3 unit tests pass.
- Task 3: Created useMessageHandler hook with window message listener, STATE_UPDATE and ERROR handling, cleanup on unmount. Exported from dashboard hooks index. 5 unit tests pass.
- Task 4: Updated DashboardViewProvider with optional StateManager dependency, onStateChange subscription, handleMessage implementation for REFRESH/OPEN_DOCUMENT/EXECUTE_WORKFLOW/COPY_COMMAND, and onDidChangeVisibility for initial state.
- Task 5: Updated extension.ts to create FileWatcher and StateManager when BMAD detected, pass StateManager to DashboardViewProvider, wire bmad.refresh to StateManager.refresh(), and register all services for disposal.
- Task 6: Updated Dashboard component to use useMessageHandler hook, send REFRESH on mount, and conditionally render loading state or Placeholder with data-testid attributes.
- Task 7: All 20 new unit tests pass (12 store + 5 message handler + 3 VS Code API).
- Task 8: pnpm typecheck, lint, test (212 total pass), and build all succeed.

### Senior Developer Review (AI)

**Reviewer:** Boss on 2026-02-09
**Outcome:** APPROVED with fixes applied
**Issues Found:** 2 High, 3 Medium, 2 Low - ALL FIXED

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| H1 | HIGH | `useVSCodeApi` wasn't a real React hook (no hook calls inside) | Added `useMemo` wrapper to make it a proper hook; updated tests to use `renderHook` |
| H2 | HIGH | `refresh()` method on DashboardViewProvider was dead code | Removed the dead method entirely |
| M1 | MEDIUM | `handleMessage` used unsafe `as ToExtension` cast with no runtime validation | Added `typeof`/`'type' in` guard before cast |
| M2 | MEDIUM | Selector hook tests tested inline selectors, not actual exported hooks | Rewrote to import and test `useSprint`/`useEpics`/etc. via `renderHook` |
| M3 | MEDIUM | Loading state showed "Loading..." text instead of skeleton UI per architecture | Replaced with animated skeleton placeholder bars using VS Code theme colors |
| L1 | LOW | Initial state delivery required unnecessary REFRESH round-trip | Provider now sends `stateManager.state` immediately in `resolveWebviewView` |
| L2 | LOW | Test used `globalThis` while implementation used `window` | Changed test to consistently use `window` |

**Verification:** typecheck, lint, 212 tests, build all pass after fixes.

### Change Log

- 2026-02-09: Senior Developer Review - Found and fixed 7 issues (2H, 3M, 2L). All fixes verified with passing CI.
- 2026-02-06: Implemented Story 3.1 - Dashboard Zustand Store and Message Handler. Created webview state management with Zustand, VS Code API hook, message handler hook, and wired extension host bidirectional communication.

### File List

**New Files:**
- src/webviews/dashboard/store.ts
- src/webviews/dashboard/store.test.ts
- src/webviews/shared/hooks/use-vscode-api.ts
- src/webviews/shared/hooks/use-vscode-api.test.ts
- src/webviews/dashboard/hooks/use-message-handler.ts
- src/webviews/dashboard/hooks/use-message-handler.test.ts

**Modified Files:**
- src/extension/providers/dashboard-view-provider.ts
- src/extension/extension.ts
- src/webviews/dashboard/index.tsx
- src/webviews/dashboard/hooks/index.ts
- src/webviews/shared/hooks/index.ts
