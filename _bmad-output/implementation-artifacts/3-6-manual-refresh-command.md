# Story 3.6: Manual Refresh Command

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to manually refresh the dashboard state,
So that I can recover from errors or force a re-sync.

## Acceptance Criteria

1. **Refresh via Dashboard Button**
   - **Given** the dashboard is displayed
   - **When** the user clicks a refresh button in the dashboard UI
   - **Then** the extension re-parses all BMAD files (FR23)
   - **And** the dashboard displays a loading state during refresh (skeleton loaders)
   - **And** the state updates upon completion

2. **Refresh via Command Palette**
   - **Given** the `bmad.refresh` command is registered
   - **When** the user invokes it via command palette
   - **Then** the dashboard refreshes (same behavior as button click)

3. **Error Recovery**
   - **Given** an error state is displayed in the dashboard
   - **When** the user triggers refresh
   - **Then** the error clears if parsing succeeds (NFR6)
   - **And** errors remain visible if parsing fails again

## Tasks / Subtasks

- [x] Task 1: Create RefreshButton component (AC: #1)
  - [x] 1.1: Create `src/webviews/dashboard/components/refresh-button.tsx` with `RefreshButton` component
  - [x] 1.2: Use `useVSCodeApi()` hook to get `postMessage` function
  - [x] 1.3: Call `createRefreshMessage()` from `@shared/messages` on button click
  - [x] 1.4: Style as a subtle icon/text button using VS Code theme CSS variables
  - [x] 1.5: Disable button and show "Refreshing..." state when `loading` is true (use `useLoading()` from store)
  - [x] 1.6: Add `data-testid="refresh-button"` for testability

- [x] Task 2: Wire RefreshButton into Dashboard layout (AC: #1)
  - [x] 2.1: Update `src/webviews/dashboard/components/index.ts` barrel to export `RefreshButton`
  - [x] 2.2: Update `src/webviews/dashboard/index.tsx` to render `RefreshButton` in the dashboard header area (above SprintStatus)
  - [x] 2.3: RefreshButton should be visible in BOTH loading and loaded states (not hidden during skeleton phase)

- [x] Task 3: Verify command palette integration (AC: #2)
  - [x] 3.1: Confirm `bmad.refresh` command already registered in `package.json` and `extension.ts` (it IS - no code changes needed)
  - [x] 3.2: Confirm `DashboardViewProvider.handleMessage` already handles REFRESH message (it DOES - no code changes needed)
  - [x] 3.3: Document in completion notes that command palette integration was pre-existing

- [x] Task 4: Write unit tests for RefreshButton component (AC: #1, #3)
  - [x] 4.1: Create `src/webviews/dashboard/components/refresh-button.test.tsx`
  - [x] 4.2: Test renders refresh button with correct data-testid
  - [x] 4.3: Test sends REFRESH message via postMessage when clicked
  - [x] 4.4: Test button is disabled when loading is true
  - [x] 4.5: Test button shows different text/state when loading
  - [x] 4.6: Test button is enabled when loading is false

- [x] Task 5: Write integration test for error recovery flow (AC: #3)
  - [x] 5.1: Add test in `refresh-button.test.tsx` verifying button is clickable when errors exist in store
  - [x] 5.2: Verify refresh message sent when errors are present (error clearing happens server-side in StateManager.refresh())

- [x] Task 6: Build and Lint Validation (AC: #1, #2, #3)
  - [x] 6.1: Run `pnpm typecheck` and verify no type errors
  - [x] 6.2: Run `pnpm lint` and verify no linting errors
  - [x] 6.3: Run `pnpm test` and verify all tests pass (existing + new)
  - [x] 6.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical: Most Infrastructure Already Exists

**This story is primarily a UI task.** The following already work end-to-end:

1. **`bmad.refresh` command** - Registered in `package.json` (contributes.commands) and `extension.ts` (line 32-34). Calls `stateManager.refresh()`.
2. **REFRESH message type** - Defined in `src/shared/messages.ts` with factory `createRefreshMessage()` and type guard `isRefreshMessage()`.
3. **DashboardViewProvider** handles REFRESH messages by calling `stateManager.refresh()` (line 83-86).
4. **StateManager.refresh()** - Clears errors, sets `loading: true`, re-parses all files, fires state change event.
5. **Dashboard loading state** - Already renders skeleton loaders when `loading: true`.
6. **Initial refresh on mount** - Dashboard sends REFRESH on mount in `index.tsx` (line 25).

**The ONLY missing piece is a user-facing refresh button in the dashboard UI.**

### Architecture Compliance

**MANDATORY patterns from Architecture Document and previous story learnings:**

1. **File Naming**: kebab-case
   - CORRECT: `refresh-button.tsx`, `refresh-button.test.tsx`
   - WRONG: `RefreshButton.tsx`

2. **Component Naming**: PascalCase for components

   ```typescript
   export function RefreshButton(): React.ReactElement { ... }
   ```

3. **Package Manager**: `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

4. **Imports**:
   - `@shared/messages` for `createRefreshMessage`
   - `../../shared/hooks/use-vscode-api` for `useVSCodeApi`
   - `../store` for `useLoading`
   - Relative imports for local files

5. **Styling**: VS Code theme CSS variables via Tailwind arbitrary values
   - `text-[var(--vscode-foreground)]` for primary text
   - `text-[var(--vscode-descriptionForeground)]` for secondary text
   - `text-[var(--vscode-textLink-foreground)]` for interactive elements
   - `hover:text-[var(--vscode-textLink-activeForeground)]` for hover states
   - `opacity-50` and `cursor-not-allowed` for disabled state

6. **Zustand Store Usage**: Use existing selector hooks

   ```typescript
   import { useLoading } from '../store';
   // DO NOT create a new store
   ```

7. **Testing**: Vitest + @testing-library/react
   - Co-locate tests next to component
   - Mock vscodeApi via the existing mock pattern
   - Mock store state via `useDashboardStore.setState()`
   - Use `render`, `screen`, `fireEvent` from testing-library

### Technical Specifications

**RefreshButton Component:**

```typescript
import { useVSCodeApi } from '../../shared/hooks/use-vscode-api';
import { createRefreshMessage } from '@shared/messages';
import { useLoading } from '../store';

export function RefreshButton(): React.ReactElement {
  const vscodeApi = useVSCodeApi();
  const loading = useLoading();

  const handleRefresh = () => {
    vscodeApi.postMessage(createRefreshMessage());
  };

  return (
    <button
      type="button"
      data-testid="refresh-button"
      disabled={loading}
      onClick={handleRefresh}
      className={cn(
        'text-xs text-[var(--vscode-textLink-foreground)] hover:underline',
        loading && 'cursor-not-allowed opacity-50'
      )}
    >
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
```

**Dashboard Layout Integration:**

The button should be placed as a header row above the component stack. The dashboard currently renders in vertical stack order:

```
SprintStatus > EpicList > ActiveStoryCard > NextActionRecommendation > PlanningArtifactLinks
```

Add a header row with title + refresh button:

```
[Dashboard Header: "BMAD Dashboard" + RefreshButton] > SprintStatus > EpicList > ...
```

The RefreshButton should be rendered in BOTH the loading and loaded branches (it must always be visible so users can trigger refresh even during loading or error states).

**Message Flow (already implemented):**

```
RefreshButton click
  → vscodeApi.postMessage(createRefreshMessage())
  → DashboardViewProvider.handleMessage({ type: 'REFRESH' })
  → stateManager.refresh()
  → sets loading:true, clears errors, re-parses all files
  → fires onStateChange event
  → DashboardViewProvider sends STATE_UPDATE to webview
  → useMessageHandler updates Zustand store
  → React re-renders: loading=true → skeletons → loading=false → content
```

**Key Existing Code Locations:**

| Purpose                     | File                                                            | Key Exports/APIs         |
| --------------------------- | --------------------------------------------------------------- | ------------------------ |
| REFRESH message factory     | `src/shared/messages.ts`                                        | `createRefreshMessage()` |
| VS Code API hook            | `src/webviews/shared/hooks/use-vscode-api.ts`                   | `useVSCodeApi()`         |
| Dashboard store             | `src/webviews/dashboard/store.ts`                               | `useLoading()`           |
| Dashboard entry             | `src/webviews/dashboard/index.tsx`                              | Dashboard component      |
| Component barrel            | `src/webviews/dashboard/components/index.ts`                    | All component exports    |
| cn utility                  | `src/webviews/shared/utils/cn.ts`                               | `cn()`                   |
| Button pattern reference    | `src/webviews/dashboard/components/planning-artifact-links.tsx` | Text button styling      |
| Active story button pattern | `src/webviews/dashboard/components/active-story-card.tsx`       | Clickable button styling |

### Project Structure Notes

**Files to Create:**

- `src/webviews/dashboard/components/refresh-button.tsx` - RefreshButton component
- `src/webviews/dashboard/components/refresh-button.test.tsx` - Component tests

**Files to Modify:**

- `src/webviews/dashboard/components/index.ts` - Add RefreshButton export
- `src/webviews/dashboard/index.tsx` - Wire RefreshButton into dashboard layout header

**Files to NOT Modify (read-only references):**

- `src/shared/messages.ts` - REFRESH message already exists, use `createRefreshMessage()`
- `src/extension/extension.ts` - `bmad.refresh` command already registered
- `src/extension/providers/dashboard-view-provider.ts` - REFRESH handling already implemented
- `src/extension/services/state-manager.ts` - `refresh()` method already works
- `src/webviews/dashboard/store.ts` - `useLoading()` selector already exists
- `package.json` - `bmad.refresh` command already in contributes.commands

**Dependencies (all already installed - NO new packages):**

- `react` 19.2.0
- `zustand` ^5.0.0
- `clsx` (for cn utility)
- `tailwind-merge` (for cn utility)
- `@testing-library/react` 16.3.2
- `vitest` ^4.0.18

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.6] - Story acceptance criteria and BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - REFRESH message type in ToExtension union
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns] - File and component naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns] - Error recovery via bmad.refresh
- [Source: _bmad-output/planning-artifacts/architecture.md#File-Watching] - Manual refresh as fallback to file watcher
- [Source: src/shared/messages.ts] - createRefreshMessage(), isRefreshMessage(), ToExtensionType.REFRESH
- [Source: src/extension/extension.ts:32-34] - bmad.refresh command registration
- [Source: src/extension/providers/dashboard-view-provider.ts:83-86] - REFRESH message handling
- [Source: src/extension/services/state-manager.ts:96-102] - StateManager.refresh() implementation
- [Source: src/webviews/dashboard/store.ts] - useLoading() selector hook, DashboardStore interface
- [Source: src/webviews/dashboard/index.tsx] - Dashboard component layout and loading/content branching
- [Source: src/webviews/dashboard/components/planning-artifact-links.tsx:40-48] - Text button styling pattern
- [Source: src/webviews/dashboard/components/active-story-card.tsx:74-80] - Clickable button pattern
- [Source: src/webviews/shared/hooks/use-vscode-api.ts] - useVSCodeApi() hook
- [Source: src/webviews/shared/utils/cn.ts] - cn() class name utility

### Previous Story Intelligence

**From Story 3.5 (Next Action Recommendation):**

- 295 tests total across all stories using Vitest
- All validation gates passed: typecheck, lint, test, build
- Dashboard renders components in order: SprintStatus > EpicList > ActiveStoryCard > NextActionRecommendation > PlanningArtifactLinks
- Loading branch renders corresponding skeleton components in same order
- Prettier formatting issues on multi-line arrow functions - fix by inlining expressions
- `useVSCodeApi()` hook used successfully in ActiveStoryCard for sending OPEN_DOCUMENT messages
- Components use `data-testid` attributes for test targeting

**From Story 3.4 (Active Story Card):**

- Mock pattern for `useVSCodeApi`: mock the module at `../../shared/hooks/use-vscode-api`
- Button click tests: `fireEvent.click()` + `expect(mockPostMessage).toHaveBeenCalledWith()`
- 17 tests added in that story (260 total at that point)

**From Story 3.2 (Sprint Status Display):**

- Dashboard owns loading orchestration - components check their own `loading` prop or store selector
- Remove dead exports from barrel file
- Test ALL conditional render paths

**From Story 3.1 (Dashboard Zustand Store):**

- Store state set directly in tests via `useDashboardStore.setState()`
- Avoid dead code in components

**Git Intelligence:**

- Recent commits: `feat: 3-5-next-action-recommendation`, `feat: 3-4-active-story-card-with-task-progress`, etc.
- Package manager: `pnpm`
- Last 5 commits are all Epic 3 stories (3.1-3.5)
- All pass: typecheck, lint, test (295 passing), build
- This is the FINAL story in Epic 3

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Created `RefreshButton` component following established patterns (useVSCodeApi, createRefreshMessage, useLoading, cn utility, VS Code theme CSS variables via Tailwind arbitrary values)
- Dashboard header row added with "BMAD Dashboard" title + RefreshButton, rendered in BOTH loading and loaded branches so refresh is always accessible
- Command palette integration (`bmad.refresh`) was pre-existing and fully functional — registered in `package.json` (contributes.commands), wired in `extension.ts` (line 32-34), handled by `DashboardViewProvider` (line 83-86), all calling `stateManager.refresh()`
- Error recovery (AC #3) works end-to-end: RefreshButton remains enabled when errors exist in store; clicking sends REFRESH message; StateManager.refresh() clears errors and re-parses all files server-side
- 7 new tests added (302 total, up from 295): renders with data-testid, sends REFRESH on click, disabled when loading, shows "Refreshing..." when loading, enabled when not loading, shows "Refresh" text, clickable with errors in store
- All validation gates pass: typecheck, lint, test (302 passing), build
- This is the FINAL story in Epic 3 (Dashboard State Visibility)
- [Code Review Fix] Added aria-label and title attributes for accessibility (M2, L2)
- [Code Review Fix] Fixed hover:underline applying on disabled button state (M1)
- [Code Review Fix] Added Dashboard-level integration tests verifying RefreshButton renders in both loading and loaded branches (M3)
- [Code Review Fix] Added aria-label accessibility test (M2)
- Post-review: 305 tests total (3 added by review), all gates pass

### File List

- `src/webviews/dashboard/components/refresh-button.tsx` (new) - RefreshButton component
- `src/webviews/dashboard/components/refresh-button.test.tsx` (new) - 8 unit/integration tests
- `src/webviews/dashboard/components/index.ts` (modified) - Added RefreshButton export
- `src/webviews/dashboard/index.tsx` (modified) - Wired RefreshButton into dashboard header in both loading and loaded branches
- `src/webviews/dashboard/index.test.tsx` (new) - 2 Dashboard integration tests for RefreshButton presence

## Change Log

- 2026-02-12: Implemented Story 3.6 - Added RefreshButton component to dashboard UI, wired into header layout, verified pre-existing command palette integration, added 7 tests (302 total)
- 2026-02-12: Code review fixes - Added aria-label/title for accessibility, fixed hover state on disabled button, added 3 tests (305 total)
