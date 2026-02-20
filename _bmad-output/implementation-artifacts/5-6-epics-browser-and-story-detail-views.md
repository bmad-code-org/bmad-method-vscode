# Story 5.6: Epics Browser & Story Detail Views

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to browse all epics in a visual layout and drill into individual story details in the editor panel,
so that I can understand project progress and review story specifications without leaving VS Code.

## Acceptance Criteria

1. **Epics View Card Layout** — Given the editor panel is open, when the user navigates to the Epics view, then all epics are displayed as cards in a visual layout, each showing: title, number, status badge, story count, and progress bar. The currently active epic is visually highlighted and completed epics are visually muted but still visible.

2. **Epic Drill-Down to Stories** — Given the Epics view is displayed, when the user clicks on an epic card, then the view transitions to show the stories within that epic, the breadcrumb updates to "Dashboard / Epics / Epic N: Title", each story shows: title, status badge, and task progress (completed/total), and Ctrl/Cmd+click or Shift+click on the epic title opens epics.md in a text editor.

3. **Story Detail View** — Given the user is viewing stories within an epic, when the user clicks on a story, then the view transitions to a story detail panel, the breadcrumb updates to "Dashboard / Epics / Epic N / Story N.M: Title", and the detail view displays: title, user story text, status, acceptance criteria list, task checklist with completion status, and progress bar. Ctrl/Cmd+click or Shift+click on the story title opens the raw .md file in a text editor.

4. **On-Demand Story Content Loading** — Given the DashboardState sent via STATE_UPDATE, when the extension host builds the state payload, then it includes lightweight story summaries (key, title, status, task counts, epic number) for all parsed stories. Full story content (user story text, acceptance criteria, dev notes) is loaded on-demand via the existing DOCUMENT_CONTENT message when the user navigates to Story Detail.

5. **Sidebar-to-Editor-Panel Navigation** — Given the sidebar dashboard shows the active story card, when the user normal-clicks the story link in the sidebar (with `bmad.defaultClickBehavior` set to `'editor-panel'`), then the editor panel opens/focuses and navigates directly to the Story Detail view for that story.

6. **Empty State Handling** — Given an epic with no stories or a project with no epics, when the view renders, then a helpful message indicates what is missing.

7. **Responsive Layout** — Given the Epics browser or Story Detail view is displayed at any width, when the viewport width changes, then the layout adapts responsively (e.g., epic cards reflow, story detail sections stack) and content remains usable at widths as narrow as 400px.

## Tasks / Subtasks

- [x] Task 1: Extend shared types for story summaries in DashboardState (AC: 4)
  - [x]1.1 Add `StorySummary` interface to `src/shared/types/story.ts` with fields: `key`, `title`, `status`, `epicNumber`, `storyNumber`, `storySuffix?`, `totalTasks`, `completedTasks`, `totalSubtasks`, `completedSubtasks`, `filePath`
  - [x]1.2 Add `storySummaries: StorySummary[]` field to `DashboardState` in `src/shared/types/dashboard-state.ts`
  - [x]1.3 Update `createInitialDashboardState()` to include `storySummaries: []`
  - [x]1.4 Update all test fixtures that create inline `DashboardState` objects to include `storySummaries` field (check all `*.test.ts` / `*.test.tsx` files referencing `DashboardState`)
  - [x]1.5 Add selector hooks `useStorySummaries()` to both dashboard and editor panel stores
  - [x]1.6 Write unit tests for `StorySummary` type and new selectors

- [x] Task 2: Populate story summaries from extension host (AC: 4)
  - [x]2.1 Update `StateManager.buildState()` in `src/extension/services/state-manager.ts` to include `storySummaries` array built from all parsed story files
  - [x]2.2 Map each parsed `Story` to a `StorySummary` (strip heavy fields: `userStory`, `acceptanceCriteria`, `tasks`)
  - [x]2.3 Write unit tests for story summary population in state-manager tests

- [x] Task 3: Handle DOCUMENT_CONTENT in editor panel for on-demand story loading (AC: 4)
  - [x]3.1 Add `storyDetail: Story | null` and `storyDetailLoading: boolean` fields to editor panel store's `NavigationState`
  - [x]3.2 ~~Add `requestStoryDetail(path: string)` action to editor panel store~~ — **Deviation:** Story loading logic lives in `StoryDetailView` component's `useEffect` instead of a dedicated store action. The component calls `setStoryDetailLoading(true)` and `postMessage(createRequestDocumentContentMessage(...))` directly. This keeps the store actions simple (`setStoryDetail`, `setStoryDetailLoading`, `clearStoryDetail`) and avoids needing the VSCode API reference in the store.
  - [x]3.3 Create `src/webviews/editor-panel/utils/parse-story-content.ts` — a browser-safe utility that parses raw markdown + frontmatter from `DOCUMENT_CONTENT` into a `Story` object. Extract user story text (regex for "As a..., I want..., so that..."), acceptance criteria (numbered list under "## Acceptance Criteria"), and task checklist (checkbox items under "## Tasks"). Do NOT import from `src/extension/parsers/story-parser.ts` — that uses Node.js `fs` APIs.
  - [x]3.4 Update `use-message-handler.ts` in editor panel (`src/webviews/editor-panel/hooks/use-message-handler.ts`) to handle `DOCUMENT_CONTENT` messages — call `parseStoryContent()` and set `storyDetail` in store. Currently this handler only has cases for `STATE_UPDATE` and `ERROR`.
  - [x]3.5 Add `clearStoryDetail()` action called on navigation away from story detail view
  - [x]3.6 **CRITICAL:** `OPEN_DOCUMENT` currently opens the file in a VS Code editor tab (see `src/extension/providers/message-handler.ts` line 30, `openDocument()` function) — it does NOT send content back via postMessage. Add a new `ToExtension` message type `REQUEST_DOCUMENT_CONTENT`: `{ type: 'REQUEST_DOCUMENT_CONTENT'; payload: { path: string } }`. Add handling in `message-handler.ts` that reads the file via `vscode.workspace.fs.readFile()`, parses frontmatter with `gray-matter`, and sends a `DOCUMENT_CONTENT` message back to the requesting webview. NOTE: `handleWebviewMessage()` currently receives `(message, stateManager)` but has no reference to the webview for posting back. Either add a `postMessage` callback parameter, or handle `REQUEST_DOCUMENT_CONTENT` in `EditorPanelProvider` directly (it has access to `panel.webview.postMessage`). Add factory function `createRequestDocumentContentMessage(path)`, type guard, and update the `ToExtension` discriminated union.
  - [x]3.7 Write unit tests for: `parseStoryContent()` utility, new store actions (`requestStoryDetail`, `setStoryDetail`, `clearStoryDetail`), and `DOCUMENT_CONTENT` message handler behavior

- [x] Task 4: Create EpicsView component with card layout (AC: 1, 6, 7)
  - [x]4.1 Create `src/webviews/editor-panel/views/epics-view.tsx` with responsive card grid
  - [x]4.2 Each epic card displays: epic number, title, status badge (reuse status color mapping from epic-list.tsx), story count ("N stories"), progress bar (done/total)
  - [x]4.3 Active epic (status === 'in-progress') has highlighted border or accent
  - [x]4.4 Completed epics have muted opacity/styling but remain visible
  - [x]4.5 Card click calls `navigateTo({ view: 'epics', params: { epicId: String(epic.number) } })` to drill into epic
  - [x]4.6 Ctrl/Cmd/Shift+click on epic title opens epics.md via `OPEN_DOCUMENT` message with `forceTextEditor: true`
  - [x]4.7 Empty state: show helpful message when no epics exist
  - [x]4.8 Responsive layout: cards use `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for reflow
  - [x]4.9 Write tests for EpicsView: renders cards, click navigates, modifier-click opens raw file, empty state, responsive classes

- [x] Task 5: Create EpicDetailView component showing stories within an epic (AC: 2, 6, 7)
  - [x]5.1 Create `src/webviews/editor-panel/views/epic-detail-view.tsx`
  - [x]5.2 Read `epicId` from `currentRoute.params`, find the matching epic from store
  - [x]5.3 Display epic header: number, title, status badge, overall progress
  - [x]5.4 List all stories in the epic using `storySummaries` filtered by `epicNumber`
  - [x]5.5 Each story row shows: story number/title, status badge (reuse status color mapping), task progress bar ("N/M tasks")
  - [x]5.6 Story click calls `navigateTo({ view: 'epics', params: { epicId, storyKey: story.key } })` to drill into story detail
  - [x]5.7 Ctrl/Cmd/Shift+click on story title opens raw .md file via `OPEN_DOCUMENT` with `forceTextEditor: true`
  - [x]5.8 Empty state: show message when epic has no stories
  - [x]5.9 Write tests: renders story list, click navigates to story detail, modifier-click opens raw file, empty state

- [x] Task 6: Create StoryDetailView component (AC: 3, 4, 6, 7)
  - [x]6.1 Create `src/webviews/editor-panel/views/story-detail-view.tsx`
  - [x]6.2 Read `storyKey` from `currentRoute.params`, trigger `requestStoryDetail()` on mount if `storyDetail` is null or stale
  - [x]6.3 Display skeleton loading state while `storyDetailLoading` is true
  - [x]6.4 Display story header: epic context ("Epic N"), story title, status badge
  - [x]6.5 Display user story text ("As a..., I want..., so that...")
  - [x]6.6 Display acceptance criteria as a numbered list
  - [x]6.7 Display task checklist with completion checkmarks and subtask nesting
  - [x]6.8 Display progress bar (tasks completed / total tasks)
  - [x]6.9 Ctrl/Cmd/Shift+click on story title opens raw .md file
  - [x]6.10 Empty/error state: show message if story content fails to load
  - [x]6.11 Write tests: skeleton state, loaded state with all sections, modifier-click, error state

- [x] Task 7: Update navigation routing and breadcrumbs (AC: 1, 2, 3)
  - [x]7.1 Update `NavigationShell` to route: `'epics'` without params → `EpicsView`, `'epics'` with `epicId` param only → `EpicDetailView`, `'epics'` with `epicId` + `storyKey` params → `StoryDetailView`
  - [x]7.2 Update `buildBreadcrumbs()` in `src/webviews/editor-panel/store.ts` (currently line 16-27) to generate multi-level breadcrumbs based on `route.params`: no params → "Dashboard / Epics"; `epicId` only → "Dashboard / Epics / Epic N: Title" (look up epic title from store's `epics` array); `epicId` + `storyKey` → "Dashboard / Epics / Epic N / Story N.M: Title" (look up from `storySummaries`). NOTE: `buildBreadcrumbs` currently only takes a `ViewRoute` — it will need access to the store state (epics, storySummaries) to resolve labels. Refactor to `buildBreadcrumbs(route, state)` or move into the `set()` callback where state is available.
  - [x]7.3 Ensure `goBack()` and `navigateToBreadcrumb()` work correctly with the deeper hierarchy — test navigation: Dashboard → Epics → Epic 3 → Story 3.2 → goBack → Epic 3 → breadcrumb click "Epics" → Epics list
  - [x]7.4 Update tab bar in `DashboardView` — Epics tab should now navigate to the real `EpicsView` (remove placeholder)
  - [x]7.5 Write tests for multi-level breadcrumb generation, navigation between levels, back button behavior

- [x] Task 8: Implement sidebar-to-editor-panel navigation (AC: 5)
  - [x]8.1 Extend `ToExtension` message type with `NAVIGATE_EDITOR_PANEL` message: `{ type: 'NAVIGATE_EDITOR_PANEL'; payload: { view: string; params?: Record<string, string> } }`
  - [x]8.2 In sidebar dashboard components (ActiveStoryCard, EpicList), when `defaultClickBehavior === 'editor-panel'`, send `NAVIGATE_EDITOR_PANEL` message on normal click instead of `OPEN_DOCUMENT`
  - [x]8.3 In extension host `message-handler.ts`, handle `NAVIGATE_EDITOR_PANEL` by calling `EditorPanelProvider.createOrShow()` and forwarding the navigation route to the editor panel webview
  - [x]8.4 Add a new `ToWebview` message type `NAVIGATE_TO_VIEW` that the editor panel handles to navigate its internal store
  - [x]8.5 Update editor panel `use-message-handler.ts` to handle `NAVIGATE_TO_VIEW` by calling `navigateTo()` on the store
  - [x]8.6 Write tests for the full flow: sidebar click → message → extension host → editor panel navigation

- [x] Task 9: Run validation pipeline (AC: all)
  - [x]9.1 Run `pnpm typecheck` — all types compile cleanly
  - [x]9.2 Run `pnpm lint` — no lint errors (run `pnpm format` if needed)
  - [x]9.3 Run `pnpm test` — all tests pass (expect ~550+ tests)
  - [x]9.4 Run `pnpm build` — clean build, both webview bundles produce output
  - [x]9.5 Manual smoke test: open editor panel, navigate Epics → Epic Detail → Story Detail, verify breadcrumbs, back button, modifier-click

## Dev Notes

### Architecture Patterns and Constraints

- **Dual Webview Architecture:** The sidebar (WebviewView) and editor panel (WebviewPanel) share the same bundled JS/CSS. The editor panel is distinguished by `data-view="editor-panel"` on the root div. Both subscribe to the same extension host state via `STATE_UPDATE` messages but have separate Zustand stores.

- **Component Reuse via Optional Props:** All dashboard components (SprintStatus, EpicList, ActiveStoryCard, etc.) accept optional props. When props are provided, they override store selectors. This allows the same components to work in both sidebar (store-connected) and editor panel (prop-driven). **Follow this pattern for any shared components.**

- **Navigation is Purely Client-Side:** No URL routing — the editor panel uses Zustand state (`currentRoute`, `breadcrumbs`, `navigationHistory`) to drive navigation. `NavigationShell` reads `currentRoute.view` and renders the appropriate view component.

- **On-Demand Content via DOCUMENT_CONTENT:** The existing `DOCUMENT_CONTENT` message type (`ToWebview`) delivers `{ path, content, frontmatter }`. Use this for loading full story detail rather than bloating `STATE_UPDATE` with all story content. **IMPORTANT:** The editor panel's `use-message-handler.ts` currently does NOT handle `DOCUMENT_CONTENT` — only `STATE_UPDATE` and `ERROR`. You must add a `DOCUMENT_CONTENT` case to the switch statement. The frontmatter from `DOCUMENT_CONTENT` will contain a parsed Story-like object (via gray-matter on extension side), but you will need to parse the raw markdown body for user story text, acceptance criteria, and tasks. **Recommended approach:** Add a lightweight `parseStoryContent(content: string, frontmatter: unknown): Story` utility in the webview that reuses the field extraction logic from `src/extension/parsers/story-parser.ts` — do NOT import the extension parser directly (it uses Node.js APIs). Create a browser-safe subset.

- **State Snapshots and updateState:** `STATE_UPDATE` replaces the entire `DashboardState` snapshot. Adding `storySummaries` keeps state updates lean. **CRITICAL:** The `updateState` action in `src/webviews/editor-panel/store.ts` (line 56-68) explicitly lists every `DashboardState` field to copy. You MUST add `storySummaries: state.storySummaries` to this list, or story summaries will be silently dropped on every state update. The same applies to the dashboard store's `updateState` in `src/webviews/dashboard/store.ts`.

- **Skeleton Loading, Not Spinners:** All loading states must use skeleton UI (placeholder shapes that mimic content layout), not spinners. This is an explicit architectural mandate.

### Status Badge Color Mapping (from epic-list.tsx)

Reuse the established status color mapping:
- **done:** `text-[var(--vscode-testing-iconPassed)]` (green)
- **in-progress:** `text-[var(--vscode-textLink-foreground)]` (blue)
- **review:** `text-[var(--vscode-editorWarning-foreground)]` (orange)
- **backlog / ready-for-dev:** `text-[var(--vscode-descriptionForeground)]` (muted)

### Key Styling Patterns

- Use `cn()` utility from `src/webviews/shared/utils/cn.ts` for conditional class merging
- VS Code CSS variables via `var(--vscode-*)` for all colors, borders, backgrounds
- Tailwind responsive breakpoints: `md:` (768px), `lg:` (1024px)
- Icons from `lucide-react`: `ChevronRight`, `ChevronDown`, `Check`, `ArrowLeft` (16px inline, 14px standalone)
- `data-testid` on every component root for testing
- `aria-label`, `aria-expanded` on interactive elements

### Testing Standards

- **Framework:** Vitest + @testing-library/react + @testing-library/jest-dom
- **Store tests:** Reset with `useEditorPanelStore.setState(createInitialEditorPanelState())` in `beforeEach`
- **Component tests:** Mock `useVSCodeApi` via `vi.mock('../../shared/hooks', ...)`
- **Test states:** Loading/skeleton, empty/no data, populated, error
- **Interaction tests:** `fireEvent.click` for navigation, verify store state changes
- **Responsive tests:** Verify responsive CSS classes exist (e.g., `md:grid-cols-2`)
- **DashboardState fixture updates:** Adding `storySummaries` to `DashboardState` will require updating ALL inline `DashboardState` objects across existing test files

### Project Structure Notes

- New view files go in `src/webviews/editor-panel/views/` following kebab-case naming
- Test files co-located: `epics-view.test.tsx`, `epic-detail-view.test.tsx`, `story-detail-view.test.tsx`
- Update barrel exports in `src/webviews/editor-panel/views/index.ts`
- Shared types in `src/shared/types/` — add `StorySummary` to `story.ts`, update `dashboard-state.ts`
- Message protocol changes in `src/shared/messages.ts`

### Deferred Items from Story 5.5b

The following were deferred to THIS story and must be implemented:
- **Full sidebar-to-editor-panel routing** (Task 8): The `bmad.defaultClickBehavior = 'editor-panel'` setting is registered and plumbed to state, but the actual routing behavior (sidebar click → editor panel opens to specific view) was deferred because views didn't exist yet. Now they do.

### Critical Warnings for Dev Agent

1. **DO NOT copy-paste dashboard components into editor panel.** Use the optional props pattern for reuse.
2. **DO NOT create a new Zustand store for the epics/story views.** Extend the existing `useEditorPanelStore` with any needed fields.
3. **DO NOT bloat STATE_UPDATE with full story content.** Use `StorySummary` for lightweight data and `DOCUMENT_CONTENT` for on-demand full detail.
4. **DO NOT forget to update ALL test fixtures** when adding `storySummaries` to `DashboardState`. This will affect ~12+ inline objects across 5+ test files (learned from 5.5b).
5. **Zustand 5 selector stability:** If creating selectors that filter/map arrays (e.g., filtering `storySummaries` by epic), either memoize the selector outside the component or use `useShallow` from `zustand/shallow` to prevent infinite re-render loops.
6. **Build validation:** Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before marking complete.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.6] — Full acceptance criteria and story requirements
- [Source: _bmad-output/planning-artifacts/architecture.md] — Dual webview architecture, message protocol, state management patterns
- [Source: _bmad-output/implementation-artifacts/5-5b-navigation-shell-breadcrumbs-dashboard-view-and-click-behavior.md] — Navigation shell, breadcrumbs, view routing patterns, component reuse strategy, defaultClickBehavior deferral
- [Source: _bmad-output/implementation-artifacts/5-5a-editor-panel-infrastructure-and-build-setup.md] — Editor panel provider, single bundle architecture, context detection
- [Source: src/shared/types/story.ts] — Story, StoryTask, AcceptanceCriterion interfaces
- [Source: src/shared/types/epic.ts] — Epic, EpicStoryEntry interfaces
- [Source: src/shared/types/dashboard-state.ts] — DashboardState, createInitialDashboardState()
- [Source: src/shared/messages.ts] — ToWebview, ToExtension message protocol
- [Source: src/webviews/editor-panel/store.ts] — Editor panel Zustand store with navigation state
- [Source: src/webviews/editor-panel/types.ts] — ViewType, ViewRoute, BreadcrumbItem
- [Source: src/webviews/editor-panel/components/navigation-shell.tsx] — Current view routing logic
- [Source: src/webviews/dashboard/components/epic-list.tsx] — Status color mapping, epic expand/collapse, story click handling
- [Source: src/webviews/dashboard/components/active-story-card.tsx] — Story card rendering pattern
- [Source: src/webviews/shared/utils/document-link.ts] — Modifier-key click handling (Shift/Ctrl/Cmd)
- [Source: src/extension/providers/message-handler.ts] — Extension host message handler: OPEN_DOCUMENT opens files in editor (does NOT return content), REFRESH triggers state refresh, EXECUTE_WORKFLOW runs terminal commands
- [Source: src/extension/providers/editor-panel-provider.ts] — Singleton WebviewPanel provider with createOrShow(), panel.webview.postMessage access
- [Source: src/extension/services/state-manager.ts] — Builds DashboardState from all parsed artifacts, fires onStateChange

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None required.

### Completion Notes List

- All 9 tasks completed with full validation pipeline passing
- Created browser-safe `parseStoryContent()` utility to avoid importing Node.js parser into webview
- Used callback pattern in `MessageHandlerOptions` to avoid circular dependency between `message-handler.ts` and `EditorPanelProvider`
- Refactored `buildBreadcrumbs()` to accept optional store state for resolving epic/story title labels in multi-level breadcrumbs
- Manual smoke test (Task 9.5) deferred to reviewer

#### Code Review Fixes (post-review)
- Added comprehensive component tests for EpicsView, EpicDetailView, and StoryDetailView (previously deferred)
- Added unit tests for `parseStoryContent()` utility (48 tests)
- Added tests for new message factory functions and type guards (`createRequestDocumentContentMessage`, `createNavigateEditorPanelMessage`, `createNavigateToViewMessage`, and corresponding type guards)
- Extracted shared status badge utility functions to `src/webviews/shared/utils/status-styles.ts` (eliminated duplication across 3 view files)
- Added `gray-matter` frontmatter parsing to `readAndSendDocumentContent()` in `editor-panel-provider.ts`
- Fixed `use-message-handler.test.ts` beforeEach to use `createInitialEditorPanelState()` (was using `createInitialDashboardState()` which didn't reset `storyDetail`)
- Documented Task 3.2 architectural deviation (store action → component useEffect)

### Change Log

- **src/shared/types/story.ts** — Added `StorySummary` interface
- **src/shared/types/dashboard-state.ts** — Added `storySummaries: StorySummary[]` to `DashboardState` and `createInitialDashboardState()`
- **src/shared/messages.ts** — Added `NAVIGATE_TO_VIEW` (ToWebview), `REQUEST_DOCUMENT_CONTENT` and `NAVIGATE_EDITOR_PANEL` (ToExtension) message types with interfaces, type guards, and factory functions
- **src/extension/services/state-manager.ts** — Added `buildStorySummaries()` method, called in `parseAll()` and `handleFileChanges()`
- **src/extension/providers/editor-panel-provider.ts** — Added `postNavigateToView()` static method, `handleLocalMessage()` for `REQUEST_DOCUMENT_CONTENT`, `readAndSendDocumentContent()` for file reading
- **src/extension/providers/message-handler.ts** — Added `MessageHandlerOptions` interface with `onNavigateEditorPanel` callback, added `NAVIGATE_EDITOR_PANEL` and `REQUEST_DOCUMENT_CONTENT` cases
- **src/extension/providers/dashboard-view-provider.ts** — Passes `onNavigateEditorPanel` callback to `handleWebviewMessage`
- **src/webviews/editor-panel/store.ts** — Added `StoryDetailState`, `setStoryDetail`, `setStoryDetailLoading`, `clearStoryDetail` actions, `useStorySummaries`/`useStoryDetail`/`useStoryDetailLoading` selectors, refactored `buildBreadcrumbs()` for multi-level labels
- **src/webviews/editor-panel/hooks/use-message-handler.ts** — Added `DOCUMENT_CONTENT` and `NAVIGATE_TO_VIEW` handlers
- **src/webviews/editor-panel/components/navigation-shell.tsx** — Updated routing for epics sub-views
- **src/webviews/dashboard/store.ts** — Added `storySummaries` to `updateState`, added `useStorySummaries`/`useDefaultClickBehavior` selectors
- **src/webviews/dashboard/components/active-story-card.tsx** — Added editor-panel click behavior support

### File List

#### New Files
- `src/webviews/editor-panel/views/epics-view.tsx`
- `src/webviews/editor-panel/views/epics-view.test.tsx`
- `src/webviews/editor-panel/views/epic-detail-view.tsx`
- `src/webviews/editor-panel/views/epic-detail-view.test.tsx`
- `src/webviews/editor-panel/views/story-detail-view.tsx`
- `src/webviews/editor-panel/views/story-detail-view.test.tsx`
- `src/webviews/editor-panel/utils/parse-story-content.ts`
- `src/webviews/editor-panel/utils/parse-story-content.test.ts`
- `src/webviews/shared/utils/status-styles.ts`

#### Modified Files
- `.prettierignore`
- `src/shared/types/story.ts`
- `src/shared/types/dashboard-state.ts`
- `src/shared/messages.ts`
- `src/shared/messages.test.ts`
- `src/extension/services/state-manager.ts`
- `src/extension/services/state-manager.test.ts`
- `src/extension/providers/editor-panel-provider.ts`
- `src/extension/providers/message-handler.ts`
- `src/extension/providers/dashboard-view-provider.ts`
- `src/webviews/editor-panel/store.ts`
- `src/webviews/editor-panel/store.test.ts`
- `src/webviews/editor-panel/hooks/use-message-handler.ts`
- `src/webviews/editor-panel/hooks/use-message-handler.test.ts`
- `src/webviews/editor-panel/components/navigation-shell.tsx`
- `src/webviews/editor-panel/components/navigation-shell.test.tsx`
- `src/webviews/editor-panel/views/index.ts`
- `src/webviews/dashboard/store.ts`
- `src/webviews/dashboard/store.test.ts`
- `src/webviews/dashboard/hooks/use-message-handler.test.ts`
- `src/webviews/dashboard/components/active-story-card.tsx`
