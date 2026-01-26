---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, party-mode-review]
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

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 3 | View current sprint status |
| FR2 | Epic 3 | View epic list with completion |
| FR3 | Epic 3 | View active epic with story progress |
| FR4 | Epic 3 | View active story with task progress |
| FR5 | Epic 3 | Identify next recommended action |
| FR6 | Epic 2 | Parse sprint-status.yaml |
| FR7 | Epic 2 | Parse epic files |
| FR8 | Epic 2 | Parse story files |
| FR9 | Epic 1 | Detect BMAD project |
| FR10 | Epic 2 | Handle malformed files gracefully |
| FR11 | Epic 2 | Display parsing warnings/errors |
| FR12 | Epic 4 | One-click workflow launch |
| FR13 | Epic 4 | Copy command to clipboard |
| FR14 | Epic 4 | Context-sensitive workflow options |
| FR15 | Epic 4 | Determine available workflows |
| FR16 | Epic 5 | View planning artifacts |
| FR17 | Epic 5 | Render markdown formatting |
| FR18 | Epic 5 | Render Mermaid diagrams |
| FR19 | Epic 5 | Syntax-highlighted code blocks |
| FR20 | Epic 5 | Navigate dashboard to document |
| FR21 | Epic 1 | Auto-activation on BMAD detection |
| FR22 | Epic 1 | No activation in non-BMAD workspaces |
| FR23 | Epic 3 | Manual refresh capability |

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

### Epic 5: Document Viewing
Developer can view any BMAD planning artifact with rich rendering - Mermaid diagrams, formatted tables, and syntax-highlighted code blocks - in a dedicated tab panel.
**FRs covered:** FR16, FR17, FR18, FR19, FR20
**NFRs addressed:** NFR4 (rendering performance), NFR11 (error feedback)

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
I want reliable parsing of epic markdown files (epic-*.md),
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
**Then** it is clearly visible as a secondary action (separate from execute)

---

## Epic 5: Document Viewing

Developer can view any BMAD planning artifact with rich rendering - Mermaid diagrams, formatted tables, and syntax-highlighted code blocks - in a dedicated tab panel. Supports deeper exploration for the Sam and Jordan user journeys.

### Story 5.1: Document Viewer Tab Panel Registration

As a developer,
I want a document viewer that opens in an editor tab panel,
So that I can view documents with full screen real estate.

**Acceptance Criteria:**

**Given** the extension is activated
**When** the document viewer panel provider is registered
**Then** `bmad.documentView` is available as a webview panel type

**Given** the `bmad.openDocument` command is invoked
**When** a document path is provided
**Then** a tab panel opens with the document viewer webview
**And** the panel title reflects the document name

**Given** multiple documents are opened
**When** each opens in a tab
**Then** each document has its own tab panel instance

**Given** the document viewer webview
**When** dependencies are configured
**Then** required rendering dependencies are installed (react-markdown, remark-gfm, mermaid, rehype-highlight)

### Story 5.2: Dashboard to Document Navigation

As a developer,
I want to navigate from the dashboard to view a specific document,
So that I can quickly access planning artifacts.

**Acceptance Criteria:**

**Given** the dashboard displays document links (PRD, Architecture, Epics, Stories)
**When** the user clicks a document link
**Then** the OPEN_DOCUMENT message is sent to extension host (FR20)
**And** the document viewer tab panel opens with the selected document

**Given** the document path is valid
**When** the extension processes OPEN_DOCUMENT
**Then** it reads the file and sends DOCUMENT_CONTENT to the viewer

**Given** the document path is invalid or file is missing
**When** the extension processes OPEN_DOCUMENT
**Then** an error message is displayed in the viewer (NFR11)

### Story 5.3: Basic Markdown Rendering

As a developer,
I want to view markdown content with proper formatting,
So that documents are readable and well-structured.

**Acceptance Criteria:**

**Given** the document viewer receives markdown content
**When** the MarkdownRenderer component renders it
**Then** headers, paragraphs, and lists are properly formatted (FR17)
**And** tables are rendered with proper alignment (remark-gfm)
**And** links are clickable
**And** the content uses VS Code theme colors

**Given** a document under 10KB
**When** rendering completes
**Then** it completes within 2 seconds (NFR4)

### Story 5.4: Mermaid Diagram Rendering

As a developer,
I want to view Mermaid diagrams rendered as visuals,
So that architecture and flow diagrams are easy to understand.

**Acceptance Criteria:**

**Given** markdown content contains a Mermaid code block
**When** the MermaidDiagram component renders it
**Then** the diagram is displayed as a visual (FR18)
**And** the diagram uses appropriate colors for readability

**Given** a Mermaid diagram has syntax errors
**When** rendering fails
**Then** the error boundary catches the failure
**And** the raw code block is displayed as fallback
**And** an error indicator shows the diagram failed to parse (NFR11)

### Story 5.5: Syntax-Highlighted Code Blocks

As a developer,
I want to view code blocks with syntax highlighting,
So that code examples are easy to read.

**Acceptance Criteria:**

**Given** markdown content contains fenced code blocks with language tags
**When** the CodeBlock component renders them
**Then** syntax highlighting is applied based on language (FR19)
**And** common languages (typescript, javascript, yaml, json, bash) are supported

**Given** a code block has no language tag
**When** rendering occurs
**Then** the code is displayed without highlighting (plain text)

### Story 5.6: Progressive Loading for Large Documents

As a developer,
I want large documents to load progressively,
So that I can start reading without waiting for full render.

**Acceptance Criteria:**

**Given** a document larger than 10KB
**When** the document viewer renders it
**Then** content appears progressively as it renders (NFR4)
**And** a loading indicator shows rendering is in progress

**Given** rendering is in progress
**When** the user scrolls
**Then** the visible content is prioritized for rendering
