# Story 5.4: About Section & Epic List UX

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want an About section showing BMAD metadata and improved epic list UX with show/hide for done epics and scroll for long lists,
so that I can see project metadata at a glance and navigate epics cleanly in large projects.

## Acceptance Criteria

1. **About Section Displays BMAD Metadata**
   - Given the dashboard sidebar
   - When the About section renders
   - Then it displays the BMAD version (from `_bmad/_config/manifest.yaml` → `installation.version`)
   - And it displays the last updated date (from `manifest.yaml` → `installation.lastUpdated`), formatted as a human-readable date (e.g., "Feb 6, 2026")
   - And it displays installed modules as a comma-separated list (from `manifest.yaml` → `modules[].name`), e.g., "core, bmm"

2. **About Section Handles Missing Data**
   - Given the dashboard with no manifest.yaml or unreadable manifest
   - When the About section renders
   - Then it still renders without crashing (graceful degradation)
   - And it displays "Unknown" or similar placeholder text for missing fields

3. **Done Epics Hidden by Default**
   - Given a project with completed ("done") epics
   - When the epic list renders
   - Then completed epics are hidden by default
   - And only non-done epics (backlog, in-progress) are visible

4. **Toggle to Show/Hide Done Epics**
   - Given the epic list with hidden done epics
   - When the user clicks the "Show completed" toggle/button
   - Then all done epics become visible
   - And done epics are visually distinct (muted text color using `var(--vscode-disabledForeground)`)
   - And the toggle text changes to "Hide completed"
   - And clicking again hides them

5. **Epic List Scrolling for Long Lists**
   - Given a project with more than 5 epics visible
   - When the epic list renders
   - Then the epic list area has a max-height constraint (approximately 5 epic items)
   - And additional epics are accessible via vertical scrolling within the epic list area
   - And the scroll area uses VS Code native scrollbar styling (already defined in `index.css`)

6. **About Section Skeleton During Loading**
   - Given the dashboard is in loading state
   - When the skeleton layout renders
   - Then an `AboutSectionSkeleton` renders with `animate-pulse` placeholder blocks
   - And it has `data-testid="about-section-skeleton"`

7. **Accessibility & Test IDs**
   - The About section has `data-testid="about-section"`
   - The "Show/Hide completed" toggle has `data-testid="toggle-done-epics"`
   - The scrollable epic list container has `data-testid="epic-list-scroll-container"`
   - All interactive elements have appropriate `aria-label` attributes

## Tasks / Subtasks

- [x] Task 1: Add `BmadMetadata` type and update `DashboardState` (AC: 1, 2)
  - [x] 1.1 Create `src/shared/types/bmad-metadata.ts` with `BmadMetadata` and `BmadModule` interfaces
  - [x] 1.2 Re-export from `src/shared/types/index.ts`
  - [x] 1.3 Add `bmadMetadata: BmadMetadata | null` field to `DashboardState` interface in `dashboard-state.ts`
  - [x] 1.4 Add `bmadMetadata: null` to `createInitialDashboardState()`

- [x] Task 2: Parse manifest.yaml in StateManager (AC: 1, 2)
  - [x] 2.1 Add `parseManifest(bmadRoot: vscode.Uri)` private method to `StateManager`
  - [x] 2.2 Read `_bmad/_config/manifest.yaml` using `this.readFile()`, parse with `js-yaml`
  - [x] 2.3 Extract `installation.version`, `installation.lastUpdated`, and `modules[].name` into `BmadMetadata`
  - [x] 2.4 Call `parseManifest()` in `parseAll()` (use `bmadDetector.getBmadPaths().bmadRoot`)
  - [x] 2.5 Handle missing/malformed manifest gracefully (set `bmadMetadata: null`, no error to user)

- [x] Task 3: Update Zustand store and selectors (AC: 1)
  - [x] 3.1 Add `bmadMetadata` to `updateState()` spread in `store.ts`
  - [x] 3.2 Add selector: `export const useBmadMetadata = () => useDashboardStore((s) => s.bmadMetadata)`

- [x] Task 4: Create `about-section.tsx` component (AC: 1, 2, 6, 7)
  - [x] 4.1 Create `src/webviews/dashboard/components/about-section.tsx`
  - [x] 4.2 Implement `AboutSection` component using `useBmadMetadata()` selector
  - [x] 4.3 Display version, last updated (formatted), and module list
  - [x] 4.4 Handle null metadata gracefully (show "Unknown" placeholders)
  - [x] 4.5 Implement `AboutSectionSkeleton` with `animate-pulse` placeholders
  - [x] 4.6 Add all `data-testid` attributes

- [x] Task 5: Update `epic-list.tsx` for done epic filtering and scrolling (AC: 3, 4, 5, 7)
  - [x] 5.1 Add `hideDoneEpics` local state with `useState<boolean>(true)` (default: hide done)
  - [x] 5.2 Filter `summaries` to exclude `status === 'done'` when `hideDoneEpics` is true
  - [x] 5.3 Add "Show completed (N)" / "Hide completed" toggle button below epic list
  - [x] 5.4 Add scrollable container with `max-h-[280px] overflow-y-auto` around epic items
  - [x] 5.5 Add `data-testid="toggle-done-epics"` and `data-testid="epic-list-scroll-container"`
  - [x] 5.6 Style done epics with `text-[var(--vscode-disabledForeground)]` when shown

- [x] Task 6: Update barrel exports and dashboard layout (AC: 1, 6)
  - [x] 6.1 Export `AboutSection` and `AboutSectionSkeleton` from `components/index.ts`
  - [x] 6.2 Add `<AboutSection />` to dashboard layout in `index.tsx` (below `PlanningArtifactLinks`, above footer area)
  - [x] 6.3 Add `<AboutSectionSkeleton />` to loading state in `index.tsx`

- [x] Task 7: Create `about-section.test.tsx` (AC: 1, 2, 6, 7)
  - [x] 7.1 Test renders version from store metadata
  - [x] 7.2 Test renders formatted last updated date
  - [x] 7.3 Test renders module list
  - [x] 7.4 Test handles null metadata (shows "Unknown" or graceful fallback)
  - [x] 7.5 Test skeleton renders with correct testid
  - [x] 7.6 Test all `data-testid` attributes present

- [x] Task 8: Create/update `epic-list.test.tsx` for new features (AC: 3, 4, 5, 7)
  - [x] 8.1 Test done epics are hidden by default
  - [x] 8.2 Test toggle button shows "Show completed (N)" with count of done epics
  - [x] 8.3 Test clicking toggle reveals done epics with muted styling
  - [x] 8.4 Test clicking toggle again hides done epics
  - [x] 8.5 Test scroll container has max-height constraint
  - [x] 8.6 Test toggle and scroll container have correct `data-testid` attributes
  - [x] 8.7 Test no toggle renders when zero done epics exist

- [x] Task 9: Update `state-manager.test.ts` for manifest parsing (AC: 1, 2)
  - [x] 9.1 Test `parseManifest` populates `bmadMetadata` in state
  - [x] 9.2 Test missing manifest sets `bmadMetadata: null`
  - [x] 9.3 Test malformed manifest YAML sets `bmadMetadata: null`

- [x] Task 10: Validate build pipeline
  - [x] 10.1 Run `pnpm typecheck` — must pass
  - [x] 10.2 Run `pnpm lint` — must pass
  - [x] 10.3 Run `pnpm test` — all tests pass (381 tests, 22 files)
  - [x] 10.4 Run `pnpm build` — must complete without errors

## Dev Notes

### Critical Implementation Details

**About Section — Data Flow (Extension Host → Webview):**
The BMAD manifest lives at `_bmad/_config/manifest.yaml` (relative to workspace root). The `StateManager` already has `this.bmadDetector.getBmadPaths().bmadRoot` which resolves to the `_bmad/` directory. The manifest path is `vscode.Uri.joinPath(bmadRoot, '_config', 'manifest.yaml')`. Parse it with `js-yaml` (already a dependency) in the extension host, add the result to `DashboardState`, and it flows automatically to the webview via the existing `STATE_UPDATE` → `updateState()` → Zustand pipeline.

**Manifest YAML Structure (real file at `_bmad/_config/manifest.yaml`):**

```yaml
installation:
  version: 6.0.0-Beta.7
  installDate: 2026-01-26T10:36:25.989Z
  lastUpdated: 2026-02-06T10:56:23.659Z
modules:
  - name: core
    version: 6.0.0-Beta.7
    source: built-in
  - name: bmm
    version: 6.0.0-Beta.7
    source: built-in
ides:
  - claude-code
```

**BmadMetadata Type (new file: `src/shared/types/bmad-metadata.ts`):**

```typescript
export interface BmadModule {
  name: string;
  version: string;
  source: string;
}

export interface BmadMetadata {
  version: string;
  lastUpdated: string; // ISO date string
  modules: BmadModule[];
}
```

**Date Formatting — Use native `Date.toLocaleDateString()` in the component:**

```typescript
const formatDate = (isoDate: string): string => {
  try {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
};
```

Do NOT add a date library (dayjs, date-fns, etc.). Native API is sufficient.

**About Section Placement:**
Place it at the bottom of the dashboard, after `PlanningArtifactLinks` and before the end of the content area. This is metadata that doesn't need prime real estate. It should be a compact, collapsible section.

**About Section UI Pattern — Compact info display:**
Use a small section header "About" in uppercase muted text (like "Other Actions" in `cta-buttons.tsx`), then a few lines of key-value pairs:

```
ABOUT
Version: 6.0.0-Beta.7
Updated: Feb 6, 2026
Modules: core, bmm
```

Use `text-xs` for the content, `var(--vscode-descriptionForeground)` for labels, `var(--vscode-foreground)` for values.

**Epic List — Hide Done Epics Pattern:**
Add a local `useState<boolean>(true)` for `hideDoneEpics`. Filter the `summaries` array before rendering. The count of hidden epics is available for the toggle label.

```typescript
const [hideDoneEpics, setHideDoneEpics] = useState(true);
const doneCount = summaries.filter((s) => s.status === 'done').length;
const visibleSummaries = hideDoneEpics ? summaries.filter((s) => s.status !== 'done') : summaries;
```

**Epic List — Toggle Button Pattern:**
Place below the epic items, as a small text button (not a full button). Pattern:

```
[Show completed (4)] or [Hide completed]
```

Use the same muted text styling as "Other Actions" header. Use `cursor-pointer hover:text-[var(--vscode-foreground)]` for interaction feedback.

**Epic List — Scrolling:**
Wrap the epic items (not the header or toggle) in a scrollable container:

```typescript
<div
  data-testid="epic-list-scroll-container"
  className="max-h-[280px] overflow-y-auto"
>
  {/* Epic items here */}
</div>
```

The `280px` approximates ~5 compact epic items (each ~56px including padding/margins). Adjust if needed during implementation. The VS Code scrollbar styling from `index.css` (`::-webkit-scrollbar`) will apply automatically.

**StateManager — Where to call parseManifest:**
In the `parseAll()` method, after getting paths and before the final state fire. The `bmadRoot` is available from `this.bmadDetector.getBmadPaths()!.bmadRoot`. The manifest is NOT watched by FileWatcher (it's in `_bmad/` not `_bmad-output/`), so it only refreshes on full refresh — this is fine since BMAD installation metadata rarely changes.

```typescript
// In parseAll(), after existing parse calls:
await this.parseManifest(paths);
```

**YAML Parsing Pattern (reuse existing js-yaml import):**
The `StateManager` doesn't currently import `js-yaml` directly — it uses the parser modules. For the manifest, add a direct `js-yaml` import since there's no dedicated parser for this one-off file. Use `yaml.load()` with a try-catch returning null on failure.

```typescript
import * as yaml from 'js-yaml';

private async parseManifest(paths: BmadPaths): Promise<void> {
  const manifestPath = vscode.Uri.joinPath(paths.bmadRoot, '_config', 'manifest.yaml');
  const content = await this.readFile(manifestPath);
  if (content === null) {
    this._state = { ...this._state, bmadMetadata: null };
    return;
  }
  try {
    const raw = yaml.load(content) as Record<string, unknown>;
    const installation = raw?.installation as Record<string, unknown> | undefined;
    const modules = (raw?.modules as Array<Record<string, unknown>>) ?? [];
    this._state = {
      ...this._state,
      bmadMetadata: {
        version: String(installation?.version ?? 'Unknown'),
        lastUpdated: String(installation?.lastUpdated ?? ''),
        modules: modules.map((m) => ({
          name: String(m.name ?? ''),
          version: String(m.version ?? ''),
          source: String(m.source ?? ''),
        })),
      },
    };
  } catch {
    this._state = { ...this._state, bmadMetadata: null };
  }
}
```

**No New Dependencies Required:**
All libraries are already installed: `js-yaml` (YAML parsing), `react` (components), `zustand` (store), `lucide-react` (icons), `tailwindcss` (styling), `vitest` + `@testing-library/react` (testing).

### Previous Story Intelligence (5.1, 5.2, 5.3)

**From Story 5.1 (Epic Detail View):**

- `useState<Set<number>>` for expand/collapse state management in `epic-list.tsx`
- `animate-expand-in` CSS keyframe already defined in `src/webviews/index.css` — reuse for toggle animations
- `useCallback` for event handlers to prevent unnecessary re-renders
- `cn()` utility from `../../shared/utils/cn` for conditional classNames
- Shift+click on epic title opens raw file in text editor

**From Story 5.2 (Next Action Enhancements):**

- `actionButtonClass` constant pattern for consistent button styling
- Icon button pattern with `size={12}` for inline icons
- `useVSCodeApi()` hook from `../../shared/hooks` for message posting
- Test mock pattern: `vi.mock('../../shared/hooks', ...)` + `useDashboardStore.setState()`

**From Story 5.3 (Overflow Menu & Help Icon):**

- `HeaderToolbar` component replaced `RefreshButton` in dashboard header
- Click-outside dismiss pattern with `useRef` + `mousedown` listener
- `refresh-button.tsx` and its test were deleted (dead code cleanup)
- All `data-testid`, `aria-label`, `aria-expanded` attributes on interactive elements
- Full pipeline: typecheck, lint, 359 tests (21 files), build — all green
- Review fixes: added ARIA menu roles, added workflow item icons

**Key Testing Patterns (from all Epic 5 stories):**

```typescript
// Mock setup
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: vi.fn(() => ({ postMessage: vi.fn() })),
}));

// Set store state directly
useDashboardStore.setState({
  sprint: mockSprintStatus,
  epics: mockEpics,
  bmadMetadata: mockMetadata,
  // ...
});

// Render and assert
render(<ComponentUnderTest />);
expect(screen.getByTestId('about-section')).toBeInTheDocument();
```

### Git Intelligence

**Recent commit pattern:** `feat: 5-X-story-slug` (e.g., `feat: 5-3-overflow-menu-and-help-icon`)
**Expected commit:** `feat: 5-4-about-section-and-epic-list-ux`

**Recent work context (last 3 commits):**

- `2bf8e5f` — Fix: name parsing (parser fixes)
- `487ddc7` — Story 5.3: Overflow menu & help icon (HeaderToolbar component)
- `5dfc037` — Story 5.2: Next action enhancements (play/copy icons on next action)

**Files changed in last 3 commits (20 files, 1272 insertions):**

- New: `header-toolbar.tsx`, `header-toolbar.test.tsx`, story docs
- Modified: `cta-buttons.tsx/test`, `next-action-recommendation.tsx/test`, `epic-parser.ts/test`, `story-parser.ts/test`, `index.ts` (barrel), `dashboard/index.tsx/test`
- Deleted: `refresh-button.tsx`, `refresh-button.test.tsx`

**Patterns established:**

- Icon buttons use `size={12}` for inline, `size={14}` for standalone
- All buttons have `data-testid`, `aria-label`, `title` attributes
- Tests mock `useVSCodeApi` and set Zustand store state directly
- Validation: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

### Project Structure Notes

**New files:**

- `src/shared/types/bmad-metadata.ts` — New type file for BmadMetadata and BmadModule interfaces
- `src/webviews/dashboard/components/about-section.tsx` — New component with skeleton
- `src/webviews/dashboard/components/about-section.test.tsx` — Co-located test

**Modified files:**

- `src/shared/types/index.ts` — Add `export * from './bmad-metadata'`
- `src/shared/types/dashboard-state.ts` — Add `bmadMetadata: BmadMetadata | null` to interface and initial state
- `src/webviews/dashboard/store.ts` — Add `bmadMetadata` to `updateState()` spread + new selector
- `src/extension/services/state-manager.ts` — Add `parseManifest()` method + import js-yaml
- `src/extension/services/state-manager.test.ts` — Add manifest parsing tests
- `src/webviews/dashboard/components/epic-list.tsx` — Add done epic filtering, toggle, scroll container
- `src/webviews/dashboard/components/epic-list.test.tsx` — Add tests for new features
- `src/webviews/dashboard/components/index.ts` — Add AboutSection exports
- `src/webviews/dashboard/index.tsx` — Add AboutSection to layout (both loading and loaded states)

**No deleted files.**

### Existing Imports Reference (copy-paste ready)

```typescript
// In about-section.tsx:
import React from 'react';
import { useBmadMetadata } from '../store';

// In about-section.test.tsx:
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AboutSection, AboutSectionSkeleton } from './about-section';
import { useDashboardStore } from '../store';

// In state-manager.ts (new import):
import * as yaml from 'js-yaml';
import type { BmadMetadata } from '../../shared/types';

// In epic-list.tsx (existing, add useState if not already):
import React, { useState, useCallback } from 'react';
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#State Management, Message Protocol, Naming Conventions, Testing Standards]
- [Source: _bmad-output/planning-artifacts/prd.md#FR2 (enhanced epic list), NFR1 (render performance), NFR7 (graceful degradation)]
- [Source: _bmad/_config/manifest.yaml — BMAD installation metadata source]
- [Source: src/extension/services/state-manager.ts — where manifest parsing will be added]
- [Source: src/extension/services/bmad-detector.ts — provides bmadRoot path for manifest access]
- [Source: src/shared/types/dashboard-state.ts — DashboardState to extend with bmadMetadata]
- [Source: src/webviews/dashboard/store.ts — Zustand store to add bmadMetadata selector]
- [Source: src/webviews/dashboard/components/epic-list.tsx — component to modify for done epic filtering + scrolling]
- [Source: src/webviews/dashboard/components/cta-buttons.tsx — "Other Actions" section header pattern reference]
- [Source: src/webviews/dashboard/components/header-toolbar.tsx — recent component pattern reference]
- [Source: src/webviews/dashboard/index.tsx — dashboard layout for AboutSection placement]
- [Source: src/webviews/index.css — scrollbar styling, animate-expand-in keyframe]
- [Source: _bmad-output/implementation-artifacts/5-3-overflow-menu-and-help-icon.md — previous story patterns]
- [Source: _bmad-output/implementation-artifacts/5-2-next-action-enhancements.md — icon button + workflow patterns]

### Library/Framework Requirements

| Library                | Version  | Usage in This Story                           |
| ---------------------- | -------- | --------------------------------------------- |
| React                  | ^19.2.0  | Component framework, useState                 |
| js-yaml                | ^4.1.1   | Parse manifest.yaml in StateManager           |
| zustand                | ^5.0.0   | useBmadMetadata() selector                    |
| tailwindcss            | ^4.1.0   | Styling with VS Code CSS variables            |
| clsx + tailwind-merge  | via cn() | Conditional className composition             |
| vitest                 | ^4.0.18  | Test runner                                   |
| @testing-library/react | ^16.3.2  | Component testing (render, screen, fireEvent) |

**No new dependencies required.** All libraries are already installed.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Implemented full About section data pipeline: manifest.yaml parsing in StateManager → DashboardState → Zustand store → AboutSection component
- AboutSection displays version, formatted last updated date, and comma-separated module list with graceful null handling
- Epic list now hides done epics by default with a "Show completed (N)" / "Hide completed" toggle
- Done epics rendered with muted `--vscode-disabledForeground` styling when shown
- Scrollable container (280px max-height) wraps epic items for long lists
- All data-testid and aria-label accessibility attributes implemented per AC 7
- Updated existing epic-list tests to account for new hide-by-default behavior
- Added bmadMetadata: null to DashboardState literals in messages.test.ts, store.test.ts, and use-message-handler.test.ts to satisfy new interface requirement
- 381 tests passing across 22 test files (22 net new tests added)

### Code Review Fixes (AI)

- Fixed `formatDate` to return "Unknown" for invalid dates (NaN check before toLocaleDateString)
- Added `useBmadMetadata` selector test to store.test.ts (was missing from selector test suite)
- Removed unnecessary `useVSCodeApi` mock from about-section.test.tsx
- Added type-safe `String()` coercion in `parseManifest` via `str()` helper (handles non-string YAML values)
- Added test for empty `lastUpdated` string edge case
- 383 tests passing across 22 test files after review fixes

### File List

**New files:**

- src/shared/types/bmad-metadata.ts
- src/webviews/dashboard/components/about-section.tsx
- src/webviews/dashboard/components/about-section.test.tsx

**Modified files:**

- src/shared/types/index.ts
- src/shared/types/dashboard-state.ts
- src/shared/messages.test.ts
- src/extension/services/state-manager.ts
- src/extension/services/state-manager.test.ts
- src/webviews/dashboard/store.ts
- src/webviews/dashboard/store.test.ts
- src/webviews/dashboard/components/epic-list.tsx
- src/webviews/dashboard/components/epic-list.test.tsx
- src/webviews/dashboard/components/index.ts
- src/webviews/dashboard/index.tsx
- src/webviews/dashboard/hooks/use-message-handler.test.ts

## Change Log

- 2026-02-13: Story 5.4 implementation complete — About section with BMAD metadata, epic list done-epic filtering with toggle, scrollable epic list container
- 2026-02-13: Code review fixes — formatDate invalid date handling, useBmadMetadata selector test, removed dead mock, type-safe parseManifest coercion, empty lastUpdated test
