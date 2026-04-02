# BMAD Dashboard

A VS Code extension that acts as a real-time GPS for BMAD V6 projects. It monitors workflow artifacts, tracks sprint progress, and recommends next actions — all without leaving the editor.

## Features

### Sidebar Dashboard

Auto-activates when the workspace contains a `_bmad/` directory. Appears as a custom icon in the Activity Bar.

**Header Toolbar**

- **Help icon** — copies `bmad help` to clipboard
- **Overflow menu (⋮)** — lists all available workflow commands with descriptions, plus a manual Refresh option; dismisses on click-outside or ESC

**Sprint Progress**

- Visual progress bar with done / in-progress / backlog counts
- Project name and completion percentage

**Epic List**

- Collapsible cards per epic showing status, progress bar, and done/total story counts
- Active epic highlighted (blue left border)
- Done epics hidden by default; toggle to reveal them
- Scrollable container (max 280 px)
- **Click** epic title → expand/collapse story list
- **Shift+Click** epic title → open `epics.md` in text editor
- **Click** a story inside the list → open the story markdown file

**Active Story Card**

- Shows current story's epic/story number, title, task progress bar, subtask count, and status badge
- Progress combines tasks + subtasks
- **Click** story title → open story file in preview
- **Shift+Click** story title → open in text editor

**Next Action Recommendation**

State-machine-driven suggestion with mandatory/optional action kinds:

| Condition           | Suggested Action    |
| ------------------- | ------------------- |
| No sprint data      | Run Sprint Planning |
| Story in-progress   | Continue Story X.Y  |
| Story in review     | Run Code Review     |
| Story ready-for-dev | Start Dev Story X.Y |
| No active story     | Create Next Story   |
| Epic complete       | Run Retrospective   |
| All done            | Sprint Complete     |

Each action has a **Play** button (execute in terminal) and a **Copy** button (clipboard).

**Other Actions** — Secondary workflow buttons that change based on project state (e.g., Correct Course, Create Story).

**Planning Artifact Links** — Quick links to PRD and Architecture docs. Click opens markdown preview; Shift+Click opens in text editor.

**About Section** — Displays BMAD version, last-updated date, and installed modules (from `manifest.yaml`).

### Editor Panel

A multi-view editor panel (`BMAD: Open Editor Panel` command) with breadcrumb navigation:

- **Dashboard view** — mirrors the sidebar dashboard
- **Epics Browser** — browse epics and drill into story details
- **Stories Table & Kanban Board** — view all stories in table or kanban layout
- **Document Library** — file tree browser with markdown rendering, syntax highlighting, and table of contents

### Real-Time Updates

- File watcher monitors `_bmad-output/**/*.{yaml,md}` with 500 ms debounce
- Any change to `sprint-status.yaml` or story files triggers a full state recompute and UI refresh

## Configuration

| Setting                     | Default                                                      | Purpose                                                               |
| --------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- |
| `bmad.outputRoot`           | `_bmad-output`                                               | Root directory for BMAD output files                                  |
| `bmad.cliPrefix`            | `claude`                                                     | CLI prefix for terminal commands (e.g., `claude`, `aider`, `copilot`) |
| `bmad.defaultClickBehavior` | `markdown-preview`                                           | Click behavior for doc links: `markdown-preview` or `editor-panel`    |
| `bmad.docLibraryPaths`      | `["planning-artifacts", "implementation-artifacts", "docs"]` | Folders to display in the Document Library                            |

## Prerequisites

- **Node.js** 22+
- **pnpm** 10.26+ (`corepack enable && corepack prepare pnpm@10.26.2`)

## Building

The extension uses a dual build system — esbuild for the extension host, Vite for the React webview.

```bash
pnpm install              # install dependencies
pnpm build                # full build (extension + webview)
pnpm build:extension      # build extension host only
pnpm build:webview        # build webview only
pnpm watch                # parallel watch mode for both
```

To package as a `.vsix`:

```bash
pnpm vscode:package       # produces out/bmad-dashboard-*.vsix
```

## Testing

### Webview tests (Vitest)

Runs in a jsdom environment using `@testing-library/react`.

```bash
pnpm test                 # run all Vitest tests once
pnpm test:watch           # watch mode
pnpm test:coverage        # generate coverage report (v8 provider)
```

### Extension host tests (Mocha)

Runs under `@vscode/test-electron` for tests that need VS Code APIs.

```bash
pnpm test:extension       # run extension integration tests
```

### Linting & type checking

```bash
pnpm lint                 # ESLint
pnpm typecheck            # typecheck both extension and webview
```

## Release Process

Versioning and releases are fully automated via [semantic-release](https://github.com/semantic-release/semantic-release). CI/CD workflows are not yet configured — see below for how to run releases locally.

### How it works

1. **Commit analysis** — `@semantic-release/commit-analyzer` determines the next version from [Conventional Commits](https://www.conventionalcommits.org/):
   - `fix:` → patch bump (1.2.x)
   - `feat:` → minor bump (1.x.0)
   - `BREAKING CHANGE:` / `feat!:` → major bump (x.0.0)
2. **Changelog** — `CHANGELOG.md` is updated automatically
3. **Build & package** — the extension is built and packaged as a `.vsix`
4. **Git commit** — `package.json` and `CHANGELOG.md` are committed with `chore(release): <version> [skip ci]`
5. **GitHub release** — a release is created with the `.vsix` attached as a downloadable asset

### Local dry run

```bash
pnpm release:dry          # preview what the next release would be
```

## Project Structure

```
src/
├── extension/            # VS Code extension host (Node.js)
│   ├── extension.ts      # main entry point
│   ├── commands/         # command handlers
│   ├── parsers/          # YAML, epic, story file parsers
│   ├── providers/        # webview providers (dashboard, editor panel)
│   └── services/         # BMAD detector, file watcher, state manager, workflows
├── webviews/             # React webview (sandboxed)
│   ├── dashboard/        # sidebar dashboard components
│   └── editor-panel/     # multi-view editor (epics, stories, docs)
└── shared/               # shared types and message protocol
```

## License

MIT
