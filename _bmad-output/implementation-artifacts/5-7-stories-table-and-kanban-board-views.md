# Story 5.7: Stories Table & Kanban Board Views

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a filterable stories table and a kanban board view showing story cards organized by status columns,
so that I can visualize workflow progress across all stories and quickly find stories by status or epic.

## Acceptance Criteria

1. **Stories Table View** — Given the editor panel is open, when the user navigates to the Stories view, then all stories across all epics are displayed in a table layout with columns: Story ID, Title, Epic, Status, Tasks Progress. Clicking a story row navigates to the Story Detail view.

2. **Kanban Board View** — Given the Stories view is displayed, when the user switches to the Kanban view (via a table/kanban toggle), then stories are displayed as cards organized in columns by status: Backlog, Ready for Dev, In Progress, Review, Done. Each card shows: story title, epic context (e.g., "Epic 3"), and task count (e.g., "4/7"). Each column header shows the column name and story count. Empty columns display a subtle empty state.

3. **Filter Bar** — Given the Stories or Kanban view is displayed, when the user interacts with the filter bar, then they can filter by epic (dropdown), by status (dropdown), and search by story title (text input). Filters are preserved when toggling between table and kanban layouts.

4. **Table/Kanban Toggle** — Given the user switches between table and kanban views, when the toggle is clicked, then the view switches while preserving the current filter state.

5. **Story Navigation from Table/Kanban** — Given a story card in the kanban view or row in the stories table, when the user clicks on it, then the view navigates to the Story Detail view with breadcrumb updated. Ctrl/Cmd+click or Shift+click opens the raw story .md file in a text editor.

6. **Live Status Updates** — Given the kanban board or stories table is open, when story statuses change (detected by file watcher), then cards/rows update to reflect the new status automatically.

7. **Responsive Layout** — Given the Stories table or Kanban board is displayed at any width, when the viewport width changes, then the layout adapts responsively (e.g., kanban columns stack vertically at narrow widths, table scrolls horizontally). Content remains usable at widths as narrow as 400px.

## Tasks / Subtasks

- [x] Task 1: Create StoriesView component with table layout (AC: 1, 3, 4, 5, 7)
  - [x] 1.1 Create `src/webviews/editor-panel/views/stories-view.tsx` with a filter bar at top and table below
  - [x] 1.2 Create a `useFilteredStories()` hook inside the component (or co-located utility) that reads `storySummaries` from the store and applies filters: epic dropdown, status dropdown, title text search. Memoize with `React.useMemo` depending on `[storySummaries, epicFilter, statusFilter, searchText]`
  - [x] 1.3 Render table with columns: Story ID (`epicNumber.storyNumber + storySuffix`), Title, Epic (`Epic N`), Status (using `getStoryStatusClasses` / `getStoryStatusLabel` from `status-styles.ts`), Tasks Progress (e.g., `completedTasks/totalTasks` with inline progress bar)
  - [x] 1.4 Add filter bar above table: epic dropdown (populated from `useEpics()` — show "All Epics" default + each epic number/title), status dropdown (hardcoded list: All, Backlog, Ready for Dev, In Progress, Review, Done), and a text input for title search
  - [x] 1.5 Store filter state in React `useState` (NOT in Zustand store — filters are view-local). Use three state variables: `epicFilter: number | null`, `statusFilter: StoryStatusValue | null`, `searchText: string`
  - [x] 1.6 Add a table/kanban toggle button group in the filter bar area. Use state variable `viewMode: 'table' | 'kanban'` defaulting to `'table'`. When `viewMode === 'kanban'`, render `<KanbanBoard>` instead of the table, passing the same filtered stories
  - [x] 1.7 Table rows are `<button>` elements (like epic-detail-view.tsx story rows) — normal click calls `navigateTo({ view: 'stories', params: { storyKey: story.key } })`, Ctrl/Cmd/Shift+click opens raw `.md` file via `createShiftOpenHandler(vscodeApi, story.filePath, primaryAction)`
  - [x] 1.8 Add empty state when no stories match current filters: "No stories match the current filters"
  - [x] 1.9 Responsive: table container uses `overflow-x-auto` for horizontal scroll on narrow widths. Table uses `min-w-[600px]` to prevent column collapse. Outer container is full width
  - [x] 1.10 Add `data-testid="stories-view"` on root, `data-testid="stories-filter-bar"` on filter section, `data-testid="stories-table"` on table, `data-testid="story-table-row-{key}"` on each row

- [x] Task 2: Create KanbanBoard component (AC: 2, 3, 5, 6, 7)
  - [x] 2.1 Create `src/webviews/editor-panel/components/kanban-board.tsx` as a reusable component. Props: `stories: StorySummary[]` (already filtered by parent), plus navigation/vscodeApi callbacks or hooks
  - [x] 2.2 Define kanban columns as a constant: `const KANBAN_COLUMNS: { status: StoryStatusValue; label: string }[] = [{ status: 'backlog', label: 'Backlog' }, { status: 'ready-for-dev', label: 'Ready for Dev' }, { status: 'in-progress', label: 'In Progress' }, { status: 'review', label: 'Review' }, { status: 'done', label: 'Done' }]`
  - [x] 2.3 For each column, filter stories by `story.status === column.status`. Display column header with label and count (e.g., "In Progress (3)")
  - [x] 2.4 Each story card renders: story title (truncated if needed), epic context label ("Epic N"), task progress as compact text ("N/M tasks"). Use VS Code theme variables for card styling: `bg-[var(--vscode-editor-background)]`, `border-[var(--vscode-panel-border)]`
  - [x] 2.5 Card click: normal click navigates to Story Detail via `navigateTo({ view: 'stories', params: { storyKey: story.key } })`. Ctrl/Cmd/Shift+click opens raw `.md` file — use `createShiftOpenHandler()`
  - [x] 2.6 Empty columns show subtle text: "No stories" in muted description foreground color
  - [x] 2.7 Responsive layout: at `md:` and above, columns display side-by-side using `flex` with `flex-1 min-w-[140px]` per column and `overflow-x-auto` on the container. Below `md:`, columns stack vertically with `flex-col`
  - [x] 2.8 Add `data-testid="kanban-board"` on root, `data-testid="kanban-column-{status}"` on each column, `data-testid="kanban-card-{key}"` on each card

- [x] Task 3: Update NavigationShell routing for stories and kanban views (AC: 1, 2, 5)
  - [x] 3.1 In `src/webviews/editor-panel/components/navigation-shell.tsx`, update `renderView()` switch to handle `'stories'` view: if `params?.storyKey` exists, render `<StoryDetailView />` (reuse existing story detail); otherwise render `<StoriesView />`
  - [x] 3.2 Remove `'stories'` and `'kanban'` from the `PlaceholderView` fallback — the kanban view is integrated WITHIN `StoriesView` as a toggle, so no separate `'kanban'` route case is needed in NavigationShell. The `'kanban'` tab from dashboard-view.tsx should navigate to `{ view: 'stories' }` with the toggle defaulting to kanban mode. **Decision:** Add an optional `params.mode` to the route: `{ view: 'stories', params: { mode: 'kanban' } }`. `StoriesView` reads `params.mode` to set initial `viewMode` state
  - [x] 3.3 Import `StoriesView` from `../views/stories-view`
  - [x] 3.4 Update `buildBreadcrumbs()` in `store.ts` to handle `'stories'` view with story detail breadcrumbs: when `view === 'stories'` and `params?.storyKey`, generate: Dashboard / Stories / Story N.M: Title (lookup from `storySummaries`). When no storyKey, just: Dashboard / Stories

- [x] Task 4: Update DashboardView tab bar for kanban navigation (AC: 4)
  - [x] 4.1 In `src/webviews/editor-panel/views/dashboard-view.tsx`, update the `VIEWS` array entry for kanban: change the `view` from `'kanban'` to `'stories'` and add `params: { mode: 'kanban' }` so clicking the Kanban tab navigates to the stories view in kanban mode
  - [x] 4.2 Update `TabBar` to pass params when navigating: `navigateTo({ view: v.view, ...(v.params && { params: v.params }) })`
  - [x] 4.3 Update the `VIEWS` type to support optional params: `{ label: string; view: ViewType; params?: Record<string, string> }[]`
  - [x] 4.4 Update the `isActive` check in TabBar: for the kanban tab entry, active when `currentView === 'stories' && currentRoute.params?.mode === 'kanban'`. For the stories tab, active when `currentView === 'stories' && !currentRoute.params?.mode`

- [x] Task 5: Update barrel exports and cleanup placeholder (AC: all)
  - [x] 5.1 Add `export { StoriesView } from './stories-view'` to `src/webviews/editor-panel/views/index.ts`
  - [x] 5.2 Update `PlaceholderView` `COMING_SOON_MAP`: remove `stories` and `kanban` entries (only `docs: 'Coming in Story 5.8'` remains as placeholder)
  - [x] 5.3 Update PlaceholderView props type if needed — currently accepts `ViewType`, but `'stories'` and `'kanban'` will no longer route to it

- [x] Task 6: Write comprehensive tests (AC: all)
  - [x] 6.1 Create `src/webviews/editor-panel/views/stories-view.test.tsx`:
    - Renders table view by default with all story data
    - Filters by epic dropdown
    - Filters by status dropdown
    - Filters by title search text
    - Preserves filters when toggling to kanban mode
    - Click row navigates to story detail
    - Modifier-click opens raw file
    - Empty state when no stories match filters
    - Empty state when no stories at all
    - Responsive: verify `overflow-x-auto` class on table container
    - Starts in kanban mode when `params.mode === 'kanban'`
  - [x] 6.2 Create `src/webviews/editor-panel/components/kanban-board.test.tsx`:
    - Renders all 5 status columns with correct headers and counts
    - Places story cards in correct columns by status
    - Empty columns show "No stories" text
    - Card click navigates to story detail
    - Modifier-click on card opens raw file
    - Displays story title, epic context, task count on cards
    - Responsive: verify column layout classes
  - [x] 6.3 Update `src/webviews/editor-panel/components/navigation-shell.test.tsx`:
    - Stories view route renders StoriesView
    - Stories view with storyKey param renders StoryDetailView
    - Kanban route no longer renders PlaceholderView
  - [x] 6.4 Update `src/webviews/editor-panel/store.test.ts`:
    - Test `buildBreadcrumbs` for stories view (Dashboard / Stories)
    - Test `buildBreadcrumbs` for stories view with storyKey (Dashboard / Stories / Story N.M: Title)
  - [x] 6.5 Update `src/webviews/editor-panel/views/dashboard-view.test.tsx` (if exists) or add tests:
    - Kanban tab navigates to `{ view: 'stories', params: { mode: 'kanban' } }`
    - Stories tab navigates to `{ view: 'stories' }`
    - Tab active state correctly highlights for stories vs kanban mode

- [x] Task 7: Run validation pipeline (AC: all)
  - [x] 7.1 Run `pnpm typecheck` — all types compile cleanly
  - [x] 7.2 Run `pnpm lint` — no lint errors (run `pnpm format` if needed)
  - [x] 7.3 Run `pnpm test` — all tests pass
  - [x] 7.4 Run `pnpm build` — clean build, both webview bundles produce output
  - [x] 7.5 Manual smoke test: open editor panel, click Stories tab (table view), toggle to kanban, apply filters, click story card → story detail, verify breadcrumbs, back button, modifier-click

## Dev Notes

### Architecture Patterns and Constraints

- **Dual Webview Architecture:** The sidebar (WebviewView) and editor panel (WebviewPanel) share bundled JS/CSS. The editor panel is distinguished by `data-view="editor-panel"` on the root div. Both subscribe to the same extension host state via `STATE_UPDATE` messages but have separate Zustand stores. This story only touches the editor panel.

- **Component Reuse via Optional Props:** All dashboard components accept optional props for use in both sidebar and editor panel. For the kanban board, create it as a standalone component in `editor-panel/components/` since it is editor-panel-specific (not needed in sidebar).

- **Navigation is Purely Client-Side:** No URL routing — the editor panel uses Zustand state (`currentRoute`, `breadcrumbs`, `navigationHistory`). `NavigationShell` reads `currentRoute.view` and renders the appropriate view. The stories and kanban views are both rendered within `StoriesView` using a local toggle, NOT as separate routes.

- **StorySummary for Lightweight Rendering:** All story data needed for table/kanban is available via `useStorySummaries()` selector. This returns `StorySummary[]` with: key, title, status, epicNumber, storyNumber, storySuffix, totalTasks, completedTasks, totalSubtasks, completedSubtasks, filePath. NO need to load full `Story` objects — save those for `StoryDetailView` on-demand loading.

- **State Snapshots via updateState:** `STATE_UPDATE` replaces the entire `DashboardState` snapshot. Story summaries are already included (added in 5.6). No changes to the store's `updateState` action are needed.

- **Skeleton Loading, Not Spinners:** All loading states must use skeleton UI (placeholder shapes), not spinners. This story does NOT need a loading state since `storySummaries` are always available from state — they arrive with every `STATE_UPDATE`. If summaries are empty, show an empty state message, not a skeleton.

- **Filter State is View-Local:** Use React `useState` for filter values (epicFilter, statusFilter, searchText, viewMode). Do NOT add filters to the Zustand store — they are ephemeral UI state that resets when navigating away and back.

### Kanban/Table Toggle Architecture Decision

The kanban board is NOT a separate navigable view — it is a display mode WITHIN `StoriesView`. Rationale:
- Both views share the same data source (filtered `storySummaries`) and filter bar
- Switching between them should preserve filter state (AC 3, 4)
- Having separate routes would require duplicating filter state management
- The dashboard tab bar navigates: Stories tab → `{ view: 'stories' }`, Kanban tab → `{ view: 'stories', params: { mode: 'kanban' } }`

### Story Detail Navigation from Stories/Kanban

When clicking a story from the table or kanban board, navigate using:
```typescript
navigateTo({ view: 'stories', params: { storyKey: story.key } })
```

This keeps the breadcrumb trail under "Stories" (not "Epics"). The `NavigationShell` routing handles `view: 'stories'` with `params.storyKey` by rendering `<StoryDetailView />` — the SAME component used from the epics flow. The `StoryDetailView` component reads `storyKey` from `currentRoute.params` and loads content on-demand via `REQUEST_DOCUMENT_CONTENT`, which is already implemented.

### Breadcrumb Behavior

Update `buildBreadcrumbs()` in `store.ts` to handle the `'stories'` view:
- `{ view: 'stories' }` → `Dashboard / Stories`
- `{ view: 'stories', params: { mode: 'kanban' } }` → `Dashboard / Stories` (mode doesn't affect breadcrumb)
- `{ view: 'stories', params: { storyKey: '5-7-...' } }` → `Dashboard / Stories / Story 5.7: Title`

### Status Badge Color Mapping (from status-styles.ts)

Reuse the established utility functions:
- `getStoryStatusClasses(status)` → returns Tailwind class string
- `getStoryStatusLabel(status)` → returns human-readable label
- **done:** green (`--vscode-testing-iconPassed`)
- **in-progress:** blue (`--vscode-textLink-foreground`)
- **review:** orange (`--vscode-editorWarning-foreground`)
- **ready-for-dev / backlog:** muted gray (`--vscode-descriptionForeground`)

### Key Styling Patterns

- Use `cn()` utility from `src/webviews/shared/utils/cn.ts` for conditional class merging
- VS Code CSS variables via `var(--vscode-*)` for all colors, borders, backgrounds
- Tailwind responsive breakpoints: `md:` (768px), `lg:` (1024px)
- Icons from `lucide-react`: `Table2`, `LayoutGrid` or `Columns3` for toggle icons (16px inline)
- `data-testid` on every component root for testing
- `aria-label` on interactive elements

### Testing Standards

- **Framework:** Vitest + @testing-library/react + @testing-library/jest-dom
- **Store tests:** Reset with `useEditorPanelStore.setState(createInitialEditorPanelState())` in `beforeEach`
- **Component tests:** Mock `useVSCodeApi` via `vi.mock('../../shared/hooks', ...)`
- **Test states:** Empty/no data, populated with multiple stories, filtered results, toggle between modes
- **Interaction tests:** `fireEvent.click` for navigation, `fireEvent.change` for dropdowns/inputs, verify store state changes
- **Responsive tests:** Verify responsive CSS classes exist (e.g., `overflow-x-auto`, `md:flex-row`)

### Project Structure Notes

- New files go in `src/webviews/editor-panel/views/` (StoriesView) and `src/webviews/editor-panel/components/` (KanbanBoard)
- Test files co-located: `stories-view.test.tsx`, `kanban-board.test.tsx`
- Update barrel exports in `src/webviews/editor-panel/views/index.ts`
- No new shared types needed — `StorySummary` already has everything
- No message protocol changes needed
- No extension host changes needed

### Previous Story Intelligence (from 5.6)

Key learnings from story 5.6 to apply here:
1. **DO NOT create a new Zustand store** — extend existing `useEditorPanelStore` only if truly needed (this story likely needs NO store changes beyond `buildBreadcrumbs`)
2. **DO NOT bloat STATE_UPDATE** — `StorySummary[]` is already included, no new data needed
3. **Zustand 5 selector stability:** If creating selectors that filter/map arrays, either memoize outside the component or use `useShallow` from `zustand/shallow` to prevent infinite re-render loops. The `useFilteredStories()` hook should use `React.useMemo` with store values as deps, NOT create a new Zustand selector that returns a derived array
4. **Build validation:** Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before marking complete
5. **Browser-safe utilities only** — all code in webviews must avoid Node.js APIs. No `fs`, `path`, etc.
6. The callback pattern for `createShiftOpenHandler()` works well for dual-action click handling — use it consistently

### Git Intelligence

Recent commits show the project follows a pattern of:
- One commit per story: `feat: 5-6-epics-browser-and-story-detail-views`
- Files changed per story: typically 10-30 files (new + modified)
- Test coverage is comprehensive: ~550+ tests at last count
- Build system: `pnpm` is used (not npm)

### Critical Warnings for Dev Agent

1. **DO NOT create separate routes for 'stories' and 'kanban'** in NavigationShell. Kanban is a display mode toggle WITHIN `StoriesView`. Only `'stories'` needs routing.
2. **DO NOT add filter state to the Zustand store.** Filters are ephemeral view-local React state.
3. **DO NOT import from `src/extension/`** — all webview code must stay within the webview boundary.
4. **DO NOT use `useStorySummaries()` with `.filter()` directly in render** — this creates a new array reference every render, causing infinite re-renders with Zustand 5. Always wrap in `React.useMemo`.
5. **DO NOT forget to update `buildBreadcrumbs()`** in `store.ts` to handle the `'stories'` view with `storyKey` params for story detail breadcrumbs.
6. **DO NOT forget to update the dashboard `TabBar`** — the Kanban tab must navigate to `{ view: 'stories', params: { mode: 'kanban' } }` not `{ view: 'kanban' }`.
7. **Build validation:** Run `pnpm typecheck && pnpm lint && pnpm test && pnpm build` before marking complete.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.7] — Full acceptance criteria and story requirements
- [Source: _bmad-output/planning-artifacts/architecture.md] — Dual webview architecture, message protocol, state management patterns
- [Source: _bmad-output/implementation-artifacts/5-6-epics-browser-and-story-detail-views.md] — Previous story: EpicsView card pattern, EpicDetailView row pattern, StoryDetailView on-demand loading, StorySummary integration, navigation routing, breadcrumb refactoring, sidebar-to-editor-panel navigation
- [Source: src/webviews/editor-panel/store.ts] — Editor panel Zustand store: navigation actions, buildBreadcrumbs(), selector hooks, StoryDetailState
- [Source: src/webviews/editor-panel/types.ts] — ViewType (includes 'stories' and 'kanban'), ViewRoute, BreadcrumbItem
- [Source: src/webviews/editor-panel/components/navigation-shell.tsx] — Current view routing with PlaceholderView for stories/kanban
- [Source: src/webviews/editor-panel/views/epics-view.tsx] — Card layout pattern, useEpicCards() memoized hook, responsive grid, createShiftOpenHandler() usage
- [Source: src/webviews/editor-panel/views/epic-detail-view.tsx] — Story row pattern with progress bar, status badge, click navigation
- [Source: src/webviews/editor-panel/views/story-detail-view.tsx] — On-demand content loading via REQUEST_DOCUMENT_CONTENT, skeleton state, storyKey param reading
- [Source: src/webviews/editor-panel/views/dashboard-view.tsx] — TabBar component with VIEWS array, tab active state styling
- [Source: src/webviews/editor-panel/views/placeholder-view.tsx] — PlaceholderView showing "Coming in Story 5.7" for stories/kanban
- [Source: src/webviews/shared/utils/status-styles.ts] — getStoryStatusClasses(), getStoryStatusLabel(), getEpicStatusClasses(), getEpicStatusLabel()
- [Source: src/webviews/shared/utils/document-link.ts] — createDocumentLinkHandler(), createShiftOpenHandler() for modifier-key behavior
- [Source: src/shared/types/story.ts] — Story, StorySummary, StoryTask interfaces, calculateStoryProgress()
- [Source: src/shared/types/sprint-status.ts] — StoryStatusValue type, isStoryKey() helper

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed TypeScript error: `vscodeApi` prop type in `StoriesTable` needed `ToExtension` instead of `unknown`
- Fixed 4 test failures: duplicate text matches (getAllByText), breadcrumb route expectations, StoryDetailView error state testid

### Completion Notes List

- Created `StoriesView` with filter bar (epic dropdown, status dropdown, title search), table layout, and table/kanban toggle
- Created `KanbanBoard` with 5 status columns (Backlog, Ready for Dev, In Progress, Review, Done), story cards with title/epic/task count, empty column states
- Updated `NavigationShell` routing: `stories` view renders `StoriesView`, `stories` with `storyKey` renders `StoryDetailView`
- Updated `DashboardView` TabBar: Kanban tab navigates to `{ view: 'stories', params: { mode: 'kanban' } }`, active state correctly differentiates Stories vs Kanban tabs
- Updated `buildBreadcrumbs()` in store.ts for stories view: `Dashboard / Stories` and `Dashboard / Stories / Story N.M: Title`
- Updated `PlaceholderView` to remove stories/kanban entries (only docs remains)
- Added barrel export for `StoriesView`
- Filter state is view-local (React useState), not in Zustand store
- `useFilteredStories()` hook uses `React.useMemo` to prevent re-render loops
- All navigation uses `createShiftOpenHandler()` for dual-action click handling
- Responsive: table uses `overflow-x-auto` + `min-w-[600px]`, kanban uses `flex-col md:flex-row`
- 630 tests pass (17 new stories-view tests, 10 new kanban-board tests, 4 new store breadcrumb tests, 3 new dashboard-view tests, 2 updated navigation-shell tests)
- Validation: typecheck clean, lint clean, all tests pass, build clean

### Change Log

- 2026-02-20: Story 5.7 implementation complete — Stories Table & Kanban Board Views
- 2026-02-20: Code review fixes — added aria-label to kanban cards (H1), removed stale 'kanban' from ViewType/VIEW_LABELS (M1), fixed store test stale route (M2), fixed getStoryStatusLabel to return 'Ready for Dev' instead of 'Ready' (M3)

### File List

New files:
- src/webviews/editor-panel/views/stories-view.tsx
- src/webviews/editor-panel/views/stories-view.test.tsx
- src/webviews/editor-panel/components/kanban-board.tsx
- src/webviews/editor-panel/components/kanban-board.test.tsx

Modified files:
- src/webviews/editor-panel/components/navigation-shell.tsx
- src/webviews/editor-panel/components/navigation-shell.test.tsx
- src/webviews/editor-panel/views/dashboard-view.tsx
- src/webviews/editor-panel/views/dashboard-view.test.tsx
- src/webviews/editor-panel/views/placeholder-view.tsx
- src/webviews/editor-panel/views/index.ts
- src/webviews/editor-panel/store.ts
- src/webviews/editor-panel/store.test.ts
- src/webviews/editor-panel/types.ts
- src/webviews/shared/utils/status-styles.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
