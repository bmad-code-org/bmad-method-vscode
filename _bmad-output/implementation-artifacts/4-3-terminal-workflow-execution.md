# Story 4.3: Terminal Workflow Execution

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to launch any BMAD workflow via terminal with one click,
So that I can immediately start working without typing commands.

## Acceptance Criteria

1. **Terminal Creation and Command Execution**
   - **Given** the user clicks a workflow CTA button
   - **When** the `EXECUTE_WORKFLOW` message is processed by the extension host
   - **Then** a terminal named "BMAD" is created or an existing one is reused (FR12)
   - **And** the configured CLI prefix (`bmad.cliPrefix`, default "claude") is prepended to the command
   - **And** the full command is sent to the terminal via `terminal.sendText()` (e.g., `claude /bmad-bmm-dev-story`)
   - **And** the terminal is brought to focus via `terminal.show()`

2. **Terminal Reuse**
   - **Given** a BMAD terminal already exists from a previous workflow execution
   - **When** the user executes a new workflow
   - **Then** the existing "BMAD" terminal is reused (not a new terminal created)
   - **And** the new command is sent to the existing terminal

3. **Shell Compatibility**
   - **Given** the user's configured default shell in VS Code
   - **When** the terminal executes a command
   - **Then** it works correctly with the user's shell (NFR10)
   - **And** `vscode.window.createTerminal()` uses VS Code's default shell configuration

4. **CLI Prefix Configuration**
   - **Given** the `bmad.cliPrefix` setting in VS Code configuration
   - **When** a workflow command is executed
   - **Then** the configured prefix is prepended to the BMAD slash command
   - **And** the default prefix is "claude" if not configured
   - **And** users can change this to other CLI tools (e.g., "aider", "copilot")

5. **Error Handling**
   - **Given** terminal creation or command execution fails
   - **When** the error is caught
   - **Then** a user-friendly error message is shown via `vscode.window.showErrorMessage()`
   - **And** the extension does not crash

## Tasks / Subtasks

- [x] Task 1: Verify existing EXECUTE_WORKFLOW handler (AC: #1, #2, #3, #4, #5)
  - [x] 1.1: Confirm `executeWorkflow()` method in `DashboardViewProvider` handles terminal creation/reuse
  - [x] 1.2: Confirm `bmad.cliPrefix` setting exists in `package.json` and is read at execution time
  - [x] 1.3: Confirm `terminal.show()` and `terminal.sendText()` are called in correct order
  - [x] 1.4: Confirm error handling wraps terminal operations in try/catch

- [x] Task 2: Verify existing tests cover all ACs (AC: #1-#5)
  - [x] 2.1: Confirm test for terminal creation with CLI prefix prepended
  - [x] 2.2: Confirm test for terminal reuse when existing "BMAD" terminal found
  - [x] 2.3: Confirm test for error handling path (terminal creation failure)
  - [x] 2.4: Run `pnpm test` and verify all tests pass

- [x] Task 3: Build and Lint Validation (AC: #1-#5)
  - [x] 3.1: Run `pnpm typecheck` and verify no type errors
  - [x] 3.2: Run `pnpm lint` and verify no linting errors
  - [x] 3.3: Run `pnpm test` and verify all tests pass (existing + new)
  - [x] 3.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### CRITICAL: This Story's Implementation is Already Complete

**All functionality for Story 4.3 was implemented as part of Story 4.2 (Context-Sensitive CTA Buttons).** Story 4.2 delivered:

1. **`executeWorkflow()` method** in `DashboardViewProvider` - Terminal creation, reuse, CLI prefix prepending, command execution
2. **`copyCommand()` method** in `DashboardViewProvider` - Clipboard copy with toast confirmation
3. **`EXECUTE_WORKFLOW` message handler** - Wired in `handleMessage()` switch statement
4. **`bmad.cliPrefix` VS Code setting** - Configurable CLI prefix with "claude" default
5. **Complete test coverage** - Terminal creation, reuse, error handling, clipboard tests

**The dev agent for this story should verify the existing implementation satisfies all ACs and ensure all tests pass.** No new code is expected to be needed.

### Architecture Compliance

**MANDATORY patterns from Architecture Document and all previous story learnings:**

1. **File Naming**: kebab-case
   - CORRECT: `dashboard-view-provider.ts`, `dashboard-view-provider.test.ts`
   - WRONG: `DashboardViewProvider.ts`

2. **Package Manager**: `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

3. **Error Pattern**: Never throw from extension host handlers - wrap in try/catch, show error message to user
   ```typescript
   private executeWorkflow(command: string): void {
     try { ... } catch { void vscode.window.showErrorMessage('Failed to execute workflow command'); }
   }
   ```

4. **Terminal API Usage**:
   - `vscode.window.createTerminal({ name })` - Creates named terminal
   - `vscode.window.terminals.find()` - Searches existing terminals by name
   - `terminal.show()` - Brings terminal panel to focus
   - `terminal.sendText(text)` - Sends command to terminal (auto-appends newline)

5. **Configuration Access**:
   - `vscode.workspace.getConfiguration('bmad')` to read extension settings
   - `config.get<string>('cliPrefix', 'claude')` with typed default

6. **Testing**:
   - Extension host tests: Mocha + Sinon (for files using VS Code API)
   - Co-locate tests next to source
   - Mock terminal via `sinon.stub(vscode.window, 'createTerminal')`
   - Mock terminals array via `sinon.stub(vscode.window, 'terminals')`

### Technical Specifications

**Existing `executeWorkflow` Method** (`src/extension/providers/dashboard-view-provider.ts:129-144`):

```typescript
private executeWorkflow(command: string): void {
  try {
    const config = vscode.workspace.getConfiguration('bmad');
    const cliPrefix = config.get<string>('cliPrefix', 'claude');
    let terminal = vscode.window.terminals.find(
      (t) => t.name === DashboardViewProvider.TERMINAL_NAME
    );
    if (!terminal) {
      terminal = vscode.window.createTerminal(DashboardViewProvider.TERMINAL_NAME);
    }
    terminal.show();
    terminal.sendText(`${cliPrefix} ${command}`);
  } catch {
    void vscode.window.showErrorMessage('Failed to execute workflow command');
  }
}
```

**Message Handler** (`src/extension/providers/dashboard-view-provider.ts:92-94`):

```typescript
case ToExtensionType.EXECUTE_WORKFLOW:
  void this.executeWorkflow(msg.payload.command);
  break;
```

**CLI Prefix Setting** (`package.json`):

```json
"bmad.cliPrefix": {
  "type": "string",
  "default": "claude",
  "description": "CLI tool prefix for workflow terminal commands (e.g., 'claude', 'aider', 'copilot'). The BMAD slash command is appended after this prefix."
}
```

**Command Flow:**
1. Webview CTA button click → `vscodeApi.postMessage(createExecuteWorkflowMessage(workflow.command))`
2. `workflow.command` = `/bmad-bmm-dev-story` (BMAD slash command only, no CLI prefix)
3. Extension host receives `EXECUTE_WORKFLOW` message with `{ command: '/bmad-bmm-dev-story' }`
4. `executeWorkflow()` reads `bmad.cliPrefix` setting (default: "claude")
5. Finds or creates "BMAD" terminal
6. Calls `terminal.show()` then `terminal.sendText('claude /bmad-bmm-dev-story')`

### Key Existing Code Locations

| Purpose | File | Key Exports/APIs |
|---------|------|-----------------|
| Terminal execution | `src/extension/providers/dashboard-view-provider.ts` | `executeWorkflow()` method (line 129) |
| Clipboard copy | `src/extension/providers/dashboard-view-provider.ts` | `copyCommand()` method (line 149) |
| Message handler | `src/extension/providers/dashboard-view-provider.ts` | `handleMessage()` (line 78) |
| Terminal name constant | `src/extension/providers/dashboard-view-provider.ts` | `TERMINAL_NAME = 'BMAD'` (line 12) |
| Message types | `src/shared/messages.ts` | `ToExtensionType.EXECUTE_WORKFLOW`, `ExecuteWorkflowMessage` |
| Message factory | `src/shared/messages.ts` | `createExecuteWorkflowMessage()` |
| Workflow types | `src/shared/types/workflow.ts` | `AvailableWorkflow` (command field stores slash command only) |
| CLI prefix setting | `package.json` | `bmad.cliPrefix` (default: "claude") |
| CTA buttons | `src/webviews/dashboard/components/cta-buttons.tsx` | `CTAButtons` component (calls execute/copy) |
| Workflow discovery | `src/extension/services/workflow-discovery.ts` | `WORKFLOW_DEFINITIONS` (commands without CLI prefix) |
| DashboardProvider tests | `src/extension/providers/dashboard-view-provider.test.ts` | Terminal and clipboard test suites |

### Project Structure Notes

**Files to Create:** None expected - all code is already implemented.

**Files to Modify:** None expected - verify existing implementation covers all ACs.

**Files to NOT Modify:**
- `src/extension/providers/dashboard-view-provider.ts` - Terminal execution already implemented
- `src/shared/messages.ts` - Message types already defined
- `src/shared/types/workflow.ts` - AvailableWorkflow already defined
- `src/webviews/dashboard/components/cta-buttons.tsx` - CTA buttons already call EXECUTE_WORKFLOW
- `src/extension/services/workflow-discovery.ts` - Discovery engine complete
- `package.json` - `bmad.cliPrefix` setting already exists

**Dependencies (all already installed - NO new packages):**
- `vscode` ^1.96.0 (terminal, clipboard, configuration APIs)

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.3] - Terminal workflow execution acceptance criteria
- [Source: _bmad-output/planning-artifacts/epics.md#Epic-4] - Workflow Actions epic objectives (FR12-15)
- [Source: _bmad-output/planning-artifacts/architecture.md#Workflow-Execution] - Terminal execution via `vscode.window.createTerminal()`, clipboard via `vscode.env.clipboard`
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - EXECUTE_WORKFLOW message type
- [Source: _bmad-output/planning-artifacts/prd.md#FR12] - One-click workflow launch
- [Source: _bmad-output/planning-artifacts/prd.md#NFR10] - Terminal works with user's default shell
- [Source: src/extension/providers/dashboard-view-provider.ts:129-144] - `executeWorkflow()` implementation
- [Source: src/extension/providers/dashboard-view-provider.ts:92-94] - `EXECUTE_WORKFLOW` message handler
- [Source: src/extension/providers/dashboard-view-provider.test.ts] - Terminal execution tests
- [Source: src/shared/messages.ts] - `createExecuteWorkflowMessage()` factory function
- [Source: src/shared/types/workflow.ts] - `AvailableWorkflow` interface (command field)
- [Source: package.json] - `bmad.cliPrefix` VS Code setting definition

### Previous Story Intelligence

**From Story 4.2 (Context-Sensitive CTA Buttons) - Direct Predecessor:**

This is the **critical predecessor** - Story 4.2 already implemented ALL of Story 4.3's functionality:

- `executeWorkflow()` method with terminal creation, reuse, CLI prefix prepending
- `copyCommand()` method with clipboard and toast
- `EXECUTE_WORKFLOW` and `COPY_COMMAND` message handlers
- `bmad.cliPrefix` configurable setting (default: "claude")
- 4 Mocha tests for terminal creation, reuse, clipboard, and error handling
- Workflow commands store ONLY the BMAD slash command (e.g., `/bmad-bmm-dev-story`)
- CLI prefix prepended at runtime from VS Code configuration
- Total test count after 4.2: 321 Vitest + 94 Mocha = 415 tests passing

**Dev notes from Story 4.2:**
- `vscode.env.clipboard.writeText` is non-configurable with sinon - tests use real clipboard API with readback
- `executeWorkflow` is synchronous (no `await` needed for terminal APIs) per `@typescript-eslint/require-await` lint rule
- Added `src/extension/providers/**/*.test.ts` to vitest exclude for Mocha/Vitest separation
- lucide-react `Copy` icon used for copy button (replaced Unicode character for cross-platform rendering)

**From Story 4.1 (Workflow Discovery Service):**
- `AvailableWorkflow.command` stores BMAD slash command only (e.g., `/bmad-bmm-dev-story`)
- `WorkflowDiscoveryService` filters workflows against installed workflows on disk
- State-based mapping: sprint state → available workflows → CTA buttons → terminal execution
- 399 tests passing at end of 4.1

**Git Intelligence:**
- Commit pattern: `feat: 4-3-terminal-workflow-execution`
- All stories pass: `pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- Current test count: 415 (321 Vitest + 94 Mocha) after Story 4.2

### Terminal API Reference

**vscode.window.createTerminal(name):**
- Creates a new terminal in VS Code's integrated terminal panel
- Uses the user's configured default shell (PowerShell, bash, zsh, etc.)
- Terminal persists until explicitly disposed or user closes it
- Returns `Terminal` object

**vscode.window.terminals:**
- Read-only array of currently open terminals
- Use `.find(t => t.name === 'BMAD')` to locate existing terminal
- Terminal may be closed externally by user

**terminal.sendText(text, addNewLine?):**
- Sends text string to the terminal's underlying process
- Default: appends newline (presses Enter automatically)
- Works with any shell the user has configured (NFR10)

**terminal.show(preserveFocus?):**
- Brings terminal panel to focus
- Shows the specific terminal tab if multiple terminals exist
- `preserveFocus: true` would keep focus in editor (not used here - we want terminal focus)

**vscode.workspace.getConfiguration('bmad'):**
- Returns configuration object for `bmad.*` settings
- `.get<string>('cliPrefix', 'claude')` returns typed value with default

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — no issues encountered during verification.

### Completion Notes List

- **Task 1 (Verification):** Confirmed `executeWorkflow()` at `dashboard-view-provider.ts:129-144` correctly creates/reuses BMAD terminal, reads `bmad.cliPrefix` from VS Code config (default "claude"), calls `terminal.show()` then `terminal.sendText()`, and wraps all operations in try/catch with `showErrorMessage` fallback.
- **Task 2 (Test Coverage):** All 3 EXECUTE_WORKFLOW Mocha tests pass — terminal creation with CLI prefix, terminal reuse, and error handling. Full Vitest suite: 326 tests passing. Full Mocha suite: 99 tests passing. Total: 425 tests.
- **Task 3 (Build/Lint):** `pnpm typecheck` (0 errors), `pnpm lint` (0 errors), `pnpm test` (326 Vitest pass), `pnpm test:extension` (99 Mocha pass), `pnpm build` (successful, extension 265kb + webview 246kb).
- **No code changes required.** All Story 4.3 functionality was delivered as part of Story 4.2. This story was a verification-only pass confirming all ACs are satisfied.

### Change Log

- 2026-02-12: Verified all acceptance criteria satisfied by existing implementation from Story 4.2. No code changes needed. All 425 tests pass. Story marked for review.
- 2026-02-12: Code review fixes applied. Added command validation regex (`/^\/bmad-[a-z0-9-]+$/`) to prevent command injection via webview messages. Added test for custom cliPrefix configuration. Added test for invalid command rejection. Removed redundant `void` operator on synchronous `executeWorkflow()` call. Changed `createTerminal()` to use `TerminalOptions` object form. Total: 326 Vitest + 101 Mocha = 427 tests. Story marked done.

### File List

- `src/extension/providers/dashboard-view-provider.ts` — Added `VALID_COMMAND_PATTERN` static, command validation guard, `createTerminal({ name })` object form, removed redundant `void` on handler call
- `src/extension/providers/dashboard-view-provider.test.ts` — Added test for custom cliPrefix ("aider"), added test for command injection rejection, updated `createTerminal` assertion to match options object
