# Sprint Change Proposal — Epic 5 Scope Redefinition

**Date:** 2026-02-13
**Triggered by:** Epic 4 Retrospective — Boss feedback
**Change Scope:** Major (Epic-level scope redefinition)
**Recommended Path:** Direct Adjustment

---

## Section 1: Issue Summary

### Problem Statement

The original Epic 5 (Document Viewing) defined a rich markdown rendering experience — Mermaid diagrams, syntax-highlighted code blocks, formatted tables — in a dedicated editor tab panel. After completing Epics 1-4 and using the dashboard hands-on, Boss identified that the most valuable next step is **not** a document viewer but rather a **UX polish pass** on the existing dashboard plus several new feature enhancements.

### Discovery Context

- **When:** During Epic 4 retrospective (2026-02-13)
- **How:** Direct stakeholder feedback after hands-on use of completed dashboard
- **Evidence:** 10 specific improvement items captured in retro document

### Retro Items Driving the Change

1. UX Detail Pass — Story lists within epics
2. Kanban View — Board view in editor panel
3. Help Icon — "?" suggesting `bmad help`
4. Actionable Next Action — Play and copy icons
5. Actions Section — Show only "other actions"
6. Overflow Menu — "..." replacing standalone Refresh
7. About Section — BMAD version, modules, last updated
8. Epic List UX — Show/hide done epics, max 5 visible with scroll
9. Keyboard Shortcut — Ctrl/Cmd+click for raw .md navigation
10. Doc Tree View — Planning Artifacts document tree

---

## Section 2: Impact Analysis

### Epic Impact

| Epic         | Impact                    | Details                                                                                 |
| ------------ | ------------------------- | --------------------------------------------------------------------------------------- |
| Epic 1-4     | None                      | Completed, no changes needed                                                            |
| Epic 5       | **Complete redefinition** | Old: Document Viewing (6 stories) → New: UX Polish & Dashboard Enhancements (6 stories) |
| Future Epics | None                      | No planned epics beyond Epic 5                                                          |

### Story Impact

**Removed Stories (6):**

- 5.1: Document Viewer Tab Panel Registration
- 5.2: Dashboard to Document Navigation
- 5.3: Basic Markdown Rendering
- 5.4: Mermaid Diagram Rendering
- 5.5: Syntax-Highlighted Code Blocks
- 5.6: Progressive Loading for Large Documents

**New Stories (6):**

- 5.1: Epic Detail View with Story Lists (retro #1)
- 5.2: Next Action Enhancements (retro #4, #5)
- 5.3: Overflow Menu & Help Icon (retro #3, #6)
- 5.4: About Section & Epic List UX (retro #7, #8)
- 5.5: Keyboard Navigation & Doc Tree View (retro #9, #10)
- 5.6: Kanban Board View (retro #2)

### Artifact Conflicts

| Artifact               | Impact | Action Needed                                                        |
| ---------------------- | ------ | -------------------------------------------------------------------- |
| **epics.md**           | High   | Full Epic 5 rewrite — summary, FR map, and all stories               |
| **PRD**                | Medium | FR16-19 deferred to Phase 2; MVP scope note for Document Viewing     |
| **Architecture**       | Low    | No fundamental changes; Kanban view reuses dual-webview pattern      |
| **sprint-status.yaml** | Low    | Already partially updated; story entries needed after story creation |

### Technical Impact

- **No code changes required** — Epic 5 is in backlog (no implementation started)
- **No rollbacks needed** — Zero code to revert
- **Architecture preserved** — All new features build on Epics 1-4 patterns
- **Kanban view** reuses the editor panel webview architecture originally designed for Document Viewer
- **Libraries deferred** — react-markdown, remark-gfm, mermaid, rehype-highlight no longer needed for MVP

---

## Section 3: Recommended Approach

### Selected Path: Direct Adjustment

**Rationale:**

- Epic 5 is in backlog status — no work started, no code to revert
- All 10 new features build on proven patterns from Epics 1-4
- No architectural changes required
- Zero timeline impact — scope swap, not scope addition
- Team is already aligned (captured in retro with full team present)

**Effort Estimate:** Low (artifact updates only — no code changes)
**Risk Level:** Low (no technical unknowns, builds on established patterns)
**Timeline Impact:** None (epic hasn't started)

### Alternatives Considered

| Option     | Assessment                                                       |
| ---------- | ---------------------------------------------------------------- |
| Rollback   | Not viable — nothing to roll back                                |
| MVP Review | Not needed — core MVP (Epics 1-4) is delivered; this enhances it |

---

## Section 4: Detailed Change Proposals

### 4.1 epics.md — Epic List Summary

**OLD:**

```
### Epic 5: Document Viewing

Developer can view any BMAD planning artifact with rich rendering - Mermaid diagrams, formatted tables, and syntax-highlighted code blocks - in a dedicated tab panel.
**FRs covered:** FR16, FR17, FR18, FR19, FR20
**NFRs addressed:** NFR4 (rendering performance), NFR11 (error feedback)
```

**NEW:**

```
### Epic 5: UX Polish & Dashboard Enhancements

Developer benefits from a refined dashboard experience with epic drill-down views, actionable next actions, an overflow menu, an about section, improved epic list UX, document tree navigation, and a kanban board view.
**FRs covered:** FR2 (enhanced), FR5 (enhanced), FR20 (partial), plus new UX capabilities
**NFRs addressed:** NFR1 (render performance), NFR11 (error feedback)
```

### 4.2 epics.md — FR Coverage Map

**OLD:**

```
| FR16 | Epic 5 | View planning artifacts              |
| FR17 | Epic 5 | Render markdown formatting           |
| FR18 | Epic 5 | Render Mermaid diagrams              |
| FR19 | Epic 5 | Syntax-highlighted code blocks       |
| FR20 | Epic 5 | Navigate dashboard to document       |
```

**NEW:**

```
| FR16 | Deferred | View planning artifacts (moved to Phase 2)  |
| FR17 | Deferred | Render markdown formatting (moved to Phase 2)|
| FR18 | Deferred | Render Mermaid diagrams (moved to Phase 2)   |
| FR19 | Deferred | Syntax-highlighted code blocks (Phase 2)     |
| FR20 | Epic 5   | Navigate dashboard to document (partial: doc tree view) |
```

### 4.3 epics.md — Full Epic 5 Stories Section

**OLD:** Stories 5.1-5.6 (Document Viewer Tab Panel, Dashboard to Document Navigation, Basic Markdown Rendering, Mermaid Diagram Rendering, Syntax-Highlighted Code Blocks, Progressive Loading)

**NEW:** Complete replacement with 6 new stories:

- **Story 5.1: Epic Detail View with Story Lists** — Drill-down into epics to see individual stories with status
- **Story 5.2: Next Action Enhancements** — Play/copy icons on next action; Actions becomes "Other Actions"
- **Story 5.3: Overflow Menu & Help Icon** — "?" icon for bmad help; "..." menu replacing Refresh with expanded options
- **Story 5.4: About Section & Epic List UX** — BMAD metadata display; show/hide done epics; max 5 visible with scroll
- **Story 5.5: Keyboard Navigation & Doc Tree View** — Ctrl/Cmd+click for raw files; planning artifacts tree view
- **Story 5.6: Kanban Board View** — Editor panel webview with story cards in status columns

_(Full acceptance criteria for each story documented in the approved edit proposals and will be written to epics.md upon approval)_

---

## Section 5: Implementation Handoff

### Change Scope Classification: Minor

This is a **planning artifact update** — no code changes, no backlog reorganization, no architectural decisions needed. The development team can proceed directly once epics.md is updated.

### Handoff Plan

| Role                 | Responsibility                                            |
| -------------------- | --------------------------------------------------------- |
| **Alice (PO)**       | Update epics.md with new Epic 5 scope and stories         |
| **Bob (SM)**         | Begin story creation workflow for Epic 5 stories          |
| **Charlie (Dev)**    | Update architecture doc (parallel, per retro action item) |
| **Development Team** | Implement Epic 5 stories once story files are created     |

### Deliverables

1. Updated `epics.md` with new Epic 5 definition and 6 stories
2. Updated FR Coverage Map (FR16-19 deferred, FR20 partial)
3. Sprint Change Proposal document (this document)

### Success Criteria

- epics.md reflects the 10 retro items organized into 6 well-scoped stories
- FR Coverage Map accurately shows deferred vs. active FRs
- Story creation can begin immediately after epics.md update
- No story in Epic 5 is "verification-only" (applying Epic 4 retro lesson)

---

_Sprint Change Proposal generated 2026-02-13 via Correct Course workflow_
