# Story 4.4: Copy Command to Clipboard

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to copy a workflow command to clipboard,
so that I can paste it into an existing terminal or use it elsewhere.

## Acceptance Criteria

1. **Clipboard Copy on Button Click**
   - **Given** the user clicks a "Copy" button next to a workflow action
   - **When** the `COPY_COMMAND` message is processed by the extension host
   - **Then** the command text is copied to clipboard via `vscode.env.clipboard.writeText()` (FR13)
   - **And** a brief toast confirmation is shown via `vscode.window.showInformationMessage('Command copied to clipboard')`

2. **Copy Button Visibility and Placement**
   - **Given** the copy button in the UI
   - **When** rendered next to each CTA workflow button
   - **Then** it is clearly visible as a secondary action (separate from execute)
   - **And** it uses a `Copy` icon from lucide-react for cross-platform rendering
   - **And** it has accessible attributes (`aria-label`, `title` with full command)

3. **Error Handling**
   - **Given** the clipboard write operation fails
   - **When** the error is caught
   - **Then** a user-friendly error message is shown via `vscode.window.showErrorMessage('Failed to copy command to clipboard')`
   - **And** the extension does not crash

4. **Command Content**
   - **Given** the copy button is clicked for a specific workflow
   - **When** the command is copied
   - **Then** only the raw BMAD slash command is copied (e.g., `/bmad-bmm-dev-story`)
   - **And** the CLI prefix is NOT included (user can prefix with their preferred CLI tool)

## Tasks / Subtasks

- [x] Task 1: Verify existing COPY_COMMAND message protocol (AC: #1, #4)
  - [x] 1.1: Confirm `COPY_COMMAND` type exists in `ToExtensionType` enum in `src/shared/messages.ts`
  - [x] 1.2: Confirm `CopyCommandMessage` interface with `payload.command` field exists
  - [x] 1.3: Confirm `createCopyCommandMessage()` factory function exists
  - [x] 1.4: Confirm `isCopyCommandMessage()` type guard function exists

- [x] Task 2: Verify existing clipboard handler in extension host (AC: #1, #3)
  - [x] 2.1: Confirm `copyCommand()` method in `DashboardViewProvider` at `dashboard-view-provider.ts`
  - [x] 2.2: Confirm method uses `vscode.env.clipboard.writeText(command)` for clipboard access
  - [x] 2.3: Confirm success toast via `vscode.window.showInformationMessage('Command copied to clipboard')`
  - [x] 2.4: Confirm error handling wraps clipboard operations in try/catch with `showErrorMessage` fallback
  - [x] 2.5: Confirm `COPY_COMMAND` case exists in `handleMessage()` switch statement

- [x] Task 3: Verify existing copy button UI in CTA component (AC: #2, #4)
  - [x] 3.1: Confirm copy button exists in `cta-buttons.tsx` as icon-only button next to each execute button
  - [x] 3.2: Confirm copy button uses `<Copy size={12} />` icon from lucide-react
  - [x] 3.3: Confirm copy button has `title` attribute showing full command (e.g., `Copy: /bmad-bmm-dev-story`)
  - [x] 3.4: Confirm copy button has `aria-label` for accessibility
  - [x] 3.5: Confirm copy handler calls `vscodeApi.postMessage(createCopyCommandMessage(workflow.command))`
  - [x] 3.6: Confirm only raw BMAD slash command is copied (no CLI prefix)

- [x] Task 4: Verify existing tests cover all ACs (AC: #1-#4)
  - [x] 4.1: Confirm test for clipboard copy operation in `dashboard-view-provider.test.ts`
  - [x] 4.2: Confirm test for toast confirmation after copy
  - [x] 4.3: Confirm test for copy button rendering in `cta-buttons.test.tsx`
  - [x] 4.4: Confirm test for COPY_COMMAND message sent on copy click
  - [x] 4.5: Run `pnpm test` and verify all tests pass

- [x] Task 5: Build and Lint Validation (AC: #1-#4)
  - [x] 5.1: Run `pnpm typecheck` and verify no type errors
  - [x] 5.2: Run `pnpm lint` and verify no linting errors
  - [x] 5.3: Run `pnpm test` and verify all tests pass (Vitest + Mocha)
  - [x] 5.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### CRITICAL: This Story's Implementation is Already Complete

**All functionality for Story 4.4 was implemented as part of Story 4.2 (Context-Sensitive CTA Buttons).** This follows the same pattern as Story 4.3, which was also a verification-only story. Story 4.2 delivered:

1. **`copyCommand()` method** in `DashboardViewProvider` - Clipboard write with toast confirmation and error handling
2. **`COPY_COMMAND` message handler** - Wired in `handleMessage()` switch statement
3. **Copy button UI** in `CTAButtons` component - Icon button with `Copy` icon from lucide-react
4. **`CopyCommandMessage` type** in shared messages - Full type-safe message protocol
5. **Complete test coverage** - Clipboard write, toast confirmation, UI rendering, message sending

**The dev agent for this story should verify the existing implementation satisfies all ACs and ensure all tests pass.** No new code is expected to be needed.

### Architecture Compliance

**MANDATORY patterns from Architecture Document and all previous story learnings:**

1. **File Naming**: kebab-case
   - CORRECT: `dashboard-view-provider.ts`, `cta-buttons.tsx`
   - WRONG: `DashboardViewProvider.ts`, `CTAButtons.tsx`

2. **Package Manager**: `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

3. **Error Pattern**: Never throw from extension host handlers - wrap in try/catch, show error message to user
   ```typescript
   private async copyCommand(command: string): Promise<void> {
     try {
       await vscode.env.clipboard.writeText(command);
       void vscode.window.showInformationMessage('Command copied to clipboard');
     } catch {
       void vscode.window.showErrorMessage('Failed to copy command to clipboard');
     }
   }
   ```

4. **Clipboard API Usage**:
   - `vscode.env.clipboard.writeText(text)` - Writes text to system clipboard (async)
   - Returns `Thenable<void>` - must be awaited or voided
   - Cross-platform: works on Windows, macOS, Linux

5. **Testing**:
   - Extension host tests: Mocha + Sinon (for files using VS Code API)
   - Webview component tests: Vitest + React Testing Library
   - Co-locate tests next to source
   - `vscode.env.clipboard.writeText` is non-configurable with sinon - tests use real clipboard API with readback

6. **Message Protocol**:
   - Factory functions for creating messages: `createCopyCommandMessage(command)`
   - Type guards for validating messages: `isCopyCommandMessage(msg)`
   - Discriminated unions for type-safe switch statements
   - Message types use SCREAMING_SNAKE_CASE: `COPY_COMMAND`

### Technical Specifications

**Existing `copyCommand` Method** (`src/extension/providers/dashboard-view-provider.ts`):

```typescript
private async copyCommand(command: string): Promise<void> {
  try {
    await vscode.env.clipboard.writeText(command);
    void vscode.window.showInformationMessage('Command copied to clipboard');
  } catch {
    void vscode.window.showErrorMessage('Failed to copy command to clipboard');
  }
}
```

**Message Handler** (`src/extension/providers/dashboard-view-provider.ts`):

```typescript
case ToExtensionType.COPY_COMMAND:
  void this.copyCommand(msg.payload.command);
  break;
```

**Copy Button UI** (`src/webviews/dashboard/components/cta-buttons.tsx`):

```tsx
<button
  onClick={() => handleCopy(workflow)}
  title={`Copy: ${workflow.command}`}
  aria-label={`Copy ${workflow.name} command`}
  data-testid={`cta-copy-${workflow.id}`}
  className="..."
>
  <Copy size={12} />
</button>
```

**Copy Handler** (`src/webviews/dashboard/components/cta-buttons.tsx`):

```typescript
const handleCopy = useCallback(
  (workflow: AvailableWorkflow) => {
    vscodeApi.postMessage(createCopyCommandMessage(workflow.command));
  },
  [vscodeApi]
);
```

**Command Flow:**
1. Webview CTA copy button click -> `handleCopy(workflow)` callback fires
2. `createCopyCommandMessage(workflow.command)` creates typed message with raw slash command
3. `vscodeApi.postMessage()` sends message to extension host
4. Extension host `handleMessage()` matches `COPY_COMMAND` case
5. `copyCommand(msg.payload.command)` is called
6. `vscode.env.clipboard.writeText(command)` writes to clipboard
7. `vscode.window.showInformationMessage('Command copied to clipboard')` shows toast
8. Only the raw BMAD slash command is copied (e.g., `/bmad-bmm-dev-story`) - no CLI prefix

### Key Existing Code Locations

| Purpose | File | Key Exports/APIs |
|---------|------|-----------------|
| Clipboard handler | `src/extension/providers/dashboard-view-provider.ts` | `copyCommand()` method |
| Message handler | `src/extension/providers/dashboard-view-provider.ts` | `handleMessage()` - COPY_COMMAND case |
| Message type | `src/shared/messages.ts` | `ToExtensionType.COPY_COMMAND`, `CopyCommandMessage` |
| Message factory | `src/shared/messages.ts` | `createCopyCommandMessage()` |
| Type guard | `src/shared/messages.ts` | `isCopyCommandMessage()` |
| Copy button UI | `src/webviews/dashboard/components/cta-buttons.tsx` | Copy icon button with handleCopy callback |
| Workflow types | `src/shared/types/workflow.ts` | `AvailableWorkflow` (command field stores slash command only) |
| DashboardProvider tests | `src/extension/providers/dashboard-view-provider.test.ts` | Clipboard test suite |
| CTA buttons tests | `src/webviews/dashboard/components/cta-buttons.test.tsx` | Copy button rendering and message tests |

### Project Structure Notes

**Files to Create:** None expected - all code is already implemented.

**Files to Modify:** None expected - verify existing implementation covers all ACs.

**Files to NOT Modify:**
- `src/extension/providers/dashboard-view-provider.ts` - Clipboard copy already implemented
- `src/shared/messages.ts` - COPY_COMMAND message types already defined
- `src/shared/types/workflow.ts` - AvailableWorkflow already defined
- `src/webviews/dashboard/components/cta-buttons.tsx` - Copy button already calls COPY_COMMAND
- `src/extension/services/workflow-discovery.ts` - Discovery engine complete
- `package.json` - No new settings needed for clipboard

**Dependencies (all already installed - NO new packages):**
- `vscode` ^1.96.0 (clipboard, notification APIs)
- `lucide-react` (Copy icon already used in CTA buttons)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.4] - Copy command to clipboard acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-4] - Workflow Actions epic objectives (FR12-15)
- [Source: _bmad-output/planning-artifacts/architecture.md#Workflow-Execution] - Copy to clipboard via `vscode.env.clipboard.writeText()`, brief toast confirmation
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - COPY_COMMAND message type in ToExtension union
- [Source: _bmad-output/planning-artifacts/prd.md#FR13] - User can copy a workflow command to clipboard
- [Source: src/extension/providers/dashboard-view-provider.ts] - `copyCommand()` implementation and COPY_COMMAND handler
- [Source: src/extension/providers/dashboard-view-provider.test.ts] - Clipboard copy test suite
- [Source: src/shared/messages.ts] - `createCopyCommandMessage()` factory, `CopyCommandMessage` interface
- [Source: src/webviews/dashboard/components/cta-buttons.tsx] - Copy button UI with handleCopy callback
- [Source: src/webviews/dashboard/components/cta-buttons.test.tsx] - Copy button rendering and message tests

### Previous Story Intelligence

**From Story 4.3 (Terminal Workflow Execution) - Direct Predecessor:**

Story 4.3 was also a verification-only story (all functionality from 4.2). Key learnings:
- All 425 tests pass (326 Vitest + 99 Mocha at start, 326 Vitest + 101 Mocha after code review fixes)
- Code review added command validation regex (`/^\/bmad-[a-z0-9-]+$/`) to prevent command injection
- The `copyCommand()` method does NOT apply command validation regex (it copies raw text, not executing in a shell)
- `vscode.env.clipboard.writeText` is non-configurable with sinon - tests use real clipboard API with readback
- lucide-react `Copy` icon used for cross-platform rendering (replaced Unicode character)

**From Story 4.2 (Context-Sensitive CTA Buttons) - Implementation Source:**

This is the **critical predecessor** - Story 4.2 implemented ALL of Story 4.4's functionality:
- `copyCommand()` async method with clipboard write, toast confirmation, and error handling
- `COPY_COMMAND` message handler in `handleMessage()` switch
- Copy button UI as icon-only button next to each execute button
- `createCopyCommandMessage()` factory function
- Tests for clipboard operations and copy button rendering
- Total test count after 4.2: 321 Vitest + 94 Mocha = 415 tests passing

**From Story 4.1 (Workflow Discovery Service):**
- `AvailableWorkflow.command` stores BMAD slash command only (e.g., `/bmad-bmm-dev-story`)
- No CLI prefix in stored commands - prefix applied only at terminal execution time
- This means the copy operation correctly copies just the slash command

**Git Intelligence:**

Recent commits show clean linear progression through Epic 4:
```
5ed05cc feat: 4-2-context-sensitive-cta-buttons
83f158a feat: 4-1-workflow-discovery-service
```

All stories follow: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
Commit message pattern: `feat: 4-4-copy-command-to-clipboard`

### Clipboard API Reference

**vscode.env.clipboard.writeText(value: string): Thenable<void>**
- Writes text to the system clipboard
- Async operation - returns a Thenable
- Cross-platform (Windows, macOS, Linux)
- Does not require any permissions
- Used in `copyCommand()` method

**vscode.window.showInformationMessage(message: string): Thenable<string | undefined>**
- Shows a brief toast/notification in VS Code
- Auto-dismisses after a few seconds
- Used for "Command copied to clipboard" confirmation

**vscode.window.showErrorMessage(message: string): Thenable<string | undefined>**
- Shows an error toast/notification in VS Code
- Used for "Failed to copy command to clipboard" error feedback

### Design Decision: No CLI Prefix in Copied Text

The copy operation intentionally copies only the raw BMAD slash command (e.g., `/bmad-bmm-dev-story`) without the CLI prefix. This is different from the execute operation which prepends the configured `bmad.cliPrefix` (default: "claude").

**Rationale:**
- Users may want to paste into different CLI tools
- The copied command is the universal BMAD identifier
- Users can prefix with their preferred tool manually
- More flexible than hardcoding a specific CLI prefix

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered. All verification checks passed on first attempt.

### Completion Notes List

- ✅ Task 1: Verified `COPY_COMMAND` type in `ToExtensionType`, `CopyCommandMessage` interface, `createCopyCommandMessage()` factory, and `isCopyCommandMessage()` type guard all exist in `src/shared/messages.ts`
- ✅ Task 2: Verified `copyCommand()` method in `DashboardViewProvider` with `vscode.env.clipboard.writeText()`, success toast, error handling via try/catch with `showErrorMessage`, and `COPY_COMMAND` case in `handleMessage()` switch
- ✅ Task 3: Verified copy button UI in `cta-buttons.tsx` — icon-only button with `<Copy size={12} />` from lucide-react, `title` showing full command, `aria-label` for accessibility, handler sending `createCopyCommandMessage(workflow.command)`, and raw slash command only (no CLI prefix)
- ✅ Task 4: Verified test coverage — clipboard copy test + toast confirmation test in `dashboard-view-provider.test.ts`, copy button rendering + COPY_COMMAND message test in `cta-buttons.test.tsx`. All 327 Vitest + 102 Mocha = 429 tests passing.
- ✅ Task 5: `pnpm typecheck` (clean), `pnpm lint` (clean), `pnpm test` (429 tests pass), `pnpm build` (clean)

All functionality was already implemented in Story 4.2 (Context-Sensitive CTA Buttons). No code changes were needed — this was a verification-only story confirming the existing implementation satisfies all acceptance criteria.

### Change Log

- 2026-02-13: Story 4.4 verified — all acceptance criteria confirmed satisfied by existing implementation from Story 4.2. 429 tests passing (327 Vitest + 102 Mocha). No code modifications required.
- 2026-02-13: Code review fixes applied — added clipboard error handling test (M1), corrected misleading test data using CLI-prefixed commands instead of raw slash commands (M2), added explicit copy button rendering assertions (M3), added copy button title attribute test (L1). 431 tests passing (328 Vitest + 103 Mocha).

### File List

Code review modified files:
- `src/extension/providers/dashboard-view-provider.test.ts` — Added clipboard error handling test (AC#3 coverage)
- `src/shared/messages.test.ts` — Corrected COPY_COMMAND test data to use raw slash commands (`/bmad-bmm-*`)
- `src/webviews/dashboard/components/cta-buttons.test.tsx` — Added copy button rendering assertions and title attribute test

Verified files (no modifications):
- `src/shared/messages.ts` — COPY_COMMAND type, CopyCommandMessage interface, factory, type guard
- `src/extension/providers/dashboard-view-provider.ts` — copyCommand() method, COPY_COMMAND handler
- `src/webviews/dashboard/components/cta-buttons.tsx` — Copy button UI with handleCopy callback
