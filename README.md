# BMAD Dashboard — Feature Summary

A VS Code sidebar extension that acts as a real-time GPS for BMAD V6 projects. It monitors workflow artifacts, tracks sprint progress, and recommends next actions — all without leaving the editor.

## Activation

Auto-activates when the workspace contains a `_bmad/` directory. Appears as a custom icon in the Activity Bar.

## Dashboard Sections (top to bottom)

### Header Toolbar

- **Help icon** — copies `bmad help` to clipboard
- **Overflow menu (⋮)** — lists all available workflow commands with descriptions, plus a manual Refresh option; dismisses on click-outside or ESC

### Sprint Progress

- Visual progress bar with done / in-progress / backlog counts
- Project name and completion percentage

### Epic List

- Collapsible cards per epic showing status, progress bar, and done/total story counts
- Active epic highlighted (blue left border)
- Done epics hidden by default; toggle to reveal them
- Scrollable container (max 280 px)
- **Click** epic title → expand/collapse story list
- **Shift+Click** epic title → open `epics.md` in text editor
- **Click** a story inside the list → open the story markdown file

### Active Story Card

- Shows current story's epic/story number, title, task progress bar, subtask count, and status badge
- Progress combines tasks + subtasks
- **Click** story title → open story file in preview
- **Shift+Click** story title → open in text editor

### Next Action Recommendation

State-machine-driven suggestion for what to do next:

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

### Other Actions

Secondary workflow buttons that change based on project state (e.g., Correct Course, Create Story).

### Planning Artifact Links

Quick links to PRD and Architecture docs.

- **Click** → open in markdown preview
- **Shift+Click** → open in text editor

### About Section

Displays BMAD version, last-updated date, and installed modules (from `manifest.yaml`).

## Real-Time Updates

- File watcher monitors `_bmad-output/**/*.{yaml,md}` with 500 ms debounce
- Any change to `sprint-status.yaml` or story files triggers a full state recompute and UI refresh

## Configuration

| Setting           | Default        | Purpose                                                    |
| ----------------- | -------------- | ---------------------------------------------------------- |
| `bmad.outputRoot` | `_bmad-output` | Root directory for BMAD output files                       |
| `bmad.cliPrefix`  | `claude`       | CLI prefix for terminal commands (e.g., `claude`, `aider`) |

# DISLAIMER

This is not an official VS Code Extension for BMAD.
This extension try to follow the BMAD philosophy and workflow as close as possible.
This extension will remain until the official one is out.
