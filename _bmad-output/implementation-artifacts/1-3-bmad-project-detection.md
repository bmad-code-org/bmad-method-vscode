# Story 1.3: BMAD Project Detection

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the extension to detect when a workspace contains a BMAD project,
So that the extension only activates in relevant workspaces.

## Acceptance Criteria

1. **Automatic Activation in BMAD Workspaces**
   - **Given** a VS Code workspace with a `_bmad/` directory
   - **When** VS Code opens the workspace
   - **Then** the extension activates automatically (FR21)

2. **No Activation in Non-BMAD Workspaces**
   - **Given** a VS Code workspace without a `_bmad/` directory
   - **When** VS Code opens the workspace
   - **Then** the extension does not activate (FR22)

3. **Detection Mechanism and Compatibility**
   - **Given** a VS Code workspace
   - **When** the extension checks for BMAD presence
   - **Then** it detects BMAD via `workspaceContains:**/_bmad/**` activation event (FR9)
   - **And** no activation occurs in non-BMAD workspaces
   - **And** the extension is compatible with VS Code versions from the past 3 months (NFR9)

**Out of Scope:** Detection of `_bmad/` directory created after the workspace is already open. The `workspaceContains` activation event only fires at workspace open time. Post-open detection will be addressed by the file watcher in Story 2.5. For MVP, users can reload the VS Code window.

## Tasks / Subtasks

- [x] Task 1: Create BMAD detector service (AC: #1, #3)
  - [x] 1.1: Create `src/extension/services/bmad-detector.ts` with `BmadDetector` class
  - [x] 1.2: Implement `detectBmadProject()` method that checks for `_bmad/` directory using `vscode.workspace.fs.stat()` (NOT Node.js `fs`)
  - [x] 1.3: Verify stat result is `vscode.FileType.Directory` (not a file named `_bmad`)
  - [x] 1.4: Return a typed result indicating detection status (detected, not-detected, no-workspace)
  - [x] 1.5: Also check for `_bmad-output/` existence as optional metadata (detected=true even if `_bmad-output/` absent — it may not exist in fresh projects)
  - [x] 1.6: Implement `getBmadPaths()` method returning resolved paths for `_bmad/` and `_bmad-output/` directories
  - [x] 1.7: Update `src/extension/services/index.ts` barrel export to include BmadDetector

- [x] Task 2: Integrate detector into extension activation (AC: #1, #2)
  - [x] 2.1: Import BmadDetector in `src/extension/extension.ts`
  - [x] 2.2: Call `detectBmadProject()` during extension activation
  - [x] 2.3: Pass detection result to DashboardViewProvider so it can render "Not a BMAD project" when detection fails (the provider MUST still be registered — VS Code requires it for `contributes.views` entries — but its content changes based on detection)
  - [x] 2.4: Store detection result on the provider instance or as extension-level state so the webview renders appropriate content
  - [x] 2.5: Log detection result to debug console (use `console.log` — do NOT create a VS Code OutputChannel yet)
  - [x] 2.6: Ensure `deactivate()` function cleans up any resources

- [x] Task 3: Handle edge cases (AC: #2, #3)
  - [x] 3.1: Handle no workspace open (no `vscode.workspace.workspaceFolders`) — skip detection silently
  - [x] 3.2: Handle multi-root workspaces — use `workspaceFolders[0]` explicitly with a code comment: "Single-context model: check first workspace folder only (see Architecture doc)"
  - [x] 3.3: Handle file system errors during detection — catch and log, do not crash (NFR5)

- [x] Task 4: Write unit tests for detector (AC: #1, #2, #3)
  - [x] 4.1: Create `src/extension/services/bmad-detector.test.ts` (extension host test, uses Mocha/TDD)
  - [x] 4.2: Test: detects BMAD project when `_bmad/` directory exists
  - [x] 4.3: Test: returns not-detected when `_bmad/` directory is missing
  - [x] 4.4: Test: handles no workspace open gracefully
  - [x] 4.5: Test: handles file system errors without throwing
  - [x] 4.6: Test: returns not-detected when `_bmad` exists as a file (not a directory)

- [x] Task 5: Verify activation event configuration (AC: #3)
  - [x] 5.1: Confirm `package.json` has `"workspaceContains:**/_bmad/**"` in activationEvents (already present from Story 1.1)
  - [x] 5.2: Verify `engines.vscode` is set to `"^1.96.0"` for 3-month compatibility (NFR9)
  - [x] 5.3: Run `pnpm build` and verify no compilation errors
  - [x] 5.4: Run `pnpm test:extension` and verify all tests pass (existing + new)
  - [x] 5.5: Verify extension activates correctly in Extension Development Host (F5) with a workspace containing `_bmad/`

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `bmad-detector.ts`, `bmad-detector.test.ts`
   - WRONG: `BmadDetector.ts`, `bmadDetector.ts`

2. **Never Throw from Service Functions**: Return typed result objects, matching the ParseResult pattern spirit
   ```typescript
   type DetectionResult =
     | { detected: true; bmadRoot: vscode.Uri; outputRoot: vscode.Uri | null }
     | { detected: false; reason: 'no-workspace' | 'not-found' | 'not-directory' | 'error'; message?: string }
   ```
   Note: `outputRoot` is `null` when `_bmad-output/` doesn't exist yet (fresh BMAD projects). Detection succeeds based on `_bmad/` alone.

3. **Use `vscode.workspace.fs`** (NOT Node.js `fs` module): This ensures compatibility with remote development (WSL, SSH, Codespaces). Pattern:
   ```typescript
   try {
     await vscode.workspace.fs.stat(bmadUri);
     // Directory exists
   } catch {
     // Directory does not exist
   }
   ```

4. **Extension Host Tests Only**: This service runs in the extension host, so tests must use @vscode/test-electron (Mocha, TDD style), NOT Vitest. Test file: `src/extension/services/bmad-detector.test.ts`, compiled to `out/extension/services/bmad-detector.test.js`.

5. **Single-Context Model**: Architecture specifies one dashboard per VS Code window. Check only the first workspace folder for `_bmad/`. Do not iterate multi-root workspace folders.

6. **Package Manager**: Use `pnpm` (NOT npm)

### Technical Specifications

**Detection Logic:**

```
1. Check vscode.workspace.workspaceFolders exists and has at least one entry
2. Get first workspace folder URI (workspaceFolders[0] — single-context model)
3. Construct URI: vscode.Uri.joinPath(workspaceFolder.uri, '_bmad')
4. Call vscode.workspace.fs.stat(bmadUri)
5. If stat succeeds → verify fileStat.type includes vscode.FileType.Directory
6. If type is Directory → detected: true
7. If type is NOT Directory (file named `_bmad`) → detected: false, reason: 'not-directory'
8. If stat throws → detected: false, reason: 'not-found' or 'error'
9. If detected, also check _bmad-output/ (optional — null if absent)
```

**Key VS Code APIs:**
- `vscode.workspace.workspaceFolders` — array of workspace folders (may be undefined)
- `vscode.workspace.fs.stat(uri)` — returns `FileStat` or throws `FileSystemError`
- `vscode.Uri.joinPath(baseUri, ...pathSegments)` — construct child URIs (cross-platform safe)
- `vscode.FileType.Directory` — enum value to check stat result

**Integration with extension.ts:**

Current `activate()` function registers DashboardViewProvider unconditionally. Story 1.3 should:
1. First call `BmadDetector.detectBmadProject()`
2. Pass detection result to DashboardViewProvider
3. DashboardViewProvider MUST always be registered (VS Code requires it for contributed views in `package.json`)
4. If detected → provider renders normal dashboard content
5. If not detected → provider renders a "Not a BMAD project" message in the webview

**CRITICAL:** You CANNOT skip registering `DashboardViewProvider` even when BMAD is not detected. VS Code's `contributes.views` in `package.json` declares the sidebar panel, and VS Code expects the provider to be registered. If you skip registration, VS Code shows an error. Instead, pass the detection result to the provider and let it render different content based on the result.

The `workspaceContains` activation event already prevents activation in non-BMAD workspaces. The runtime detection is a defense-in-depth check and provides the workspace paths needed by later stories.

**Known Limitation:** The `workspaceContains` activation event does NOT trigger if `_bmad/` is created after the workspace is opened. This is a known VS Code limitation. For MVP, this is acceptable — the user can reload the window. Future enhancement could add a file watcher for `_bmad/` creation (Story 2.5 will implement file watching).

### Previous Story Intelligence (Story 1.1 + 1.2)

**Critical Learnings:**

1. **Template Was Replaced**: The githubnext/vscode-react-webviews template was obsolete. Project was built from scratch with modern tooling. No legacy code or patterns to worry about.

2. **Current Stack Versions** (Story 1.1):
   - TypeScript 5.9.3
   - React 19.2.4, Zustand 5.0.10
   - Vite 7.3.1, esbuild 0.27.2
   - Tailwind CSS 4.1.18 (CSS-first, no JS config)
   - ESLint 9.39.2 (flat config: `eslint.config.mjs`)
   - pnpm 10.26.2

3. **Package Manager**: pnpm (established in Story 1.1) — use `pnpm add`, NOT `npm install`

4. **Build Output**: Extension compiles to `out/extension/extension.js`. Extension tests run against `out/` directory.

5. **Test Framework** (Story 1.2):
   - Extension tests: @vscode/test-electron with Mocha TDD — `pnpm test:extension`
   - Webview tests: Vitest — `pnpm test`
   - Extension tests must be compiled before running
   - `.vscode-test.mjs` config discovers tests at `out/extension/**/*.test.js`

6. **TypeScript Boundary**: Extension tsconfig excludes webview code. Extension code cannot import from `src/webviews/`. Shared code lives in `src/shared/`.

7. **ESLint Boundary**: `no-restricted-imports` rules block cross-context imports with clear error messages.

8. **Architecture Doc Drift**: Architecture references `.eslintrc.js` and `tailwind.config.js` — actual files are `eslint.config.mjs` and CSS-first Tailwind v4 config. Use actual file names.

### Git Intelligence

**Recent Commits:**
```
3817979 chore: BMAD udpdate
b37f122 feat: 1-2-test-framework-configuration
560dade feat: 1-1-project-initialization-from-starter-template
79dfdd7 chore: epic doc
4a04d9c chore: add architecture doc
```

**Commit Convention**: `feat: <story-key>` for story implementations. This story should commit as `feat: 1-3-bmad-project-detection`.

**Files Created by Previous Stories:**
- `src/extension/extension.ts` — will be modified in this story
- `src/extension/services/index.ts` — placeholder, will be updated
- `src/extension/providers/dashboard-view-provider.ts` — no changes needed
- `src/extension/extension.test.ts` — existing test, keep passing

### Existing Code Context

**`src/extension/extension.ts`** — Current activate function registers DashboardViewProvider unconditionally. Modify to conditionally register based on detection result.

**`src/extension/services/index.ts`** — Currently a placeholder with comment "Will be implemented in Epic 2". Update to export BmadDetector.

**`src/extension/providers/dashboard-view-provider.ts`** — 92 lines, manages sidebar webview. No changes needed for this story.

**`package.json`** activation events — Already has `"workspaceContains:**/_bmad/**"`. Verify `engines.vscode` value.

### File Structure Requirements

**Files to Create:**
```
src/extension/services/bmad-detector.ts          # NEW - BMAD detection service
src/extension/services/bmad-detector.test.ts      # NEW - Extension host test (Mocha TDD)
```

**Files to Modify:**
```
src/extension/extension.ts                        # MODIFY - Add detection before registration
src/extension/services/index.ts                   # MODIFY - Export BmadDetector
src/extension/providers/dashboard-view-provider.ts # MODIFY - Accept DetectionResult, render conditional content
```

**Files NOT to Modify:**
```
package.json                                      # activationEvents already correct
src/extension/extension.test.ts                   # Keep existing tests passing
```

### Testing Requirements

**Test Framework**: @vscode/test-electron with Mocha TDD style

**Test File**: `src/extension/services/bmad-detector.test.ts`

**Test Pattern:**
```typescript
import { suite, test } from 'mocha';
import * as assert from 'assert';

suite('BmadDetector', () => {
  test('detects BMAD project when _bmad/ exists', async () => {
    // ...
  });
});
```

**Test Compilation**: Tests compile to `out/extension/services/bmad-detector.test.js` and are discovered by `.vscode-test.mjs` config pattern `out/extension/**/*.test.js`.

**Test Execution**: `pnpm test:extension` (runs ALL extension host tests including existing ones)

**Test Strategy:** Tests run via @vscode/test-electron in a real VS Code instance. The test workspace (this project) already contains a `_bmad/` directory, so the happy-path test can detect it directly. For negative tests, construct a URI to a known-nonexistent path within the workspace.

**Coverage Expectations:**
- Happy path: `_bmad/` directory exists → detected
- Missing: `_bmad/` directory absent → not detected
- No workspace: `workspaceFolders` is undefined → not detected (may require mocking or conditional skip)
- Error: file system error during stat → not detected (no crash)
- Edge case: `_bmad` exists as a file (not directory) → not detected, reason: `not-directory`

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Core-Architectural-Decisions] — Detection via `workspaceContains` activation
- [Source: _bmad-output/planning-artifacts/architecture.md#Project-Structure-&-Boundaries] — File locations and service organization
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-&-Consistency-Rules] — Naming conventions, error handling patterns
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.3] — Acceptance criteria and FR mapping
- [Source: _bmad-output/planning-artifacts/prd.md#Extension-Lifecycle] — FR21, FR22, FR23 requirements
- [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-from-starter-template.md] — Project setup context and learnings
- [Source: _bmad-output/implementation-artifacts/1-2-test-framework-configuration.md] — Test framework setup and conventions
- [Web: VS Code Activation Events](https://code.visualstudio.com/api/references/activation-events) — `workspaceContains` limitations
- [Web: VS Code workspace.fs API](https://code.visualstudio.com/api/references/vscode-api) — `fs.stat()` for directory detection

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Test runner required `workspaceFolder: '.'` in `.vscode-test.mjs` to provide workspace context for extension host tests. Without this, `vscode.workspace.workspaceFolders` was undefined.
- ESLint `no-console` warning on `console.log` in extension.ts — suppressed with inline disable comment per story requirement (subtask 2.5 explicitly requires console.log, not OutputChannel).

### Completion Notes List

- Created `BmadDetector` service with `DetectionResult` discriminated union type matching the spec exactly
- Detection uses `vscode.workspace.fs.stat()` (not Node.js fs) for remote development compatibility
- Single-context model: checks only `workspaceFolders[0]` with explicit architecture comment
- DashboardViewProvider updated to accept `DetectionResult` and render "Not a BMAD project" message for non-BMAD workspaces
- Extension `activate()` changed from sync to async to support awaiting detection
- All 6 new tests pass (8 total with 2 existing), covering: happy path, missing dir, no workspace, FS errors, file-not-directory, getBmadPaths
- `.vscode-test.mjs` updated with `workspaceFolder` config to enable workspace-dependent tests
- Build, lint, typecheck, and all tests pass clean

### File List

**New Files:**
- `src/extension/services/bmad-detector.ts` — BMAD project detection service
- `src/extension/services/bmad-detector.test.ts` — Extension host tests for detector (6 tests)

**Modified Files:**
- `src/extension/extension.ts` — Integrated BmadDetector, async activate, pass detection result to provider
- `src/extension/services/index.ts` — Updated barrel export to include BmadDetector types
- `src/extension/providers/dashboard-view-provider.ts` — Accept DetectionResult, render "Not a BMAD project" for non-detected workspaces
- `.vscode-test.mjs` — Added `workspaceFolder: '.'` for workspace-aware testing

## Change Log

- **2026-01-28**: Implemented BMAD project detection (Story 1.3) — BmadDetector service with typed results, extension activation integration, edge case handling, 6 new extension host tests, all passing
- **2026-01-28**: Code review fixes — H1: Differentiated 'error' vs 'not-found' in checkDirectory catch block using vscode.FileSystemError.code; M1: Added assertion guard in getBmadPaths test to prevent silent pass-through; M2: Made checkDirectory private, refactored tests to use public API (detectWithFolders); M3: Fixed story doc File Structure Requirements contradiction; L1: Removed unused nonce in getNotDetectedHtml. All 8 tests pass, lint/build clean.
