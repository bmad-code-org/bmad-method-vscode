---
stepsCompleted:
  [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, party-mode-review]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

# bmad-extension - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for bmad-extension, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

**Project State Visibility**

- FR1: User can view current sprint status at a glance
- FR2: User can view list of all epics with completion status
- FR3: User can view current/active epic with story progress
- FR4: User can view current/active story with task progress
- FR5: User can identify the next recommended action based on project state

**BMAD File Parsing**

- FR6: System can parse `sprint-status.yaml` to extract workflow state
- FR7: System can parse epic files (`epic-*.md`) to extract epic metadata and story lists
- FR8: System can parse story files to extract tasks and completion status
- FR9: System can detect when a workspace contains a BMAD project
- FR10: System can handle malformed or incomplete BMAD files without crashing
- FR11: User can view parsing warnings/errors for problematic BMAD files

**Workflow Actions**

- FR12: User can launch any available BMAD workflow via terminal command with one click
- FR13: User can copy a workflow command to clipboard
- FR14: System displays context-sensitive workflow options based on current project state
- FR15: System can determine which workflows are available based on project state and BMAD installation

**Document Viewing**

- FR16: User can view any BMAD planning artifact (PRD, architecture, epics, stories)
- FR17: User can view markdown content with proper formatting (headers, lists, tables)
- FR18: User can view Mermaid diagrams rendered as visuals
- FR19: User can view syntax-highlighted code blocks
- FR20: User can navigate from dashboard to view a specific document

**Extension Lifecycle**

- FR21: Extension activates automatically when BMAD project is detected
- FR22: Extension does not activate in non-BMAD workspaces
- FR23: User can manually refresh dashboard state

### NonFunctional Requirements

**Performance**

- NFR1: Dashboard initial render completes within 1 second of activation
- NFR2: Dashboard updates after file changes within 500ms
- NFR3: File watching consumes less than 1% CPU and 50MB memory under normal operation
- NFR4: Markdown rendering completes within 2 seconds for documents under 10KB; larger documents show progressive loading

**Reliability**

- NFR5: Extension does not crash when encountering malformed BMAD files
- NFR6: Extension recovers from file system errors by showing error state and enabling manual refresh
- NFR7: Dashboard displays meaningful state even with incomplete BMAD project data

**Integration**

- NFR8: Dashboard automatically updates when BMAD files change in the workspace
- NFR9: Extension is compatible with VS Code versions from the past 3 months
- NFR10: Terminal command execution works with user's configured VS Code default shell

**User Feedback**

- NFR11: User receives visual feedback when extension encounters errors or is in degraded state

### Additional Requirements

**From Architecture - Starter Template:**

- Use `githubnext/vscode-react-webviews` starter template for project initialization
- Configure Vitest for webview unit tests
- Configure @vscode/test-electron for extension host tests
- Establish TypeScript boundary enforcement between extension host and webview contexts

**Dual Webview Architecture:**

- Dashboard webview as sidebar panel (always visible, compact status)
- Document Viewer webview as editor tab panel (on-demand, full document display)
- Both webviews subscribe to same extension host state via postMessage

**Parsing Stack:**

- js-yaml for parsing sprint-status.yaml
- gray-matter for extracting frontmatter from epic/story .md files
- react-markdown with remark-gfm for rendering markdown in document viewer
- mermaid library for rendering diagrams (wrapped in React error boundary)
- rehype-highlight for syntax highlighting code blocks

**State Management:**

- Zustand for webview state management
- Extension host remains single source of truth
- ParseResult<T> pattern for all parsing operations (never throw)

**File Watching:**

- VS Code FileSystemWatcher on `_bmad-output/**/*.yaml` and `_bmad-output/**/*.md`
- 500ms debounce for batching rapid changes
- Manual refresh button/command as fallback

**Message Protocol:**

- Typed message protocol with discriminated unions
- Shared types in `/src/shared/messages.ts`
- Extension → Webview: STATE_UPDATE, DOCUMENT_CONTENT, ERROR
- Webview → Extension: OPEN_DOCUMENT, EXECUTE_WORKFLOW, COPY_COMMAND, REFRESH

**Workflow Execution:**

- Primary: Terminal execution via `vscode.window.createTerminal()`
- Secondary: Copy to clipboard via `vscode.env.clipboard.writeText()`

**Implementation Patterns (Consistency Rules):**

- All files use kebab-case naming
- Test files co-located with source (`*.test.ts`)
- Components use PascalCase, functions use camelCase
- Commands follow `bmad.<action>` pattern
- Message types use SCREAMING_SNAKE_CASE

### FR Coverage Map

| FR   | Epic     | Description                                             |
| ---- | -------- | ------------------------------------------------------- |
| FR1  | Epic 3   | View current sprint status                              |
| FR2  | Epic 3   | View epic list with completion                          |
| FR3  | Epic 3   | View active epic with story progress                    |
| FR4  | Epic 3   | View active story with task progress                    |
| FR5  | Epic 3   | Identify next recommended action                        |
| FR6  | Epic 2   | Parse sprint-status.yaml                                |
| FR7  | Epic 2   | Parse epic files                                        |
| FR8  | Epic 2   | Parse story files                                       |
| FR9  | Epic 1   | Detect BMAD project                                     |
| FR10 | Epic 2   | Handle malformed files gracefully                       |
| FR11 | Epic 2   | Display parsing warnings/errors                         |
| FR12 | Epic 4   | One-click workflow launch                               |
| FR13 | Epic 4   | Copy command to clipboard                               |
| FR14 | Epic 4   | Context-sensitive workflow options                      |
| FR15 | Epic 4   | Determine available workflows                           |
| FR16 | Epic 5   | View planning artifacts (via document library)          |
| FR17 | Epic 5   | Render markdown formatting (via markdown renderer)      |
| FR18 | Deferred | Render Mermaid diagrams (deferred to future epic)       |
| FR19 | Epic 5   | Syntax-highlighted code blocks (via rehype-highlight)   |
| FR20 | Epic 5   | Navigate dashboard to document (full: editor panel)     |
| FR21 | Epic 1   | Auto-activation on BMAD detection                       |
| FR22 | Epic 1   | No activation in non-BMAD workspaces                    |
| FR23 | Epic 3   | Manual refresh capability                               |

## Epic List

### Epic 1: Project Foundation & Detection

Developer opens VS Code and the extension activates in BMAD projects, establishing the foundation for all dashboard functionality.
**FRs covered:** FR9, FR21, FR22
**NFRs addressed:** NFR9 (VS Code compatibility)

### Epic 2: BMAD File Parsing & State Management

Developer has reliable parsing of all BMAD artifacts with graceful handling of malformed files, and the system maintains consistent state.
**FRs covered:** FR6, FR7, FR8, FR10, FR11
**NFRs addressed:** NFR5, NFR6, NFR7 (reliability requirements)

### Epic 3: Dashboard State Visibility

Developer opens VS Code and immediately sees their current project state - sprint status, epic progress, active story, and recommended next action - in a sidebar dashboard.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR23
**NFRs addressed:** NFR1 (1s render), NFR2 (500ms updates), NFR3 (resource limits), NFR8 (auto-update)

### Epic 4: Workflow Actions

Developer can launch any BMAD workflow with one click or copy commands to clipboard, with context-sensitive options based on project state.
**FRs covered:** FR12, FR13, FR14, FR15
**NFRs addressed:** NFR10 (shell compatibility)

### Epic 5: UX Polish & Dashboard Enhancements

Developer benefits from a refined dashboard experience with epic drill-down views, actionable next actions, an overflow menu, an about section, improved epic list UX, plus a full editor panel webview providing an enhanced dashboard, epics browser, story detail, stories table, kanban board, and document library with breadcrumb navigation.
**FRs covered:** FR2 (enhanced), FR5 (enhanced), FR16 (partial via doc library), FR17 (partial via markdown renderer), FR20 (full), plus new UX capabilities
**NFRs addressed:** NFR1 (render performance), NFR4 (rendering performance), NFR11 (error feedback)

---

## Epic 1: Project Foundation & Detection

Developer opens VS Code and the extension activates in BMAD projects, establishing the foundation for all dashboard functionality. This epic initializes the project using the githubnext/vscode-react-webviews starter template and establishes the core extension infrastructure.

### Story 1.1: Project Initialization from Starter Template

As a developer,
I want the project initialized with the githubnext/vscode-react-webviews starter template,
So that I have a properly configured VS Code extension with React webview support.

**Acceptance Criteria:**

**Given** the githubnext/vscode-react-webviews repository
**When** the template is cloned
**Then** the template exists and matches Architecture assumptions (Vite, Tailwind, dual tsconfig)
**And** if template has diverged significantly, required customizations are documented before proceeding

**Given** a fresh development environment
**When** the project is initialized
**Then** the project contains the starter template structure with `/src/extension/` and `/src/webviews/` directories
**And** TypeScript is configured with separate tsconfigs for extension and webview contexts
**And** Vite is configured for webview bundling
**And** Tailwind CSS is configured with VS Code theme color integration
**And** `npm install` completes without errors
**And** `npm run build` produces a working extension bundle

### Story 1.2: Test Framework Configuration

As a developer,
I want test frameworks configured for both extension host and webview contexts,
So that I can write reliable unit and integration tests.

**Acceptance Criteria:**

**Given** the initialized project from Story 1.1
**When** test frameworks are configured
**Then** Vitest is configured for webview unit tests with a passing sample test
**And** @vscode/test-electron is configured for extension host tests with a passing sample test
**And** `npm test` runs all tests and reports results
**And** Test files are co-located with source files following `*.test.ts` pattern

### Story 1.3: BMAD Project Detection

As a developer,
I want the extension to detect when a workspace contains a BMAD project,
So that the extension only activates in relevant workspaces.

**Acceptance Criteria:**

**Given** a VS Code workspace with a `_bmad/` directory
**When** VS Code opens the workspace
**Then** the extension activates automatically (FR21)

**Given** a VS Code workspace without a `_bmad/` directory
**When** VS Code opens the workspace
**Then** the extension does not activate (FR22)

**Given** a VS Code workspace
**When** the extension checks for BMAD presence
**Then** it detects BMAD via `workspaceContains:**/_bmad/**` activation event (FR9)
**And** no activation occurs in non-BMAD workspaces
**And** the extension is compatible with VS Code versions from the past 3 months (NFR9)

### Story 1.4: Sidebar Panel Registration

As a developer,
I want the dashboard sidebar panel registered and displaying a placeholder,
So that the extension has a visible presence in BMAD workspaces.

**Acceptance Criteria:**

**Given** the extension is activated in a BMAD workspace
**When** the sidebar panel is registered
**Then** a "BMAD Dashboard" panel appears in the VS Code sidebar
**And** the panel displays a placeholder message indicating successful initialization
**And** the webview loads without errors in the extension development host
**And** the panel uses VS Code theme colors via Tailwind classes

---

## Epic 2: BMAD File Parsing & State Management

Developer has reliable parsing of all BMAD artifacts with graceful handling of malformed files, and the system maintains consistent state. Implements the ParseResult<T> pattern for all parsing operations to ensure NFR5-7 reliability requirements.

**Implementation Note:** Stories 2.2, 2.3, 2.4, and 2.5 can be developed in parallel after Story 2.1 completes (shared types define the interfaces). Story 2.6 depends on all parsers being complete.

### Story 2.1: Shared Types and Message Protocol

As a developer,
I want shared TypeScript types for BMAD data structures and the message protocol,
So that type safety is enforced across extension host and webview boundaries.

**Acceptance Criteria:**

**Given** the project structure from Epic 1
**When** shared types are created
**Then** `/src/shared/types/` contains interfaces for SprintStatus, Epic, Story, and ParseResult<T>
**And** `/src/shared/messages.ts` contains ToWebview and ToExtension discriminated union types
**And** TypeScript compilation fails if webview imports from extension directory or vice versa
**And** All message types use SCREAMING_SNAKE_CASE naming convention

### Story 2.2: Sprint Status Parser

As a developer,
I want reliable parsing of sprint-status.yaml files,
So that the extension can extract workflow state for dashboard display.

**Acceptance Criteria:**

**Given** a valid sprint-status.yaml file
**When** the parser processes it
**Then** it returns `ParseResult<SprintStatus>` with `success: true` and extracted data (FR6)

**Given** a malformed or missing sprint-status.yaml file
**When** the parser processes it
**Then** it returns `ParseResult<SprintStatus>` with `success: false` and descriptive error message (FR10)
**And** the parser never throws an exception (NFR5)
**And** partial data is returned when possible for graceful degradation (NFR7)

**Given** the sprint-status parser
**When** unit tests are run
**Then** tests cover valid YAML, invalid YAML, missing file, and partial data scenarios

### Story 2.3: Epic File Parser

As a developer,
I want reliable parsing of epic markdown files (epic-\*.md),
So that the extension can extract epic metadata and story lists.

**Acceptance Criteria:**

**Given** a valid epic file with frontmatter
**When** the parser processes it
**Then** it returns `ParseResult<Epic>` with `success: true` and extracted metadata (FR7)
**And** it extracts epic title, status, and story references from frontmatter

**Given** a malformed epic file or missing frontmatter
**When** the parser processes it
**Then** it returns `ParseResult<Epic>` with `success: false` and descriptive error (FR10)
**And** the parser never throws an exception (NFR5)

**Given** the epic parser
**When** unit tests are run
**Then** tests cover valid frontmatter, invalid frontmatter, and missing file scenarios

### Story 2.4: Story File Parser

As a developer,
I want reliable parsing of story markdown files,
So that the extension can extract tasks and completion status.

**Acceptance Criteria:**

**Given** a valid story file with frontmatter
**When** the parser processes it
**Then** it returns `ParseResult<Story>` with `success: true` and extracted data (FR8)
**And** it extracts story title, status, and task completion from frontmatter

**Given** a malformed story file or missing frontmatter
**When** the parser processes it
**Then** it returns `ParseResult<Story>` with `success: false` and descriptive error (FR10)
**And** the parser never throws an exception (NFR5)

**Given** the story parser
**When** unit tests are run
**Then** tests cover valid frontmatter, invalid frontmatter, and missing file scenarios

### Story 2.5: File Watcher Service

As a developer,
I want a file watcher that monitors BMAD artifact changes,
So that the dashboard can auto-update when files change.

**Acceptance Criteria:**

**Given** the extension is active in a BMAD workspace
**When** the file watcher is initialized
**Then** it watches `_bmad-output/**/*.yaml` and `_bmad-output/**/*.md` patterns

**Given** a BMAD file changes in the workspace
**When** the file watcher detects the change
**Then** it debounces changes for 500ms to batch rapid updates
**And** it triggers a re-parse of affected files

**Given** a file system error occurs
**When** the file watcher encounters it
**Then** it recovers gracefully and enables manual refresh (NFR6)

**Given** file watching is active
**When** the extension monitors for changes
**Then** CPU usage stays below 1% and memory below 50MB under normal operation (NFR3)

### Story 2.6: State Manager with Parse Error Collection

As a developer,
I want a centralized state manager that aggregates parsed data and collects errors,
So that the dashboard displays consistent state and parsing warnings.

**Acceptance Criteria:**

**Given** parsed data from all parsers
**When** the state manager aggregates results
**Then** it maintains a single DashboardState containing sprint, epics, currentStory, errors, and loading status

**Given** parsers return errors
**When** the state manager processes results
**Then** errors are collected in the `errors` array for UI display (FR11)
**And** partial data is still available for graceful degradation (NFR7)

**Given** file changes trigger re-parsing
**When** new parse results are available
**Then** the state manager notifies all active webviews via postMessage
**And** error state clears on next successful parse

---

## Epic 3: Dashboard State Visibility

Developer opens VS Code and immediately sees their current project state - sprint status, epic progress, active story, and recommended next action - in a sidebar dashboard. This is the primary user value delivering the "GPS for BMAD" experience.

### Story 3.1: Dashboard Zustand Store and Message Handler

As a developer,
I want the dashboard webview to receive and store state from the extension host,
So that React components can reactively display project state.

**Acceptance Criteria:**

**Given** the sidebar panel from Epic 1
**When** the Zustand store is implemented
**Then** `/src/webviews/dashboard/store.ts` contains a DashboardState store
**And** `use-message-handler.ts` hook processes STATE_UPDATE messages from extension host
**And** state updates trigger React re-renders
**And** the store supports loading and error states

**Given** the extension host sends a STATE_UPDATE message
**When** the dashboard receives it
**Then** the Zustand store updates with the new state snapshot
**And** the update completes within 500ms (NFR2)

**Given** the extension activates in a BMAD workspace
**When** the dashboard initially renders
**Then** rendering completes within 1 second (NFR1)

### Story 3.2: Sprint Status Display Component

As a developer,
I want to view the current sprint status at a glance,
So that I know the overall progress of the current sprint.

**Acceptance Criteria:**

**Given** the dashboard receives sprint status data
**When** the SprintStatus component renders
**Then** it displays the current sprint name/phase (FR1)
**And** it shows sprint progress indicators
**And** it uses VS Code theme colors via Tailwind classes

**Given** sprint status data is loading
**When** the component renders
**Then** it displays a skeleton UI (not a spinner)

**Given** sprint status data is unavailable or errored
**When** the component renders
**Then** it displays a meaningful "unknown state" message (NFR7)

**Given** the dashboard displays planning artifacts section
**When** PRD and Architecture documents exist
**Then** links to PRD and Architecture documents are displayed and clickable

### Story 3.3: Epic List with Completion Status

As a developer,
I want to view a list of all epics with their completion status,
So that I can see project progress across all epics.

**Acceptance Criteria:**

**Given** the dashboard receives epic data
**When** the EpicList component renders
**Then** it displays all epics with their titles (FR2)
**And** it shows completion status for each epic (e.g., "3/5 stories complete")
**And** the current/active epic is visually highlighted

**Given** no epic data is available
**When** the component renders
**Then** it displays a helpful message indicating no epics found

**Given** an epic is displayed in the list
**When** the user clicks on the epic title
**Then** the epic document opens in the document viewer

### Story 3.4: Active Story Card with Task Progress

As a developer,
I want to view the current active story with task progress,
So that I know exactly where I left off and what remains.

**Acceptance Criteria:**

**Given** the dashboard receives current story data
**When** the StoryCard component renders
**Then** it displays the story title and epic context (FR3, FR4)
**And** it shows task completion progress (e.g., "4/7 tasks done")
**And** it displays the story status (draft, in-progress, complete)

**Given** no current story is active
**When** the component renders
**Then** it displays a message indicating no active story

**Given** a story is displayed in the card
**When** the user clicks on the story title
**Then** the story document opens in the document viewer

### Story 3.5: Next Action Recommendation

As a developer,
I want to see the next recommended action based on project state,
So that I immediately know what to do next.

**Acceptance Criteria:**

**Given** the dashboard has project state data
**When** the next action is determined
**Then** it identifies the appropriate next workflow based on state (FR5)
**And** it displays a clear recommendation (e.g., "Continue Story 2.4" or "Start next story")

**Given** the project is in various states
**When** recommendations are computed
**Then** recommendations follow logical BMAD workflow progression
**And** recommendations are context-sensitive to current sprint/epic/story state

### Story 3.6: Manual Refresh Command

As a developer,
I want to manually refresh the dashboard state,
So that I can recover from errors or force a re-sync.

**Acceptance Criteria:**

**Given** the dashboard is displayed
**When** the user triggers a refresh (via button or command)
**Then** the extension re-parses all BMAD files (FR23)
**And** the dashboard displays a loading state during refresh
**And** the state updates upon completion

**Given** the `bmad.refresh` command is registered
**When** the user invokes it via command palette
**Then** the dashboard refreshes

**Given** an error state is displayed
**When** the user triggers refresh
**Then** the error clears if parsing succeeds (NFR6)

---

## Epic 4: Workflow Actions

Developer can launch any BMAD workflow with one click or copy commands to clipboard, with context-sensitive options based on project state. Completes the "warm-up tax elimination" workflow.

### Story 4.1: Workflow Discovery Service

As a developer,
I want the extension to determine which workflows are available based on project state,
So that only relevant actions are displayed.

**Acceptance Criteria:**

**Given** the extension has parsed BMAD project state
**When** the workflow discovery service runs
**Then** it identifies available workflows based on current sprint/epic/story state (FR15)
**And** it returns a list of workflow commands with display names

**Given** a BMAD installation exists
**When** workflows are discovered
**Then** the service detects available BMAD workflows from the installation

**Given** different project states (no sprint, mid-epic, story complete, etc.)
**When** workflows are discovered
**Then** the available workflows change appropriately based on state

**Given** the workflow state mapping:
| Project State | Available Workflows |
|---------------|---------------------|
| No sprint-status.yaml exists | `/sprint-planning` |
| Sprint active, no stories started | `/create-story` |
| Story status: draft | `/dev-story` |
| Story status: in-progress | `/dev-story` (continue) |
| Story status: complete | `/code-review`, `/create-story` |
| All stories in epic complete | `/retrospective`, `/create-story` (next epic) |

**When** workflows are discovered
**Then** the available workflows match this state mapping

### Story 4.2: Context-Sensitive CTA Buttons

As a developer,
I want context-sensitive action buttons displayed based on project state,
So that I see the most relevant actions for my current situation.

**Acceptance Criteria:**

**Given** the dashboard receives available workflow data
**When** the CTAButtons component renders
**Then** it displays buttons for each available workflow (FR14)
**And** the primary/recommended action is visually emphasized
**And** buttons use VS Code theme colors

**Given** no workflows are available
**When** the component renders
**Then** it displays a helpful message or hides the section

**Given** the project state changes
**When** workflows are re-discovered
**Then** the CTA buttons update to reflect new available actions

### Story 4.3: Terminal Workflow Execution

As a developer,
I want to launch any BMAD workflow via terminal with one click,
So that I can immediately start working without typing commands.

**Acceptance Criteria:**

**Given** the user clicks a workflow CTA button
**When** the EXECUTE_WORKFLOW message is processed
**Then** a BMAD terminal is created or reused (FR12)
**And** the workflow command is sent to the terminal (e.g., `claude /dev-story`)
**And** the terminal is brought to focus

**Given** a BMAD terminal already exists
**When** executing a new workflow
**Then** the existing terminal is reused

**Given** the user's configured default shell
**When** the terminal executes the command
**Then** it works correctly with the user's shell (NFR10)

### Story 4.4: Copy Command to Clipboard

As a developer,
I want to copy a workflow command to clipboard,
So that I can paste it into an existing terminal or use it elsewhere.

**Acceptance Criteria:**

**Given** the user clicks a "Copy" button next to a workflow action
**When** the COPY_COMMAND message is processed
**Then** the command text is copied to clipboard (FR13)
**And** a brief toast confirmation is shown

**Given** the copy button in the UI
**When** rendered next to each CTA
**Then** it is clearly visible as a second ary action (separate from execute)

---

## Epic 5: UX Polish & Dashboard Enhancements

Developer benefits from a refined dashboard experience with epic drill-down views, actionable next actions, an overflow menu, an about section, improved epic list UX, plus a full editor panel webview providing an enhanced dashboard, epics browser, story detail, stories table, kanban board, and document library with breadcrumb navigation. Builds on proven patterns from Epics 1-4.

**Implementation Note:** Stories 5.1-5.4 modify the existing sidebar dashboard webview. Story 5.5a establishes the editor panel infrastructure (WebviewPanel provider, Vite multi-entry build, CSP handling). Story 5.5b adds the navigation shell, breadcrumbs with back button, full-width dashboard view, and click behavior. Stories 5.6-5.7 build the epics/stories/kanban views on that foundation. Story 5.8 (Document Library) depends only on 5.5a/5.5b and can be developed in parallel with 5.6-5.7. Dependency chain: 5.5a -> 5.5b -> 5.6 -> 5.7, with 5.8 parallel after 5.5b.

### Story 5.1: Epic Detail View with Story Lists

As a developer,
I want to drill down into an epic and see its individual stories with status,
So that I can understand epic progress at the story level, not just top-level completion.

**Acceptance Criteria:**

**Given** the epic list is displayed in the dashboard
**When** the user clicks/expands an epic
**Then** the epic expands to show a list of stories within that epic
**And** each story displays its title and status (backlog, in-progress, done, etc.)
**And** story completion is visually indicated (checkmark, strikethrough, or similar)

**Given** an expanded epic with stories
**When** the user clicks on a story title
**Then** the raw story .md file opens in a VS Code editor tab

**Given** an epic with no stories parsed
**When** the epic is expanded
**Then** a helpful message indicates no stories were found

### Story 5.2: Next Action Enhancements

As a developer,
I want the next action to be directly actionable with play and copy icons, and the Actions section to show only secondary actions,
So that I can launch my next workflow instantly without scanning through all actions.

**Acceptance Criteria:**

**Given** the dashboard displays a next action recommendation
**When** the NextAction component renders
**Then** a "play" icon button is displayed that launches the next action command in the terminal
**And** a "copy" icon button is displayed that copies the next action command to clipboard
**And** the play/copy icons follow existing terminal execution and clipboard patterns from Epic 4

**Given** the next action has play and copy functionality
**When** the Actions section renders below it
**Then** the Actions section heading reads "Other Actions" (or similar, excluding the primary)
**And** the primary/next action is NOT duplicated in the Other Actions list
**And** only secondary workflow actions appear in the Other Actions section

### Story 5.3: Overflow Menu & Help Icon

As a developer,
I want a "?" help icon and a "..." overflow menu replacing the standalone refresh button,
So that I have quick access to help and a clean menu for utility actions.

**Acceptance Criteria:**

**Given** the dashboard header/toolbar area
**When** the help icon ("?") is rendered
**Then** clicking it suggests running `bmad help` (e.g., copies command or shows tooltip with instruction)

**Given** the dashboard currently shows a standalone Refresh button
**When** the overflow menu ("...") replaces it
**Then** the "..." button opens a dropdown/context menu
**And** the menu contains "Refresh" as an action
**And** the menu contains all "quick workflow" commands discovered by WorkflowDiscoveryService
**And** if the TEA module is installed, a "TEA" action appears in the menu
**And** the standalone Refresh button is removed from its current location

### Story 5.4: About Section & Epic List UX

As a developer,
I want an About section showing BMAD metadata and improved epic list UX with show/hide for done epics and scroll for long lists,
So that I can see project metadata at a glance and navigate epics cleanly in large projects.

**Acceptance Criteria:**

**Given** the dashboard sidebar
**When** the About section renders
**Then** it displays the BMAD version (from bmad installation metadata)
**And** it displays the last updated date (from sprint-status.yaml or file timestamps)
**And** it displays installed modules (detected from bmad installation)

**Given** a project with completed epics
**When** the epic list renders
**Then** completed ("done") epics are hidden by default
**And** a toggle button allows showing/hiding done epics
**And** when shown, done epics are visually distinct (muted, strikethrough, or similar)

**Given** a project with more than 5 epics
**When** the epic list renders
**Then** only 5 epics are visible at a time
**And** additional epics are accessible via scrolling within the epic list area
**And** the scroll area has a defined max-height to prevent the epic list from consuming the entire sidebar

### Story 5.5a: Editor Panel Infrastructure & Build Setup

As a developer,
I want a dedicated editor panel webview registered and functional with its own build entry point,
So that there is a foundation for all editor panel views to be built upon.

**Acceptance Criteria:**

**Given** the extension is activated in a BMAD workspace
**When** the user invokes the `bmad.openEditorPanel` command (via command palette or dashboard action)
**Then** a webview panel opens in the editor area with the title "BMAD Project"
**And** the panel receives STATE_UPDATE messages from the extension host (same state as sidebar)
**And** only one editor panel instance exists at a time (singleton pattern)

**Given** the editor panel is open
**When** the user closes and reopens it
**Then** the panel is recreated cleanly (onDidDispose clears singleton reference)
**And** the panel restores to the default view

**Given** the build system
**When** `pnpm build` runs
**Then** it produces both `out/webview/index.js` (sidebar) and `out/webview/editor-panel.js` (editor panel)
**And** Vite multi-entry build handles shared code deduplication (React, Zustand, shared types)
**And** the editor panel HTML template correctly includes all generated script chunks with CSP nonces
**And** `pnpm build` completes without errors
**And** both webviews load correctly

**Given** the editor panel webview
**When** it initializes
**Then** it has its own Zustand store subscribing to STATE_UPDATE messages
**And** it renders a placeholder layout confirming successful initialization

### Story 5.5b: Navigation Shell, Breadcrumbs, Dashboard View & Click Behavior

As a developer,
I want a navigation shell with breadcrumbs and back button, a full-width dashboard as the default view, and both Ctrl/Cmd+click and Shift+click to open raw files,
So that I can navigate between views with clear context and access a richer project overview in the editor panel.

**Acceptance Criteria:**

**Given** the editor panel is open
**When** the user navigates between views (e.g., Dashboard > Epics > Epic 3 > Story 3.2)
**Then** the breadcrumb bar shows the navigation path (e.g., "Dashboard / Epics / Epic 3 / Story 3.2")
**And** clicking any breadcrumb segment navigates back to that level
**And** the current view title is highlighted as the active breadcrumb segment

**Given** the editor panel navigation
**When** the user has navigated through multiple views
**Then** a back arrow button is displayed next to the breadcrumb
**And** clicking the back button returns to the previous view
**And** the navigation history is capped at 10 entries (oldest entries are dropped)

**Given** the editor panel opens or navigates to the default view
**When** no specific view has been selected
**Then** a full-width dashboard view renders as the default landing page
**And** it displays the same core information as the sidebar (sprint status, epics, active story, actions) in a more spacious, visually appealing layout with richer details that would overcharge the compact sidebar
**And** navigation tabs or links allow switching to Epics, Stories, Kanban, and Docs views

**Given** any clickable document link in the sidebar dashboard or editor panel
**When** the user Ctrl+click (Windows/Linux), Cmd+click (macOS), or Shift+click on the link
**Then** the raw .md file opens in a VS Code editor tab
**And** both modifier key combinations work identically for raw file access

**Given** the VS Code settings
**When** the `bmad.defaultClickBehavior` setting is configured
**Then** it accepts values `'markdown-preview'` (default, preserves current behavior) or `'editor-panel'` (opens editor panel to relevant view)
**And** when set to `'editor-panel'`, normal-clicking a story or artifact link in the sidebar opens/focuses the editor panel at the relevant view
**And** when set to `'markdown-preview'`, normal-clicking behaves as it does today (opens VS Code markdown preview)

**Given** the editor panel is displayed at any width
**When** the viewport width changes (e.g., split editor, narrow panel)
**Then** the layout adapts responsively using Tailwind breakpoints
**And** content remains usable at widths as narrow as 400px

### Story 5.6: Epics Browser & Story Detail Views

As a developer,
I want to browse all epics in a visual layout and drill into individual story details in the editor panel,
So that I can understand project progress and review story specifications without leaving VS Code.

**Acceptance Criteria:**

**Given** the editor panel is open
**When** the user navigates to the Epics view
**Then** all epics are displayed as cards in a visual layout
**And** each epic shows: title, number, status badge, story count, and progress bar
**And** the currently active epic is visually highlighted
**And** completed epics are visually muted but still visible

**Given** the Epics view is displayed
**When** the user clicks on an epic card
**Then** the view transitions to show the stories within that epic
**And** the breadcrumb updates to "Dashboard / Epics / Epic N: Title"
**And** each story shows: title, status badge, and task progress (completed/total)
**And** Ctrl/Cmd+click or Shift+click on the epic title opens epics.md in a text editor

**Given** the user is viewing stories within an epic
**When** the user clicks on a story
**Then** the view transitions to a story detail panel
**And** the breadcrumb updates to "Dashboard / Epics / Epic N / Story N.M: Title"
**And** the detail view displays: title, user story text, status, acceptance criteria list, task checklist with completion status, and progress bar
**And** Ctrl/Cmd+click or Shift+click on the story title opens the raw .md file in a text editor

**Given** the DashboardState sent via STATE_UPDATE
**When** the extension host builds the state payload
**Then** it includes lightweight story summaries (key, title, status, task counts, epic number) for all parsed stories
**And** full story content (user story text, acceptance criteria, dev notes) is loaded on-demand via the existing DOCUMENT_CONTENT message when the user navigates to Story Detail
**And** this keeps state updates fast and lean regardless of project size

**Given** the sidebar dashboard shows the active story card
**When** the user normal-clicks the story link in the sidebar (with `bmad.defaultClickBehavior` set to `'editor-panel'`)
**Then** the editor panel opens/focuses and navigates directly to the Story Detail view for that story

**Given** an epic with no stories or a project with no epics
**When** the view renders
**Then** a helpful message indicates what is missing

**Given** the Epics browser or Story Detail view is displayed at any width
**When** the viewport width changes
**Then** the layout adapts responsively (e.g., epic cards reflow, story detail sections stack)
**And** content remains usable at widths as narrow as 400px

### Story 5.7: Stories Table & Kanban Board Views

As a developer,
I want a filterable stories table and a kanban board view showing story cards organized by status columns,
So that I can visualize workflow progress across all stories and quickly find stories by status or epic.

**Acceptance Criteria:**

**Given** the editor panel is open
**When** the user navigates to the Stories view
**Then** all stories across all epics are displayed in a table layout
**And** the table shows columns: Story ID, Title, Epic, Status, Tasks Progress
**And** clicking a story row navigates to the Story Detail view

**Given** the Stories view is displayed
**When** the user switches to the Kanban view (via a table/kanban toggle)
**Then** stories are displayed as cards organized in columns by status: Backlog, Ready for Dev, In Progress, Review, Done
**And** each card shows: story title, epic context (e.g., "Epic 3"), and task count (e.g., "4/7")
**And** each column header shows the column name and story count
**And** empty columns display a subtle empty state

**Given** the Stories or Kanban view is displayed
**When** the user interacts with the filter bar
**Then** they can filter by epic (dropdown), by status (dropdown), and search by story title (text input)
**And** filters are preserved when toggling between table and kanban layouts

**Given** the user switches between table and kanban views
**When** the toggle is clicked
**Then** the view switches while preserving the current filter state

**Given** a story card in the kanban view or row in the stories table
**When** the user clicks on it
**Then** the view navigates to the Story Detail view with breadcrumb updated
**And** Ctrl/Cmd+click or Shift+click opens the raw story .md file in a text editor

**Given** the kanban board or stories table is open
**When** story statuses change (detected by file watcher)
**Then** cards/rows update to reflect the new status automatically

**Given** the Stories table or Kanban board is displayed at any width
**When** the viewport width changes
**Then** the layout adapts responsively (e.g., kanban columns stack vertically at narrow widths, table scrolls horizontally)
**And** content remains usable at widths as narrow as 400px

### Story 5.8: Document Library & Markdown Viewer

As a developer,
I want to browse all project artifacts in a file tree and read markdown documents with proper formatting directly in the editor panel,
So that I can review PRDs, architecture docs, and other artifacts without switching to external tools.

**Acceptance Criteria:**

**Given** the editor panel is open
**When** the user navigates to the Docs view
**Then** a file tree is displayed on the left showing files from configurable directories
**And** the content area on the right displays the selected document
**And** the file tree updates when files change (via existing file watcher)

**Given** the VS Code settings
**When** the `bmad.docLibraryPaths` setting is configured
**Then** the file tree displays files from the configured paths
**And** the default value includes: `["{outputRoot}/planning-artifacts", "{outputRoot}/implementation-artifacts", "docs"]`
**And** the user can add custom folder paths to this setting

**Given** the file tree is displayed
**When** the user clicks on a file in the tree
**Then** the file content loads and displays in the main content area
**And** the selected file is visually highlighted in the tree
**And** the breadcrumb updates to "Dashboard / Docs / filename.md"
**And** directories are expandable/collapsible

**Given** a .md file is selected
**When** the content renders
**Then** markdown is rendered with proper formatting: headings, lists, tables, bold/italic, links, blockquotes
**And** GFM extensions are supported (tables, task lists, strikethrough)

**Given** a .yaml, .yml, or code file is selected
**When** the content renders
**Then** the content displays with syntax highlighting
**And** a "Copy" button allows copying the raw content

**Given** a markdown document is rendered
**When** headings are present (H1-H4)
**Then** a table of contents appears as a side panel or collapsible section
**And** clicking a TOC entry scrolls to that heading

**Given** the project dependencies
**When** the document library is implemented
**Then** `react-markdown`, `remark-gfm`, and `rehype-highlight` are added as dependencies
**And** they are used only in the editor panel webview bundle

**Given** the Document Library view is displayed at any width
**When** the viewport width changes
**Then** the layout adapts responsively (e.g., file tree collapses to a toggle at narrow widths, content area takes full width)
**And** content remains usable at widths as narrow as 400px
