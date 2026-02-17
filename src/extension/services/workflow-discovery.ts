import * as vscode from 'vscode';
import type { BmadDetector } from './bmad-detector';
import type { DashboardState, AvailableWorkflow } from '../../shared/types';
import { isStoryKey, isEpicKey, isStoryStatus, isRetrospectiveKey } from '../../shared/types';

/**
 * Known BMAD workflow definitions.
 * Phase 4 (implementation) workflows map to folders under _bmad/bmm/workflows/4-implementation/.
 * Pre-implementation workflows map to specific directories in phases 1-3.
 */
const WORKFLOW_DEFINITIONS: Record<string, Omit<AvailableWorkflow, 'isPrimary'>> = {
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
 * Pre-implementation workflow directory mappings.
 * Maps workflow definition IDs to their actual directory paths relative to _bmad/.
 * Phase 4 workflows use folder names matching their IDs under 4-implementation/.
 *
 * Note: The `sprint-status` workflow folder exists on disk but is excluded
 * because it is a status display utility, not an actionable workflow for CTA buttons.
 */
const PRE_IMPL_WORKFLOW_DIRS: Array<{ path: string[]; id: string }> = [
  { path: ['core', 'workflows', 'brainstorming'], id: 'brainstorming' },
  { path: ['bmm', 'workflows', '1-analysis', 'create-product-brief'], id: 'create-product-brief' },
  { path: ['bmm', 'workflows', '2-plan-workflows', 'create-prd'], id: 'create-prd' },
  { path: ['bmm', 'workflows', '3-solutioning', 'create-architecture'], id: 'create-architecture' },
  {
    path: ['bmm', 'workflows', '3-solutioning', 'create-epics-and-stories'],
    id: 'create-epics',
  },
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
   * Scans Phase 4 (4-implementation/) generically, plus specific pre-implementation directories.
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

      // Check pre-implementation workflow directories
      const preImplResults = await Promise.all(
        PRE_IMPL_WORKFLOW_DIRS.map(async ({ path, id }) => {
          const dir = vscode.Uri.joinPath(paths.bmadRoot, ...path);
          const entries = await this.readDirectory(dir);
          return entries.length > 0 ? id : null;
        })
      );

      this.installedWorkflows = new Set([
        ...implWorkflows,
        ...preImplResults.filter((id): id is string => id !== null),
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
   * without checking installation.
   */
  private computeWorkflowCandidates(state: DashboardState): AvailableWorkflow[] {
    const { sprint, currentStory, planningArtifacts } = state;

    // 1. No sprint data → check planning artifacts to determine phase
    if (!sprint) {
      if (!planningArtifacts.hasPrd) {
        return [
          this.makeWorkflow('create-prd', true),
          this.makeWorkflow('brainstorming', false),
          this.makeWorkflow('create-product-brief', false),
        ];
      }
      if (!planningArtifacts.hasArchitecture) {
        return [this.makeWorkflow('create-architecture', true)];
      }
      if (!planningArtifacts.hasEpics) {
        return [this.makeWorkflow('create-epics', true)];
      }
      return [this.makeWorkflow('sprint-planning', true)];
    }

    // 2. Active story in-progress → continue development
    if (currentStory?.status === 'in-progress') {
      return [this.makeWorkflow('dev-story', true), this.makeWorkflow('correct-course', false)];
    }

    // 3. Story in review → code review
    if (currentStory?.status === 'review') {
      return [this.makeWorkflow('code-review', true), this.makeWorkflow('create-story', false)];
    }

    // 4. Story ready-for-dev → start development
    if (currentStory?.status === 'ready-for-dev') {
      return [this.makeWorkflow('dev-story', true)];
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
      return [this.makeWorkflow('create-story', true)];
    }

    // 7. All stories in sprint complete → retrospective
    // Note: get-next-action.ts distinguishes this as 'sprint-complete' type,
    // but for workflow discovery we offer 'retrospective' as the actionable workflow.
    if (allStoriesDone) {
      return [this.makeWorkflow('retrospective', true)];
    }

    // 6. Check if any single epic has all its stories done (per-epic retrospective)
    // Skip epics whose retrospective is already done
    for (const [epicNum, counts] of epicStories) {
      if (counts.total > 0 && counts.done === counts.total && !retroDone.has(epicNum)) {
        return [this.makeWorkflow('retrospective', true), this.makeWorkflow('create-story', false)];
      }
    }

    // 5. Backlog stories exist → create next story
    if (hasBacklogStory) {
      return [this.makeWorkflow('create-story', true), this.makeWorkflow('correct-course', false)];
    }

    // Fallback: some stories exist in non-backlog, non-done states but no currentStory
    return [this.makeWorkflow('create-story', true)];
  }

  /**
   * Create an AvailableWorkflow from a definition with the given primary flag.
   */
  private makeWorkflow(id: string, isPrimary: boolean): AvailableWorkflow {
    const def = WORKFLOW_DEFINITIONS[id];
    if (!def) {
      return { id, name: id, command: '', description: '', isPrimary };
    }
    return { ...def, isPrimary };
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
