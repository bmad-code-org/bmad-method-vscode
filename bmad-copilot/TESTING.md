# BMAD Copilot Adapter — Testing Guide

> Minimum viable test flow: from zero to executing a BMAD command in Copilot Chat.

---

## Prerequisites

- **Node.js v20+** with npm
- **VS Code** ≥ 1.93.0
- **GitHub Copilot Chat** extension installed and signed in

---

## Step 0: Build the Extension

```bash
cd bmad-copilot
npm install
npm run compile
```

Verify: no TypeScript errors. The `dist/` directory should contain compiled `.js` files.

---

## Step 1: Launch Extension Development Host

1. Open the `bmad-copilot` folder in VS Code.
2. Press **F5** (or Run → Start Debugging).
3. Select **"Run Extension"** if prompted.
4. A new VS Code window (Extension Development Host) opens.

**Troubleshoot:**
- If F5 shows "select debugger" → ensure `.vscode/launch.json` exists with `type: extensionHost`.
- If compile errors → run `npm run compile` and check Output panel.

---

## Step 2: Open a BMAD Test Project

In the Extension Development Host window:

1. Open a folder where you want to test (or create a new empty folder).
2. Open the integrated terminal.

---

## Step 3: Install BMAD-METHOD

In the test project terminal:

**Option A — claude-code tool (tests prompt mirror):**

```powershell
# Windows PowerShell
npx bmad-method install --modules bmm --tools claude-code --yes
```

```bash
# macOS / Linux
npx bmad-method install --modules bmm --tools claude-code --yes
```

This creates:
- `_bmad/` — BMAD core + module files
- `_bmad/_config/` — CSV manifests
- `_bmad/ide/claude-code/prompts/*.prompt.md` — claude-code prompt files
- `_bmad/ide/claude-code/agents/*.agent.md` — Agent persona files (if any)

> The adapter will automatically mirror these to `.github/prompts/` and `.github/agents/` on activation.

**Option B — github-copilot tool (native):**

```bash
npx bmad-method install --modules bmm --tools github-copilot --yes
```

This creates:
- `_bmad/` — BMAD core + module files
- `_bmad/_config/` — CSV manifests
- `.github/prompts/*.prompt.md` — Copilot workflow prompts
- `.github/agents/*.agent.md` — Agent persona files

**Or from Copilot Chat:**

```
@bmad /install
```

This opens a terminal with the installer.

---

## Step 4: Test `/status`

Open Copilot Chat (Ctrl+Shift+I) and type:

```
@bmad /status
```

**Expected:** A table showing:
- ✅ `_bmad/` directory found
- ✅ GitHub Copilot prompt files found (or mirrored from claude-code)
- ✅ claude-code prompt source (if installed with `--tools claude-code`)
- Installed modules (e.g., `core, bmm`)
- Number of commands discovered
- Number of prompt files mapped

**If `_bmad/` is missing:** You'll see an installation guide with exact commands.

---

## Step 5: Test `/help`

```
@bmad /help
```

**Expected:** A table of available commands grouped by phase, with run instructions.

---

## Step 6: Test `/workflows`

```
@bmad /workflows
```

**Expected:** List of all installed workflows with `/run <command>` instructions.

---

## Step 7: Test `/agents`

```
@bmad /agents
```

**Expected:** List of installed agents grouped by module.

---

## Step 8: Test `/run` (Core Test)

```
@bmad /run bmad-bmm-create-prd
```

**Expected:**
1. Header: `🚀 Executing: bmad-bmm-create-prd → CLI: bmad:bmm:create-prd`
2. The LLM receives the official prompt from `.github/prompts/bmad-bmm-create-prd.prompt.md`
   (or falls back to `_bmad/` manifest-based prompt if prompt files don't exist).
3. The LLM follows BMAD workflow instructions and begins creating a PRD.

**Other commands to test:**
```
@bmad /run bmad-agent-bmm-pm
@bmad /run bmad-help
@bmad bmad-bmm-create-prd
```

---

## Step 9: Test Free-text

```
@bmad What workflows are available for creating stories?
```

**Expected:** BMAD-context-aware response suggesting relevant commands.

---

## Common Failure Points

| Symptom | Cause | Fix |
|---------|-------|-----|
| "BMAD installation not found" | No `_bmad/` in workspace root | Run `npx bmad-method install --modules bmm --tools claude-code --yes` |
| "GitHub Copilot prompt files not found" | Installed without `--tools github-copilot` or `--tools claude-code` | Re-run installer with either tool flag |
| No commands discovered | `_bmad/_config/` missing CSVs | Reinstall BMAD |
| LLM doesn't follow workflow | Prompt file may reference files LLM can't access | Check that `_bmad/` files exist and are readable |
| F5 doesn't work | Missing `.vscode/launch.json` | Ensure the file exists with `type: extensionHost` |
| Mirror didn't run | `.github/prompts/` already had files | Delete `.github/prompts/` and rescan to re-trigger |

---

## Debugging with Output Panel

1. In the Extension Development Host, open **Output** panel (Ctrl+Shift+U).
2. Select **"BMAD Copilot"** from the dropdown.
3. You'll see:
   - Activation logs
   - **Prompt mirror** status (skipped / mirrored N files / failed)
   - Scan results (how many commands, which modules)
   - Request routing (`command=run prompt="bmad-bmm-create-prd"`)
   - Which prompt file was used or if fallback was triggered
   - LLM errors (rate limits, model issues)

Set `"bmad.verbose": true` in Settings for additional detail.

---

## Verifying Prompt File Usage

When you run `/run <command>`, the output channel will show either:

```
[ChatBridge] Using prompt file: C:\project\.github\prompts\bmad-bmm-create-prd.prompt.md
```

The prompt body is passed **as-is** to the Copilot LLM — no file inlining,
no `{project-root}` resolution. The LLM reads workspace files through its
own context.

Or the legacy fallback (when `.github/prompts/` files are missing):

```
[ChatBridge] No prompt file for bmad-bmm-create-prd, falling back to BmadRuntime
```

> **Note:** The BmadRuntime fallback is deprecated. If you see this message,
> re-run `npx bmad-method install --tools claude-code --yes` to generate
> prompt files that the adapter can mirror.

---

## Step 10: Test Prompt Mirror (claude-code → Copilot)

This test verifies the auto-mirror feature works correctly.

### 10a: Clean Slate

```powershell
# Windows PowerShell — remove any existing Copilot prompt files
Remove-Item -Recurse -Force .github\prompts -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .github\agents -ErrorAction SilentlyContinue
```

```bash
# macOS / Linux
rm -rf .github/prompts .github/agents
```

### 10b: Install with claude-code

```bash
npx bmad-method install --modules bmm --tools claude-code --yes
```

### 10c: Trigger Rescan

In Copilot Chat:
```
@bmad /status
```

Or use Command Palette: `BMAD Copilot: Rescan Commands`

### 10d: Verify Mirror

**Expected in Output → "BMAD Copilot":**
```
Prompt mirror: N prompt(s), M agent(s) mirrored from claude-code → .github/
Scan complete: X commands, Y prompt files, modules=[core, bmm]
```

**Expected in `/status`:**
- ✅ `_bmad/` directory found
- ✅ GitHub Copilot prompt files found
- ✅ claude-code prompt source: Available (auto-mirror)
- Prompt files mapped > 0

### 10e: Verify No Overwrite

1. Create a custom file: `.github/prompts/bmad-bmm-create-prd.prompt.md`
2. Run rescan
3. Verify the custom file was **not** overwritten (mirror skips existing files)

### 10f: Test /run After Mirror

```
@bmad /run bmad-bmm-create-prd
```

**Expected:** The LLM receives the mirrored prompt and begins the PRD workflow.

---

## Architecture Summary

```
@bmad /install  → CLI Bridge → opens VS Code terminal → npx bmad-method install
@bmad /status   → Built-in   → reads _bmad/ + .github/ state + mirror status → Markdown table
@bmad /run X    → Prompt Executor → reads .prompt.md/.agent.md → passes AS-IS to LLM
@bmad /help     → Built-in   → command listing + optional LLM help
```

The adapter reads the **exact same prompt files** that native GitHub Copilot
would use (`.github/prompts/*.prompt.md`) and passes them directly to the
LLM without any transformation, inlining, or file pre-reading.

If `.github/prompts/` is missing but `_bmad/ide/claude-code/prompts/` exists,
the adapter **automatically mirrors** the files with minimal transformation
(filename sanitisation + frontmatter `command:` → `name:` conversion).
