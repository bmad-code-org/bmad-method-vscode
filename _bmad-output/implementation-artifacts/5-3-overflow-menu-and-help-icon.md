# Story 5.3: Overflow Menu & Help Icon

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a "?" help icon and a "..." overflow menu replacing the standalone refresh button,
so that I have quick access to help and a clean menu for utility actions.

## Acceptance Criteria

1. **Help Icon Implementation**
   - Given the dashboard header/toolbar area
   - When the help icon ("?") is rendered
   - Then clicking it copies `bmad help` to clipboard via `COPY_COMMAND` message (consistent with existing copy pattern)
   - And the help icon displays a tooltip: "Copy 'bmad help' command"

2. **Overflow Menu Button**
   - Given the dashboard currently shows a standalone Refresh text-link button
   - When the overflow menu ("...") replaces it
   - Then the "..." button opens a dropdown menu below it
   - And clicking the button toggles the menu open/closed
   - And the standalone `RefreshButton` component is no longer rendered in the header

3. **Overflow Menu Contents**
   - Given the overflow menu is open
   - Then the menu contains a "Refresh" action item (first position)
   - And the menu contains all workflow commands from `useWorkflows()` (all workflows, including primary)
   - And each workflow item shows the workflow name
   - And clicking "Refresh" sends a `REFRESH` message via `createRefreshMessage()`
   - And clicking a workflow sends `EXECUTE_WORKFLOW` via `createExecuteWorkflowMessage(workflow.command)`

4. **Menu Dismiss Behavior**
   - Given the overflow menu is open
   - When the user clicks a menu item, the menu closes
   - When the user clicks outside the menu, the menu closes
   - When the user presses Escape, the menu closes

5. **Accessibility & Theming**
   - The overflow menu button has `aria-label="More actions"` and `aria-expanded` reflecting open state
   - The help icon button has `aria-label="Help - copy bmad help command"`
   - Both buttons have `data-testid` attributes (`help-icon`, `overflow-menu-button`)
   - The menu dropdown has `data-testid="overflow-menu-dropdown"`
   - All elements follow VS Code theme styling using CSS variables
   - Both buttons render in loading (skeleton) and loaded dashboard states

## Tasks / Subtasks

- [x] Task 1: Create `header-toolbar.tsx` component (AC: 1, 2, 3, 4, 5)
  - [x] 1.1 Create `HeaderToolbar` component with help icon ("?" via `HelpCircle` from lucide-react) and overflow menu button ("..." via `EllipsisVertical` from lucide-react)
  - [x] 1.2 Implement help icon click handler: `vscodeApi.postMessage(createCopyCommandMessage('bmad help'))`
  - [x] 1.3 Implement overflow menu toggle with `useState<boolean>` for open/closed state
  - [x] 1.4 Render menu dropdown with "Refresh" + all workflows from `useWorkflows()`
  - [x] 1.5 Implement click-outside dismiss using `useEffect` + `useRef` + document click listener
  - [x] 1.6 Implement Escape key dismiss using `useEffect` + keydown listener
  - [x] 1.7 Close menu on item click after executing action
  - [x] 1.8 Create `HeaderToolbarSkeleton` component (two disabled icon placeholders)
  - [x] 1.9 Add all `data-testid`, `aria-label`, `aria-expanded`, and `title` attributes

- [x] Task 2: Update barrel export and dashboard integration (AC: 2)
  - [x] 2.1 Add `HeaderToolbar` and `HeaderToolbarSkeleton` exports to `components/index.ts`
  - [x] 2.2 Replace `RefreshButton` with `HeaderToolbar` in `dashboard/index.tsx` (both loading and loaded states)
  - [x] 2.3 Remove `RefreshButton` export from `components/index.ts`
  - [x] 2.4 Remove or keep `refresh-button.tsx` (keep file for now — only remove the import/usage from dashboard; file can be cleaned up later if truly unused)

- [x] Task 3: Create `header-toolbar.test.tsx` tests (AC: 1, 2, 3, 4, 5)
  - [x] 3.1 Test help icon renders with `HelpCircle` icon
  - [x] 3.2 Test help icon click sends `COPY_COMMAND` with `bmad help`
  - [x] 3.3 Test overflow menu button renders
  - [x] 3.4 Test clicking overflow button opens dropdown
  - [x] 3.5 Test clicking overflow button again closes dropdown
  - [x] 3.6 Test "Refresh" appears as first menu item
  - [x] 3.7 Test clicking "Refresh" sends `REFRESH` message and closes menu
  - [x] 3.8 Test all workflows from store appear in menu
  - [x] 3.9 Test clicking a workflow sends `EXECUTE_WORKFLOW` message and closes menu
  - [x] 3.10 Test clicking outside menu closes it
  - [x] 3.11 Test pressing Escape closes menu
  - [x] 3.12 Test `aria-expanded` reflects menu state
  - [x] 3.13 Test all `data-testid` attributes present
  - [x] 3.14 Test skeleton renders placeholder elements
  - [x] 3.15 Test menu renders empty (no workflow items) when no workflows available (still shows Refresh)

- [x] Task 4: Validate build pipeline
  - [x] 4.1 Run `pnpm typecheck` — must pass
  - [x] 4.2 Run `pnpm lint` — must pass
  - [x] 4.3 Run `pnpm test` — all tests pass (expect ~365+ total)
  - [x] 4.4 Run `pnpm build` — must complete without errors

## Dev Notes

### Critical Implementation Details

**Component Architecture — Single `HeaderToolbar` component:**
The help icon and overflow menu are tightly coupled (both live in the header toolbar area, replacing RefreshButton). A single `header-toolbar.tsx` file is simplest and avoids over-engineering. Internally it can have local helper functions if needed but should NOT be split into separate files.

**Overflow Menu Pattern — Pure CSS/React state, NO external library:**
Use `useState<boolean>` for open/closed + `useRef<HTMLDivElement>` for click-outside detection. This is the same local-state pattern used in `epic-list.tsx` (expandedEpics with `useState<Set<number>>`). Do NOT install a headless UI library — keep deps minimal.

**Click-Outside Pattern:**

```typescript
const menuRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  if (!isOpen) return;
  const handleClickOutside = (e: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, [isOpen]);
```

**Escape Key Pattern:**

```typescript
useEffect(() => {
  if (!isOpen) return;
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  };
  document.addEventListener('keydown', handleEscape);
  return () => document.removeEventListener('keydown', handleEscape);
}, [isOpen]);
```

**Icons from lucide-react (already installed v0.563.0):**

- Help icon: `HelpCircle` (renders as "?" in a circle)
- Overflow menu: `EllipsisVertical` (renders as vertical "...")
- Refresh: `RefreshCw` (for menu item icon, optional)

**Message Protocol — All message types already exist, NO new types needed:**

- `createCopyCommandMessage('bmad help')` — for help icon click
- `createRefreshMessage()` — for Refresh menu item
- `createExecuteWorkflowMessage(workflow.command)` — for workflow menu items

**Workflows in Menu:**
Show ALL workflows from `useWorkflows()` in the overflow menu (both primary and secondary). This is different from `CTAButtons` which filters to secondary-only. The rationale: the overflow menu is a utility menu providing quick access to everything. The Next Action section already highlights the primary workflow, and CTAButtons shows secondary ones, but the overflow menu serves as a comprehensive "all actions" reference.

**Menu Positioning:**
Position the dropdown absolutely, anchored to the overflow button. Use `absolute right-0 top-full mt-1` to drop below the button aligned to the right edge. Apply `z-10` to ensure it renders above other content.

**Menu Styling (VS Code-native feel):**

```
bg-[var(--vscode-menu-background)]
border border-[var(--vscode-menu-border)]
text-[var(--vscode-menu-foreground)]
shadow-md rounded
```

Menu items on hover: `hover:bg-[var(--vscode-menu-selectionBackground)]`

**Button Styling (matching existing icon buttons from story 5.2):**

```
rounded p-1
text-[var(--vscode-descriptionForeground)]
hover:text-[var(--vscode-foreground)]
hover:bg-[var(--vscode-toolbar-hoverBackground)]
focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none
```

**TEA Module — NOT in scope for this story:**
The epics mention "if TEA module is installed" but there is no TEA detection logic in the codebase. The workflow discovery service already dynamically provides all available workflows. When TEA is eventually installed, its workflows will appear through WorkflowDiscoveryService automatically. No special TEA handling needed in this component.

### Previous Story Intelligence (5.1 + 5.2)

**From Story 5.1 (Epic Detail View):**

- `useState<Set<number>>` for expand/collapse state management
- `animate-expand-in` CSS keyframe already defined in `src/webviews/index.css` — reuse for menu animation
- `useCallback` for event handlers to prevent unnecessary re-renders
- `cn()` utility from `../../shared/utils/cn` for conditional classNames

**From Story 5.2 (Next Action Enhancements):**

- `actionButtonClass` constant pattern for consistent button styling
- `useWorkflows()` selector provides `AvailableWorkflow[]` from Zustand store
- `useVSCodeApi()` hook from `../../shared/hooks` for message posting
- `Play`, `Copy` icons from lucide-react at `size={12}` for inline buttons
- Message factories: `createExecuteWorkflowMessage()`, `createCopyCommandMessage()`
- Test mock pattern: `vi.mock('../../shared/hooks', ...)` + `useDashboardStore.setState()`

### Project Structure Notes

- **New file:** `src/webviews/dashboard/components/header-toolbar.tsx` — kebab-case, co-located with other dashboard components
- **New file:** `src/webviews/dashboard/components/header-toolbar.test.tsx` — co-located test
- **Modified:** `src/webviews/dashboard/components/index.ts` — add HeaderToolbar exports, remove RefreshButton export
- **Modified:** `src/webviews/dashboard/index.tsx` — replace `<RefreshButton />` with `<HeaderToolbar />` and `<HeaderToolbarSkeleton />`
- **No longer imported:** `refresh-button.tsx` — the file remains but is no longer imported or rendered from the dashboard. If linting flags it as unused, it can be deleted.

### Existing Imports Reference (copy-paste ready)

```typescript
// In header-toolbar.tsx:
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HelpCircle, EllipsisVertical, RefreshCw } from 'lucide-react';
import { useWorkflows, useLoading } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import {
  createRefreshMessage,
  createExecuteWorkflowMessage,
  createCopyCommandMessage,
} from '@shared/messages';
import type { AvailableWorkflow } from '@shared/types';
```

```typescript
// In header-toolbar.test.tsx:
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HeaderToolbar, HeaderToolbarSkeleton } from './header-toolbar';
import { useDashboardStore } from '../store';
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 5, Story 5.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Message Protocol, Naming Conventions, Testing Standards]
- [Source: _bmad-output/planning-artifacts/prd.md#FR14, FR15, FR23, NFR1]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-02-13.md#Story 5.3]
- [Source: src/webviews/dashboard/components/refresh-button.tsx — component being replaced]
- [Source: src/webviews/dashboard/components/cta-buttons.tsx — workflow button pattern reference]
- [Source: src/webviews/dashboard/components/next-action-recommendation.tsx — icon button + message pattern reference]
- [Source: src/webviews/dashboard/components/epic-list.tsx — expand/collapse + click-outside pattern reference]
- [Source: src/webviews/dashboard/store.ts — useWorkflows, useLoading selectors]
- [Source: src/shared/messages.ts — createRefreshMessage, createExecuteWorkflowMessage, createCopyCommandMessage factories]
- [Source: src/shared/types/workflow.ts — AvailableWorkflow interface]
- [Source: src/webviews/index.css — animate-expand-in keyframe]
- [Source: _bmad-output/implementation-artifacts/5-1-epic-detail-view-with-story-lists.md — expand/collapse patterns]
- [Source: _bmad-output/implementation-artifacts/5-2-next-action-enhancements.md — icon button + workflow integration patterns]

### Git Intelligence

**Recent commit pattern:** `feat: 5-X-story-slug` (e.g., `feat 5-1-epic-detail-view-with-story-lists`)
**Expected commit:** `feat: 5-3-overflow-menu-and-help-icon`

**Recent work context (last 3 commits):**

- `1bd141e` — Story 5.1: Added epic expand/collapse with story lists, introduced `animate-expand-in` CSS keyframe, added docs/ folder
- `5e0748d` — Story 4.4: Added copy-to-clipboard pattern with `Copy` icon from lucide-react
- `976790e` — Story 4.3: Terminal workflow execution, created terminal execution pattern

**Patterns established:**

- Icon buttons use `size={12}` for inline, `size={14}` for standalone
- All buttons have `data-testid`, `aria-label`, `title` attributes
- Tests mock `useVSCodeApi` and set Zustand store state directly
- Validation: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`

### Library/Framework Requirements

| Library                | Version  | Usage in This Story                                           |
| ---------------------- | -------- | ------------------------------------------------------------- |
| React                  | 19.2.4   | Component framework, useState, useRef, useEffect, useCallback |
| lucide-react           | 0.563.0  | HelpCircle, EllipsisVertical, RefreshCw icons                 |
| zustand                | 5.0.10   | useWorkflows(), useLoading() selectors                        |
| tailwindcss            | v4       | Styling with VS Code CSS variables                            |
| clsx + tailwind-merge  | via cn() | Conditional className composition                             |
| vitest                 | —        | Test runner                                                   |
| @testing-library/react | —        | Component testing (render, screen, fireEvent)                 |

**No new dependencies required.** All libraries are already installed.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prettier lint fix: reordered Tailwind classes (`animate-expand-in` before `absolute`) and fixed indentation inside workflow button JSX

### Completion Notes List

- Created `HeaderToolbar` component with HelpCircle ("?") icon and EllipsisVertical ("...") overflow menu button
- Help icon sends `COPY_COMMAND` with `bmad help` on click
- Overflow menu toggles open/closed via `useState<boolean>`, renders "Refresh" as first item + all workflows from `useWorkflows()`
- Click-outside dismiss via `useRef` + `mousedown` listener, Escape key dismiss via `keydown` listener
- Menu closes after any item click (Refresh, workflow)
- `HeaderToolbarSkeleton` renders two placeholder boxes for loading state
- All accessibility attributes: `data-testid`, `aria-label`, `aria-expanded`, `title` on all interactive elements
- Replaced `RefreshButton` with `HeaderToolbar`/`HeaderToolbarSkeleton` in dashboard layout (both loading and loaded states)
- Removed `RefreshButton` export from barrel (`components/index.ts`); file retained per story instructions
- Updated `dashboard/index.test.tsx` to expect new toolbar testids instead of `refresh-button`
- 15 unit tests covering all acceptance criteria, all passing
- Full pipeline green: typecheck, lint, 365 tests, build

### Senior Developer Review (AI)

**Reviewer:** Claude Opus 4.6 (adversarial code review)
**Date:** 2026-02-13

**Findings Summary:** 0 High, 4 Medium, 3 Low

**Acknowledged (no action):**

- M1: Story File List incomplete — 5 files changed in git but undocumented (cta-buttons.tsx/test, next-action-recommendation.tsx/test, package.json). These belong to story 5-2 scope.
- M2: Story 5-2 changes uncommitted and interleaved with 5-3 in working tree. 5-2 marked "done" but never committed.
- M4: package.json name/publisher changes are out of scope and undocumented.

**Fixed:**

- M3: Deleted orphaned `refresh-button.tsx` and `refresh-button.test.tsx` (dead code — no longer exported or imported by any component)
- L1: Added `Play` icon to workflow menu items for visual consistency with Refresh item
- L2: Added `role="menu"` on dropdown container and `role="menuitem"` on all menu items (WAI-ARIA menu pattern)
- L3: Evaluated — inline arrow in `onClick` is standard React pattern for parameterized handlers; no change needed

**Post-fix pipeline:** typecheck, lint, 359 tests (21 files), build — all GREEN

### Change Log

- 2026-02-13: Implemented story 5-3 — overflow menu & help icon replacing standalone RefreshButton
- 2026-02-13: Code review fixes — deleted dead refresh-button files, added ARIA menu roles, added workflow item icons, added 2 review tests

### File List

- `src/webviews/dashboard/components/header-toolbar.tsx` (new — then modified in review: added Play icon, role attributes)
- `src/webviews/dashboard/components/header-toolbar.test.tsx` (new — then modified in review: added 2 tests for ARIA roles and icons)
- `src/webviews/dashboard/components/index.ts` (modified — added HeaderToolbar exports, removed RefreshButton export)
- `src/webviews/dashboard/index.tsx` (modified — replaced RefreshButton with HeaderToolbar/HeaderToolbarSkeleton)
- `src/webviews/dashboard/index.test.tsx` (modified — updated tests for new toolbar components)
- `src/webviews/dashboard/components/refresh-button.tsx` (deleted — orphaned dead code)
- `src/webviews/dashboard/components/refresh-button.test.tsx` (deleted — tests for dead code)
