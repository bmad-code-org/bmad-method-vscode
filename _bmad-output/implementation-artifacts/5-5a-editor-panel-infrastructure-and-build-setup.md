# Story 5.5a: Editor Panel Infrastructure & Build Setup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a dedicated editor panel webview registered and functional, sharing the existing webview bundle,
so that there is a foundation for all editor panel views to be built upon.

## Acceptance Criteria

1. **Editor Panel Opens via Command**
   - Given the extension is activated in a BMAD workspace
   - When the user invokes the `bmad.openEditorPanel` command (via command palette or dashboard action)
   - Then a webview panel opens in the editor area with the title "BMAD Project"
   - And the panel receives STATE_UPDATE messages from the extension host (same state as sidebar)
   - And only one editor panel instance exists at a time (singleton pattern)

2. **Panel Lifecycle (Singleton)**
   - Given the editor panel is open
   - When the user closes and reopens it
   - Then the panel is recreated cleanly (`onDidDispose` clears singleton reference)
   - And the panel restores to the default view

3. **Single Bundle Architecture**
   - Given the build system
   - When `pnpm build` runs
   - Then it produces a single `out/webview/index.js` and `out/webview/index.css` (same as today)
   - And the editor panel HTML loads the same bundle as the sidebar
   - And the webview entry point detects its context (sidebar vs editor panel) and renders the correct root component
   - And `pnpm build` completes without errors
   - And both webviews load correctly

4. **Editor Panel Zustand Store & Message Handling**
   - Given the editor panel webview initializes
   - When it receives STATE_UPDATE messages
   - Then it has its own Zustand store instance subscribing to STATE_UPDATE messages
   - And the store uses the same `DashboardState` shape as the sidebar store
   - And the message handler uses the same pattern as `useMessageHandler`

5. **Placeholder UI**
   - Given the editor panel is open
   - When it renders
   - Then it displays a placeholder layout confirming successful initialization
   - And the placeholder shows the panel title "BMAD Project" and a message like "Editor panel views coming soon"
   - And it uses VS Code theme colors via Tailwind classes

6. **Build Pipeline Passes**
   - `pnpm typecheck` passes
   - `pnpm lint` passes
   - `pnpm test` passes (all existing + new tests)
   - `pnpm build` completes without errors

## Tasks / Subtasks

- [x] Task 1: Create `EditorPanelProvider` class (AC: 1, 2)
  - [x] 1.1 Create `src/extension/providers/editor-panel-provider.ts`
  - [x] 1.2 Implement `EditorPanelProvider` using `vscode.WebviewPanel` (NOT `WebviewViewProvider` — editor panels use a different API)
  - [x] 1.3 Implement singleton pattern: static `currentPanel` reference, `createOrShow()` static method
  - [x] 1.4 Implement `onDidDispose` to clear singleton reference
  - [x] 1.5 Implement `getHtmlForWebview()` reusing the same `out/webview/index.js` + `out/webview/index.css` bundles as sidebar
  - [x] 1.6 Add CSP nonce handling (copy `getNonce()` pattern from `dashboard-view-provider.ts`)
  - [x] 1.7 Subscribe to `StateManager.onStateChange` and post `STATE_UPDATE` messages
  - [x] 1.8 Handle webview-to-extension messages (reuse `handleMessage` logic from `DashboardViewProvider`)
  - [x] 1.9 Send current state immediately on panel creation
  - [x] 1.10 Export from `src/extension/providers/index.ts`

- [x] Task 2: Register command and provider in `extension.ts` (AC: 1)
  - [x] 2.1 Import `EditorPanelProvider`
  - [x] 2.2 Register `bmad.openEditorPanel` command that calls `EditorPanelProvider.createOrShow()`
  - [x] 2.3 Add command to `context.subscriptions` for cleanup

- [x] Task 3: Add command contribution to `package.json` (AC: 1)
  - [x] 3.1 Add `bmad.openEditorPanel` to `contributes.commands` with title "BMAD: Open Editor Panel"

- [x] Task 4: Add webview context detection (AC: 3)
  - [x] 4.1 In `editor-panel-provider.ts` `getHtmlForWebview()`, set a global variable or data attribute to identify context (e.g., `<div id="root" data-view="editor-panel">`)
  - [x] 4.2 In `src/webviews/app.tsx`, read the context from the root element's `data-view` attribute
  - [x] 4.3 Render `<Dashboard />` for sidebar (default/no attribute) and `<EditorPanel />` for `data-view="editor-panel"`

- [x] Task 5: Create editor panel React components (AC: 4, 5)
  - [x] 5.1 Create `src/webviews/editor-panel/index.tsx` — `EditorPanel` component
  - [x] 5.2 Create `src/webviews/editor-panel/store.ts` — own Zustand store (same shape as dashboard store, separate instance)
  - [x] 5.3 Create `src/webviews/editor-panel/hooks/use-message-handler.ts` — reuse same pattern from dashboard
  - [x] 5.4 Create `src/webviews/editor-panel/hooks/index.ts` — barrel export
  - [x] 5.5 Create `src/webviews/editor-panel/components/placeholder.tsx` — placeholder UI with title and "coming soon" message
  - [x] 5.6 Create `src/webviews/editor-panel/components/index.ts` — barrel export
  - [x] 5.7 Wire `EditorPanel` to use its own store, message handler, and render placeholder

- [x] Task 6: Write tests (AC: 1, 2, 4, 5, 6)
  - [x] 6.1 Create `src/extension/providers/editor-panel-provider.test.ts` — test singleton lifecycle, HTML generation, message handling
  - [x] 6.2 Create `src/webviews/editor-panel/store.test.ts` — test store updateState, selectors
  - [x] 6.3 Create `src/webviews/editor-panel/hooks/use-message-handler.test.ts` — test message dispatch
  - [x] 6.4 Create `src/webviews/editor-panel/components/placeholder.test.tsx` — test renders placeholder text and testids
  - [x] 6.5 Create `src/webviews/app.test.tsx` — test context-based routing

- [x] Task 7: Validate build pipeline (AC: 6)
  - [x] 7.1 Run `pnpm typecheck` — must pass
  - [x] 7.2 Run `pnpm lint` — must pass (no new lint errors in changed files)
  - [x] 7.3 Run `pnpm test` — all 439 tests pass (27 test files)
  - [x] 7.4 Run `pnpm build` — completes without errors

## Dev Notes

### Critical Architecture Decision: Single Bundle

**This story uses a SINGLE webview bundle**, not multi-entry Vite. Since this is a local VS Code extension, bundle size is irrelevant. Both sidebar and editor panel load the same `out/webview/index.js` + `out/webview/index.css`.

**Context detection** is done via a `data-view` attribute on the `#root` element:
- Sidebar HTML: `<div id="root"></div>` (no attribute, default = dashboard)
- Editor panel HTML: `<div id="root" data-view="editor-panel"></div>`

`app.tsx` reads this and renders the appropriate root component. This avoids any Vite config changes.

### EditorPanelProvider vs DashboardViewProvider

These are fundamentally different VS Code APIs:

| Aspect | DashboardViewProvider (sidebar) | EditorPanelProvider (editor tab) |
|---|---|---|
| API | `vscode.WebviewViewProvider` | `vscode.WebviewPanel` (via `createWebviewPanel`) |
| Registration | `registerWebviewViewProvider()` | `registerCommand()` that creates panel |
| Lifecycle | VS Code manages (resolve on demand) | Extension manages (singleton pattern) |
| Trigger | Sidebar icon click (automatic) | Command invocation (explicit) |
| Instance | VS Code manages single instance | Extension manages singleton via static ref |

**EditorPanelProvider pattern:**

```typescript
export class EditorPanelProvider {
  public static readonly viewType = 'bmad.editorPanel';
  private static currentPanel: EditorPanelProvider | undefined;
  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  public static createOrShow(
    extensionUri: vscode.Uri,
    stateManager: StateManager
  ): EditorPanelProvider {
    // If panel exists, reveal it
    if (EditorPanelProvider.currentPanel) {
      EditorPanelProvider.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return EditorPanelProvider.currentPanel;
    }
    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      EditorPanelProvider.viewType,
      'BMAD Project',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'out'),
          vscode.Uri.joinPath(extensionUri, 'src', 'webviews'),
        ],
        retainContextWhenHidden: true,
      }
    );
    EditorPanelProvider.currentPanel = new EditorPanelProvider(
      panel, extensionUri, stateManager
    );
    return EditorPanelProvider.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    stateManager: StateManager
  ) {
    this.panel = panel;
    // Set HTML, subscribe to state, handle messages...
    // On dispose: clear singleton ref
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  private dispose(): void {
    EditorPanelProvider.currentPanel = undefined;
    // Clean up disposables
  }
}
```

**Key difference from sidebar:** Use `retainContextWhenHidden: true` so the editor panel doesn't reset when the user switches tabs. The sidebar uses `onDidChangeVisibility` instead because sidebar views are always managed by VS Code.

### Message Handling — Shared Logic

The editor panel handles the SAME message types as the sidebar. The `handleMessage` method in `DashboardViewProvider` handles: `REFRESH`, `OPEN_DOCUMENT`, `EXECUTE_WORKFLOW`, `COPY_COMMAND`.

**Option A (recommended):** Extract a shared `handleWebviewMessage(msg, stateManager)` utility function that both providers call. Place it in `src/extension/providers/message-handler.ts`.

**Option B:** Duplicate the switch statement. Acceptable for now since it's small, but Option A is cleaner.

Either approach is fine — use judgment. The key is that both providers must handle all four `ToExtension` message types.

### Context Detection in app.tsx

```typescript
// src/webviews/app.tsx
import React from 'react';
import { Dashboard } from './dashboard';
import { EditorPanel } from './editor-panel';

export function App(): React.ReactElement {
  const rootEl = document.getElementById('root');
  const view = rootEl?.dataset.view;

  if (view === 'editor-panel') {
    return <EditorPanel />;
  }
  return <Dashboard />;
}
```

This is evaluated once on mount. No dynamic switching needed.

### Editor Panel Store — Separate Instance

The editor panel MUST have its own Zustand store instance (`src/webviews/editor-panel/store.ts`). Do NOT share the sidebar's `useDashboardStore` — both webviews run in separate iframes with separate JS contexts, so they cannot share store instances. The store shape is identical (`DashboardState` + `updateState` + `setLoading` + `setError`), but it's a separate `create()` call.

```typescript
// src/webviews/editor-panel/store.ts
import { create } from 'zustand';
import type { DashboardState } from '@shared/types';
import { createInitialDashboardState } from '@shared/types';

interface EditorPanelStore extends DashboardState {
  updateState: (state: DashboardState) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
}

export const useEditorPanelStore = create<EditorPanelStore>()((set) => ({
  ...createInitialDashboardState(),
  updateState: (state: DashboardState) =>
    set({
      sprint: state.sprint,
      epics: state.epics,
      currentStory: state.currentStory,
      errors: state.errors,
      loading: state.loading,
      outputRoot: state.outputRoot,
      workflows: state.workflows,
      bmadMetadata: state.bmadMetadata,
      planningArtifacts: state.planningArtifacts,
    }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (message: string) =>
    set((prev) => ({
      errors: [...prev.errors, { message, recoverable: true }],
    })),
}));

// Selector hooks
export const useSprint = () => useEditorPanelStore((s) => s.sprint);
export const useEpics = () => useEditorPanelStore((s) => s.epics);
export const useCurrentStory = () => useEditorPanelStore((s) => s.currentStory);
export const useErrors = () => useEditorPanelStore((s) => s.errors);
export const useLoading = () => useEditorPanelStore((s) => s.loading);
export const useOutputRoot = () => useEditorPanelStore((s) => s.outputRoot);
export const useWorkflows = () => useEditorPanelStore((s) => s.workflows);
```

### HTML Template for Editor Panel

The editor panel's `getHtmlForWebview()` is nearly identical to `DashboardViewProvider.getHtmlForWebview()` but with:
1. `data-view="editor-panel"` on the `#root` div
2. Title "BMAD Project" instead of "BMAD Dashboard"
3. Same script/style URIs (`out/webview/index.js`, `out/webview/index.css`)
4. Same CSP policy with nonce

```html
<div id="root" data-view="editor-panel"></div>
<script nonce="${nonce}" src="${scriptUri.toString()}"></script>
```

### Placeholder Component

Keep it simple — a centered message confirming the panel loaded:

```typescript
// src/webviews/editor-panel/components/placeholder.tsx
export function EditorPanelPlaceholder(): React.ReactElement {
  return (
    <div className="flex h-full items-center justify-center p-8" data-testid="editor-panel-placeholder">
      <div className="text-center">
        <h1 className="mb-2 text-lg font-semibold">BMAD Project</h1>
        <p className="text-sm text-[var(--vscode-descriptionForeground)]">
          Editor panel views coming soon.
        </p>
      </div>
    </div>
  );
}
```

### Files NOT to Touch

- `vite.config.ts` — NO changes needed (single bundle)
- `src/webviews/index.tsx` — NO changes (entry point stays the same)
- `src/webviews/index.css` — NO changes (shared CSS)
- `src/webviews/dashboard/**` — NO changes to existing dashboard components
- `src/shared/messages.ts` — NO changes (protocol already supports everything)
- `src/shared/types/**` — NO changes (DashboardState already has all fields)

### Testing Patterns

**EditorPanelProvider tests** follow `dashboard-view-provider.test.ts` patterns. Mock `vscode` namespace (`createWebviewPanel`, `WebviewPanel`, etc.).

**Editor panel React component tests** follow the established pattern:

```typescript
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: vi.fn(() => ({ postMessage: vi.fn() })),
}));

// Set store state
useEditorPanelStore.setState({ ...mockState });

render(<EditorPanelPlaceholder />);
expect(screen.getByTestId('editor-panel-placeholder')).toBeInTheDocument();
```

**app.tsx routing test:**

```typescript
// Test default (no data-view) renders Dashboard
const root = document.getElementById('root');
// root.dataset.view is undefined → renders Dashboard

// Test data-view="editor-panel" renders EditorPanel
root.dataset.view = 'editor-panel';
// → renders EditorPanel
```

### Project Structure Notes

**New files:**

- `src/extension/providers/editor-panel-provider.ts`
- `src/extension/providers/editor-panel-provider.test.ts`
- `src/webviews/editor-panel/index.tsx`
- `src/webviews/editor-panel/store.ts`
- `src/webviews/editor-panel/store.test.ts`
- `src/webviews/editor-panel/hooks/index.ts`
- `src/webviews/editor-panel/hooks/use-message-handler.ts`
- `src/webviews/editor-panel/hooks/use-message-handler.test.ts`
- `src/webviews/editor-panel/components/index.ts`
- `src/webviews/editor-panel/components/placeholder.tsx`
- `src/webviews/editor-panel/components/placeholder.test.tsx`

**Modified files:**

- `src/extension/providers/index.ts` — add `EditorPanelProvider` export
- `src/extension/extension.ts` — register `bmad.openEditorPanel` command
- `src/webviews/app.tsx` — add context-based routing
- `package.json` — add `bmad.openEditorPanel` command contribution

**Optionally modified (if extracting shared message handler):**

- `src/extension/providers/message-handler.ts` — new shared utility (optional)
- `src/extension/providers/dashboard-view-provider.ts` — refactor to use shared handler (optional)

**Deleted files:**

- `src/webviews/document-viewer/index.tsx` — remove stale placeholder (or repurpose directory)
- `src/webviews/document-viewer/components/index.ts` — remove stale placeholder

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.5a]
- [Source: _bmad-output/planning-artifacts/architecture.md#Webview Architecture, Message Protocol, State Management]
- [Source: src/extension/providers/dashboard-view-provider.ts — pattern reference for getHtmlForWebview, getNonce, handleMessage, state subscription]
- [Source: src/extension/extension.ts — where to register command and provider]
- [Source: src/webviews/app.tsx — entry routing point to modify]
- [Source: src/webviews/dashboard/store.ts — Zustand store pattern to replicate]
- [Source: src/webviews/dashboard/hooks/use-message-handler.ts — message handler pattern to replicate]
- [Source: src/shared/messages.ts — ToWebview, ToExtension types, factory functions]
- [Source: src/shared/types/dashboard-state.ts — DashboardState interface shared by both stores]
- [Source: package.json — contributes.commands for new command registration]
- [Source: _bmad-output/implementation-artifacts/5-4-about-section-and-epic-list-ux.md — previous story patterns and learnings]

### Library/Framework Requirements

| Library               | Version  | Usage in This Story                           |
| --------------------- | -------- | --------------------------------------------- |
| React                 | ^19.2.0  | Component framework                           |
| zustand               | ^5.0.0   | Editor panel store (separate instance)        |
| tailwindcss           | ^4.1.0   | Styling with VS Code CSS variables            |
| vitest                | ^4.0.18  | Test runner                                   |
| @testing-library/react| ^16.3.2  | Component testing (render, screen)            |
| sinon                 | ^21.0.1  | Mocking for extension host tests              |

**No new dependencies required.** All libraries are already installed.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Implemented EditorPanelProvider with singleton pattern using `vscode.WebviewPanel` API, distinct from the sidebar's `WebviewViewProvider`
- Extracted shared `handleWebviewMessage()` utility into `message-handler.ts` (Option A from Dev Notes) — both DashboardViewProvider and EditorPanelProvider now delegate to the same handler, eliminating code duplication
- Refactored DashboardViewProvider to remove duplicated message handling logic (openDocument, executeWorkflow, copyCommand methods moved to shared handler)
- Editor panel uses `data-view="editor-panel"` attribute on root div for context detection; `app.tsx` routes to the correct root component based on this attribute
- Editor panel has its own Zustand store instance (`useEditorPanelStore`) with identical shape to the dashboard store
- Registered `bmad.openEditorPanel` command in both `extension.ts` and `package.json`
- Created comprehensive test suite: 26 new tests across 5 test files (singleton lifecycle, HTML generation, message handling, store, message handler, placeholder, app routing)
- Deleted stale `src/webviews/document-viewer/` directory as specified in story Dev Notes
- All 439 tests pass, typecheck passes, lint clean on changed files, build succeeds

**Code Review Fixes (2026-02-20):**
- [H1] Extracted duplicated `getNonce()` into shared `src/extension/providers/webview-utils.ts`; both `DashboardViewProvider` and `EditorPanelProvider` now import from the shared utility
- [M2] Made `EditorPanelProvider` implement `vscode.Disposable` with re-entrancy guard; added static `disposePanel()` method; registered disposal in `extension.ts` `context.subscriptions` for clean extension deactivation
- [M4] Added missing `useBmadMetadata` and `usePlanningArtifacts` selector hooks to editor panel store for API parity with dashboard store
- [M1] Added `_bmad-output/planning-artifacts/epics.md` to File List (was modified in git but not documented)
- Post-review: 441 tests pass (2 new selector tests), typecheck passes, build succeeds

### Implementation Plan

Used Option A (shared message handler) from Dev Notes. Created `src/extension/providers/message-handler.ts` with all message handling logic (REFRESH, OPEN_DOCUMENT, EXECUTE_WORKFLOW, COPY_COMMAND) extracted as module-level functions. Both providers delegate to `handleWebviewMessage()`.

### Change Log

- 2026-02-19: Story 5.5a implementation complete — Editor panel infrastructure with shared message handler, singleton lifecycle, context-based routing, Zustand store, placeholder UI, and comprehensive tests
- 2026-02-20: Code review fixes — extracted getNonce() to shared utility, added EditorPanelProvider disposal tracking, added missing store selectors, documented epics.md in File List

### File List

**New files:**
- src/extension/providers/editor-panel-provider.ts
- src/extension/providers/editor-panel-provider.test.ts
- src/extension/providers/message-handler.ts
- src/extension/providers/webview-utils.ts
- src/webviews/editor-panel/index.tsx
- src/webviews/editor-panel/store.ts
- src/webviews/editor-panel/store.test.ts
- src/webviews/editor-panel/hooks/index.ts
- src/webviews/editor-panel/hooks/use-message-handler.ts
- src/webviews/editor-panel/hooks/use-message-handler.test.ts
- src/webviews/editor-panel/components/index.ts
- src/webviews/editor-panel/components/placeholder.tsx
- src/webviews/editor-panel/components/placeholder.test.tsx
- src/webviews/app.test.tsx

**Modified files:**
- src/extension/providers/index.ts — added EditorPanelProvider export
- src/extension/providers/dashboard-view-provider.ts — refactored to use shared message handler
- src/extension/extension.ts — registered bmad.openEditorPanel command
- src/webviews/app.tsx — added context-based routing (editor-panel vs dashboard)
- package.json — added bmad.openEditorPanel command contribution
- _bmad-output/implementation-artifacts/sprint-status.yaml — status updated
- _bmad-output/planning-artifacts/epics.md — story 5.5a description updated

**Deleted files:**
- src/webviews/document-viewer/index.tsx — removed stale placeholder
- src/webviews/document-viewer/components/index.ts — removed stale placeholder
