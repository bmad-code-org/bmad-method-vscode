import * as vscode from 'vscode';
import type { BmadDetector } from './bmad-detector';
import type { DashboardState, AvailableWorkflow } from '../../shared/types';
import { isStoryKey, isEpicKey, isStoryStatus } from '../../shared/types';

/**
 * Known BMAD implementation workflow definitions.
 * These map to folders under _bmad/bmm/workflows/4-implementation/
 */
const WORKFLOW_DEFINITIONS: Record<string, Omit<AvailableWorkflow, 'isPrimary'>> = {
  'sprint-planning': {
    id: 'sprint-planning',
    name: 'Sprint Planning',
    command: 'claude /bmad-bmm-sprint-planning',
    description: 'Set up sprint tracking and plan story execution order',
  },
  'create-story': {
    id: 'create-story',
    name: 'Create Story',
    command: 'claude /bmad-bmm-create-story',
    description: 'Create the next user story with comprehensive dev context',
  },
  'dev-story': {
    id: 'dev-story',
    name: 'Dev Story',
    command: 'claude /bmad-bmm-dev-story',
    description: 'Start or continue story implementation',
  },
  'code-review': {
    id: 'code-review',
    name: 'Code Review',
    command: 'claude /bmad-bmm-code-review',
    description: 'Run code review on completed story',
  },
  retrospective: {
    id: 'retrospective',
    name: 'Retrospective',
    command: 'claude /bmad-bmm-retrospective',
    description: 'Review what went well and what to improve',
  },
  'correct-course': {
    id: 'correct-course',
    name: 'Correct Course',
    command: 'claude /bmad-bmm-correct-course',
    description: 'Adjust sprint plan based on learnings',
  },
};

/**
 * Known workflow IDs. The folder name under _bmad/bmm/workflows/4-implementation/
 * matches the workflow ID exactly.
 *
 * Note: The `sprint-status` workflow folder exists on disk but is excluded here
 * because it is a status display utility, not an actionable workflow for CTA buttons.
 * The dashboard's built-in sprint status display covers this functionality.
 */

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
   * Discover installed workflows by scanning _bmad/bmm/workflows/4-implementation/
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

    const workflowsDir = vscode.Uri.joinPath(
      paths.bmadRoot,
      'bmm',
      'workflows',
      '4-implementation'
    );

    try {
      const entries = await this.readDirectory(workflowsDir);
      this.installedWorkflows = new Set(
        entries
          .filter(([, type]) => type === vscode.FileType.Directory)
          .map(([name]) => name)
          .filter((name) => name in WORKFLOW_DEFINITIONS)
      );
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
    const { sprint, currentStory } = state;

    // 1. No sprint data → recommend sprint planning
    if (!sprint) {
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

    // Track per-epic story completion
    const epicStories = new Map<number, { total: number; done: number }>();

    for (const [key] of entries) {
      if (isEpicKey(key)) {
        const epicNum = parseInt(key.replace('epic-', ''), 10);
        epicStories.set(epicNum, { total: 0, done: 0 });
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
    for (const [, counts] of epicStories) {
      if (counts.total > 0 && counts.done === counts.total) {
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
