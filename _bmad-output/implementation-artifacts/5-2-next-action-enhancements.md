# Story 5.2: Next Action Enhancements

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the next action to be directly actionable with play and copy icons, and the Actions section to show only secondary actions,
so that I can launch my next workflow instantly without scanning through all actions.

## Acceptance Criteria

1. **Play and Copy Icons on Next Action**
   - **Given** the dashboard displays a next action recommendation
   - **When** the NextAction component renders
   - **Then** a "play" icon button is displayed that launches the next action command in the terminal
   - **And** a "copy" icon button is displayed that copies the next action command to clipboard
   - **And** the play/copy icons follow existing terminal execution and clipboard patterns from Epic 4

2. **Actions Section Becomes "Other Actions"**
   - **Given** the next action has play and copy functionality
   - **When** the Actions section renders below it
   - **Then** the Actions section heading reads "Other Actions"
   - **And** the primary/next action is NOT duplicated in the Other Actions list
   - **And** only secondary workflow actions appear in the Other Actions section

3. **Graceful Handling When No Command Available**
   - **Given** the next action type is "sprint-complete" (no associated workflow command)
   - **When** the NextAction component renders
   - **Then** the play and copy buttons are NOT displayed (since there is no actionable command)
   - **And** the label and description render as before

## Tasks / Subtasks

- [x] Task 1: Add play and copy icon buttons to NextActionRecommendation component (AC: #1, #3)
  - [x] 1.1: Import `Play` and `Copy` icons from `lucide-react` in `next-action-recommendation.tsx`
  - [x] 1.2: Import `useWorkflows` from `../store` and `useVSCodeApi` from `../../shared/hooks`
  - [x] 1.3: Import `createExecuteWorkflowMessage` and `createCopyCommandMessage` from `@shared/messages`
  - [x] 1.4: Add `useCallback` to React imports
  - [x] 1.5: Inside `NextActionRecommendation`, get `workflows` from `useWorkflows()` and `vscodeApi` from `useVSCodeApi()`
  - [x] 1.6: Derive the primary workflow's command: `const primaryWorkflow = workflows.find(w => w.isPrimary)` — this gives the command string for the next action
  - [x] 1.7: Add `handleExecute` callback that calls `vscodeApi.postMessage(createExecuteWorkflowMessage(primaryWorkflow.command))`
  - [x] 1.8: Add `handleCopy` callback that calls `vscodeApi.postMessage(createCopyCommandMessage(primaryWorkflow.command))`
  - [x] 1.9: Render play and copy icon buttons inline next to the action label, only when `primaryWorkflow` exists (AC: #3 — hide when no command)
  - [x] 1.10: Style buttons with VS Code theme colors matching CTA button patterns: `bg-[var(--vscode-button-background)]`, hover states, focus rings
  - [x] 1.11: Add `data-testid` attributes: `next-action-execute` and `next-action-copy`
  - [x] 1.12: Add `aria-label` and `title` attributes for accessibility

- [x] Task 2: Change CTAButtons heading to "Other Actions" and filter out primary workflow (AC: #2)
  - [x] 2.1: In `cta-buttons.tsx`, change the heading text from `"Actions"` to `"Other Actions"`
  - [x] 2.2: Filter the workflows list: `const secondaryWorkflows = workflows.filter(w => !w.isPrimary)`
  - [x] 2.3: Render `secondaryWorkflows` instead of `workflows` in the map
  - [x] 2.4: Update the empty check: `if (secondaryWorkflows.length === 0) return null` — section hides when only primary action exists
  - [x] 2.5: All secondary workflows keep secondary styling (no primary button styling in Other Actions since primary is in NextAction)

- [x] Task 3: Update NextActionRecommendation tests (AC: #1, #3)
  - [x] 3.1: Add `vi.mock('../../shared/hooks', ...)` for `useVSCodeApi` with `mockPostMessage`
  - [x] 3.2: Add mock workflows data to store state in `beforeEach` (including a primary workflow)
  - [x] 3.3: Test that play button renders and sends `EXECUTE_WORKFLOW` message with correct command
  - [x] 3.4: Test that copy button renders and sends `COPY_COMMAND` message with correct command
  - [x] 3.5: Test that play/copy buttons do NOT render when no primary workflow exists (e.g., sprint-complete scenario)
  - [x] 3.6: Test that buttons have correct `data-testid`, `aria-label`, and `title` attributes
  - [x] 3.7: Ensure existing tests still pass (regression check)

- [x] Task 4: Update CTAButtons tests (AC: #2)
  - [x] 4.1: Update test that checks for "Actions" heading to check for "Other Actions" instead
  - [x] 4.2: Add test verifying primary workflow is NOT rendered in the Other Actions list
  - [x] 4.3: Add test verifying only secondary workflows appear in Other Actions
  - [x] 4.4: Add test that section returns null when only primary workflow exists (no secondary)
  - [x] 4.5: Ensure existing button execution/copy tests still pass

- [x] Task 5: Build and Lint Validation (AC: #1-#3)
  - [x] 5.1: Run `pnpm typecheck` and verify no type errors
  - [x] 5.2: Run `pnpm lint` and verify no linting errors
  - [x] 5.3: Run `pnpm test` and verify all tests pass (Vitest + Mocha)
  - [x] 5.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Architecture Compliance

**MANDATORY patterns from Architecture Document and all previous story learnings:**

1. **File Naming**: kebab-case
   - CORRECT: `next-action-recommendation.tsx`, `cta-buttons.tsx`
   - WRONG: `NextAction.tsx`, `CTAButtons.tsx`

2. **Package Manager**: `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

3. **Component Pattern**: Export both main component and skeleton
   - `export function NextActionRecommendation()` + `export function NextActionRecommendationSkeleton()`
   - Re-export through `src/webviews/dashboard/components/index.ts`

4. **State Management**: Zustand with selector hooks, extension host is single source of truth
   - Use existing `useSprint()`, `useCurrentStory()`, `useWorkflows()` selector hooks
   - No new Zustand state needed — the primary workflow is derived from `useWorkflows()`

5. **Message Protocol**: Factory functions for creating messages
   - Use `createExecuteWorkflowMessage(command)` for terminal execution
   - Use `createCopyCommandMessage(command)` for clipboard copy
   - Same pattern as `cta-buttons.tsx` — copy exactly

6. **Styling**: Tailwind CSS with VS Code theme variables
   - Button background: `bg-[var(--vscode-button-background)]`, `text-[var(--vscode-button-foreground)]`
   - Hover: `hover:bg-[var(--vscode-button-hoverBackground)]`
   - Focus: `focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none`
   - Use `cn()` utility from `../../shared/utils/cn` for conditional classes

7. **Testing**: Vitest + React Testing Library for webview components
   - Co-locate test files: `next-action-recommendation.test.tsx` next to source
   - Mock pattern: `vi.mock('../../shared/hooks', () => ({ useVSCodeApi: () => ({ postMessage: mockPostMessage }) }))`
   - Set store state: `useDashboardStore.setState({ ... })`

8. **Accessibility**: Use `aria-label` on icon buttons, `title` for tooltips

### Technical Specifications

**Key Design Decision: Connecting NextAction to Workflow Commands**

The `NextAction.type` values (`dev-story`, `create-story`, `code-review`, `retrospective`, `sprint-planning`, `sprint-complete`) map 1:1 to `AvailableWorkflow.id` values used by `WorkflowDiscoveryService`. The primary workflow is always the one that matches the current next action.

**Implementation Approach:**

1. `useWorkflows()` returns the `AvailableWorkflow[]` array from the Zustand store
2. The primary workflow is: `workflows.find(w => w.isPrimary)`
3. This gives us the `.command` string (e.g., `/bmad-bmm-dev-story`) needed for execute/copy
4. When `primaryWorkflow` is `undefined` (e.g., no installed workflows, or `sprint-complete` which has no workflow definition), hide the play/copy buttons

**Why this works:** The `WorkflowDiscoveryService.computeWorkflowCandidates()` uses the EXACT same state analysis logic as `getNextAction()` — both check `currentStory.status`, `development_status` entries, etc. The primary workflow's `id` will always correspond to the next action's `type` (except for `sprint-complete` which has no matching workflow).

**Data Flow:**

```
Extension Host: WorkflowDiscoveryService → STATE_UPDATE → Webview Store (workflows[])
Webview: useWorkflows() → find(isPrimary) → primaryWorkflow.command
NextAction Click → postMessage(EXECUTE_WORKFLOW) → Extension Host → Terminal
NextAction Copy → postMessage(COPY_COMMAND) → Extension Host → Clipboard
```

**Component Layout Change:**

Before (current):

```
[Next Action]
  🚀 Continue Story 3.5          ← informational only
  "Story is in progress..."

[Actions]
  [Dev Story        ][📋]        ← primary (blue)
  [Correct Course   ][📋]        ← secondary (muted)
```

After (this story):

```
[Next Action]
  🚀 Continue Story 3.5  [▶][📋] ← NOW actionable with play/copy
  "Story is in progress..."

[Other Actions]
  [Correct Course   ][📋]        ← secondary only, no primary duplication
```

**Icon Usage (lucide-react):**

```typescript
import { Play, Copy } from 'lucide-react';
// Play: execute next action in terminal
// Copy: copy next action command to clipboard
// Size: 12px to match existing CTA button icon size
```

**Button Placement:**
The play and copy buttons should be placed INLINE with the action label row, to the right of the label text. This keeps the component compact for the sidebar while making the action immediately accessible.

```tsx
<div className="flex items-center gap-2">
  <span>{icon}</span>
  <span>{action.label}</span>
  {primaryWorkflow && (
    <div className="ml-auto flex items-center gap-1">
      <button onClick={handleExecute} data-testid="next-action-execute">
        <Play size={12} />
      </button>
      <button onClick={handleCopy} data-testid="next-action-copy">
        <Copy size={12} />
      </button>
    </div>
  )}
</div>
```

### Library & Framework Requirements

| Library               | Version   | Purpose                                                  |
| --------------------- | --------- | -------------------------------------------------------- |
| React                 | 19.2.4    | Component framework, useState, useCallback hooks         |
| Zustand               | 5.0.10    | State management (existing store, useWorkflows selector) |
| lucide-react          | 0.563.0   | Play, Copy icons (Copy already in cta-buttons)           |
| Tailwind CSS          | v4        | Utility-first styling with VS Code theme variables       |
| clsx + tailwind-merge | installed | `cn()` utility for conditional class merging             |

**No new dependencies needed.** All libraries are already installed.

### File Structure Requirements

**Files to MODIFY:**

| File                                                                    | Changes                                                                         |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/webviews/dashboard/components/next-action-recommendation.tsx`      | Add Play/Copy icon buttons with execute/copy handlers using workflows           |
| `src/webviews/dashboard/components/next-action-recommendation.test.tsx` | Add tests for play/copy buttons, message sending, graceful no-workflow handling |
| `src/webviews/dashboard/components/cta-buttons.tsx`                     | Change heading "Actions" → "Other Actions", filter out primary workflow         |
| `src/webviews/dashboard/components/cta-buttons.test.tsx`                | Update heading test, add primary-filtered tests                                 |

**Files to NOT MODIFY (read-only reference):**

| File                                              | Why Referenced                                                                   |
| ------------------------------------------------- | -------------------------------------------------------------------------------- |
| `src/shared/messages.ts`                          | `createExecuteWorkflowMessage()`, `createCopyCommandMessage()` factory functions |
| `src/shared/types/workflow.ts`                    | `AvailableWorkflow` interface with `isPrimary`, `command`                        |
| `src/webviews/dashboard/store.ts`                 | `useWorkflows()`, `useSprint()`, `useCurrentStory()` selector hooks              |
| `src/webviews/dashboard/utils/get-next-action.ts` | `getNextAction()` utility, `NextAction` type — no changes needed                 |
| `src/webviews/shared/hooks/use-vscode-api.ts`     | `useVSCodeApi()` hook for `postMessage`                                          |
| `src/webviews/shared/utils/cn.ts`                 | `cn()` class merging utility                                                     |
| `src/webviews/dashboard/components/index.ts`      | Barrel export (already exports all needed components)                            |
| `src/extension/services/workflow-discovery.ts`    | Reference for understanding workflow ID ↔ command mapping                        |

**Files to NOT Create:** No new files needed. This is purely modifications to two existing components.

### Testing Requirements

**Test File 1:** `src/webviews/dashboard/components/next-action-recommendation.test.tsx` (existing, extend)

**New Mock Required:**

```typescript
const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));
```

**New Mock Data Required:**

```typescript
const mockPrimaryWorkflow: AvailableWorkflow = {
  id: 'dev-story',
  name: 'Dev Story',
  command: '/bmad-bmm-dev-story',
  description: 'Implement the next story',
  isPrimary: true,
};

const mockSecondaryWorkflow: AvailableWorkflow = {
  id: 'correct-course',
  name: 'Correct Course',
  command: '/bmad-bmm-correct-course',
  description: 'Adjust sprint plan',
  isPrimary: false,
};
```

**Add to `beforeEach`:** `workflows: [mockPrimaryWorkflow, mockSecondaryWorkflow]` in store state.

**Required New Test Cases:**

1. Play button renders and clicking sends `EXECUTE_WORKFLOW` with correct command
2. Copy button renders and clicking sends `COPY_COMMAND` with correct command
3. Play/copy buttons NOT rendered when `workflows` is empty (no primary workflow)
4. Play/copy buttons NOT rendered when no primary workflow exists in workflows array
5. Buttons have correct `data-testid` attributes (`next-action-execute`, `next-action-copy`)
6. Buttons have correct `aria-label` attributes
7. Existing tests continue to pass unchanged

**Test File 2:** `src/webviews/dashboard/components/cta-buttons.test.tsx` (existing, extend)

**Required Test Updates/Additions:**

1. UPDATE: Heading test checks for "Other Actions" instead of "Actions"
2. NEW: When only primary workflow exists, CTAButtons returns null (no Other Actions to show)
3. NEW: When both primary and secondary exist, only secondary appears in rendered list
4. NEW: Primary workflow's execute/copy buttons are NOT in Other Actions section
5. Existing execute/copy message tests pass (they test secondary workflows now)

### Previous Story Intelligence

**From Story 5.1 (Epic Detail View with Story Lists) — Most Recent:**

- 336+ Vitest tests passing (29 in epic-list alone)
- All verification passed: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Expand/collapse pattern with `useState<Set<number>>` — different pattern from this story
- lucide-react icons used (ChevronRight, ChevronDown, Check) — same library, same import pattern
- `cn()` utility used for conditional styling — same pattern applies here

**From Story 4.4 (Copy Command to Clipboard) — CTA Button Patterns:**

- Copy icon button pattern established in `cta-buttons.tsx`
- `useVSCodeApi().postMessage()` pattern with factory functions
- `data-testid` naming: `cta-execute-{id}`, `cta-copy-{id}`
- Test mock pattern: `vi.mock('../../shared/hooks', ...)`

**From Story 4.2 (Context-Sensitive CTA Buttons) — Workflow Integration:**

- `useWorkflows()` selector hook established
- `AvailableWorkflow.isPrimary` flag determines primary vs secondary styling
- Workflow state computed by `WorkflowDiscoveryService` and sent via `STATE_UPDATE`

**From Story 3.5 (Next Action Recommendation) — Original Implementation:**

- Created the `NextActionRecommendation` component being modified
- `getNextAction()` utility computes recommendations from sprint/story state
- Action types map 1:1 to workflow IDs (by design, same state analysis logic)
- 10 existing tests (8 component + 2 skeleton)

**Git Intelligence:**

- Commit pattern: `feat: 5-1-epic-detail-view-with-story-lists`
- Build validation: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Recent commits are clean, linear progression through Epic 5
- Last commit (1bd141e) was story 5.1 implementation

### Key Existing Code Reference

**Current `next-action-recommendation.tsx` structure (62 lines):**

- `actionIcons` — maps NextAction.type to emoji
- `NextActionRecommendationSkeleton` — loading skeleton
- `NextActionRecommendation` — main component using `useSprint()`, `useCurrentStory()`, `getNextAction()`
- Currently purely informational — NO buttons, NO vscodeApi usage

**Current `cta-buttons.tsx` structure (89 lines):**

- `CTAButtonsSkeleton` — loading skeleton
- `CTAButtons` — renders ALL workflows (primary + secondary) with execute/copy buttons
- Uses `useWorkflows()`, `useVSCodeApi()`, `createExecuteWorkflowMessage`, `createCopyCommandMessage`
- Primary workflows get blue styling, secondary get muted styling

**Critical: The `cta-buttons.tsx` has the EXACT patterns needed for the NextAction buttons. Copy the execute/copy handler logic directly.**

### Design Decisions

**Button Style for NextAction Play/Copy:**
Use compact icon-only buttons (not full-width like CTA buttons) since they're inline with the action label. Style with primary button colors to visually indicate they are actionable.

**Primary Filtering in CTAButtons:**
Filter using `workflows.filter(w => !w.isPrimary)`. This is clean because the `isPrimary` flag is already computed by `WorkflowDiscoveryService` and always matches the next action.

**Skeleton Update:**
The `NextActionRecommendationSkeleton` should include small placeholder rectangles for the play/copy buttons to maintain layout consistency during loading.

### Project Structure Notes

- Alignment with unified project structure: All changes are within `src/webviews/dashboard/components/` — standard location for dashboard UI components
- No conflicts with other components or services
- No changes to extension host code, shared types, or message protocol — purely a webview UI enhancement
- No barrel export changes needed — both components already exported

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-5.2] - Next action enhancements acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-5] - UX Polish & Dashboard Enhancements epic objectives
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - EXECUTE_WORKFLOW, COPY_COMMAND message types
- [Source: _bmad-output/planning-artifacts/architecture.md#Workflow-Execution] - Terminal execution and clipboard copy patterns
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns] - Naming conventions, component patterns, testing standards
- [Source: src/webviews/dashboard/components/next-action-recommendation.tsx] - Current NextActionRecommendation component (62 lines)
- [Source: src/webviews/dashboard/components/next-action-recommendation.test.tsx] - Current tests (10 tests in 2 describe blocks)
- [Source: src/webviews/dashboard/components/cta-buttons.tsx] - CTA buttons with execute/copy pattern (89 lines)
- [Source: src/webviews/dashboard/components/cta-buttons.test.tsx] - CTA tests (13 tests in 2 describe blocks)
- [Source: src/shared/messages.ts] - `createExecuteWorkflowMessage()`, `createCopyCommandMessage()` factory functions
- [Source: src/shared/types/workflow.ts] - `AvailableWorkflow` interface with `isPrimary`, `command`, `id`
- [Source: src/webviews/dashboard/store.ts] - Zustand store with `useWorkflows()` selector hook
- [Source: src/webviews/dashboard/utils/get-next-action.ts] - `getNextAction()` utility, `NextAction` type
- [Source: src/extension/services/workflow-discovery.ts] - `WorkflowDiscoveryService` with `WORKFLOW_DEFINITIONS` mapping IDs to commands

## Change Log

- 2026-02-13: Implemented story 5-2-next-action-enhancements — added play/copy icon buttons to NextAction, changed CTAButtons to "Other Actions" with primary filtering, updated all tests (349 passing)
- 2026-02-13: Code review fixes — removed dead isPrimary ternary and cn import in CTAButtons, removed useless useCallback in NextAction, extracted duplicated button className to constant, removed always-visible skeleton button placeholders, added edge case test for mismatched next-action/workflow state (350 tests passing)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prettier lint error on class order (`p-1 bg-[...]` → `bg-[...] p-1`) — fixed by reordering Tailwind classes

### Completion Notes List

- Task 1: Added Play and Copy icon buttons to `NextActionRecommendation` component with `useWorkflows()` + `useVSCodeApi()` integration. Buttons conditionally render only when a primary workflow exists (handles sprint-complete gracefully). Skeleton updated with placeholder rectangles for buttons.
- Task 2: Changed CTAButtons heading from "Actions" to "Other Actions" and filtered out primary workflow using `workflows.filter(w => !w.isPrimary)`. Section returns null when no secondary workflows exist.
- Task 3: Extended NextActionRecommendation tests from 10 to 19 tests. Added mock for `useVSCodeApi`, mock workflow data, tests for play/copy button rendering, message sending, no-primary-workflow hiding, data-testid/aria-label/title attributes.
- Task 4: Updated CTAButtons tests to reflect new behavior: heading now "Other Actions", primary workflow filtered out, returns null when only primary exists. All 13 tests updated and passing.
- Task 5: Full validation passed — `pnpm typecheck`, `pnpm lint`, `pnpm test` (349 tests), `pnpm build` all clean.

### File List

- `src/webviews/dashboard/components/next-action-recommendation.tsx` (modified) — Added play/copy icon buttons with workflow integration
- `src/webviews/dashboard/components/next-action-recommendation.test.tsx` (modified) — Extended with 10 new tests for play/copy functionality
- `src/webviews/dashboard/components/cta-buttons.tsx` (modified) — Changed heading to "Other Actions", filtered primary workflow
- `src/webviews/dashboard/components/cta-buttons.test.tsx` (modified) — Updated tests for new filtering behavior
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) — Updated 5-2 status from backlog to review
