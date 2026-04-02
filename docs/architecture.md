# Architecture Documentation

## Executive Summary

BMAD Dashboard is a VS Code sidebar extension that provides an interactive dashboard for BMAD V6 projects. It monitors BMAD workflow artifacts (sprint status, epics, stories) via file system watchers, parses them into structured data, and renders a React-based dashboard in a VS Code webview panel. The extension helps developers track sprint progress, view active stories, and execute BMAD workflows directly from the IDE.

## Architecture Pattern

**Dual-Context Extension** — The application runs across two isolated JavaScript contexts that communicate via message passing:

1. **Extension Host** (Node.js) — Has access to VS Code APIs, file system, and terminal
2. **Webview** (Browser sandbox) — Renders React UI with no direct VS Code API access
3. **Shared Layer** — TypeScript types and message protocol used by both contexts

This follows the standard VS Code webview extension pattern with strict context isolation enforced by:

- Separate TypeScript configurations (`tsconfig.extension.json` / `tsconfig.webview.json`)
- ESLint boundary rules preventing cross-context imports
- Message-passing communication (no shared runtime objects)

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VS Code Host                              │
│                                                                  │
│  ┌──────────────────────────────────┐  postMessage  ┌──────────┐│
│  │      Extension Host (Node.js)    │◄────────────►│  Webview  ││
│  │                                  │   ToWebview   │ (Browser) ││
│  │  ┌────────────┐ ┌─────────────┐  │  ToExtension  │           ││
│  │  │ BmadDetector│ │ FileWatcher │  │               │  React 19 ││
│  │  └────────────┘ └──────┬──────┘  │               │  Zustand  ││
│  │                        │         │               │  Tailwind ││
│  │  ┌─────────────────────▼──────┐  │               │           ││
│  │  │      StateManager          │  │               └──────────┘│
│  │  │  ┌─────────┐ ┌──────────┐  │  │                           │
│  │  │  │ Parsers  │ │ Workflow │  │  │                           │
│  │  │  │ (YAML,MD)│ │Discovery │  │  │                           │
│  │  │  └─────────┘ └──────────┘  │  │                           │
│  │  └────────────────────────────┘  │                           │
│  │                                  │                           │
│  │  ┌────────────────────────────┐  │                           │
│  │  │  DashboardViewProvider     │  │                           │
│  │  │  (WebviewViewProvider)     │──┤                           │
│  │  └────────────────────────────┘  │                           │
│  └──────────────────────────────────┘                           │
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │    File System (Workspace)        │                           │
│  │    _bmad-output/                  │                           │
│  │    ├── implementation-artifacts/  │                           │
│  │    │   ├── sprint-status.yaml     │                           │
│  │    │   └── *.md (stories)         │                           │
│  │    └── planning-artifacts/        │                           │
│  │        ├── prd.md                 │                           │
│  │        ├── architecture.md        │                           │
│  │        └── epics.md               │                           │
│  └──────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Extension Host Services

| Service                    | Responsibility                               | Key Pattern                                        |
| -------------------------- | -------------------------------------------- | -------------------------------------------------- |
| `BmadDetector`             | Detects `_bmad/` directory in workspace      | Single-context model (first workspace folder only) |
| `FileWatcher`              | Monitors `_bmad-output/**/*.{yaml,md}`       | 500ms debounce, batched change events              |
| `StateManager`             | Aggregates parsed data into `DashboardState` | Event emitter pattern, immutable state updates     |
| `WorkflowDiscoveryService` | Recommends workflows based on state          | Pure logic (no I/O after initial scan)             |
| `DashboardViewProvider`    | Bridges extension ↔ webview                  | WebviewViewProvider, message routing               |

### Parsers

| Parser              | Input                   | Output         | Library     |
| ------------------- | ----------------------- | -------------- | ----------- |
| `parseSprintStatus` | `sprint-status.yaml`    | `SprintStatus` | js-yaml     |
| `parseEpics`        | `epics.md` (multi-epic) | `Epic[]`       | gray-matter |
| `parseEpic`         | Single epic section     | `Epic`         | gray-matter |
| `parseStory`        | `N-N-name.md`           | `Story`        | gray-matter |

All parsers return `ParseResult<T>` — a discriminated union of `ParseSuccess<T>` or `ParseFailure` with optional partial data for graceful degradation.

### Webview Components

| Component                  | Data Source                        | Purpose                                      |
| -------------------------- | ---------------------------------- | -------------------------------------------- |
| `Dashboard`                | `useLoading()`                     | Layout orchestrator with loading skeleton    |
| `SprintStatus`             | `useSprint()`                      | Progress bar showing done/total stories      |
| `EpicList`                 | `useSprint()`, `useEpics()`        | Per-epic cards with progress bars            |
| `ActiveStoryCard`          | `useCurrentStory()`                | Current story details with task progress     |
| `NextActionRecommendation` | `useSprint()`, `useCurrentStory()` | State-machine-driven next step               |
| `CTAButtons`               | `useWorkflows()`                   | Context-sensitive workflow execution buttons |
| `PlanningArtifactLinks`    | `useOutputRoot()`                  | Quick links to PRD/Architecture              |
| `RefreshButton`            | `useLoading()`                     | Manual refresh trigger                       |

## Data Flow

### Initialization Sequence

```
1. VS Code activates extension (workspaceContains:**/_bmad/**)
2. BmadDetector.detectBmadProject() → finds _bmad/ and _bmad-output/
3. FileWatcher.start() → creates watchers for *.yaml and *.md
4. WorkflowDiscoveryService.discoverInstalledWorkflows() → scans _bmad/bmm/workflows/
5. StateManager.initialize() → parseAll() → parses sprint, epics, stories
6. DashboardViewProvider registered → webview HTML served
7. Webview mounts React app → sends REFRESH message
8. Extension sends STATE_UPDATE with full DashboardState
9. Zustand store updates → components re-render
```

### File Change Flow

```
1. User edits sprint-status.yaml or story file
2. VS Code FileSystemWatcher fires event
3. FileWatcher accumulates changes (500ms debounce)
4. FileWatcher.flushChanges() → fires FileChangeEvent
5. StateManager.handleFileChanges() → re-parses affected files
6. StateManager.determineCurrentStory() → updates currentStory
7. WorkflowDiscovery.discoverWorkflows() → recomputes available workflows
8. StateManager fires onStateChange event
9. DashboardViewProvider sends STATE_UPDATE to webview
10. Zustand store updates → affected components re-render
```

### Workflow Execution Flow

```
1. User clicks CTA button in webview
2. CTAButtons sends EXECUTE_WORKFLOW message with command string
3. DashboardViewProvider.handleMessage() → executeWorkflow()
4. Validates command matches /^\/bmad-[a-z0-9-]+$/ pattern
5. Reads bmad.cliPrefix from settings (default: "claude")
6. Finds or creates "BMAD" terminal
7. Sends "{cliPrefix} {command}" to terminal
```

## Message Protocol

### Extension → Webview (ToWebview)

| Type               | Payload                          | When                             |
| ------------------ | -------------------------------- | -------------------------------- |
| `STATE_UPDATE`     | `DashboardState`                 | After any state change           |
| `DOCUMENT_CONTENT` | `{ path, content, frontmatter }` | When document requested (future) |
| `ERROR`            | `{ message, recoverable }`       | On unrecoverable errors          |

### Webview → Extension (ToExtension)

| Type               | Payload                      | When                     |
| ------------------ | ---------------------------- | ------------------------ |
| `REFRESH`          | —                            | On mount, manual refresh |
| `OPEN_DOCUMENT`    | `{ path, forceTextEditor? }` | Click on document link   |
| `EXECUTE_WORKFLOW` | `{ command }`                | Click CTA button         |
| `COPY_COMMAND`     | `{ command }`                | Click copy button        |

## State Management

### Extension State (StateManager)

```typescript
interface DashboardState {
  sprint: SprintStatus | null; // Parsed sprint-status.yaml
  epics: Epic[]; // Parsed epics.md
  currentStory: Story | null; // First in-progress/ready-for-dev/review story
  errors: ParseError[]; // Collected parse errors
  loading: boolean; // Whether data is being loaded
  outputRoot: string | null; // Configured output directory
  workflows: AvailableWorkflow[]; // Context-sensitive workflow recommendations
}
```

### Webview State (Zustand)

The webview Zustand store mirrors `DashboardState` exactly. It receives full state snapshots via `STATE_UPDATE` messages (no incremental updates).

Selector hooks prevent unnecessary re-renders:

- `useSprint()`, `useEpics()`, `useCurrentStory()`, `useErrors()`, `useLoading()`, `useOutputRoot()`, `useWorkflows()`

## Workflow Discovery State Machine

The `WorkflowDiscoveryService` and `getNextAction()` utility implement a state machine for recommending the next workflow:

| State               | Condition                                 | Recommended Workflow |
| ------------------- | ----------------------------------------- | -------------------- |
| No sprint           | `sprint === null`                         | Sprint Planning      |
| Story in-progress   | `currentStory.status === 'in-progress'`   | Dev Story            |
| Story in review     | `currentStory.status === 'review'`        | Code Review          |
| Story ready-for-dev | `currentStory.status === 'ready-for-dev'` | Dev Story            |
| No stories          | Sprint exists, no story keys              | Create Story         |
| All done            | All stories `done`                        | Retrospective        |
| Epic complete       | All stories in one epic `done`            | Retrospective        |
| Backlog stories     | Unstarted stories exist                   | Create Story         |

## Security

### Webview Content Security Policy

```
default-src 'none';
style-src ${webview.cspSource} 'unsafe-inline';
script-src 'nonce-${nonce}';
img-src ${webview.cspSource} data:;
```

### Command Injection Prevention

Workflow commands are validated against `/^\/bmad-[a-z0-9-]+$/` before being sent to the terminal, preventing arbitrary command execution.

### Remote Development Compatibility

All file system operations use `vscode.workspace.fs` (not Node.js `fs`) to ensure compatibility with VS Code Remote (SSH, WSL, Containers, Codespaces).

## Configuration

| Setting           | Type   | Default        | Purpose                                        |
| ----------------- | ------ | -------------- | ---------------------------------------------- |
| `bmad.outputRoot` | string | `_bmad-output` | Root directory for BMAD output files           |
| `bmad.cliPrefix`  | string | `claude`       | CLI tool prefix for workflow terminal commands |

## Activation

The extension activates when a workspace contains a `_bmad/` directory:

```json
"activationEvents": ["workspaceContains:**/_bmad/**"]
```

## Future Architecture (Planned)

- **Epic 5**: Document Viewer — In-webview markdown rendering for BMAD artifacts
- The `DocumentViewer` component and `DOCUMENT_CONTENT` message type are already scaffolded
