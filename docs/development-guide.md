# Development Guide

## Prerequisites

| Requirement | Version | Purpose |
|---|---|---|
| Node.js | 22+ (LTS) | Runtime for extension host and build tools |
| pnpm | 10.26.2 | Package manager (enforced via `packageManager` field) |
| VS Code | 1.96.0+ | Extension host runtime |

## Quick Start

```bash
# Install dependencies
pnpm install

# Build everything (extension + webview)
pnpm build

# Run in VS Code
# Press F5 or use "Run Extension" launch config
```

## Project Structure

The project has a dual-context architecture:

- **Extension Host** (`src/extension/`) — Node.js process with VS Code API access
- **Webview** (`src/webviews/`) — Browser sandbox with React 19 UI
- **Shared** (`src/shared/`) — Cross-context types and message protocol

These contexts communicate via `postMessage` with typed discriminated unions.

## Build System

### Extension Host (esbuild)

```bash
# One-shot build
pnpm build:extension

# Watch mode
pnpm watch:extension
```

- Bundles `src/extension/extension.ts` → `out/extension/extension.js`
- Output format: CommonJS (Node.js)
- External: `vscode` module (provided by VS Code runtime)
- Source maps enabled

### Webview (Vite)

```bash
# One-shot build
pnpm build:webview

# Watch mode
pnpm watch:webview
```

- Entry: `src/webviews/index.tsx` → `out/webview/index.js` + `out/webview/index.css`
- Plugins: React (with React Compiler), Tailwind CSS v4
- Source maps enabled
- Path aliases: `@` → `src/`, `@webviews` → `src/webviews/`, `@shared` → `src/shared/`

### Combined Build

```bash
# Build both extension + webview
pnpm build

# Watch both simultaneously
pnpm watch
```

## TypeScript Configuration

The project uses a composite TypeScript setup:

| Config | Target | Context | Module |
|---|---|---|---|
| `tsconfig.json` | — | Root references only | — |
| `tsconfig.extension.json` | ES2022 | Node.js (extension host) | Node16 |
| `tsconfig.webview.json` | ES2022 | Browser (webview) | ESNext/Bundler |

Both configs share `src/shared/` and enforce strict mode.

Path alias `@shared/*` → `src/shared/*` is available in both contexts.

## Testing

### Unit Tests (Vitest)

```bash
# Run once
pnpm test

# Watch mode
pnpm test:watch

# With coverage
pnpm test:coverage
```

- Environment: jsdom
- Includes: `src/**/*.test.{ts,tsx}` and `src/extension/parsers/**/*.test.ts`
- Excludes: Extension service/provider tests (require VS Code APIs)
- Setup: `vitest.setup.ts`
- Coverage: V8 provider

### Extension Integration Tests

```bash
# Type-check extension first
pnpm pretest:extension

# Run VS Code integration tests
pnpm test:extension
```

- Uses `@vscode/test-electron` to launch VS Code instance
- Tests extension activation, service integration

### Test Organization

Tests are co-located with source files (`.test.ts` / `.test.tsx` suffix).

## Linting & Formatting

```bash
# Lint
pnpm lint

# Type-check (both contexts)
pnpm typecheck

# Type-check individually
pnpm typecheck:extension
pnpm typecheck:webview
```

### ESLint Configuration

- Flat config format (`eslint.config.mjs`)
- TypeScript type-aware linting (`recommendedTypeChecked`)
- React plugin with React Compiler support
- Prettier integration
- **Boundary enforcement via `no-restricted-imports`:**
  - Webview code cannot import from `**/extension/**`
  - Extension code cannot import from `**/webviews/**`
  - Both can import from `src/shared/` or `@shared/`

## Packaging

```bash
# Package as .vsix
pnpm vscode:package
```

Produces `bmad-extension-{version}.vsix` for distribution.

## Debugging

### Extension Host

1. Open this project in VS Code
2. Press **F5** (or select "Run Extension" from launch configs)
3. A new VS Code window opens with the extension loaded
4. The BMAD Dashboard appears in the sidebar activity bar
5. Debug console shows `[BMAD] Detection result: ...`

### Watch Mode (Hot Reload)

1. Use "Run Extension (Watch)" launch config
2. Both extension and webview rebuild on file changes
3. Use **Ctrl+Shift+P** → "Developer: Reload Webviews" to see webview changes

## Key Development Patterns

### Adding a New Component

1. Create `src/webviews/dashboard/components/my-component.tsx`
2. Create `src/webviews/dashboard/components/my-component.test.tsx`
3. Export from `src/webviews/dashboard/components/index.ts`
4. Import in `src/webviews/dashboard/index.tsx`

### Adding a New Service

1. Create `src/extension/services/my-service.ts`
2. Create `src/extension/services/my-service.test.ts`
3. Export from `src/extension/services/index.ts`
4. Wire up in `src/extension/extension.ts` activate function

### Adding a New Message Type

1. Add constant to `ToWebviewType` or `ToExtensionType` in `src/shared/messages.ts`
2. Define message interface
3. Add to discriminated union (`ToWebview` or `ToExtension`)
4. Create type guard function
5. Create factory function
6. Handle in `DashboardViewProvider.handleMessage()` or `useMessageHandler()`

### Adding a New Shared Type

1. Create `src/shared/types/my-type.ts`
2. Re-export from `src/shared/types/index.ts`
3. Import via `@shared/types` in either context
