# Story 1.2: Test Framework Configuration

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want test frameworks configured for both extension host and webview contexts,
So that I can write reliable unit and integration tests.

## Acceptance Criteria

1. **Vitest Configuration for Webview Unit Tests**
   - **Given** the initialized project from Story 1.1
   - **When** Vitest is configured
   - **Then** a `vitest.config.ts` file exists with proper configuration for the webview context
   - **And** Vitest resolves the same path aliases (`@shared/*`) as `vite.config.ts`
   - **And** a passing sample test exists in `src/webviews/` demonstrating the setup works
   - **And** test files follow the `*.test.ts` / `*.test.tsx` co-located pattern

2. **@vscode/test-electron Configuration for Extension Host Tests**
   - **Given** the initialized project from Story 1.1
   - **When** @vscode/test-electron is configured
   - **Then** `.vscode-test.mjs` configuration file exists
   - **And** @vscode/test-cli and @vscode/test-electron packages are installed as dev dependencies
   - **And** a passing sample test exists in `src/extension/` demonstrating the setup works
   - **And** extension host tests can access the VS Code API

3. **Unified Test Execution**
   - **Given** both test frameworks are configured
   - **When** `pnpm test` is executed
   - **Then** all Vitest webview tests run and report results
   - **And** `pnpm test:extension` runs @vscode/test-electron extension host tests
   - **And** test files are co-located with source files following `*.test.ts` pattern

4. **Test File Co-location**
   - **Given** test files follow the architecture co-location pattern
   - **When** a test file is created
   - **Then** it is placed next to its source file (e.g., `sprint-status.test.ts` next to `sprint-status.ts`)
   - **And** test files use kebab-case naming matching their source file

## Tasks / Subtasks

- [x] Task 1: Install and configure Vitest for webview unit tests (AC: #1)
  - [x] 1.1: Install `vitest` and `@vitest/coverage-v8` as dev dependencies
  - [x] 1.2: Install `jsdom` as dev dependency for DOM environment simulation
  - [x] 1.3: Create `vitest.config.ts` with webview-specific configuration (jsdom environment, path aliases matching vite.config.ts)
  - [x] 1.4: Add `test` script to package.json: `"test": "vitest run"`
  - [x] 1.5: Add `test:watch` script to package.json: `"test:watch": "vitest"`
  - [x] 1.6: Add `test:coverage` script: `"test:coverage": "vitest run --coverage"`
  - [x] 1.7: Create passing sample test at `src/webviews/shared/utils/cn.test.ts` testing the `cn()` utility

- [x] Task 2: Install and configure @vscode/test-electron for extension host tests (AC: #2)
  - [x] 2.1: Install `@vscode/test-cli` and `@vscode/test-electron` as dev dependencies
  - [x] 2.2: Install `mocha` and `@types/mocha` as dev dependencies (required by vscode test runner)
  - [x] 2.3: Create `.vscode-test.mjs` configuration file with extension test runner setup
  - [x] 2.4: ~~Create test runner entry point at `src/extension/test/index.ts`~~ (Removed during review: @vscode/test-cli has built-in Mocha runner, making this file dead code)
  - [x] 2.5: Create passing sample test at `src/extension/extension.test.ts` that verifies extension activation
  - [x] 2.6: Add `test:extension` script to package.json: `"test:extension": "vscode-test"`

- [x] Task 3: Verify unified test execution (AC: #3)
  - [x] 3.1: Run `pnpm test` and verify Vitest webview tests pass
  - [x] 3.2: Run `pnpm test:extension` and verify extension host tests pass
  - [x] 3.3: Verify test output is clear and reports results correctly

- [x] Task 4: Verify test co-location pattern (AC: #4)
  - [x] 4.1: Confirm sample tests are co-located next to their source files
  - [x] 4.2: Verify `vitest.config.ts` includes the correct test file glob patterns (`src/**/*.test.{ts,tsx}`)
  - [x] 4.3: Verify extension tests are properly discovered by the test runner

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and Story 1.1 learnings**

1. **File Naming Convention**: ALL files must use kebab-case
   - CORRECT: `cn.test.ts`, `sprint-status.test.ts`, `vitest.config.ts`
   - WRONG: `CN.test.ts`, `sprintStatus.test.ts`

2. **Test File Co-location**: Test files go NEXT TO their source files
   - `src/webviews/shared/utils/cn.ts` -> `src/webviews/shared/utils/cn.test.ts`
   - `src/extension/parsers/sprint-status.ts` -> `src/extension/parsers/sprint-status.test.ts`
   - Do NOT create a separate `test/` or `__tests__/` directory for unit tests

3. **Two Test Frameworks - Two Contexts**: This is critical to understand
   - **Vitest**: For webview code (React components, hooks, utilities, Zustand stores) - runs in jsdom/browser-like environment
   - **@vscode/test-electron**: For extension host code (parsers, services, commands, providers) - runs in actual VS Code instance with API access
   - **Why two?** Extension host code needs the VS Code API (not available in Node.js/jsdom). Webview code needs DOM APIs (not available in VS Code extension host).

4. **Package Manager**: Use `pnpm` (NOT npm) - the project uses pnpm as established in Story 1.1
   - `pnpm add -D vitest` (NOT `npm install --save-dev vitest`)

5. **TypeScript Boundary**: Vitest config should only test webview + shared code. Extension tests use the separate @vscode/test-electron runner.

### Technical Specifications

**Vitest Configuration Details:**

- **Version**: Install latest stable Vitest (^4.0.0 as of January 2026)
- **Environment**: `jsdom` for DOM simulation in webview tests
- **Path Aliases**: Must match `vite.config.ts` aliases:
  - `@shared` -> `src/shared`
  - `@webviews` -> `src/webviews`
  - `@` -> `src`
- **Test Globals**: Enable `globals: true` so `describe`, `it`, `expect` are available without imports
- **Coverage**: Configure `@vitest/coverage-v8` provider
- **Include Pattern**: `src/**/*.test.{ts,tsx}` but EXCLUDE `src/extension/**` (those use vscode-test-electron)

**@vscode/test-electron Configuration Details:**

- **Version**: Install `@vscode/test-electron` (^2.5.0) and `@vscode/test-cli` (latest)
- **Test Runner**: Mocha (standard for VS Code extension tests)
- **Config File**: `.vscode-test.mjs` in project root
- **Test Pattern**: `out/extension/**/*.test.js` (compiled output)
- **Important**: Extension tests must be compiled BEFORE running (they run against the `out/` directory)
- **Launch Args**: Consider `--disable-extensions` to avoid interference from other extensions

**Sample Vitest Test (`cn.test.ts`):**
The `cn()` utility from `src/webviews/shared/utils/cn.ts` is the ideal first test target because:

- It's a pure function (no side effects, no DOM, no React)
- It already exists in the codebase
- It validates the test infrastructure is working
- Test cases: merging classes, handling conditionals, deduplicating Tailwind classes

**Sample Extension Test (`extension.test.ts`):**

- Should verify the extension can be found by its ID
- Should verify the extension activates correctly
- Uses `vscode.extensions.getExtension('bmad.bmad-extension')` pattern
- Note: Extension ID is `publisher.name` from package.json

### Previous Story Intelligence (Story 1.1)

**Critical Learnings to Apply:**

1. **Template Was Obsolete**: The githubnext/vscode-react-webviews template was severely outdated (Oct 2021). Project was initialized from scratch with modern tooling. This means NO existing test scaffolding exists - everything must be created fresh.

2. **Modern Stack Versions** (from Story 1.1 completion notes):
   - React 19.2.4, Vite 7.3.1, TypeScript 5.9.3, esbuild 0.27.2
   - Tailwind CSS 4.1.18 (CSS-first config, no JS config)
   - ESLint 9.39.2 (flat config in `eslint.config.mjs`)
   - Zustand 5.0.10
   - pnpm 10.26.2

3. **Tailwind v4 Note**: No `tailwind.config.js` or `postcss.config.js` exists - uses CSS-first configuration via `@import "tailwindcss"` and `@theme` blocks in `src/webviews/index.css`

4. **ESLint Flat Config**: Uses `eslint.config.mjs` with `defineConfig()` - NOT `.eslintrc.js`

5. **TypeScript Boundary Enforcement**: Extension tsconfig lacks JSX support (prevents importing React code). Webview tsconfig provides `@shared/*` path alias. ESLint `no-restricted-imports` rules actively block cross-boundary imports.

6. **Architecture Doc Drift**: The architecture document references `.eslintrc.js` and `tailwind.config.js` which don't exist. Use actual file names from Story 1.1.

7. **Build Output**: Extension bundles to `out/extension/extension.js`, webview bundles to `out/webview/index.js` - extension tests run against `out/` compiled output.

### Git Intelligence

**Recent Commits:**

```
560dade feat: 1-1-project-initialization-from-starter-template
79dfdd7 chore: epic doc
4a04d9c chore: add architecture doc
5aec3dc chore: BMAD Setup and PRD
```

**Key Patterns Established:**

- Commit messages use conventional commits format (`feat:`, `chore:`)
- Story-based commit naming: `feat: 1-1-project-initialization-from-starter-template`
- All source files use kebab-case naming consistently
- TypeScript strict mode enabled in all tsconfigs

### Latest Technology Information

**Vitest 4.x (Current Stable: 4.0.17)**

- Vitest 4.0 is the current major version (released recently)
- Powered by Vite - shares configuration with `vite.config.ts` by default
- If you want separate config, create `vitest.config.ts` (takes higher priority)
- Supports `process.env.VITEST` for conditional configuration in shared vite config
- Note: Vitest 4.0 added visual regression testing in Browser Mode (not needed for this story)

**@vscode/test-electron (Current: 2.5.2)**

- Standard VS Code extension integration test runner
- New extensions should also consider `@vscode/test-cli` for richer execution experience
- Test runner uses Mocha under the hood
- Config file: `.vscode-test.js/mjs/cjs` with `defineConfig()` API
- `extensionDevelopmentPath` defaults to directory of config file
- Downloads and unzips VS Code for running tests

**Key Compatibility Notes:**

- Vitest 4.x requires Vite 7.x (already installed: Vite 7.3.1)
- @vscode/test-electron 2.5.x works with current VS Code versions
- Mocha is the standard test framework for VS Code extension tests (NOT Jest, NOT Vitest)

### Project Structure Notes

**Files to Create:**

```
vitest.config.ts                                    # NEW - Vitest configuration
.vscode-test.mjs                                    # NEW - VS Code test electron config
src/webviews/shared/utils/cn.test.ts                # NEW - Sample webview unit test
src/extension/extension.test.ts                     # NEW - Sample extension host test
src/extension/test/index.ts                         # NEW - Extension test runner entry (if needed by @vscode/test-cli)
```

**Files to Modify:**

```
package.json                                        # ADD test scripts and dev dependencies
.gitignore                                          # ADD .vscode-test/ directory exclusion
tsconfig.extension.json                             # VERIFY test files are included
```

**Alignment with Architecture Document:**

- Architecture specifies: "Vitest for webview unit tests" and "@vscode/test-electron for extension host tests"
- Test co-location: `*.test.ts` next to source files
- Integration tests directory: `src/__tests__/integration/` (future stories)
- E2E tests directory: `src/__tests__/e2e/` (future stories)

### Potential Pitfalls

1. **Vitest + Extension Code**: Do NOT configure Vitest to test extension host code. Extension code imports `vscode` module which is only available in the VS Code runtime. Vitest runs in Node.js/jsdom and will fail on `import * as vscode from 'vscode'`.

2. **Extension Test Compilation**: Extension tests must be compiled via esbuild/tsc before running with @vscode/test-electron. The test runner looks for compiled `.js` files in `out/`, not `.ts` source files.

3. **Path Alias in Vitest**: Make sure `resolve.alias` in `vitest.config.ts` matches `vite.config.ts` exactly, or Vitest won't resolve `@shared/*` imports correctly.

4. **Vitest Include/Exclude**: Configure Vitest to EXCLUDE `src/extension/**/*.test.ts` since those tests need the VS Code API and must run via @vscode/test-electron instead.

5. **.vscode-test/ Directory**: @vscode/test-electron downloads a VS Code instance to `.vscode-test/` directory. This MUST be in `.gitignore` (Story 1.1 already includes this).

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Architectural-Decisions-Provided-by-Starter]
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation-Patterns-&-Consistency-Rules]
- [Source: _bmad-output/planning-artifacts/architecture.md#Party-Mode-Validation]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]
- [Source: _bmad-output/planning-artifacts/prd.md#Technical-Architecture]
- [Source: _bmad-output/implementation-artifacts/1-1-project-initialization-from-starter-template.md#Completion-Notes-List]
- [Web: Vitest 4.0 Documentation](https://vitest.dev/guide/)
- [Web: @vscode/test-electron npm](https://www.npmjs.com/package/@vscode/test-electron)
- [Web: VS Code Extension Testing Guide](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Installed Vitest 4.0.18 with @vitest/coverage-v8 and jsdom 27.4.0 for webview unit testing
- Created `vitest.config.ts` with jsdom environment, path aliases matching `vite.config.ts` (`@`, `@webviews`, `@shared`), and extension test exclusion
- Added `test`, `test:watch`, and `test:coverage` scripts to package.json
- Created sample Vitest test `cn.test.ts` with 5 test cases (merge, conditional, dedup, empty, null/undefined)
- Installed @vscode/test-cli 0.0.12, @vscode/test-electron 2.5.2, mocha 11.7.5, @types/mocha 10.0.10
- Created `.vscode-test.mjs` with `defineConfig` for extension test discovery (`out/extension/**/*.test.js`), `--disable-extensions` launch arg, and explicit `mocha: { ui: 'tdd' }` config
- Created sample extension test `extension.test.ts` verifying extension presence and activation via VS Code API
- Added `pretest:extension` (tsc compile) and `test:extension` (vscode-test) scripts to package.json
- Updated `eslint.config.mjs`: added `.vscode-test/` to ignores, added `vitest.config.ts` to `allowDefaultProject` and config files disable-type-checked section
- All Vitest tests pass (5/5), all extension tests pass (2/2)
- Lint, typecheck, and build all pass cleanly

### Change Log

- 2026-01-27: Implemented test framework configuration - Vitest for webview tests, @vscode/test-electron for extension host tests
- 2026-01-28: Code review fixes - removed dead code `src/extension/test/index.ts`, removed `globals: true` from vitest.config.ts (explicit imports preferred), added explicit `mocha: { ui: 'tdd' }` to .vscode-test.mjs

### File List

**New Files:**

- vitest.config.ts
- .vscode-test.mjs
- src/webviews/shared/utils/cn.test.ts
- src/extension/extension.test.ts

**Modified Files:**

- package.json (added test scripts and dev dependencies)
- pnpm-lock.yaml (updated with new dev dependencies)
- eslint.config.mjs (added .vscode-test/ ignore, vitest.config.ts to allowDefaultProject)

**Deleted Files (Review):**

- src/extension/test/index.ts (dead code - unused by @vscode/test-cli runner)
