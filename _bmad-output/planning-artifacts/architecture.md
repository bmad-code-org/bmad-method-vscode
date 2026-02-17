---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
workflowType: 'architecture'
project_name: 'bmad-extension'
user_name: 'Boss'
date: '2026-01-26'
lastStep: 8
status: 'complete'
completedAt: '2026-01-26'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Starter Template Evaluation

### Primary Technology Domain

VS Code Extension with React Webview (Sidebar Panel) - specialized domain requiring dual-context architecture:

- Extension Host: Node.js/TypeScript runtime
- Webview: Sandboxed browser environment (React)
- Communication: postMessage API between contexts

### Starter Options Considered

| Option                                    | Pros                                                                   | Cons                                  |
| ----------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| **yo code** (Official)                    | Microsoft-maintained, latest VS Code patterns                          | No React setup, manual webview config |
| **githubnext/vscode-react-webviews**      | Best practices for sidebars/panels, Vite, Tailwind + theme integration | Slightly more opinionated             |
| **estruyf/vscode-react-webview-template** | Simple, esbuild                                                        | Less feature-complete                 |

### Selected Starter: githubnext/vscode-react-webviews

**Rationale for Selection:**

- Explicitly designed for sidebar and panel webviews (our exact use case)
- Vite + esbuild provides fast builds meeting our 1s render requirement
- `tailwind-vscode` package provides theme-aware styling out of the box
- TypeScript setup for both extension and webview contexts prevents API mixing issues
- Architecture supports multiple webviews (dashboard + doc viewer)
- Well-documented best practices from GitHub Next team

**Party Mode Validation:** Architect, Developer, and UX Designer agents confirmed this choice. Key insights:

- Dual-context TypeScript separation prevents mixing Node.js and browser APIs
- Theme-aware Tailwind classes (`bg-vscode-editor-background`) ensure native feel
- Test framework scaffolding (Vitest + @vscode/test-electron) should be added in initialization story

**Initialization:**

```bash
# Clone the template
git clone https://github.com/githubnext/vscode-react-webviews.git bmad-extension
cd bmad-extension
npm install
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**

- TypeScript for extension host (Node.js)
- TypeScript for webview (browser/React)
- Separate tsconfig for each context

**Styling Solution:**

- Tailwind CSS with VS Code theme color integration
- Theme-aware classes: `bg-vscode-editor-background`, `text-vscode-foreground`

**Build Tooling:**

- Vite for webview bundling (esbuild under the hood)
- esbuild for extension host bundling
- Fast rebuilds for development iteration

**Testing Framework:**

- Not included by default - add in initialization story:
  - Vitest for webview unit tests
  - @vscode/test-electron for extension host tests

**Code Organization:**

- `/src/extension/` - Extension host code (parsing, file watching, state)
- `/src/webviews/` - React webview code (UI components)
- Clear separation of concerns between contexts

**Development Experience:**

- VS Code launch configurations pre-configured
- tasks.json waits for builds before launching
- css_custom_data.json for Tailwind directive support

**Note:** Project initialization using this template should be the first implementation story, including test framework scaffolding.

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

- **Project State Visibility (FR1-5):** Dashboard must display sprint status, epic list with completion, active epic/story progress, and recommended next actions
- **BMAD File Parsing (FR6-11):** Parse sprint-status.yaml, epic files (epic-\*.md), and story files; detect BMAD projects; handle malformed files gracefully with user-visible warnings
- **Workflow Actions (FR12-15):** One-click terminal command execution, clipboard copy, context-sensitive workflow options based on project state
- **Document Viewing (FR16-20):** Rich markdown rendering with Mermaid diagrams, syntax highlighting, proper table formatting, navigation from dashboard to documents
- **Extension Lifecycle (FR21-23):** Auto-activation on BMAD detection, no activation in non-BMAD workspaces, manual refresh capability

**Non-Functional Requirements:**

- **Performance:** 1s initial render, 500ms file change updates, <1% CPU, <50MB memory, progressive loading for large docs
- **Reliability:** No crashes on malformed files, recovery from FS errors, meaningful state with incomplete data
- **Integration:** Auto-update on file changes, VS Code 3-month compatibility, works with user's default shell

**Scale & Complexity:**

- Primary domain: VS Code Extension / Developer Tooling
- Complexity level: Low-Medium
- Estimated architectural components: 4-5 major components (Extension Host, Parser Service, State Manager, Webview UI, File Watcher)

### Technical Constraints & Dependencies

- **Platform:** VS Code Extension API (target: versions from past 3 months)
- **UI Framework:** React in Webview panel (sidebar)
- **Communication:** VS Code Webview API message passing (postMessage/onMessage)
- **Activation:** `workspaceContains:**/_bmad/**` or BMAD config presence
- **Single-context model:** One dashboard per VS Code window (no multi-root workspace complexity)

### Cross-Cutting Concerns Identified

1. **Graceful Degradation:** Every component must handle missing/malformed data without crashing
2. **Performance Monitoring:** File watching and parsing must stay within resource budgets
3. **State Consistency:** File changes must propagate reliably from watcher → parser → state → UI
4. **Error Visibility:** Users need clear feedback when extension encounters problems

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**

- Dual webview architecture (sidebar + tab panel)
- Parsing library selection (js-yaml, gray-matter)
- Message protocol definition
- State management approach (Zustand)

**Important Decisions (Shape Architecture):**

- File watching strategy with debounce
- Error handling pattern (ParseResult)
- Workflow execution approach

**Deferred Decisions (Post-MVP):**

- Polling fallback (implement if FSWatcher issues arise)
- Persistent caching via Memento API

### Webview Architecture

**Dual Webview Model:**

| Webview         | Type             | Purpose                          | Key Components                                  |
| --------------- | ---------------- | -------------------------------- | ----------------------------------------------- |
| Dashboard       | Sidebar Panel    | Always visible, compact status   | Sprint status, epic list, CTA buttons           |
| Document Viewer | Editor Tab Panel | On-demand, full document display | Markdown renderer, Mermaid, syntax highlighting |

**Registration:**

- `bmad.dashboardView` - Sidebar provider
- `bmad.documentView` - Editor panel (opened via command)

**State Sharing:** Both webviews subscribe to same extension host state via postMessage

### Data Architecture

**Parsing Stack:**

| Layer          | Library          | Purpose                                       |
| -------------- | ---------------- | --------------------------------------------- |
| Extension Host | js-yaml          | Parse sprint-status.yaml                      |
| Extension Host | gray-matter      | Extract frontmatter from epic/story .md files |
| Webview (Tab)  | react-markdown   | Render markdown body                          |
| Webview (Tab)  | remark-gfm       | GitHub Flavored Markdown (tables)             |
| Webview (Tab)  | mermaid          | Render diagrams                               |
| Webview (Tab)  | rehype-highlight | Syntax highlighting for code blocks           |

**Caching Strategy:**

- In-memory cache with file content hash
- Re-parse only when hash changes
- Cache cleared on extension reload
- Deferred: Memento API for persistence (post-MVP if needed)

### State Management

**Approach:** Zustand in webviews

**Rationale:**

- Lightweight (~1KB), minimal overhead
- Clean subscription to state slices
- Extension host remains single source of truth
- Webviews receive state snapshots via postMessage, store in Zustand for React consumption

**State Shape:**

```typescript
interface DashboardState {
  sprint: SprintStatus | null;
  epics: Epic[];
  currentStory: Story | null;
  errors: ParseError[];
  loading: boolean;
}
```

### Error Handling

**Pattern:** Result type for all parsing operations

```typescript
type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; partial?: Partial<T> };
```

**Error Display:**

- Sidebar: Warning icon with error count (compact), expandable on click
- Tab Panel: Inline error display with more detail (more real estate)

**Recovery:**

- All errors recoverable via manual refresh
- Partial data displayed when possible (graceful degradation)

### File Watching

**Primary:** VS Code FileSystemWatcher

**Watch Paths:**

- `_bmad-output/**/*.yaml`
- `_bmad-output/**/*.md`

**Debounce:** 500ms - batches rapid changes (git operations, bulk saves)

**Fallback:** Manual refresh button/command (polling deferred unless FSWatcher proves unreliable)

### Message Protocol

**Extension → Webview:**

```typescript
type ToWebview =
  | { type: 'STATE_UPDATE'; payload: DashboardState }
  | { type: 'DOCUMENT_CONTENT'; payload: { path: string; content: string; frontmatter: unknown } }
  | { type: 'ERROR'; payload: { message: string; recoverable: boolean } };
```

**Webview → Extension:**

```typescript
type ToExtension =
  | { type: 'OPEN_DOCUMENT'; payload: { path: string } }
  | { type: 'EXECUTE_WORKFLOW'; payload: { command: string } }
  | { type: 'COPY_COMMAND'; payload: { command: string } }
  | { type: 'REFRESH' };
```

**Type Safety:** Shared types in `/src/shared/messages.ts`, imported by both contexts

### Workflow Execution

**Primary Action (Click):** Terminal execution

- Creates/reuses BMAD terminal via `vscode.window.createTerminal()`
- Sends command text (e.g., `claude /dev-story`)
- Terminal brought to focus

**Secondary Action (Dedicated Button):** Copy to clipboard

- Separate "Copy" button next to each CTA for clear intent
- Uses `vscode.env.clipboard.writeText()`
- Shows brief toast confirmation

### Party Mode Validation

**Team Review Outcomes:**

Architect, Developer, Test Architect, and UX Designer validated the architectural decisions. Key refinements captured:

**Mermaid Error Handling:**

- Wrap Mermaid rendering in React error boundary
- Fallback: Display raw code block when diagram parsing fails
- Prevents broken diagrams from crashing document viewer

**Error Display Pattern:**

- Sidebar: Warning icon with error count (compact), expandable on click
- Tab Panel: Inline error display with more detail (more real estate)

**Bundle Size Awareness:**

- `rehype-highlight` acceptable for MVP
- Profile post-MVP; consider `shiki` if bundle size becomes concern
- Lazy-load syntax highlighting if needed

**Testing Priority:**

- Parser unit tests are critical path for NFR5-7 (reliability)
- High coverage on ParseResult edge cases
- Zustand stores testable in isolation
- Message protocol boundary validates with integration tests

### Decision Impact Analysis

**Implementation Sequence:**

1. Project initialization (starter template + test scaffolding)
2. Extension activation and BMAD detection
3. File watcher setup
4. Parser implementation (js-yaml, gray-matter)
5. State manager with Zustand
6. Sidebar webview (dashboard)
7. Tab panel webview (document viewer with markdown rendering)
8. Workflow execution (terminal + clipboard)

**Cross-Component Dependencies:**

- Parsers → State Manager → Both Webviews
- File Watcher → Parsers (triggers re-parse)
- Webview actions → Extension commands → Terminal/Clipboard

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 12 areas where AI agents could make different choices - all addressed below.

### Naming Patterns

**File Naming:**

- All files: kebab-case (`dashboard-panel.tsx`, `parse-sprint-status.ts`, `epic-list.tsx`)
- Test files: `*.test.ts` co-located with source (`parse-sprint-status.test.ts`)

**TypeScript Naming:**

- Components: PascalCase (`DashboardPanel`, `EpicList`)
- Functions/variables: camelCase (`getCurrentStory`, `epicData`)
- Types/Interfaces: PascalCase (`SprintStatus`, `ParseResult<T>`)
- Constants: SCREAMING_SNAKE_CASE (`MESSAGE_TYPES`, `DEFAULT_DEBOUNCE_MS`)

**Extension Identifiers:**

- Commands: `bmad.<action>` (`bmad.openDocument`, `bmad.refresh`, `bmad.executeWorkflow`)
- Views: `bmad.<viewName>View` (`bmad.dashboardView`, `bmad.documentView`)
- Configuration: `bmad.<setting>` (`bmad.enableFileWatching`)

**Message Types:**

- SCREAMING_SNAKE_CASE (`STATE_UPDATE`, `OPEN_DOCUMENT`, `EXECUTE_WORKFLOW`)

### Structure Patterns

**Project Organization:**

```
src/
├── extension/              # Extension host code (Node.js)
│   ├── parsers/            # js-yaml, gray-matter parsing
│   │   ├── sprint-status.ts
│   │   ├── epic-parser.ts
│   │   └── story-parser.ts
│   ├── services/           # File watcher, state manager
│   │   ├── file-watcher.ts
│   │   └── state-manager.ts
│   ├── commands/           # VS Code command handlers
│   │   └── workflow-commands.ts
│   └── extension.ts        # Entry point
├── webviews/
│   ├── dashboard/          # Sidebar webview (by feature)
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── store.ts        # Zustand store
│   │   └── index.tsx
│   ├── document-viewer/    # Tab panel webview (by feature)
│   │   ├── components/
│   │   └── index.tsx
│   └── shared/             # Shared React components
└── shared/                 # Shared between extension & webviews
    ├── types/              # TypeScript interfaces
    │   ├── sprint.ts
    │   ├── epic.ts
    │   └── story.ts
    └── messages.ts         # Message protocol types
```

**Test Location:** Co-located with source

- `src/extension/parsers/sprint-status.ts` → `src/extension/parsers/sprint-status.test.ts`

### Format Patterns

**Error Messages:**

- Sentence case, user-friendly
- Include context: "Failed to parse sprint-status.yaml: invalid YAML at line 15"
- Never expose stack traces to UI

**File Paths:**

- Internal: Always forward slashes (`_bmad-output/planning-artifacts/prd.md`)
- Display: Use `vscode.Uri.fsPath` for OS-native display
- Storage: Relative to workspace root

**TypeScript Interfaces for BMAD Files:**

- Match YAML/frontmatter property names exactly
- Use `unknown` for unvalidated frontmatter, narrow with type guards

### Communication Patterns

**Message Structure:**

- Always `{ type: string; payload?: T }` format
- Never spread payload into root: `{ type, ...data }` ❌
- Discriminated unions for type safety

**State Updates:**

- Replace entire state snapshot (not merge)
- Extension host is single source of truth
- Webviews are read-only consumers (actions go back via messages)

### Process Patterns

**Loading States:**

- `loading: boolean` in Zustand store
- Skeleton UI while loading (not spinner)
- Show stale data with "updating" indicator during refresh

**Error Recovery:**

- All errors recoverable via `bmad.refresh` command
- Partial data displayed when possible
- Error state clears on next successful parse

**Async Operations:**

- All VS Code API calls wrapped in try/catch
- ParseResult pattern for all parsing functions
- Never throw from parsers - return error result

### Enforcement Guidelines

**All AI Agents MUST:**

1. Use kebab-case for all new files
2. Return `ParseResult<T>` from any parsing function
3. Use the message protocol types from `/src/shared/messages.ts`
4. Co-locate tests with source files
5. Handle null/undefined gracefully - never crash on missing data

**Pattern Verification:**

- TypeScript strict mode catches type mismatches
- ESLint rules enforce naming conventions
- PR review checklist includes pattern compliance

### Pattern Examples

**Good Examples:**

```typescript
// Good: kebab-case file, PascalCase component
// file: src/webviews/dashboard/components/epic-list.tsx
export function EpicList({ epics }: { epics: Epic[] }) { ... }

// Good: ParseResult pattern
export function parseSprintStatus(content: string): ParseResult<SprintStatus> {
  try {
    const data = yaml.load(content);
    return { success: true, data: validateSprintStatus(data) };
  } catch (e) {
    return { success: false, error: `Failed to parse: ${e.message}` };
  }
}

// Good: Message with payload
postMessage({ type: 'OPEN_DOCUMENT', payload: { path: filePath } });
```

**Anti-Patterns:**

```typescript
// Bad: PascalCase file name
// file: src/webviews/dashboard/components/EpicList.tsx ❌

// Bad: Throwing from parser
export function parseSprintStatus(content: string): SprintStatus {
  return yaml.load(content); // Throws on invalid YAML ❌
}

// Bad: Spreading payload
postMessage({ type: 'OPEN_DOCUMENT', path: filePath }); // No payload wrapper ❌
```

## Project Structure & Boundaries

### Complete Project Directory Structure

```
bmad-extension/
├── .vscode/
│   ├── launch.json              # Extension debug configurations
│   ├── tasks.json               # Build tasks (wait for compile)
│   └── settings.json            # Workspace settings
├── .github/
│   └── workflows/
│       └── ci.yml               # CI pipeline (lint, test, build)
├── src/
│   ├── extension/               # Extension host code (Node.js runtime)
│   │   ├── parsers/
│   │   │   ├── sprint-status.ts       # Parse sprint-status.yaml
│   │   │   ├── sprint-status.test.ts
│   │   │   ├── epic-parser.ts         # Parse epic-*.md files
│   │   │   ├── epic-parser.test.ts
│   │   │   ├── story-parser.ts        # Parse story files
│   │   │   ├── story-parser.test.ts
│   │   │   └── index.ts               # Barrel export
│   │   ├── services/
│   │   │   ├── file-watcher.ts        # FileSystemWatcher + debounce
│   │   │   ├── file-watcher.test.ts
│   │   │   ├── state-manager.ts       # Centralized state, notifies webviews
│   │   │   ├── state-manager.test.ts
│   │   │   ├── bmad-detector.ts       # Detect BMAD project presence
│   │   │   └── cache.ts               # In-memory cache with file hashing
│   │   ├── commands/
│   │   │   ├── workflow-commands.ts   # Execute/copy workflow commands
│   │   │   ├── refresh-command.ts     # Manual refresh
│   │   │   └── open-document.ts       # Open doc in tab panel
│   │   ├── providers/
│   │   │   ├── dashboard-provider.ts  # Sidebar webview provider
│   │   │   └── document-panel.ts      # Tab panel webview provider
│   │   └── extension.ts               # Entry point, activation
│   ├── webviews/
│   │   ├── dashboard/                 # Sidebar webview
│   │   │   ├── components/
│   │   │   │   ├── sprint-status.tsx
│   │   │   │   ├── epic-list.tsx
│   │   │   │   ├── story-card.tsx
│   │   │   │   ├── cta-buttons.tsx
│   │   │   │   ├── error-indicator.tsx
│   │   │   │   └── loading-skeleton.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-extension-state.ts
│   │   │   │   └── use-message-handler.ts
│   │   │   ├── store.ts               # Zustand store
│   │   │   ├── index.tsx              # Dashboard entry
│   │   │   └── index.html             # Webview HTML shell
│   │   ├── document-viewer/           # Tab panel webview
│   │   │   ├── components/
│   │   │   │   ├── markdown-renderer.tsx
│   │   │   │   ├── mermaid-diagram.tsx
│   │   │   │   ├── code-block.tsx
│   │   │   │   └── error-boundary.tsx
│   │   │   ├── store.ts
│   │   │   ├── index.tsx
│   │   │   └── index.html
│   │   └── shared/                    # Shared React components
│   │       ├── components/
│   │       │   └── button.tsx
│   │       └── hooks/
│   │           └── use-vscode-api.ts
│   ├── shared/                        # Shared between extension & webviews
│   │   ├── types/
│   │   │   ├── sprint.ts              # SprintStatus interface
│   │   │   ├── epic.ts                # Epic interface
│   │   │   ├── story.ts               # Story interface
│   │   │   ├── parse-result.ts        # ParseResult<T> type
│   │   │   └── index.ts               # Barrel export
│   │   └── messages.ts                # ToWebview, ToExtension types
│   └── __tests__/                     # Non-unit tests
│       ├── integration/
│       │   └── message-protocol.test.ts
│       └── e2e/
│           └── extension-activation.test.ts
├── package.json                       # Extension manifest + dependencies
├── tsconfig.json                      # Base TypeScript config
├── tsconfig.extension.json            # Extension host config (Node)
├── tsconfig.webview.json              # Webview config (browser)
├── vite.config.ts                     # Webview bundling
├── esbuild.config.js                  # Extension bundling
├── tailwind.config.js                 # Tailwind + VS Code theme
├── vitest.config.ts                   # Vitest configuration
├── .eslintrc.js                       # ESLint rules
├── .prettierrc                        # Prettier config
├── .gitignore
├── README.md
├── CHANGELOG.md
└── LICENSE
```

### Architectural Boundaries

**Extension Host ↔ Webview Boundary:**

- Communication: postMessage only (no direct function calls)
- Data flow: Extension → Webview (state updates), Webview → Extension (actions)
- Type safety: Shared message types in `/src/shared/messages.ts`
- Serialization: All data must be JSON-serializable

**TypeScript Boundary Enforcement:**

- `tsconfig.extension.json` includes `src/extension/**` and `src/shared/**`
- `tsconfig.webview.json` includes `src/webviews/**` and `src/shared/**`
- Cross-imports between extension and webview directories = compilation failure
- Story 0 AC: "TypeScript compilation fails if webview imports from extension directory or vice versa"

**Parser Boundary:**

- Input: Raw file content (string)
- Output: `ParseResult<T>` - never throws
- Dependencies: Only `js-yaml`, `gray-matter` - no VS Code API

**State Manager Boundary:**

- Single source of truth for all BMAD state
- Notifies all active webviews on state change
- Handles cache invalidation based on file hashes

### Requirements to Structure Mapping

**FR1-5: Project State Visibility**

- `src/extension/services/state-manager.ts` - Aggregates parsed data
- `src/webviews/dashboard/components/sprint-status.tsx` - Sprint display
- `src/webviews/dashboard/components/epic-list.tsx` - Epic progress
- `src/webviews/dashboard/components/story-card.tsx` - Current story

**FR6-11: BMAD File Parsing**

- `src/extension/parsers/sprint-status.ts` - YAML parsing
- `src/extension/parsers/epic-parser.ts` - Epic frontmatter
- `src/extension/parsers/story-parser.ts` - Story frontmatter
- `src/extension/services/bmad-detector.ts` - Project detection

**FR12-15: Workflow Actions**

- `src/extension/commands/workflow-commands.ts` - Terminal execution
- `src/webviews/dashboard/components/cta-buttons.tsx` - UI buttons

**FR16-20: Document Viewing**

- `src/webviews/document-viewer/components/markdown-renderer.tsx` - react-markdown
- `src/webviews/document-viewer/components/mermaid-diagram.tsx` - Mermaid with error boundary
- `src/webviews/document-viewer/components/code-block.tsx` - Syntax highlighting

**FR21-23: Extension Lifecycle**

- `src/extension/extension.ts` - Activation logic
- `src/extension/services/file-watcher.ts` - Auto-refresh on changes

### Integration Points

**Internal Communication Flow:**

```
File Change → FileWatcher → Parser → StateManager → postMessage → Webview Store → React UI
```

**External Integrations:**

- VS Code API: Extension host only
- Terminal: `vscode.window.createTerminal()` for workflow execution
- Clipboard: `vscode.env.clipboard` for copy actions
- File System: `vscode.workspace.fs` for reading BMAD files

### Party Mode Validation

**Team Review Outcomes:**

Developer, Scrum Master, Test Architect, and Architect validated the project structure. Key refinements:

**Barrel Exports:**

- Add `index.ts` in `src/shared/types/` and `src/extension/parsers/` for clean imports

**Test Organization:**

- Unit tests: Co-located (`*.test.ts` next to source)
- Integration tests: `src/__tests__/integration/` for cross-boundary tests
- E2E tests: `src/__tests__/e2e/` for VS Code extension host tests

**Story Isolation:**

- Each story touches 2-3 directories maximum
- Clear ownership boundaries per feature

### Development Workflow

**Development:**

1. `npm run watch` - Watches both extension and webview
2. F5 in VS Code - Launches Extension Development Host
3. Changes hot-reload in webviews, extension requires restart

**Testing:**

- `npm test` - Runs Vitest for all co-located tests
- `npm run test:extension` - VS Code extension integration tests

**Build:**

- `npm run build` - Builds extension + webviews for production
- `npm run package` - Creates .vsix for distribution

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All technology choices work together without conflicts:

- TypeScript 5.x across both extension host and webviews
- React 18 + Zustand for webview state management
- Vite + esbuild build pipeline compatible with VS Code packaging
- js-yaml + gray-matter parsing stack works in Node.js context
- react-markdown + remark-gfm + mermaid + rehype-highlight render stack works in browser context

**Pattern Consistency:**
Implementation patterns fully support architectural decisions:

- ParseResult<T> pattern enforced for all parsing operations
- Message protocol types shared via `/src/shared/messages.ts`
- Naming conventions (kebab-case files, PascalCase components) applied consistently
- Error handling follows graceful degradation principle throughout

**Structure Alignment:**
Project structure enables all architectural decisions:

- Clear separation between extension host (`/src/extension/`) and webviews (`/src/webviews/`)
- Shared types in `/src/shared/` imported by both contexts
- tsconfig boundary enforcement prevents cross-context pollution
- Test co-location supports rapid development iteration

### Requirements Coverage Validation ✅

**Functional Requirements Coverage:**

| FR Category                     | Architectural Support                         |
| ------------------------------- | --------------------------------------------- |
| FR1-5: Project State Visibility | StateManager + Dashboard webview components   |
| FR6-11: BMAD File Parsing       | Parser modules with ParseResult pattern       |
| FR12-15: Workflow Actions       | Terminal commands + clipboard integration     |
| FR16-20: Document Viewing       | Tab panel webview with markdown/mermaid stack |
| FR21-23: Extension Lifecycle    | Activation logic + FileWatcher service        |

All 23 functional requirements have clear architectural homes.

**Non-Functional Requirements Coverage:**

| NFR                        | Architectural Mechanism                                     |
| -------------------------- | ----------------------------------------------------------- |
| NFR1: 1s initial render    | Vite/esbuild fast builds, lazy-load syntax highlighting     |
| NFR2: 500ms file updates   | FileWatcher with 500ms debounce                             |
| NFR3: <1% CPU              | Debounced watching, cache with file hashing                 |
| NFR4: <50MB memory         | In-memory cache, no persistence by default                  |
| NFR5-7: Reliability        | ParseResult pattern, error boundaries, graceful degradation |
| NFR8-10: Integration       | FileSystemWatcher, VS Code API compatibility                |
| NFR11: Shell compatibility | Uses VS Code terminal API with user's default shell         |

All 11 non-functional requirements are architecturally addressed.

### Implementation Readiness Validation ✅

**Decision Completeness:**

- All critical decisions documented with specific versions/libraries
- Implementation patterns comprehensive with code examples
- Consistency rules clear and enforceable via TypeScript + ESLint
- Anti-patterns documented to prevent common mistakes

**Structure Completeness:**

- Complete project tree with 60+ files/directories defined
- All integration points clearly specified
- Component boundaries well-defined with tsconfig enforcement

**Pattern Completeness:**

- All 12 potential conflict points addressed
- Naming conventions cover all scenarios (files, types, commands, messages)
- Communication patterns fully specified with TypeScript types
- Process patterns (error handling, loading states) complete

### Gap Analysis Results

**Critical Gaps:** None identified

**Important Gaps (Addressed):**

- Mermaid error boundary pattern added during Party Mode validation
- TypeScript boundary enforcement mechanism clarified
- Test organization (unit vs integration vs e2e) structure defined

**Nice-to-Have (Deferred to Post-MVP):**

- Memento API for persistent caching (implement if memory becomes concern)
- Polling fallback for FileWatcher (implement only if FSWatcher proves unreliable)
- shiki for syntax highlighting (consider if bundle size becomes issue)

### Architecture Completeness Checklist

**✅ Requirements Analysis**

- [x] Project context thoroughly analyzed (23 FRs, 11 NFRs mapped)
- [x] Scale and complexity assessed (Low-Medium)
- [x] Technical constraints identified (VS Code Extension API, dual-context)
- [x] Cross-cutting concerns mapped (graceful degradation, state consistency)

**✅ Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified (React, Zustand, js-yaml, gray-matter, etc.)
- [x] Integration patterns defined (postMessage protocol)
- [x] Performance considerations addressed (500ms debounce, caching)

**✅ Implementation Patterns**

- [x] Naming conventions established (kebab-case files, PascalCase components)
- [x] Structure patterns defined (feature-based webview organization)
- [x] Communication patterns specified (message protocol with discriminated unions)
- [x] Process patterns documented (ParseResult, error boundaries)

**✅ Project Structure**

- [x] Complete directory structure defined (60+ entries)
- [x] Component boundaries established (tsconfig enforcement)
- [x] Integration points mapped (FileWatcher → Parser → State → Webview)
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** High - based on comprehensive validation results

**Key Strengths:**

- Clear separation of concerns between extension host and webviews
- Type-safe message protocol prevents runtime errors
- ParseResult pattern ensures graceful handling of malformed BMAD files
- Dual webview architecture supports both compact dashboard and full document viewing
- Party Mode validations incorporated multiple expert perspectives

**Areas for Future Enhancement:**

- Persistent caching via Memento API (if memory becomes concern)
- Progressive rendering for very large documents
- Additional workflow commands as BMAD V6 evolves

### Implementation Handoff

**AI Agent Guidelines:**

- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries (especially tsconfig separation)
- Refer to this document for all architectural questions
- ParseResult<T> is mandatory for ALL parsing functions - never throw

**First Implementation Priority:**
Initialize project using githubnext/vscode-react-webviews starter, configure test frameworks (Vitest + @vscode/test-electron), and establish TypeScript boundary enforcement.
