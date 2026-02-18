import * as vscode from 'vscode';
import type { BmadDetector } from './bmad-detector';
import type { DashboardState, AvailableWorkflow } from '../../shared/types';
import type { WorkflowKind } from '../../shared/types/workflow';
import { isStoryKey, isEpicKey, isStoryStatus, isRetrospectiveKey } from '../../shared/types';

/**
 * Known BMAD workflow definitions.
 * Phase 4 (implementation) workflows map to folders under _bmad/bmm/workflows/4-implementation/.
 * Pre-implementation workflows map to specific directories in phases 1-3.
 */
const WORKFLOW_DEFINITIONS: Record<string, Omit<AvailableWorkflow, 'kind'>> = {
  // Phase 1 - Analysis
  brainstorming: {
    id: 'brainstorming',
    name: 'Brainstorm',
    command: '/bmad-brainstorming',
    description: 'Guided brainstorming to explore your project idea',
  },
  'create-product-brief': {
    id: 'create-product-brief',
    name: 'Create Brief',
    command: '/bmad-bmm-create-product-brief',
    description: 'Create a structured product brief to nail down your idea',
  },
  // Phase 2 - Planning
  'create-prd': {
    id: 'create-prd',
    name: 'Create PRD',
    command: '/bmad-bmm-create-prd',
    description: 'Create your Product Requirements Document',
  },
  'validate-prd': {
    id: 'validate-prd',
    name: 'Validate PRD',
    command: '/bmad-bmm-validate-prd',
    description: 'Validate PRD is comprehensive, lean, well-organized and cohesive',
  },
  'edit-prd': {
    id: 'edit-prd',
    name: 'Edit PRD',
    command: '/bmad-bmm-edit-prd',
    description: 'Improve and enhance an existing PRD',
  },
  'create-ux-design': {
    id: 'create-ux-design',
    name: 'Create UX Design',
    command: '/bmad-bmm-create-ux-design',
    description: 'Guided workflow to document your UX design decisions',
  },
  // Phase 3 - Solutioning
  'create-architecture': {
    id: 'create-architecture',
    name: 'Create Architecture',
    command: '/bmad-bmm-create-architecture',
    description: 'Define your technical architecture',
  },
  'create-epics': {
    id: 'create-epics',
    name: 'Create Epics & Stories',
    command: '/bmad-bmm-create-epics-and-stories',
    description: 'Break down your project into epics and stories',
  },
  'check-implementation-readiness': {
    id: 'check-implementation-readiness',
    name: 'Check Implementation Readiness',
    command: '/bmad-bmm-check-implementation-readiness',
    description: 'Ensure PRD, UX, Architecture and Epics/Stories are aligned',
  },
  // Phase 4 - Implementation
  'sprint-planning': {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    command: '/bmad-bmm-sprint-planning',
    description: 'Set up sprint tracking and plan story execution order',
  },
  'create-story': {
    id: 'create-story',
    name: 'Create Story',
    command: '/bmad-bmm-create-story',
    description: 'Create the next user story with comprehensive dev context',
  },
  'dev-story': {
    id: 'dev-story',
    name: 'Dev Story',
    command: '/bmad-bmm-dev-story',
    description: 'Start or continue story implementation',
  },
  'code-review': {
    id: 'code-review',
    name: 'Code Review',
    command: '/bmad-bmm-code-review',
    description: 'Run code review on completed story',
  },
  'qa-automate': {
    id: 'qa-automate',
    name: 'QA Automation',
    command: '/bmad-bmm-qa-automate',
    description: 'Generate automated API and E2E tests for implemented code',
  },
  retrospective: {
    id: 'retrospective',
    name: 'Retrospective',
    command: '/bmad-bmm-retrospective',
    description: 'Review what went well and what to improve',
  },
  'correct-course': {
    id: 'correct-course',
    name: 'Correct Course',
    command: '/bmad-bmm-correct-course',
    description: 'Adjust sprint plan based on learnings',
  },
};

/**
 * Workflow directory mappings outside of 4-implementation/.
 * Maps workflow definition IDs to their actual directory paths relative to _bmad/.
 * Phase 4 workflows use folder names matching their IDs under 4-implementation/.
 *
 * Note: The `sprint-status` workflow folder exists on disk but is excluded
 * because it is a status display utility, not an actionable workflow for CTA buttons.
 * Multiple IDs may share a directory (e.g., create-prd, validate-prd, edit-prd).
 */
const EXTRA_WORKFLOW_DIRS: Array<{ path: string[]; id: string }> = [
  // Phase 1
  { path: ['core', 'workflows', 'brainstorming'], id: 'brainstorming' },
  { path: ['bmm', 'workflows', '1-analysis', 'create-product-brief'], id: 'create-product-brief' },
  // Phase 2 (validate-prd and edit-prd share directory with create-prd)
  { path: ['bmm', 'workflows', '2-plan-workflows', 'create-prd'], id: 'create-prd' },
  { path: ['bmm', 'workflows', '2-plan-workflows', 'create-prd'], id: 'validate-prd' },
  { path: ['bmm', 'workflows', '2-plan-workflows', 'create-prd'], id: 'edit-prd' },
  { path: ['bmm', 'workflows', '2-plan-workflows', 'create-ux-design'], id: 'create-ux-design' },
  // Phase 3
  { path: ['bmm', 'workflows', '3-solutioning', 'create-architecture'], id: 'create-architecture' },
  {
    path: ['bmm', 'workflows', '3-solutioning', 'create-epics-and-stories'],
    id: 'create-epics',
  },
  {
    path: ['bmm', 'workflows', '3-solutioning', 'check-implementation-readiness'],
    id: 'check-implementation-readiness',
  },
  // QA workflow lives outside 4-implementation/
  { path: ['bmm', 'workflows', 'qa', 'automate'], id: 'qa-automate' },
];

/**
 * Service for discovering available BMAD workflows based on project state.
 *
 * Scans the BMAD installation for available workflows and computes which
 * workflows are relevant based on the current dashboard state.
 *
 * Uses vscode.workspace.fs API (NOT Node.js fs) for remote development compatibility.
 */
export class WorkflowDiscoveryService implements vscode.Disposable {
  private readonly disposables: vscode.Disposable[] = [];
  private installedWorkflows: Set<string> | null = null;

  constructor(private readonly bmadDetector: BmadDetector) {}

  /**
   * Discover installed workflows by scanning workflow directories.
   * Scans Phase 4 (4-implementation/) generically, plus extra workflow directories.
   * Caches result after first scan. Call invalidateCache() to force re-scan.
   */
  async discoverInstalledWorkflows(): Promise<Set<string>> {
    if (this.installedWorkflows !== null) {
      return this.installedWorkflows;
    }

    const paths = this.bmadDetector.getBmadPaths();
    if (!paths) {
      this.installedWorkflows = new Set();
      return this.installedWorkflows;
    }

    try {
      // Scan Phase 4 implementation workflows (folder names match definition IDs)
      const implDir = vscode.Uri.joinPath(paths.bmadRoot, 'bmm', 'workflows', '4-implementation');
      const implEntries = await this.readDirectory(implDir);
      const implWorkflows = implEntries
        .filter(([, type]) => type === vscode.FileType.Directory)
        .map(([name]) => name)
        .filter((name) => name in WORKFLOW_DEFINITIONS);

      // Check extra workflow directories
      const extraResults = await Promise.all(
        EXTRA_WORKFLOW_DIRS.map(async ({ path, id }) => {
          const dir = vscode.Uri.joinPath(paths.bmadRoot, ...path);
          const entries = await this.readDirectory(dir);
          return entries.length > 0 ? id : null;
        })
      );

      this.installedWorkflows = new Set([
        ...implWorkflows,
        ...extraResults.filter((id): id is string => id !== null),
      ]);
    } catch {
      this.installedWorkflows = new Set();
    }

    return this.installedWorkflows;
  }

  /**
   * Compute available workflows based on current dashboard state.
   * Pure logic - does not perform I/O (installed workflows must be pre-scanned).
   */
  discoverWorkflows(state: DashboardState): AvailableWorkflow[] {
    const installed = this.installedWorkflows ?? new Set<string>();
    const candidates = this.computeWorkflowCandidates(state);

    // Filter to only installed workflows
    return candidates.filter((w) => installed.has(w.id));
  }

  /**
   * Invalidate the cached installed workflows, forcing a re-scan on next discovery.
   */
  invalidateCache(): void {
    this.installedWorkflows = null;
  }

  /**
   * Compute which workflows SHOULD be available based on state,
   * without checking installation. Returns primary, mandatory, and optional workflows
   * based on the current BMAD lifecycle phase.
   */
  private computeWorkflowCandidates(state: DashboardState): AvailableWorkflow[] {
    const { sprint, currentStory, planningArtifacts } = state;

    // 1. No sprint data → check planning artifacts to determine phase
    if (!sprint) {
      if (!planningArtifacts.hasPrd) {
        const candidates = [
          this.makeWorkflow('create-prd', 'primary'),
          this.makeWorkflow('brainstorming', 'optional'),
        ];
        if (!planningArtifacts.hasProductBrief) {
          candidates.push(this.makeWorkflow('create-product-brief', 'optional'));
        }
        return candidates;
      }
      if (!planningArtifacts.hasArchitecture) {
        return [
          this.makeWorkflow('create-architecture', 'primary'),
          this.makeWorkflow('validate-prd', 'optional'),
          this.makeWorkflow('edit-prd', 'optional'),
          this.makeWorkflow('create-ux-design', 'optional'),
        ];
      }
      if (!planningArtifacts.hasEpics) {
        return [
          this.makeWorkflow('create-epics', 'primary'),
          this.makeWorkflow('create-ux-design', 'optional'),
        ];
      }
      // All planning artifacts exist
      if (!planningArtifacts.hasReadinessReport) {
        return [this.makeWorkflow('check-implementation-readiness', 'primary')];
      }
      return [this.makeWorkflow('sprint-planning', 'primary')];
    }

    // 2. Active story in-progress → continue development
    if (currentStory?.status === 'in-progress') {
      return [
        this.makeWorkflow('dev-story', 'primary'),
        this.makeWorkflow('correct-course', 'optional'),
      ];
    }

    // 3. Story in review → code review
    if (currentStory?.status === 'review') {
      return [
        this.makeWorkflow('code-review', 'primary'),
        this.makeWorkflow('create-story', 'optional'),
        this.makeWorkflow('qa-automate', 'optional'),
      ];
    }

    // 4. Story ready-for-dev → start development
    if (currentStory?.status === 'ready-for-dev') {
      return [this.makeWorkflow('dev-story', 'primary')];
    }

    // 5. No active story - analyze development_status
    const entries = Object.entries(sprint.development_status);
    let hasBacklogStory = false;
    let allStoriesDone = true;
    let hasStories = false;

    // Track per-epic story completion and retrospective status
    const epicStories = new Map<number, { total: number; done: number }>();
    const retroDone = new Set<number>();

    for (const [key, status] of entries) {
      if (isEpicKey(key)) {
        const epicNum = parseInt(key.replace('epic-', ''), 10);
        epicStories.set(epicNum, { total: 0, done: 0 });
      } else if (isRetrospectiveKey(key) && status === 'done') {
        const epicNum = parseInt(key.replace('epic-', '').replace('-retrospective', ''), 10);
        retroDone.add(epicNum);
      }
    }

    for (const [key, status] of entries) {
      if (!isStoryKey(key)) continue;
      // Skip entries with unrecognized statuses (e.g., retrospective entries, typos)
      if (!isStoryStatus(status)) continue;
      hasStories = true;

      const epicNum = parseInt(key.split('-')[0], 10);
      const counts = epicStories.get(epicNum);
      if (counts) {
        counts.total++;
        if (status === 'done') {
          counts.done++;
        }
      }

      if (status === 'backlog') {
        hasBacklogStory = true;
        allStoriesDone = false;
      } else if (status !== 'done') {
        allStoriesDone = false;
      }
    }

    // 8. Sprint exists, no stories at all → create story
    if (!hasStories) {
      return [this.makeWorkflow('create-story', 'primary')];
    }

    // 7. All stories in sprint complete → retrospective
    // Note: get-next-action.ts distinguishes this as 'sprint-complete' type,
    // but for workflow discovery we offer 'retrospective' as the actionable workflow.
    if (allStoriesDone) {
      return [this.makeWorkflow('retrospective', 'primary')];
    }

    // 6. Check if any single epic has all its stories done (per-epic retrospective)
    // Skip epics whose retrospective is already done
    for (const [epicNum, counts] of epicStories) {
      if (counts.total > 0 && counts.done === counts.total && !retroDone.has(epicNum)) {
        return [
          this.makeWorkflow('retrospective', 'primary'),
          this.makeWorkflow('create-story', 'optional'),
        ];
      }
    }

    // 5. Backlog stories exist → create next story
    if (hasBacklogStory) {
      return [
        this.makeWorkflow('create-story', 'primary'),
        this.makeWorkflow('correct-course', 'optional'),
      ];
    }

    // Fallback: some stories exist in non-backlog, non-done states but no currentStory
    return [this.makeWorkflow('create-story', 'primary')];
  }

  /**
   * Create an AvailableWorkflow from a definition with the given kind.
   */
  private makeWorkflow(id: string, kind: WorkflowKind): AvailableWorkflow {
    const def = WORKFLOW_DEFINITIONS[id];
    if (!def) {
      return { id, name: id, command: '', description: '', kind };
    }
    return { ...def, kind };
  }

  /**
   * Read directory using VS Code's workspace.fs API.
   * Returns empty array if directory doesn't exist or can't be read.
   *
   * Protected to allow subclassing for testing.
   */
  protected async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    try {
      return await vscode.workspace.fs.readDirectory(uri);
    } catch {
      return [];
    }
  }

  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }
}
