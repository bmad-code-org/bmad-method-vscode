---
stepsCompleted: [step-01-init, step-02-discovery, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish]
inputDocuments:
  - '_bmad-output/brainstorming/brainstorming-session-2026-01-26.md'
workflowType: 'prd'
documentCounts:
  briefs: 0
  research: 0
  brainstorming: 1
  projectDocs: 0
classification:
  projectType: 'Developer Tool / IDE Extension'
  domain: 'General / Developer Tooling'
  complexity: 'Low-Medium'
  projectContext: 'greenfield'
---

# Product Requirements Document - BMAD Dashboard Extension

**Author:** Boss
**Date:** 2026-01-26

## Executive Summary

**Product:** A VS Code extension that provides an interactive dashboard for BMAD V6 projects.

**Problem:** BMAD developers waste time hunting through output files, remembering workflow commands, and re-orienting after breaks. Project state is trapped in scattered files rather than visible at a glance.

**Solution:** A "GPS for BMAD" - a sidebar dashboard that parses BMAD artifacts and shows:
- Current project state (sprint, epic, story progress)
- Context-sensitive workflow actions (one-click launch)
- Rich markdown viewing (Mermaid, tables, syntax highlighting)

**Differentiator:** Shows the RIGHT information at the RIGHT time with the RIGHT actions available. Eliminates the "warm-up tax" of re-orienting to a BMAD project.

**Target Users:** Solo developers using BMAD V6 for structured development workflows.

## Success Criteria

### User Success

- Users resume work without re-orientation - open VS Code and immediately see project state
- Users discover and launch workflows without memorizing commands
- Users access planning artifacts with rich visualization

### Technical Success

- BMAD file parsing handles schema variations gracefully (show "unknown state" vs crash)
- Dashboard renders within 1 second with no perceptible lag
- Single-context model (one dashboard per VS Code window)

### Measurable Outcomes

- User determines project state within 5 seconds of opening dashboard
- User launches any workflow with 1-2 clicks
- Parser handles malformed/incomplete BMAD files without crashing

## Product Scope

### MVP (Phase 1)

**Primary User Journey:** Alex (Mid-Sprint Developer) - resume work, see state, launch next workflow

**Must-Have Capabilities:**
1. **BMAD File Parsing** - Defensive parsing of sprint-status.yaml, epics, stories
2. **Workflow State Display** - Visual, scannable view of current project state
3. **CTA Buttons** - Context-sensitive action buttons for available workflows
4. **MD Doc Viewer** - Rich markdown rendering (Mermaid, tables, syntax highlighting)

### Phase 2 (Growth)

- Deeper task-level visibility for returning users (Sam journey)
- Project onboarding view for new team members (Jordan journey)
- Progress bars and visual indicators
- Enhanced command discovery

### Phase 3 (Expansion)

- Dual-mode doc access (view formatted OR edit raw)
- Community-requested features
- Future BMAD version support

### Risk Mitigation

| Risk | Mitigation |
|------|------------|
| BMAD schema variations | Graceful degradation, loose parsing |
| Performance impact | Start with FileSystemWatcher, fall back to polling |
| Scope creep | Solo developer → strict MVP scope |

## User Journeys

### Journey 1: Alex - The Mid-Sprint Developer

Alex is a solo developer with 2 hours before their day job. Yesterday they finished implementing a story.

**Opening Scene:** Alex opens VS Code. They vaguely remember where they left off but can't recall which story was next.

**Rising Action:** The BMAD dashboard loads automatically. Alex sees:
- Current epic: "User Authentication" (3/5 stories complete)
- Last completed: Story 2.3 - "Password Reset Flow" ✓
- Next up: Story 2.4 - "Session Management"
- Available action: "Start Story 2.4"

**Climax:** One click. The workflow launches with Story 2.4 pre-loaded.

**Resolution:** Alex is coding within 60 seconds. The "warm-up tax" is gone.

### Journey 2: Sam - Returning After Vacation (Phase 2)

Sam took a week off and remembers very little about Epic 3.

**Opening Scene:** Sam opens the project, anxious about re-orientation time.

**Rising Action:** The dashboard shows:
- Sprint progress: Epic 2 complete, Epic 3 in progress (2/4 stories)
- Current story: Story 3.2 - "API Rate Limiting" (4/7 tasks done)

**Climax:** Sam clicks "View Story 3.2" - caught up in 2 minutes.

**Resolution:** Project state is visible, not trapped in memory.

### Journey 3: Jordan - New to This Project (Phase 2)

Jordan is joining an existing BMAD project.

**Opening Scene:** Jordan clones the repo and needs to understand the project.

**Rising Action:** The dashboard shows epic overview with completion status and links to PRD, Architecture, and Current Sprint.

**Climax:** Jordan clicks through planning artifacts rendered with Mermaid diagrams and proper tables.

**Resolution:** Jordan understands context and picks up their first story within 15 minutes.

### Journey-to-Capability Mapping

| Capability | Journeys |
|------------|----------|
| State visibility (epic/story progress) | Alex, Sam, Jordan |
| Quick actions (one-click workflow launch) | Alex |
| Document access (rich markdown rendering) | Sam, Jordan |
| At-a-glance comprehension (visual progress) | All |

## VS Code Extension Requirements

### Technical Architecture

**Extension Activation**
- Activation event: `workspaceContains:**/_bmad/**` or BMAD config presence
- Single activation per workspace window (single-context model)
- No activation in non-BMAD workspaces
- Target: VS Code versions from past 3 months

**Webview Implementation**
- Framework: React
- Hosted in VS Code sidebar panel
- Communication: VS Code Webview API message passing

**BMAD File Parsing**
- Parse `sprint-status.yaml` for workflow state
- Parse epic files (`epic-*.md`) for progress tracking
- Parse story files for task-level detail
- Graceful degradation: Show "unknown state" for unparseable files

**File Watching**
- Primary: VS Code FileSystemWatcher on BMAD artifact directories
- Fallback: Polling if FSW proves too resource-intensive
- Priority: Minimal CPU/memory impact

### Workflow Integration

- CTA buttons execute terminal commands (e.g., `claude /dev-story`)
- Alternative: Copy command to clipboard for Claude Code extension
- No direct Claude API integration

### Design Constraints

- Parser supports future BMAD schema changes without major refactoring
- Webview UI decoupled from parsing logic for independent updates

## Functional Requirements

### Project State Visibility

- FR1: User can view current sprint status at a glance
- FR2: User can view list of all epics with completion status
- FR3: User can view current/active epic with story progress
- FR4: User can view current/active story with task progress
- FR5: User can identify the next recommended action based on project state

### BMAD File Parsing

- FR6: System can parse `sprint-status.yaml` to extract workflow state
- FR7: System can parse epic files (`epic-*.md`) to extract epic metadata and story lists
- FR8: System can parse story files to extract tasks and completion status
- FR9: System can detect when a workspace contains a BMAD project
- FR10: System can handle malformed or incomplete BMAD files without crashing
- FR11: User can view parsing warnings/errors for problematic BMAD files

### Workflow Actions

- FR12: User can launch any available BMAD workflow via terminal command with one click
- FR13: User can copy a workflow command to clipboard
- FR14: System displays context-sensitive workflow options based on current project state
- FR15: System can determine which workflows are available based on project state and BMAD installation

### Document Viewing

- FR16: User can view any BMAD planning artifact (PRD, architecture, epics, stories)
- FR17: User can view markdown content with proper formatting (headers, lists, tables)
- FR18: User can view Mermaid diagrams rendered as visuals
- FR19: User can view syntax-highlighted code blocks
- FR20: User can navigate from dashboard to view a specific document

### Extension Lifecycle

- FR21: Extension activates automatically when BMAD project is detected
- FR22: Extension does not activate in non-BMAD workspaces
- FR23: User can manually refresh dashboard state

## Non-Functional Requirements

### Performance

- NFR1: Dashboard initial render completes within 1 second of activation
- NFR2: Dashboard updates after file changes within 500ms
- NFR3: File watching consumes less than 1% CPU and 50MB memory under normal operation
- NFR4: Markdown rendering completes within 2 seconds for documents under 10KB; larger documents show progressive loading

### Reliability

- NFR5: Extension does not crash when encountering malformed BMAD files
- NFR6: Extension recovers from file system errors by showing error state and enabling manual refresh
- NFR7: Dashboard displays meaningful state even with incomplete BMAD project data

### Integration

- NFR8: Dashboard automatically updates when BMAD files change in the workspace
- NFR9: Extension is compatible with VS Code versions from the past 3 months
- NFR10: Terminal command execution works with user's configured VS Code default shell

### User Feedback

- NFR11: User receives visual feedback when extension encounters errors or is in degraded state
