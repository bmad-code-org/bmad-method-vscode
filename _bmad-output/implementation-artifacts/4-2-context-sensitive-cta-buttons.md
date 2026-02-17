# Story 4.2: Context-Sensitive CTA Buttons

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want context-sensitive action buttons displayed based on project state,
So that I see the most relevant actions for my current situation.

## Acceptance Criteria

1. **Workflow CTA Buttons Render from State**
   - **Given** the dashboard receives available workflow data via `STATE_UPDATE`
   - **When** the CTAButtons component renders
   - **Then** it displays a button for each `AvailableWorkflow` in `DashboardState.workflows` (FR14)
   - **And** each button shows the workflow's display name
   - **And** the primary/recommended workflow (`isPrimary: true`) is visually emphasized with `--vscode-button-background`

2. **Empty State Handling**
   - **Given** `DashboardState.workflows` is an empty array
   - **When** the CTAButtons component renders
   - **Then** the section is hidden (returns `null`) to avoid empty UI chrome

3. **Reactive Updates on State Change**
   - **Given** the project state changes (e.g., story moved from backlog to ready-for-dev)
   - **When** the `WorkflowDiscoveryService` recomputes workflows and `STATE_UPDATE` fires
   - **Then** the CTA buttons update automatically via Zustand store subscription
   - **And** old buttons are replaced with new ones matching the updated workflow list

4. **Execute Workflow Action**
   - **Given** the user clicks a CTA button's main area
   - **When** the click handler fires
   - **Then** an `EXECUTE_WORKFLOW` message is sent to the extension host with `{ command: workflow.command }`
   - **And** the extension host creates/reuses a BMAD terminal and sends the command

5. **Copy Command Action**
   - **Given** the user clicks the "copy" icon/button next to a workflow CTA
   - **When** the click handler fires
   - **Then** a `COPY_COMMAND` message is sent to the extension host with `{ command: workflow.command }`
   - **And** the extension host copies the command text to clipboard and shows a toast

6. **Terminal Execution in Extension Host**
   - **Given** the extension host receives an `EXECUTE_WORKFLOW` message
   - **When** it processes the message
   - **Then** it creates a terminal named "BMAD" or reuses an existing one
   - **And** sends the command text to the terminal via `terminal.sendText()`
   - **And** brings the terminal to focus via `terminal.show()`

7. **Clipboard Copy in Extension Host**
   - **Given** the extension host receives a `COPY_COMMAND` message
   - **When** it processes the message
   - **Then** it copies the command string to clipboard via `vscode.env.clipboard.writeText()`
   - **And** shows an information message toast: "Command copied to clipboard"

8. **VS Code Theme Integration**
   - **Given** the CTA buttons render
   - **When** styled
   - **Then** the primary button uses `--vscode-button-background` / `--vscode-button-foreground` / `--vscode-button-hoverBackground`
   - **And** secondary buttons use `--vscode-button-secondaryBackground` / `--vscode-button-secondaryForeground` / `--vscode-button-secondaryHoverBackground`
   - **And** all buttons are keyboard-accessible with focus rings using `--vscode-focusBorder`

## Tasks / Subtasks

- [x] Task 1: Create CTAButtons component (AC: #1, #2, #3, #8)
  - [x] 1.1: Create `src/webviews/dashboard/components/cta-buttons.tsx`
  - [x] 1.2: Import `useWorkflows` selector from store and `useVSCodeApi` hook
  - [x] 1.3: Render empty (return `null`) when `workflows.length === 0`
  - [x] 1.4: Render a section with "Actions" heading and a button per workflow
  - [x] 1.5: Primary button (`isPrimary: true`): `--vscode-button-background` + `--vscode-button-foreground`
  - [x] 1.6: Secondary buttons (`isPrimary: false`): `--vscode-button-secondaryBackground` + `--vscode-button-secondaryForeground`
  - [x] 1.7: Each button row has: main button (click = execute) + small copy icon button (click = copy)
  - [x] 1.8: On main button click: `vscodeApi.postMessage(createExecuteWorkflowMessage(workflow.command))`
  - [x] 1.9: On copy button click: `vscodeApi.postMessage(createCopyCommandMessage(workflow.command))`
  - [x] 1.10: Add `data-testid` attributes for test targeting

- [x] Task 2: Create CTAButtonsSkeleton component (AC: #1)
  - [x] 2.1: Add `CTAButtonsSkeleton` export with skeleton UI matching loaded layout
  - [x] 2.2: Use existing skeleton pattern from other components (animate-pulse, `--vscode-editor-inactiveSelectionBackground`)

- [x] Task 3: Integrate CTAButtons into Dashboard layout (AC: #1, #3)
  - [x] 3.1: Export `CTAButtons` and `CTAButtonsSkeleton` from `src/webviews/dashboard/components/index.ts`
  - [x] 3.2: Import and place `<CTAButtons />` in `src/webviews/dashboard/index.tsx` after `<NextActionRecommendation />`
  - [x] 3.3: Add `<CTAButtonsSkeleton />` in the loading branch at the same position

- [x] Task 4: Implement EXECUTE_WORKFLOW handler in DashboardViewProvider (AC: #4, #6)
  - [x] 4.1: In `src/extension/providers/dashboard-view-provider.ts`, replace the EXECUTE_WORKFLOW placeholder (line 91-94) with actual handler
  - [x] 4.2: Create private `executeWorkflow(command: string)` method
  - [x] 4.3: Find or create a terminal named "BMAD" via `vscode.window.terminals.find()` / `vscode.window.createTerminal()`
  - [x] 4.4: Send command to terminal via `terminal.sendText(command)`
  - [x] 4.5: Bring terminal to focus via `terminal.show()`

- [x] Task 5: Implement COPY_COMMAND handler in DashboardViewProvider (AC: #5, #7)
  - [x] 5.1: In `src/extension/providers/dashboard-view-provider.ts`, add COPY_COMMAND handler
  - [x] 5.2: Create private `copyCommand(command: string)` method
  - [x] 5.3: Copy via `vscode.env.clipboard.writeText(command)`
  - [x] 5.4: Show toast via `vscode.window.showInformationMessage('Command copied to clipboard')`

- [x] Task 6: Write unit tests for CTAButtons component (AC: #1, #2, #3, #4, #5, #8)
  - [x] 6.1: Create `src/webviews/dashboard/components/cta-buttons.test.tsx`
  - [x] 6.2: Test: renders nothing when workflows is empty array
  - [x] 6.3: Test: renders button for each workflow in the array
  - [x] 6.4: Test: primary workflow button has primary styling (vscode-button-background)
  - [x] 6.5: Test: secondary workflow buttons have secondary styling
  - [x] 6.6: Test: clicking main button calls postMessage with EXECUTE_WORKFLOW and correct command
  - [x] 6.7: Test: clicking copy button calls postMessage with COPY_COMMAND and correct command
  - [x] 6.8: Test: buttons re-render when workflows state changes
  - [x] 6.9: Test: skeleton renders with expected structure

- [x] Task 7: Write unit tests for DashboardViewProvider message handlers (AC: #6, #7)
  - [x] 7.1: Add tests to existing `src/extension/providers/dashboard-view-provider.test.ts` (or create if needed)
  - [x] 7.2: Test: EXECUTE_WORKFLOW message creates terminal and sends command
  - [x] 7.3: Test: EXECUTE_WORKFLOW reuses existing "BMAD" terminal
  - [x] 7.4: Test: COPY_COMMAND message copies to clipboard
  - [x] 7.5: Test: COPY_COMMAND shows information message toast

- [x] Task 8: Build and Lint Validation (AC: #1-#8)
  - [x] 8.1: Run `pnpm typecheck` and verify no type errors
  - [x] 8.2: Run `pnpm lint` and verify no linting errors
  - [x] 8.3: Run `pnpm test` and verify all tests pass (existing + new)
  - [x] 8.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical: This is a Webview Component + Extension Host Handler Story

**This story creates the CTA UI and wires up terminal/clipboard execution.** The workflow discovery engine (Story 4.1) is complete. This story:

1. **Webview component** - `CTAButtons` React component consuming `useWorkflows()` from Zustand
2. **Extension host handlers** - EXECUTE_WORKFLOW and COPY_COMMAND message processing in `DashboardViewProvider`
3. **Dashboard integration** - CTAButtons placed in the dashboard layout

### Architecture Compliance

**MANDATORY patterns from Architecture Document and all previous story learnings:**

1. **File Naming**: kebab-case
   - CORRECT: `cta-buttons.tsx`, `cta-buttons.test.tsx`
   - WRONG: `CTAButtons.tsx`, `ctaButtons.tsx`

2. **Component/Function Naming**: PascalCase for components, camelCase for functions

   ```typescript
   export function CTAButtons(): React.ReactElement { ... }
   export function CTAButtonsSkeleton(): React.ReactElement { ... }
   ```

3. **Package Manager**: `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

4. **Message Protocol**: Use existing `createExecuteWorkflowMessage()` and `createCopyCommandMessage()` factory functions from `@shared/messages`
   - Do NOT create new message types
   - Do NOT send raw message objects - use the factory functions

5. **Error Pattern**: Never throw from extension host handlers - wrap in try/catch, show error message to user

   ```typescript
   private async executeWorkflow(command: string): Promise<void> {
     try { ... } catch { void vscode.window.showErrorMessage('Failed to execute workflow'); }
   }
   ```

6. **Zustand Store**: Use existing `useWorkflows()` selector hook
   - ALREADY EXISTS in `src/webviews/dashboard/store.ts`
   - Do NOT create new state or modify the store

7. **Styling**: VS Code theme CSS variables via Tailwind arbitrary values
   - Primary button: `bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]`
   - Secondary button: `bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]`
   - Focus ring: `focus:outline-none focus:ring-1 focus:ring-[var(--vscode-focusBorder)]`
   - Use `cn()` utility from `../../shared/utils/cn` for conditional classes

8. **Testing**:
   - Webview component tests: Vitest + @testing-library/react
   - Extension host tests: Mocha + Sinon (for files using VS Code API)
   - Co-locate tests next to source
   - Pattern: `useDashboardStore.setState()` for store state mocking
   - Pattern: `vi.mock('../../shared/hooks', ...)` for mocking `useVSCodeApi`
   - Use `data-testid` for test targeting (e.g., `data-testid="cta-buttons"`, `data-testid="cta-execute-sprint-planning"`)

9. **Component Patterns from Existing Components:**
   - Return `React.ReactElement` (not JSX.Element)
   - Section wrapper with `data-testid` and `className="flex flex-col gap-2"`
   - Heading: `<h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">`
   - Skeleton: `animate-pulse` with `bg-[var(--vscode-editor-inactiveSelectionBackground)]`

10. **Imports**:
    - `@shared/messages` for message factory functions
    - `@shared/types` for shared type imports (e.g., `AvailableWorkflow`)
    - `../../shared/hooks` for `useVSCodeApi`
    - `../../shared/utils/cn` for `cn()` utility
    - `../store` for `useWorkflows` selector
    - Relative imports for local files within same context

### Technical Specifications

**CTAButtons Component** (`src/webviews/dashboard/components/cta-buttons.tsx`):

```typescript
import React from 'react';
import { useWorkflows } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createExecuteWorkflowMessage, createCopyCommandMessage } from '@shared/messages';
import type { AvailableWorkflow } from '@shared/types';
import { cn } from '../../shared/utils/cn';

export function CTAButtonsSkeleton(): React.ReactElement {
  return (
    <div data-testid="cta-buttons-skeleton" className="flex animate-pulse flex-col gap-2">
      <div className="h-3 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-7 w-full rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-7 w-full rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
    </div>
  );
}

export function CTAButtons(): React.ReactElement | null {
  const workflows = useWorkflows();
  const vscodeApi = useVSCodeApi();

  if (workflows.length === 0) {
    return null;
  }

  const handleExecute = (workflow: AvailableWorkflow) => {
    vscodeApi.postMessage(createExecuteWorkflowMessage(workflow.command));
  };

  const handleCopy = (workflow: AvailableWorkflow) => {
    vscodeApi.postMessage(createCopyCommandMessage(workflow.command));
  };

  return (
    <section data-testid="cta-buttons" className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">
        Actions
      </h2>
      {workflows.map((workflow) => (
        <div key={workflow.id} className="flex items-stretch gap-1">
          <button
            type="button"
            data-testid={`cta-execute-${workflow.id}`}
            onClick={() => handleExecute(workflow)}
            title={workflow.description}
            className={cn(
              'flex-1 rounded-l px-3 py-1.5 text-xs font-medium transition-colors',
              'focus:outline-none focus:ring-1 focus:ring-[var(--vscode-focusBorder)]',
              workflow.isPrimary
                ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]'
                : 'bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]'
            )}
          >
            {workflow.name}
          </button>
          <button
            type="button"
            data-testid={`cta-copy-${workflow.id}`}
            onClick={() => handleCopy(workflow)}
            title={`Copy: ${workflow.command}`}
            aria-label={`Copy ${workflow.name} command`}
            className={cn(
              'rounded-r px-2 py-1.5 text-xs transition-colors',
              'focus:outline-none focus:ring-1 focus:ring-[var(--vscode-focusBorder)]',
              workflow.isPrimary
                ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]'
                : 'bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]'
            )}
          >
            {/* Clipboard icon - simple Unicode character avoids dependency */}
            &#x2398;
          </button>
        </div>
      ))}
    </section>
  );
}
```

**DashboardViewProvider Changes** (`src/extension/providers/dashboard-view-provider.ts`):

Replace the placeholder at lines 91-94 with:

```typescript
case ToExtensionType.EXECUTE_WORKFLOW:
  void this.executeWorkflow(msg.payload.command);
  break;
case ToExtensionType.COPY_COMMAND:
  void this.copyCommand(msg.payload.command);
  break;
```

Add new methods:

```typescript
private static readonly TERMINAL_NAME = 'BMAD';

private async executeWorkflow(command: string): Promise<void> {
  try {
    // Reuse existing BMAD terminal if available
    let terminal = vscode.window.terminals.find(
      (t) => t.name === DashboardViewProvider.TERMINAL_NAME
    );
    if (!terminal) {
      terminal = vscode.window.createTerminal(DashboardViewProvider.TERMINAL_NAME);
    }
    terminal.show();
    terminal.sendText(command);
  } catch {
    void vscode.window.showErrorMessage('Failed to execute workflow command');
  }
}

private async copyCommand(command: string): Promise<void> {
  try {
    await vscode.env.clipboard.writeText(command);
    void vscode.window.showInformationMessage('Command copied to clipboard');
  } catch {
    void vscode.window.showErrorMessage('Failed to copy command to clipboard');
  }
}
```

**Dashboard Layout Change** (`src/webviews/dashboard/index.tsx`):

```typescript
// Add import:
import { CTAButtons, CTAButtonsSkeleton } from './components';

// In loading branch, add after <NextActionRecommendationSkeleton />:
<CTAButtonsSkeleton />

// In content branch, add after <NextActionRecommendation />:
<CTAButtons />
```

### Key Existing Code Locations

| Purpose            | File                                                 | Key Exports/APIs                                                               |
| ------------------ | ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| Workflow types     | `src/shared/types/workflow.ts`                       | `AvailableWorkflow`                                                            |
| Dashboard state    | `src/shared/types/dashboard-state.ts`                | `DashboardState` (has `workflows: AvailableWorkflow[]`)                        |
| Message factories  | `src/shared/messages.ts`                             | `createExecuteWorkflowMessage()`, `createCopyCommandMessage()`                 |
| Message types      | `src/shared/messages.ts`                             | `ToExtensionType.EXECUTE_WORKFLOW`, `ToExtensionType.COPY_COMMAND`             |
| Zustand store      | `src/webviews/dashboard/store.ts`                    | `useWorkflows()` selector                                                      |
| VS Code API hook   | `src/webviews/shared/hooks/use-vscode-api.ts`        | `useVSCodeApi()`                                                               |
| Dashboard provider | `src/extension/providers/dashboard-view-provider.ts` | `handleMessage()` - lines 91-94 have EXECUTE_WORKFLOW/COPY_COMMAND placeholder |
| Dashboard layout   | `src/webviews/dashboard/index.tsx`                   | Component render order                                                         |
| Components barrel  | `src/webviews/dashboard/components/index.ts`         | All component exports                                                          |
| Class utility      | `src/webviews/shared/utils/cn.ts`                    | `cn()` - clsx + tailwind-merge                                                 |
| Extension entry    | `src/extension/extension.ts`                         | `activate()` - no changes needed                                               |
| Workflow discovery | `src/extension/services/workflow-discovery.ts`       | `WorkflowDiscoveryService` - already integrated                                |

### Project Structure Notes

**Files to Create:**

- `src/webviews/dashboard/components/cta-buttons.tsx` - CTAButtons + CTAButtonsSkeleton components
- `src/webviews/dashboard/components/cta-buttons.test.tsx` - Component tests

**Files to Modify:**

- `src/webviews/dashboard/components/index.ts` - Add CTAButtons/CTAButtonsSkeleton exports
- `src/webviews/dashboard/index.tsx` - Add CTAButtons to dashboard layout
- `src/extension/providers/dashboard-view-provider.ts` - Implement EXECUTE_WORKFLOW and COPY_COMMAND handlers

**Files to NOT Modify:**

- `src/shared/messages.ts` - Factory functions already exist
- `src/shared/types/workflow.ts` - AvailableWorkflow already defined
- `src/shared/types/dashboard-state.ts` - workflows field already present
- `src/webviews/dashboard/store.ts` - useWorkflows() already exists
- `src/extension/services/workflow-discovery.ts` - Discovery engine complete
- `src/extension/services/state-manager.ts` - Integration complete
- `src/extension/extension.ts` - No changes needed

**Dependencies (all already installed - NO new packages):**

- `react` ^19.2.0
- `zustand` ^5.0.0
- `clsx` ^2.1.1 + `tailwind-merge` ^3.4.0 (for `cn()`)
- `@testing-library/react` (for component tests)
- `vitest` ^4.0.18 (for webview tests)
- `vscode` ^1.96.0 (for terminal/clipboard APIs)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.2] - Acceptance criteria for context-sensitive CTA buttons
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-4] - Workflow Actions epic objectives (FR12-15)
- [Source: _bmad-output/planning-artifacts/architecture.md#Workflow-Execution] - Terminal execution via `vscode.window.createTerminal()`, clipboard via `vscode.env.clipboard`
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - EXECUTE_WORKFLOW and COPY_COMMAND message types
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns] - kebab-case files, PascalCase components
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management] - Zustand store, extension host as source of truth
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns] - cta-buttons.tsx planned location
- [Source: _bmad-output/planning-artifacts/prd.md#FR12] - One-click workflow launch
- [Source: _bmad-output/planning-artifacts/prd.md#FR13] - Copy command to clipboard
- [Source: _bmad-output/planning-artifacts/prd.md#FR14] - Context-sensitive workflow options
- [Source: _bmad-output/planning-artifacts/prd.md#NFR10] - Terminal works with user's default shell
- [Source: src/shared/messages.ts] - `createExecuteWorkflowMessage()`, `createCopyCommandMessage()` factory functions
- [Source: src/shared/types/workflow.ts] - `AvailableWorkflow` interface (id, name, command, description, isPrimary)
- [Source: src/webviews/dashboard/store.ts] - `useWorkflows()` selector hook
- [Source: src/webviews/shared/hooks/use-vscode-api.ts] - `useVSCodeApi()` for postMessage
- [Source: src/webviews/shared/utils/cn.ts] - `cn()` utility for conditional classes
- [Source: src/extension/providers/dashboard-view-provider.ts:91-94] - EXECUTE_WORKFLOW/COPY_COMMAND placeholder
- [Source: src/webviews/dashboard/index.tsx] - Dashboard layout render order
- [Source: src/webviews/dashboard/components/index.ts] - Component barrel exports
- [Source: src/webviews/dashboard/components/next-action-recommendation.tsx] - Reference for component structure, skeleton, section pattern
- [Source: src/webviews/dashboard/components/refresh-button.tsx] - Reference for button styling and useVSCodeApi pattern

### Previous Story Intelligence

**From Story 4.1 (Workflow Discovery Service) - Direct Predecessor:**

- `AvailableWorkflow` interface with `id`, `name`, `command`, `description`, `isPrimary` fields
- `useWorkflows()` selector hook already in Zustand store
- Workflows populate via `STATE_UPDATE` message - no separate message type
- 399 total tests (309 Vitest + 90 Mocha) - all passing
- DashboardViewProvider already has placeholder for EXECUTE_WORKFLOW/COPY_COMMAND at lines 91-94
- WorkflowDiscoveryService provides state-based mapping: no sprint = sprint-planning, backlog = create-story, ready-for-dev = dev-story, etc.

**From Story 3.6 (Manual Refresh Command):**

- `RefreshButton` component demonstrates the `useVSCodeApi()` + `postMessage()` pattern
- Uses `cn()` for conditional styling
- Button accessibility: `type="button"`, `aria-label`, `title`, `disabled` state

**From Story 3.5 (Next Action Recommendation):**

- Section heading pattern: `<h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">`
- Component section wrapper: `<section data-testid="..." className="flex flex-col gap-2">`
- Skeleton pattern: `animate-pulse` with `bg-[var(--vscode-editor-inactiveSelectionBackground)]`

**From Story 3.4 (Active Story Card):**

- data-testid naming: lowercase kebab-case descriptors
- `React.ReactElement` return type

**Git Intelligence:**

- Commit pattern: `feat: 4-2-context-sensitive-cta-buttons`
- All stories pass: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Current test count: 399 (309 Vitest + 90 Mocha)

### Terminal API Notes

**vscode.window.createTerminal():**

- Creates a new terminal in VS Code's terminal panel
- Accepts `TerminalOptions` with `name` property
- Terminal persists until explicitly disposed or user closes it

**vscode.window.terminals:**

- Read-only array of currently active terminals
- Use `.find()` to locate existing "BMAD" terminal
- Terminal may be disposed externally - always verify it exists

**terminal.sendText(text):**

- Sends text to the terminal's underlying process
- Automatically appends newline (press Enter) by default
- Works with user's configured default shell (NFR10)

**terminal.show():**

- Brings terminal panel to focus
- Shows the specific terminal tab if multiple terminals exist

**vscode.env.clipboard.writeText(text):**

- Returns `Thenable<void>` (async)
- Always use await or void for the return value

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Encountered non-configurable `vscode.env.clipboard.writeText` property preventing sinon stubbing; resolved with integration-style test using real clipboard API with readback verification
- `executeWorkflow` changed from `async` to synchronous (no `await` needed for terminal APIs) per lint rule `@typescript-eslint/require-await`
- Added `src/extension/providers/**/*.test.ts` to vitest exclude and `.vscode-test.mjs` files glob for proper Mocha/Vitest test runner separation

### Completion Notes List

- Created CTAButtons component with primary/secondary button styling using VS Code theme CSS variables
- Created CTAButtonsSkeleton with animate-pulse loading pattern matching existing components
- Integrated CTAButtons into Dashboard layout after NextActionRecommendation, before PlanningArtifactLinks
- Implemented EXECUTE_WORKFLOW handler: finds/creates "BMAD" terminal, sends command, shows terminal
- Implemented COPY_COMMAND handler: copies to clipboard via vscode.env.clipboard.writeText, shows info toast
- 12 new Vitest tests for CTAButtons component (empty state, rendering, styling, click handlers, re-rendering, skeleton)
- 4 new Mocha extension tests for DashboardViewProvider (terminal create, terminal reuse, clipboard copy, toast message)
- All 321 Vitest tests pass (12 new), all 94 Mocha tests pass (4 new), lint clean, typecheck clean, build clean

### File List

**New Files:**

- src/webviews/dashboard/components/cta-buttons.tsx
- src/webviews/dashboard/components/cta-buttons.test.tsx
- src/extension/providers/dashboard-view-provider.test.ts

**Modified Files:**

- src/webviews/dashboard/components/index.ts
- src/webviews/dashboard/index.tsx
- src/extension/providers/dashboard-view-provider.ts
- src/extension/services/workflow-discovery.ts (removed CLI prefix from commands)
- src/shared/types/workflow.ts (updated JSDoc)
- vitest.config.ts
- .vscode-test.mjs
- package.json (added lucide-react dependency, added bmad.cliPrefix setting)
- src/extension/services/workflow-discovery.test.ts (updated command pattern test)
- src/extension/services/state-manager.test.ts (updated workflow fixture data)
- src/webviews/dashboard/store.test.ts (updated workflow fixture data)

## Change Log

- 2026-02-12: Implemented Story 4.2 - Context-Sensitive CTA Buttons. Created CTAButtons and CTAButtonsSkeleton components, integrated into dashboard layout, implemented EXECUTE_WORKFLOW (terminal) and COPY_COMMAND (clipboard) handlers in DashboardViewProvider. Added 16 new tests (12 Vitest + 4 Mocha). Total: 321 Vitest + 94 Mocha = 415 tests passing.
- 2026-02-12: Code review fixes applied. Replaced Unicode helm symbol (&#x2398;) with lucide-react Copy icon for reliable cross-platform rendering. Wrapped handlers in useCallback for render optimization. Improved skeleton to match split-button layout. Removed gap between split-button halves, added border separator. Moved TERMINAL_NAME static to class top. Added error path test for executeWorkflow failure. Added lucide-react dependency.
- 2026-02-12: Made CLI prefix configurable. Added `bmad.cliPrefix` VS Code setting (default: "claude"). Workflow commands now store only the BMAD slash command (e.g., `/bmad-bmm-dev-story`). Execute action prepends configured prefix at runtime. Copy action copies the BMAD command without prefix. Updated workflow-discovery definitions, dashboard-view-provider, and all related tests.
