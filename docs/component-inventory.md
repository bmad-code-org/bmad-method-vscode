# Component Inventory

## Extension Host Services

### Core Services

| Component                  | File                                           | Purpose                                                                     | Dependencies                                                           |
| -------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `BmadDetector`             | `src/extension/services/bmad-detector.ts`      | Detects `_bmad/` directory in workspace, resolves output root from settings | `vscode.workspace.fs`, `vscode.workspace.getConfiguration`             |
| `FileWatcher`              | `src/extension/services/file-watcher.ts`       | Watches `_bmad-output/**/*.{yaml,md}` with 500ms debounce                   | `BmadDetector`, `vscode.FileSystemWatcher`                             |
| `StateManager`             | `src/extension/services/state-manager.ts`      | Aggregates parsed data into `DashboardState`, emits change events           | `BmadDetector`, `FileWatcher`, `WorkflowDiscoveryService`, all parsers |
| `WorkflowDiscoveryService` | `src/extension/services/workflow-discovery.ts` | Discovers installed workflows and recommends based on state                 | `BmadDetector`, `vscode.workspace.fs`                                  |

### Providers

| Component               | File                                                 | Purpose                                                                        | Dependencies                         |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------ |
| `DashboardViewProvider` | `src/extension/providers/dashboard-view-provider.ts` | VS Code `WebviewViewProvider` — serves HTML, routes messages, manages terminal | `StateManager`, `vscode.WebviewView` |

### Parsers

| Component           | File                                     | Input Format              | Output Type                 | Library     |
| ------------------- | ---------------------------------------- | ------------------------- | --------------------------- | ----------- |
| `parseSprintStatus` | `src/extension/parsers/sprint-status.ts` | YAML                      | `ParseResult<SprintStatus>` | js-yaml     |
| `parseEpics`        | `src/extension/parsers/epic-parser.ts`   | Markdown (multi-section)  | `ParseResult<Epic[]>`       | gray-matter |
| `parseEpic`         | `src/extension/parsers/epic-parser.ts`   | Markdown (single section) | `ParseResult<Epic>`         | gray-matter |
| `parseStory`        | `src/extension/parsers/story-parser.ts`  | Markdown with tasks       | `ParseResult<Story>`        | gray-matter |

## Shared Layer

### Types

| Type                                                                | File                                  | Purpose                           |
| ------------------------------------------------------------------- | ------------------------------------- | --------------------------------- |
| `SprintStatus`                                                      | `src/shared/types/sprint-status.ts`   | Sprint tracking data from YAML    |
| `EpicStatusValue` / `StoryStatusValue` / `RetrospectiveStatusValue` | `src/shared/types/sprint-status.ts`   | Status value unions               |
| `isEpicKey` / `isStoryKey` / `isRetrospectiveKey`                   | `src/shared/types/sprint-status.ts`   | Key pattern type guards           |
| `isEpicStatus` / `isStoryStatus` / `isRetrospectiveStatus`          | `src/shared/types/sprint-status.ts`   | Status value type guards          |
| `Epic` / `EpicMetadata` / `EpicStoryEntry`                          | `src/shared/types/epic.ts`            | Epic domain model                 |
| `Story` / `StoryTask` / `StorySubtask` / `AcceptanceCriterion`      | `src/shared/types/story.ts`           | Story domain model                |
| `ParseResult<T>` / `ParseSuccess<T>` / `ParseFailure`               | `src/shared/types/parse-result.ts`    | Result type for parsers           |
| `DashboardState`                                                    | `src/shared/types/dashboard-state.ts` | Aggregated dashboard state        |
| `AvailableWorkflow`                                                 | `src/shared/types/workflow.ts`        | Workflow metadata for CTA buttons |

### Message Protocol

| Component                                                                                  | File                     | Purpose                           |
| ------------------------------------------------------------------------------------------ | ------------------------ | --------------------------------- |
| `ToWebviewType` / `ToExtensionType`                                                        | `src/shared/messages.ts` | Message type constants            |
| `StateUpdateMessage` / `DocumentContentMessage` / `ErrorMessage`                           | `src/shared/messages.ts` | Extension → Webview message types |
| `OpenDocumentMessage` / `ExecuteWorkflowMessage` / `CopyCommandMessage` / `RefreshMessage` | `src/shared/messages.ts` | Webview → Extension message types |
| Type guards (`is*Message`)                                                                 | `src/shared/messages.ts` | Runtime type narrowing            |
| Factory functions (`create*Message`)                                                       | `src/shared/messages.ts` | Type-safe message construction    |

## Webview UI Components

### Dashboard Components

| Component                  | File                                                               | Data Hook                                      | Skeleton                           | Purpose                                   |
| -------------------------- | ------------------------------------------------------------------ | ---------------------------------------------- | ---------------------------------- | ----------------------------------------- |
| `Dashboard`                | `src/webviews/dashboard/index.tsx`                                 | `useLoading()`                                 | Composite                          | Main layout orchestrator                  |
| `SprintStatus`             | `src/webviews/dashboard/components/sprint-status.tsx`              | `useSprint()`                                  | `SprintStatusSkeleton`             | Sprint progress bar + story counts        |
| `EpicList`                 | `src/webviews/dashboard/components/epic-list.tsx`                  | `useSprint()`, `useEpics()`, `useOutputRoot()` | `EpicListSkeleton`                 | Per-epic cards with progress bars         |
| `ActiveStoryCard`          | `src/webviews/dashboard/components/active-story-card.tsx`          | `useCurrentStory()`                            | `ActiveStoryCardSkeleton`          | Current story with task/subtask progress  |
| `NextActionRecommendation` | `src/webviews/dashboard/components/next-action-recommendation.tsx` | `useSprint()`, `useCurrentStory()`             | `NextActionRecommendationSkeleton` | State-machine-driven next step            |
| `CTAButtons`               | `src/webviews/dashboard/components/cta-buttons.tsx`                | `useWorkflows()`                               | `CTAButtonsSkeleton`               | Context-sensitive workflow action buttons |
| `PlanningArtifactLinks`    | `src/webviews/dashboard/components/planning-artifact-links.tsx`    | `useOutputRoot()`                              | —                                  | Quick links to PRD/Architecture docs      |
| `RefreshButton`            | `src/webviews/dashboard/components/refresh-button.tsx`             | `useLoading()`                                 | —                                  | Manual dashboard refresh                  |

### Shared Webview Components

| Component        | File                                     | Purpose                                                |
| ---------------- | ---------------------------------------- | ------------------------------------------------------ |
| `DocumentViewer` | `src/webviews/document-viewer/index.tsx` | Placeholder for Epic 5 (in-webview markdown rendering) |

### Hooks

| Hook                | File                                                  | Purpose                                         |
| ------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| `useVSCodeApi`      | `src/webviews/shared/hooks/use-vscode-api.ts`         | Singleton wrapper for `acquireVsCodeApi()`      |
| `useMessageHandler` | `src/webviews/dashboard/hooks/use-message-handler.ts` | Window message listener → Zustand store updates |

### Store

| Export                                                                                                       | File                              | Purpose                                                            |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------- | ------------------------------------------------------------------ |
| `useDashboardStore`                                                                                          | `src/webviews/dashboard/store.ts` | Zustand store with `updateState`, `setLoading`, `setError` actions |
| `useSprint` / `useEpics` / `useCurrentStory` / `useErrors` / `useLoading` / `useOutputRoot` / `useWorkflows` | `src/webviews/dashboard/store.ts` | Selector hooks for individual state slices                         |

### Utilities

| Utility                    | File                                              | Purpose                                      |
| -------------------------- | ------------------------------------------------- | -------------------------------------------- |
| `cn()`                     | `src/webviews/shared/utils/cn.ts`                 | `clsx` + `tailwind-merge` class utility      |
| `getNextAction()`          | `src/webviews/dashboard/utils/get-next-action.ts` | State machine for next action recommendation |
| `calculateStoryProgress()` | `src/shared/types/story.ts`                       | Task + subtask completion percentage         |

## Component Hierarchy

```
App
└── Dashboard
    ├── RefreshButton
    ├── SprintStatus (or SprintStatusSkeleton)
    ├── EpicList (or EpicListSkeleton)
    ├── ActiveStoryCard (or ActiveStoryCardSkeleton)
    ├── NextActionRecommendation (or NextActionRecommendationSkeleton)
    ├── CTAButtons (or CTAButtonsSkeleton)
    └── PlanningArtifactLinks
```

## Design Patterns

- **Skeleton Loading**: Every data-dependent component has a matching `*Skeleton` variant for loading states
- **Selector Hooks**: Zustand selectors prevent unnecessary re-renders (one hook per state slice)
- **VS Code Theme Integration**: All components use `var(--vscode-*)` CSS custom properties for native theme support
- **Accessibility**: Progress bars have `role="progressbar"` with `aria-*` attributes; buttons have descriptive `aria-label` and `title` attributes
- **Co-located Tests**: Every component has a `.test.tsx` file alongside it
