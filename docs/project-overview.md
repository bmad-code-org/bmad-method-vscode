# Project Overview

## BMAD Dashboard — VS Code Extension

**BMAD Dashboard** is a VS Code sidebar extension that provides an interactive dashboard for BMAD V6 projects. It monitors BMAD workflow artifacts in real-time and presents sprint progress, epic status, active story details, and context-sensitive workflow recommendations — all directly in the IDE sidebar.

## Purpose

When working on BMAD-managed projects, developers need to frequently check sprint status, find the current story, and determine what to do next. This extension eliminates context-switching by bringing all that information into a single sidebar panel, with one-click workflow execution.

## Key Features

- **Sprint Progress Tracking** — Visual progress bar with done/in-progress/backlog story counts
- **Epic Overview** — Per-epic cards with completion percentages
- **Active Story Card** — Current story details with task and subtask progress
- **Next Action Recommendation** — State-machine-driven suggestion for what to do next
- **Context-Sensitive CTA Buttons** — Workflow actions that change based on project state (sprint planning, create story, dev story, code review, retrospective)
- **Terminal Workflow Execution** — One-click to run BMAD workflows in a VS Code terminal
- **Command Copy** — Copy workflow commands to clipboard for use in other tools
- **Planning Artifact Links** — Quick access to PRD and Architecture documents
- **File Watching** — Real-time updates when BMAD artifacts change on disk
- **Remote Development Support** — Compatible with VS Code Remote (SSH, WSL, Containers)

## Tech Stack Summary

| Category          | Technology                                       |
| ----------------- | ------------------------------------------------ |
| Platform          | VS Code Extension API (^1.96.0)                  |
| Language          | TypeScript 5.9 (strict mode)                     |
| UI Framework      | React 19 + React Compiler                        |
| State Management  | Zustand 5                                        |
| Styling           | Tailwind CSS 4                                   |
| Extension Bundler | esbuild                                          |
| Webview Bundler   | Vite 7                                           |
| Testing           | Vitest + Testing Library + @vscode/test-electron |
| Package Manager   | pnpm 10                                          |
| License           | MIT                                              |

## Architecture Type

**Dual-Context VS Code Extension** — Monolith repository with three internal layers:

1. Extension Host (Node.js) — File watching, parsing, state management
2. Webview (Browser) — React dashboard UI
3. Shared — Cross-context types and typed message protocol

## Repository Structure

```
bmad-extension/         (Monolith)
├── src/extension/      Extension host (Node.js, VS Code API)
├── src/shared/         Cross-context types and messages
├── src/webviews/       Webview (Browser, React 19)
├── out/                Build output (extension CJS + webview ESM)
└── resources/          Static assets (icons)
```

## Status

- **Epics 1-4**: Complete (project setup, parsing, dashboard UI, workflow integration)
- **Epic 5**: Planned (in-webview document viewer)
- **Distribution**: Will be published as open-source under MIT license
