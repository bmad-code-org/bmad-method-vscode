# BMAD Dashboard — Project Documentation Index

> Generated: 2026-02-13 | Scan Level: Deep | Mode: Initial Scan

## Project Overview

- **Name:** bmad-extension (BMAD Dashboard)
- **Type:** Monolith — VS Code Extension
- **Primary Language:** TypeScript 5.9 (strict mode)
- **Architecture:** Dual-context extension (Extension Host + React Webview)
- **License:** MIT (open source)

## Quick Reference

- **Tech Stack:** React 19, Zustand 5, Tailwind CSS 4, Vite 7, esbuild
- **Entry Points:** `src/extension/extension.ts` (extension), `src/webviews/index.tsx` (webview)
- **Architecture Pattern:** VS Code WebviewViewProvider with typed message passing
- **Package Manager:** pnpm 10.26.2
- **VS Code Engine:** ^1.96.0

## Generated Documentation

- [Project Overview](./project-overview.md) — Purpose, features, tech stack summary
- [Architecture](./architecture.md) — System design, data flow, message protocol, state management
- [Source Tree Analysis](./source-tree-analysis.md) — Annotated directory structure with critical folder explanations
- [Component Inventory](./component-inventory.md) — All services, parsers, components, hooks, and utilities
- [Development Guide](./development-guide.md) — Setup, build, test, debug, and common development patterns

## Existing Documentation (BMAD Artifacts)

- [PRD](./../_bmad-output/planning-artifacts/prd.md) — Product Requirements Document
- [Architecture (Planning)](./../_bmad-output/planning-artifacts/architecture.md) — Original architecture design document
- [Epics](./../_bmad-output/planning-artifacts/epics.md) — Epic definitions with story breakdowns

## Getting Started

```bash
# 1. Install dependencies
pnpm install

# 2. Build extension + webview
pnpm build

# 3. Launch in VS Code
#    Press F5 or use "Run Extension" launch config

# 4. Open a workspace with a _bmad/ directory
#    The BMAD Dashboard appears in the sidebar activity bar
```

For detailed development instructions, see the [Development Guide](./development-guide.md).
