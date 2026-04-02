# Changelog

## [0.2.4] — 2026-02-11

### Fixed

- **Critical: Agent file detection** — BMAD v6 generates `bmad-agent-*.md` files (not `*.agent.md`). Updated file pattern matching across all modules:
  - `commandRegistry.ts` — agent scan now matches `bmad-agent-*.md` in `.github/agents/`
  - `extension.ts` — integrity check now accepts `.github/agents/` (not just `.github/prompts/`)
  - `chatBridge.ts` — error message now references both `.github/prompts/` and `.github/agents/`
  - `cli/bootstrap.ts` — detects `bmad-agent-*.md` pattern
  - `cli/update.ts` — counts agent files correctly
  - `cli/status.ts` — lists agent files correctly

### Changed

- `README.md` — Updated for BMAD v6 structure (`.github/agents/` is primary, `.github/prompts/` is secondary)
- `ARCHITECTURE.md` — Updated version to 0.2.4, corrected agent file references
- Publisher changed to `evil9369` (extension ID: `evil9369.bmad-copilot-adapter`)
- DEP0190 deprecation warning fixed in CLI (Windows `child_process` shell commands)

## [0.2.0] — 2026-02-11

### Added

- **CLI Bootstrap Layer** (`bin/bmad-copilot-adapter.js`)
  - `npx bmad-copilot-adapter bootstrap` — Full setup: check Node ≥18, verify prompts, verify VS Code extension is installed, validate registration
  - `npx bmad-copilot-adapter update` — Rescan `.github/prompts`, count manifests, write sentinel, trigger extension refresh
  - `npx bmad-copilot-adapter status` — Show full BMAD installation diagnostics

- **`/update` Copilot Chat command**
  - Invalidates cached command registry
  - Triggers full rescan of prompt files
  - Available via `@bmad /update` in Copilot Chat

- **`bmad-copilot.update` VS Code command**
  - Available from Command Palette: "BMAD Copilot: Update (Invalidate + Rescan)"
  - Equivalent to CLI `npx bmad-copilot-adapter update`

- **`CommandRegistry.invalidate()` and `CommandRegistry.rescan()`**
  - `invalidate()` clears cached state immediately
  - `rescan()` combines invalidate + scan in one call

- **Prompt integrity auto-check on activation**
  - Detects `_bmad/` present but `.github/prompts/` missing
  - Shows actionable notification with "Run Update" button

- **UTF-8 BOM stripping** in CSV parsing
  - `loadCsv()` now strips BOM before parsing (fixes Windows-generated CSV headers)

### Changed

- **Pure adapter architecture** — all mirror/transform/conversion logic removed
  - `chatBridge.ts` no longer imports `BmadRuntime` or `hasClaudeCodeSource`
  - `executeCommand()` shows clear error with install guidance when prompt file is missing (no fallback)
  - `handleStatus()` no longer reports claude-code mirror status
  - `MISSING_COPILOT_FILES_MESSAGE` updated to point to official BMAD installer only
- `promptMirror.ts` — marked as `@deprecated` (no active imports)
- `bmadRuntime.ts` — marked as `@deprecated` (no active imports)
- Version bumped to 0.2.0 (minor)
- `package.json` now declares `bin` field for CLI entry
- `files` array includes `bin/bmad-copilot-adapter.js`
- Chat participant commands now include `/update`
- Installation guard allows `/update` to run even when state is null
- ARCHITECTURE.md and README.md fully rewritten for pure adapter model
- Removed GitHub Actions CI/CD workflow (`release.yml`)
- Removed all global install (`-g`) references from documentation
- README now recommends project-level installation only
- Added troubleshooting section for 0-command scenario
- Release process is now manual (`npm publish`) only

## [0.1.2] — Initial release

- Core Chat Participant (`@bmad`)
- Prompt File Executor
- Command Registry with CSV manifest parsing
- CLI Bridge for terminal operations
