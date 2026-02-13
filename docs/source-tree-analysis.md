# Source Tree Analysis

## Project Root

```
bmad-extension/
├── .vscode/                    # VS Code workspace configuration
│   ├── launch.json             # Extension host debug configs
│   ├── tasks.json              # Build/watch task definitions
│   ├── settings.json           # Workspace settings
│   ├── extensions.json         # Recommended extensions
│   └── css_custom_data.json    # Custom CSS data for IntelliSense
├── _bmad/                      # BMAD framework installation (not shipped)
├── _bmad-output/               # BMAD workflow artifacts (not shipped)
│   ├── brainstorming/          # Initial brainstorming sessions
│   ├── planning-artifacts/     # PRD, Architecture, Epics
│   └── implementation-artifacts/ # Stories, sprint status, retrospectives
├── docs/                       # Generated project documentation (this folder)
├── out/                        # Build output (gitignored)
│   ├── extension/              # esbuild-bundled extension host (CJS)
│   └── webview/                # Vite-bundled webview assets (ESM)
├── resources/                  # Static extension resources
│   └── bmad-icon.svg           # Activity bar icon
├── src/                        # Source code root
│   ├── extension/              # Extension host context (Node.js)
│   ├── shared/                 # Cross-context shared code
│   └── webviews/               # Webview context (Browser/React)
├── package.json                # Extension manifest + dependencies
├── pnpm-lock.yaml              # Lockfile
├── tsconfig.json               # Root TS config (references only)
├── tsconfig.extension.json     # Extension host TS config
├── tsconfig.webview.json       # Webview TS config
├── vite.config.ts              # Webview bundler config
├── vitest.config.ts            # Test runner config
├── vitest.setup.ts             # Test setup (jsdom)
└── eslint.config.mjs           # Flat ESLint config with boundary rules
```

## Source Directory Detail

```
src/
├── extension/                  # EXTENSION HOST (Node.js, VS Code API)
│   ├── extension.ts            # ★ Entry point — activate() / deactivate()
│   ├── extension.test.ts       # Extension activation tests
│   ├── providers/
│   │   ├── index.ts            # Barrel export
│   │   ├── dashboard-view-provider.ts    # WebviewViewProvider for sidebar panel
│   │   └── dashboard-view-provider.test.ts
│   ├── services/
│   │   ├── index.ts            # Barrel export
│   │   ├── bmad-detector.ts    # Workspace _bmad/ folder detection
│   │   ├── bmad-detector.test.ts
│   │   ├── file-watcher.ts     # FileSystemWatcher with 500ms debounce
│   │   ├── file-watcher.test.ts
│   │   ├── state-manager.ts    # Aggregated dashboard state + event emitter
│   │   ├── state-manager.test.ts
│   │   ├── workflow-discovery.ts # Context-sensitive workflow recommendations
│   │   └── workflow-discovery.test.ts
│   └── parsers/
│       ├── index.ts            # Barrel export with re-exported types
│       ├── sprint-status.ts    # YAML parser for sprint-status.yaml
│       ├── sprint-status.test.ts
│       ├── epic-parser.ts      # Markdown parser for epics.md (multi-epic)
│       ├── epic-parser.test.ts
│       ├── story-parser.ts     # Markdown parser for N-N-name.md stories
│       └── story-parser.test.ts
│
├── shared/                     # SHARED LAYER (no runtime dependencies on either context)
│   ├── messages.ts             # Message protocol: types, guards, factories
│   ├── messages.test.ts
│   └── types/
│       ├── index.ts            # Barrel re-export of all types
│       ├── sprint-status.ts    # SprintStatus, type guards (isEpicKey, isStoryKey, etc.)
│       ├── sprint-status.test.ts
│       ├── epic.ts             # Epic, EpicMetadata, EpicStoryEntry
│       ├── story.ts            # Story, StoryTask, AcceptanceCriterion
│       ├── story.test.ts
│       ├── parse-result.ts     # ParseResult<T> discriminated union
│       ├── parse-result.test.ts
│       ├── dashboard-state.ts  # DashboardState aggregate + factory
│       └── workflow.ts         # AvailableWorkflow interface
│
└── webviews/                   # WEBVIEW CONTEXT (Browser, React 19)
    ├── index.tsx               # ★ Webview entry point — React root mount
    ├── index.css               # Tailwind CSS entry
    ├── app.tsx                 # App shell → renders Dashboard
    ├── shared/
    │   ├── hooks/
    │   │   ├── index.ts
    │   │   ├── use-vscode-api.ts       # Singleton acquireVsCodeApi() wrapper
    │   │   └── use-vscode-api.test.ts
    │   ├── utils/
    │   │   ├── cn.ts           # clsx + tailwind-merge utility
    │   │   └── cn.test.ts
    │   └── components/
    │       └── index.ts        # Shared component barrel (empty)
    ├── dashboard/
    │   ├── index.tsx           # Dashboard layout with loading skeleton
    │   ├── index.test.tsx
    │   ├── store.ts            # Zustand store + selector hooks
    │   ├── store.test.ts
    │   ├── hooks/
    │   │   ├── index.ts
    │   │   ├── use-message-handler.ts  # Window message listener → store updates
    │   │   └── use-message-handler.test.ts
    │   ├── utils/
    │   │   ├── get-next-action.ts      # State machine for next action recommendation
    │   │   └── get-next-action.test.ts
    │   └── components/
    │       ├── index.ts                # Component barrel export
    │       ├── sprint-status.tsx       # Sprint progress bar + counts
    │       ├── sprint-status.test.tsx
    │       ├── epic-list.tsx           # Epic cards with per-epic progress
    │       ├── epic-list.test.tsx
    │       ├── active-story-card.tsx   # Current story with task progress
    │       ├── active-story-card.test.tsx
    │       ├── next-action-recommendation.tsx  # AI-driven next step
    │       ├── next-action-recommendation.test.tsx
    │       ├── cta-buttons.tsx         # Context-sensitive workflow buttons
    │       ├── cta-buttons.test.tsx
    │       ├── planning-artifact-links.tsx  # Quick links to PRD/Architecture
    │       ├── planning-artifact-links.test.tsx
    │       ├── refresh-button.tsx       # Manual refresh trigger
    │       ├── refresh-button.test.tsx
    │       └── placeholder.tsx          # Placeholder component
    │           └── placeholder.test.tsx
    └── document-viewer/
        ├── index.tsx           # Placeholder for Epic 5
        └── components/
            └── index.ts        # Component barrel (empty)
```

## Critical Folders Summary

| Folder | Purpose | Key Files |
|---|---|---|
| `src/extension/` | Extension host (Node.js process) | `extension.ts` entry point |
| `src/extension/services/` | Core business logic services | `StateManager`, `FileWatcher`, `BmadDetector`, `WorkflowDiscovery` |
| `src/extension/parsers/` | File format parsers (YAML, Markdown) | Sprint status, epic, story parsers |
| `src/extension/providers/` | VS Code API integration | `DashboardViewProvider` (WebviewViewProvider) |
| `src/shared/` | Cross-context contracts | Message protocol, shared types |
| `src/shared/types/` | TypeScript type definitions | Domain types with type guards |
| `src/webviews/` | Webview React application | `index.tsx` entry point |
| `src/webviews/dashboard/` | Dashboard feature module | Store, hooks, components, utils |
| `src/webviews/dashboard/components/` | UI components | 8 feature components + skeletons |
| `out/` | Build artifacts | Extension CJS + Webview ESM bundles |
