# Story 5.1: Epic Detail View with Story Lists

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to drill down into an epic and see its individual stories with status,
so that I can understand epic progress at the story level, not just top-level completion.

## Acceptance Criteria

1. **Epic Expand/Collapse on Click**
   - **Given** the epic list is displayed in the dashboard
   - **When** the user clicks/expands an epic
   - **Then** the epic expands to show a list of stories within that epic
   - **And** each story displays its title and status (backlog, in-progress, done, etc.)
   - **And** story completion is visually indicated (checkmark, strikethrough, or similar)

2. **Story Click Opens Raw File**
   - **Given** an expanded epic with stories
   - **When** the user clicks on a story title
   - **Then** the raw story .md file opens in a VS Code editor tab
   - **And** the file path is resolved from `outputRoot` + story key pattern (e.g., `_bmad-output/implementation-artifacts/1-1-project-initialization.md`)

3. **Empty State for Epics with No Stories**
   - **Given** an epic with no stories parsed
   - **When** the epic is expanded
   - **Then** a helpful message indicates no stories were found

## Tasks / Subtasks

- [x] Task 1: Add expand/collapse state and chevron icons to EpicList (AC: #1)
  - [x] 1.1: Import `ChevronRight` and `ChevronDown` from `lucide-react` in `epic-list.tsx`
  - [x] 1.2: Add `expandedEpics` local state via `useState<Set<number>>` for tracking which epics are expanded
  - [x] 1.3: Add `toggleEpic(epicNum)` callback that toggles epic in the expanded set
  - [x] 1.4: Replace the epic title `<button>` click handler to toggle expand/collapse (move document open to shift+click or separate action)
  - [x] 1.5: Render `ChevronRight` (collapsed) or `ChevronDown` (expanded) before the epic title
  - [x] 1.6: Add `aria-expanded` attribute to the epic row button for accessibility

- [x] Task 2: Render story list within expanded epics (AC: #1, #2, #3)
  - [x] 2.1: Create `getStoriesForEpic(epicNum)` helper that looks up stories from `epicsData` (the `Epic[]` from store) matching the epic number
  - [x] 2.2: Enrich each `EpicStoryEntry` with status from `sprint.development_status[story.key]`
  - [x] 2.3: Render story list as indented items below the epic when expanded
  - [x] 2.4: Show story status with visual indicators: checkmark icon for done, colored status badge for others
  - [x] 2.5: Make story titles clickable, sending `createOpenDocumentMessage()` with the story file path (resolve from `outputRoot`/implementation-artifacts/`storyKey`.md)
  - [x] 2.6: Handle empty stories state: show "No stories found" message when `epic.stories` is empty or undefined

- [x] Task 3: Style the expanded story list (AC: #1)
  - [x] 3.1: Indent story items with left padding (e.g., `pl-4`) under the epic
  - [x] 3.2: Use smaller text (`text-xs`) for story entries consistent with epic list density
  - [x] 3.3: Color-code story status labels using VS Code theme variables (passed=green, description=muted, link=blue for active)
  - [x] 3.4: Add subtle transition on expand/collapse for smooth UX

- [x] Task 4: Update tests for expand/collapse behavior (AC: #1, #2, #3)
  - [x] 4.1: Test that clicking an epic toggles the expanded state and shows stories
  - [x] 4.2: Test that stories display correct titles and statuses
  - [x] 4.3: Test that clicking a story title sends OPEN_DOCUMENT message with correct story file path
  - [x] 4.4: Test that expanded epic shows chevron-down, collapsed shows chevron-right
  - [x] 4.5: Test empty state when epic has no stories
  - [x] 4.6: Test that multiple epics can be expanded independently
  - [x] 4.7: Verify existing tests still pass (epic rendering, progress bars, status labels)

- [x] Task 5: Build and Lint Validation (AC: #1-#3)
  - [x] 5.1: Run `pnpm typecheck` and verify no type errors
  - [x] 5.2: Run `pnpm lint` and verify no linting errors
  - [x] 5.3: Run `pnpm test` and verify all tests pass (Vitest + Mocha)
  - [x] 5.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Architecture Compliance

**MANDATORY patterns from Architecture Document and all previous story learnings:**

1. **File Naming**: kebab-case
   - CORRECT: `epic-list.tsx`, `epic-list.test.tsx`
   - WRONG: `EpicList.tsx`, `EpicList.test.tsx`

2. **Package Manager**: `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

3. **Component Pattern**: Export both main component and skeleton
   - `export function EpicList()` + `export function EpicListSkeleton()`
   - Re-export through `src/webviews/dashboard/components/index.ts`

4. **State Management**: Zustand with selector hooks, extension host is single source of truth
   - Use existing `useSprint()`, `useEpics()`, `useOutputRoot()` selector hooks
   - Expand/collapse is LOCAL component state only (`useState`) — not Zustand store state
   - **Zustand v5 note**: Selector hooks already return primitives/stable references — no `useShallow` needed for this story

5. **Message Protocol**: Factory functions for creating messages
   - Use `createOpenDocumentMessage(path, forceTextEditor)` for opening story files
   - Shift+click sends `forceTextEditor: true` (existing pattern from epic title click)

6. **Styling**: Tailwind CSS with VS Code theme variables
   - Text colors: `text-[var(--vscode-foreground)]`, `text-[var(--vscode-descriptionForeground)]`, `text-[var(--vscode-textLink-foreground)]`
   - Success color: `text-[var(--vscode-testing-iconPassed)]`
   - Backgrounds: `bg-[var(--vscode-list-activeSelectionBackground)]/10`
   - Use `cn()` utility from `../../shared/utils/cn` for conditional classes

7. **Testing**: Vitest + React Testing Library for webview components
   - Co-locate test files: `epic-list.test.tsx` next to `epic-list.tsx`
   - Mock pattern: `vi.mock('../../shared/hooks', () => ({ useVSCodeApi: () => ({ postMessage: mockPostMessage }) }))`
   - Set store state: `useDashboardStore.setState({ ... })`

8. **Accessibility**: Use `aria-expanded` on expandable elements, `aria-label` on icon buttons

### Technical Specifications

**Data Flow for Story List:**

1. `useSprint()` provides `sprint.development_status` — contains story keys and their statuses
2. `useEpics()` provides `Epic[]` — each `Epic` has a `stories: EpicStoryEntry[]` array with `key`, `title`, `description`, `status`
3. The `EpicStoryEntry.status` field may already be populated by the epic parser, but you should ALSO cross-reference with `sprint.development_status[story.key]` for the most current status
4. Story file path pattern: `{outputRoot}/implementation-artifacts/{story.key}.md`

**Existing `EpicStoryEntry` Interface** (`src/shared/types/epic.ts`):

```typescript
export interface EpicStoryEntry {
  key: string; // e.g., "1-1-project-initialization"
  title: string;
  description?: string;
  status?: 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done';
}
```

**Existing `deriveEpicSummaries()` Function:**

The current `epic-list.tsx` has a `deriveEpicSummaries()` function that builds `EpicSummary` objects from `sprint.development_status`. This should remain as-is for the epic-level display. The story list is rendered BELOW each epic item when expanded.

**Icon Usage (lucide-react):**

```typescript
import { ChevronRight, ChevronDown, Check } from 'lucide-react';
// ChevronRight: collapsed epic indicator
// ChevronDown: expanded epic indicator
// Check: done story indicator (optional, can also use text/color)
```

lucide-react v0.563.0 is already installed. Icons accept standard SVG props: `size`, `className`, `strokeWidth`, etc.

**Expand/Collapse Implementation Pattern:**

```typescript
const [expandedEpics, setExpandedEpics] = useState<Set<number>>(new Set());

const toggleEpic = useCallback((epicNum: number) => {
  setExpandedEpics((prev) => {
    const next = new Set(prev);
    if (next.has(epicNum)) {
      next.delete(epicNum);
    } else {
      next.add(epicNum);
    }
    return next;
  });
}, []);
```

This allows multiple epics to be expanded simultaneously. Uses `Set` for O(1) lookup.

**Story Status Display Mapping:**

| Status          | Visual                         | Color Variable                                                  |
| --------------- | ------------------------------ | --------------------------------------------------------------- |
| `done`          | Checkmark icon or "Done" label | `--vscode-testing-iconPassed` (green)                           |
| `in-progress`   | "In Progress" label            | `--vscode-textLink-foreground` (blue)                           |
| `review`        | "Review" label                 | `--vscode-charts-orange` or `--vscode-editorWarning-foreground` |
| `ready-for-dev` | "Ready" label                  | `--vscode-descriptionForeground` (muted)                        |
| `backlog`       | "Backlog" label                | `--vscode-descriptionForeground` (muted)                        |

**Story File Path Resolution:**

Story files live at `{outputRoot}/implementation-artifacts/{story.key}.md`. The `outputRoot` is available from `useOutputRoot()` hook (defaults to `'_bmad-output'`). Not all stories have files — only those with status `ready-for-dev` or later. For `backlog` stories, the click should still attempt to open (the extension host handles file-not-found gracefully).

### Library & Framework Requirements

| Library               | Version   | Purpose                                            |
| --------------------- | --------- | -------------------------------------------------- |
| React                 | 19.2.4    | Component framework, useState, useCallback hooks   |
| Zustand               | 5.0.10    | State management (existing store, selector hooks)  |
| lucide-react          | 0.563.0   | ChevronRight, ChevronDown, Check icons             |
| Tailwind CSS          | v4        | Utility-first styling with VS Code theme variables |
| clsx + tailwind-merge | installed | `cn()` utility for conditional class merging       |

**No new dependencies needed.** All libraries are already installed.

### File Structure Requirements

**Files to MODIFY:**

| File                                                   | Changes                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `src/webviews/dashboard/components/epic-list.tsx`      | Add expand/collapse state, chevron icons, story list rendering |
| `src/webviews/dashboard/components/epic-list.test.tsx` | Add tests for expand/collapse, story display, story click      |

**Files to NOT MODIFY (read-only reference):**

| File                                         | Why Referenced                                                     |
| -------------------------------------------- | ------------------------------------------------------------------ |
| `src/shared/types/epic.ts`                   | `Epic`, `EpicStoryEntry` interfaces                                |
| `src/shared/types/sprint-status.ts`          | `StoryStatusValue`, `DevelopmentStatusValue` types, `isStoryKey()` |
| `src/shared/messages.ts`                     | `createOpenDocumentMessage()` factory                              |
| `src/webviews/dashboard/store.ts`            | `useSprint()`, `useEpics()`, `useOutputRoot()` selector hooks      |
| `src/webviews/shared/utils/cn.ts`            | `cn()` class merging utility                                       |
| `src/webviews/dashboard/components/index.ts` | Barrel export (already exports EpicList)                           |

**Files to NOT Create:** No new files needed. This is a modification to an existing component.

### Testing Requirements

**Test File:** `src/webviews/dashboard/components/epic-list.test.tsx` (existing, extend)

**Test Data Setup:**

```typescript
// Add epics with stories to mock data
const mockEpicsWithStories: Epic[] = [
  {
    number: 1,
    key: 'epic-1',
    title: 'Project Foundation',
    description: '',
    metadata: {},
    stories: [
      { key: '1-1-project-init', title: 'Project Initialization', status: 'done' },
      { key: '1-2-test-framework', title: 'Test Framework', status: 'done' },
    ],
    filePath: '',
    status: 'done',
  },
  {
    number: 2,
    key: 'epic-2',
    title: 'File Parsing',
    description: '',
    metadata: {},
    stories: [
      { key: '2-1-shared-types', title: 'Shared Types', status: 'done' },
      { key: '2-2-sprint-parser', title: 'Sprint Parser', status: 'done' },
      { key: '2-3-epic-parser', title: 'Epic Parser', status: 'in-progress' },
    ],
    filePath: '',
    status: 'in-progress',
  },
];
```

**Required Test Cases:**

1. Clicking epic toggles story list visibility
2. Stories render with correct titles from `EpicStoryEntry`
3. Stories render with correct status from `sprint.development_status`
4. Clicking story title sends `OPEN_DOCUMENT` with correct path (`_bmad-output/implementation-artifacts/{key}.md`)
5. Chevron icons toggle between right (collapsed) and down (expanded)
6. Empty state shown for epics with no stories
7. Multiple epics can be expanded at the same time
8. Existing tests continue to pass (regression)
9. Skeleton component unchanged
10. `aria-expanded` attribute correctly reflects expand state

### Previous Story Intelligence

**From Story 4.4 (Copy Command to Clipboard) - Most Recent:**

- 431 tests passing (328 Vitest + 103 Mocha)
- All verification passed: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Code review applied fixes to test data accuracy and added coverage for edge cases
- lucide-react icons used successfully (Copy icon in CTA buttons)

**From Story 3.3 (Epic List with Completion Status) - Original Implementation:**

- Created the `EpicList` component being modified in this story
- Established `deriveEpicSummaries()` pattern
- `EpicSummary` interface derives from `sprint.development_status`
- Click on epic title opens `epics.md` via `createOpenDocumentMessage()`
- Current test count for this file: 13 tests

**From Story 3.4 (Active Story Card with Task Progress):**

- Established story status visual patterns
- Used `StoryStatusValue` type for status display
- Story file path pattern: `{key}.md` in implementation-artifacts

**Git Intelligence:**

- Commit pattern: `feat: 5-1-epic-detail-view-with-story-lists`
- Build validation: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Recent commits are clean, linear progression

### Key Existing Code Reference

**Current `epic-list.tsx` structure (184 lines):**

- `deriveEpicSummaries()` — builds EpicSummary[] from sprint.development_status
- `getEpicTitle()` — looks up epic title from epicsData
- `getStatusLabel()` — maps status to display string
- `EpicListSkeleton` — loading skeleton
- `EpicList` — main component with epic rendering

**The expand/collapse logic should be added TO the existing `EpicList` component.** Do NOT create a separate component for the story list — keep it inline within the epic list item rendering for simplicity.

**Current epic item structure:**

```tsx
<div key={summary.key} className="flex flex-col gap-1 rounded px-2 py-1.5">
  <div className="flex items-center justify-between">
    <button>Epic Title</button>     // <-- Add chevron before title, change onClick to toggle
    <span>Status Label</span>
  </div>
  <div>Progress bar + count</div>
  {/* NEW: Story list renders here when expanded */}
</div>
```

### Design Decision: Epic Title Click Behavior

Currently clicking an epic title opens `epics.md`. This behavior changes:

- **Click** (no modifier): Toggle expand/collapse of the story list
- **Shift+click**: Open `epics.md` in text editor (preserves existing shift+click behavior)

This is a deliberate UX change — expand/collapse is the primary action since this story is about drill-down.

### Project Structure Notes

- Alignment with unified project structure: All changes are within `src/webviews/dashboard/components/` — standard location for dashboard UI components
- No conflicts with other components or services
- No changes to extension host code, shared types, or message protocol — purely a webview UI enhancement

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.1] - Epic detail view with story lists acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-5] - UX Polish & Dashboard Enhancements epic objectives
- [Source: _bmad-output/planning-artifacts/architecture.md#Webview-Architecture] - Sidebar panel webview, Zustand state management
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns] - Naming conventions, component patterns, testing standards
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - OPEN_DOCUMENT message type for story click
- [Source: src/webviews/dashboard/components/epic-list.tsx] - Current EpicList implementation (184 lines)
- [Source: src/webviews/dashboard/components/epic-list.test.tsx] - Current tests (13 tests in 2 describe blocks)
- [Source: src/shared/types/epic.ts] - `Epic`, `EpicStoryEntry` interfaces with stories array
- [Source: src/shared/types/sprint-status.ts] - `StoryStatusValue`, `isStoryKey()` utilities
- [Source: src/shared/messages.ts] - `createOpenDocumentMessage()` factory function
- [Source: src/webviews/dashboard/store.ts] - Zustand store with `useSprint()`, `useEpics()`, `useOutputRoot()` selectors

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no blockers.

### Completion Notes List

- **Task 1**: Added expand/collapse state management using `useState<Set<number>>` with `toggleEpic` callback wrapped in `useCallback`. Imported `ChevronRight`, `ChevronDown`, `Check` from lucide-react. Changed epic title click to toggle expand/collapse; shift+click opens epics.md (preserving existing behavior). Added `aria-expanded` attribute for accessibility.
- **Task 2**: Created `getStoriesForEpic()` helper that resolves stories from `epicsData` and enriches with sprint status (sprint status takes priority over epic parser status). Story titles are clickable, opening `{outputRoot}/implementation-artifacts/{story.key}.md`. Empty state shows "No stories found" when epic has no stories.
- **Task 3**: Story list uses `pl-4` indentation, `text-xs` for density, color-coded status labels (green for done, blue for in-progress, warning for review, muted for backlog/ready-for-dev). Done stories show checkmark icon + strikethrough. Hover background on story items.
- **Task 4**: Added 8 new tests in dedicated "EpicList expand/collapse" describe block. Updated 1 existing test (click behavior changed from open document to toggle). All 24 EpicList tests pass. Total suite: 336 Vitest tests passing.
- **Task 5**: All validations pass — `pnpm typecheck`, `pnpm lint`, `pnpm test` (336 tests), `pnpm build` all clean.

### Change Log

- 2026-02-13: Implemented epic detail view with expand/collapse story lists (Story 5.1)
- 2026-02-13: Code review fixes — type safety (isStoryStatus guard), expand animation, ARIA accessibility, test coverage improvements (29 tests, up from 24)

### File List

- `src/webviews/dashboard/components/epic-list.tsx` (modified) — Added expand/collapse state, chevron icons, story list rendering with status-aware styling, ARIA accessibility, expand animation
- `src/webviews/dashboard/components/epic-list.test.tsx` (modified) — 29 tests: 14 original + 8 expand/collapse + 5 review fixes (chevron verification, status CSS, accessibility, type safety, data inconsistency) + 2 updated
- `src/webviews/index.css` (modified) — Added expand-in keyframe animation for expand/collapse transition
