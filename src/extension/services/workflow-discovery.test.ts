import { suite, test, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { WorkflowDiscoveryService } from './workflow-discovery';
import { BmadDetector, BmadPaths } from './bmad-detector';
import type { DashboardState, AvailableWorkflow, SprintStatus } from '../../shared/types';
import { createInitialDashboardState } from '../../shared/types';

/**
 * Testable WorkflowDiscoveryService subclass that allows mocking file system operations.
 */
class TestableWorkflowDiscoveryService extends WorkflowDiscoveryService {
  private _mockReadDirectory: ((uri: vscode.Uri) => Promise<[string, vscode.FileType][]>) | null =
    null;

  setReadDirectoryMock(mockFn: (uri: vscode.Uri) => Promise<[string, vscode.FileType][]>): void {
    this._mockReadDirectory = mockFn;
  }

  protected override async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    if (this._mockReadDirectory) {
      return this._mockReadDirectory(uri);
    }
    return super.readDirectory(uri);
  }
}

function createMockPaths(): BmadPaths {
  return {
    bmadRoot: vscode.Uri.file('/test/_bmad'),
    outputRoot: vscode.Uri.file('/test/_bmad-output'),
  };
}

function createMockSprintStatus(developmentStatus: Record<string, string>): SprintStatus {
  return {
    generated: '2026-01-27',
    project: 'test-project',
    project_key: 'test-project',
    tracking_system: 'file-system',
    story_location: '_bmad-output/implementation-artifacts',
    development_status: developmentStatus as SprintStatus['development_status'],
  };
}

function createState(overrides: Partial<DashboardState> = {}): DashboardState {
  return {
    ...createInitialDashboardState(),
    loading: false,
    ...overrides,
  };
}

/** Standard BMAD workflow folder entries for readDirectory mock */
const ALL_WORKFLOW_FOLDERS: [string, vscode.FileType][] = [
  ['sprint-planning', vscode.FileType.Directory],
  ['create-story', vscode.FileType.Directory],
  ['dev-story', vscode.FileType.Directory],
  ['code-review', vscode.FileType.Directory],
  ['retrospective', vscode.FileType.Directory],
  ['correct-course', vscode.FileType.Directory],
];

suite('WorkflowDiscoveryService', () => {
  let sandbox: sinon.SinonSandbox;
  let detector: sinon.SinonStubbedInstance<BmadDetector>;
  let service: TestableWorkflowDiscoveryService;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  function setup(
    paths: BmadPaths | null = createMockPaths(),
    workflowFolders: [string, vscode.FileType][] = ALL_WORKFLOW_FOLDERS
  ): void {
    detector = sandbox.createStubInstance(BmadDetector);
    detector.getBmadPaths.returns(paths);
    service = new TestableWorkflowDiscoveryService(detector as unknown as BmadDetector);
    service.setReadDirectoryMock(async () => Promise.resolve(workflowFolders));
  }

  function findById(workflows: AvailableWorkflow[], id: string): AvailableWorkflow | undefined {
    return workflows.find((w) => w.id === id);
  }

  suite('discoverInstalledWorkflows', () => {
    test('discovers all standard workflow folders', async () => {
      setup();
      const installed = await service.discoverInstalledWorkflows();
      assert.strictEqual(installed.size, 6);
      assert.ok(installed.has('sprint-planning'));
      assert.ok(installed.has('create-story'));
      assert.ok(installed.has('dev-story'));
      assert.ok(installed.has('code-review'));
      assert.ok(installed.has('retrospective'));
      assert.ok(installed.has('correct-course'));
    });

    test('returns empty set when no BMAD paths detected', async () => {
      setup(null);
      const installed = await service.discoverInstalledWorkflows();
      assert.strictEqual(installed.size, 0);
    });

    test('filters out non-directory entries', async () => {
      setup(createMockPaths(), [
        ['dev-story', vscode.FileType.Directory],
        ['readme.md', vscode.FileType.File],
      ]);
      const installed = await service.discoverInstalledWorkflows();
      assert.strictEqual(installed.size, 1);
      assert.ok(installed.has('dev-story'));
    });

    test('filters out unknown workflow folders', async () => {
      setup(createMockPaths(), [
        ['dev-story', vscode.FileType.Directory],
        ['unknown-workflow', vscode.FileType.Directory],
      ]);
      const installed = await service.discoverInstalledWorkflows();
      assert.strictEqual(installed.size, 1);
      assert.ok(installed.has('dev-story'));
    });

    test('caches result after first scan', async () => {
      setup();
      const first = await service.discoverInstalledWorkflows();
      // Change the mock - should still return cached result
      service.setReadDirectoryMock(async () => Promise.resolve([]));
      const second = await service.discoverInstalledWorkflows();
      assert.strictEqual(first, second);
    });

    test('invalidateCache forces re-scan', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      service.invalidateCache();
      service.setReadDirectoryMock(async () =>
        Promise.resolve<[string, vscode.FileType][]>([['dev-story', vscode.FileType.Directory]])
      );
      const refreshed = await service.discoverInstalledWorkflows();
      assert.strictEqual(refreshed.size, 1);
    });

    test('returns empty set when readDirectory fails', async () => {
      setup();
      service.setReadDirectoryMock(async () => Promise.reject(new Error('directory not found')));
      service.invalidateCache();
      const installed = await service.discoverInstalledWorkflows();
      assert.strictEqual(installed.size, 0);
    });
  });

  suite('discoverWorkflows - state mapping', () => {
    test('no sprint data returns sprint-planning', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({ sprint: null });
      const workflows = service.discoverWorkflows(state);
      assert.strictEqual(workflows.length, 1);
      assert.strictEqual(workflows[0].id, 'sprint-planning');
      assert.strictEqual(workflows[0].isPrimary, true);
    });

    test('sprint active with all backlog stories returns create-story', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
          '1-1-first-story': 'backlog',
          '1-2-second-story': 'backlog',
        }),
        currentStory: null,
      });
      const workflows = service.discoverWorkflows(state);
      const primary = workflows.find((w) => w.isPrimary);
      assert.strictEqual(primary?.id, 'create-story');
    });

    test('story with ready-for-dev status returns dev-story', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
          '1-1-first-story': 'ready-for-dev',
        }),
        currentStory: {
          key: '1-1-first-story',
          epicNumber: 1,
          storyNumber: 1,
          title: 'First Story',
          userStory: 'As a...',
          acceptanceCriteria: [],
          tasks: [],
          filePath: 'stories/1-1-first-story.md',
          status: 'ready-for-dev',
          totalTasks: 0,
          completedTasks: 0,
          totalSubtasks: 0,
          completedSubtasks: 0,
        },
      });
      const workflows = service.discoverWorkflows(state);
      assert.strictEqual(workflows.length, 1);
      assert.strictEqual(workflows[0].id, 'dev-story');
      assert.strictEqual(workflows[0].isPrimary, true);
    });

    test('story with in-progress status returns dev-story (continue)', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
          '1-1-first-story': 'in-progress',
        }),
        currentStory: {
          key: '1-1-first-story',
          epicNumber: 1,
          storyNumber: 1,
          title: 'First Story',
          userStory: 'As a...',
          acceptanceCriteria: [],
          tasks: [],
          filePath: 'stories/1-1-first-story.md',
          status: 'in-progress',
          totalTasks: 0,
          completedTasks: 0,
          totalSubtasks: 0,
          completedSubtasks: 0,
        },
      });
      const workflows = service.discoverWorkflows(state);
      const primary = workflows.find((w) => w.isPrimary);
      assert.strictEqual(primary?.id, 'dev-story');
      assert.ok(findById(workflows, 'correct-course'));
    });

    test('story with review status returns code-review and create-story', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
          '1-1-first-story': 'review',
        }),
        currentStory: {
          key: '1-1-first-story',
          epicNumber: 1,
          storyNumber: 1,
          title: 'First Story',
          userStory: 'As a...',
          acceptanceCriteria: [],
          tasks: [],
          filePath: 'stories/1-1-first-story.md',
          status: 'review',
          totalTasks: 0,
          completedTasks: 0,
          totalSubtasks: 0,
          completedSubtasks: 0,
        },
      });
      const workflows = service.discoverWorkflows(state);
      const primary = workflows.find((w) => w.isPrimary);
      assert.strictEqual(primary?.id, 'code-review');
      assert.ok(findById(workflows, 'create-story'));
    });

    test('all stories in an epic complete returns retrospective and create-story', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
          '1-1-first-story': 'done',
          '1-2-second-story': 'done',
          'epic-2': 'backlog',
          '2-1-third-story': 'backlog',
        }),
        currentStory: null,
      });
      const workflows = service.discoverWorkflows(state);
      const primary = workflows.find((w) => w.isPrimary);
      assert.strictEqual(primary?.id, 'retrospective');
      assert.ok(findById(workflows, 'create-story'));
    });

    test('skips epic with completed retrospective and returns create-story for backlog', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'done',
          '1-1-first-story': 'done',
          '1-2-second-story': 'done',
          'epic-1-retrospective': 'done',
          'epic-2': 'in-progress',
          '2-1-third-story': 'backlog',
        }),
        currentStory: null,
      });
      const workflows = service.discoverWorkflows(state);
      const primary = workflows.find((w) => w.isPrimary);
      assert.strictEqual(primary?.id, 'create-story');
    });

    test('all stories in sprint complete returns retrospective', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
          '1-1-first-story': 'done',
          '1-2-second-story': 'done',
        }),
        currentStory: null,
      });
      const workflows = service.discoverWorkflows(state);
      assert.strictEqual(workflows.length, 1);
      assert.strictEqual(workflows[0].id, 'retrospective');
      assert.strictEqual(workflows[0].isPrimary, true);
    });

    test('sprint with no stories returns create-story', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
        }),
        currentStory: null,
      });
      const workflows = service.discoverWorkflows(state);
      assert.strictEqual(workflows.length, 1);
      assert.strictEqual(workflows[0].id, 'create-story');
      assert.strictEqual(workflows[0].isPrimary, true);
    });
  });

  suite('discoverWorkflows - installation filtering', () => {
    test('workflows filtered against installed workflows', async () => {
      // Only dev-story is installed
      setup(createMockPaths(), [['dev-story', vscode.FileType.Directory]]);
      await service.discoverInstalledWorkflows();

      // State would normally return [dev-story, correct-course]
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
          '1-1-first-story': 'in-progress',
        }),
        currentStory: {
          key: '1-1-first-story',
          epicNumber: 1,
          storyNumber: 1,
          title: 'First Story',
          userStory: 'As a...',
          acceptanceCriteria: [],
          tasks: [],
          filePath: 'stories/1-1-first-story.md',
          status: 'in-progress',
          totalTasks: 0,
          completedTasks: 0,
          totalSubtasks: 0,
          completedSubtasks: 0,
        },
      });
      const workflows = service.discoverWorkflows(state);
      // correct-course should be filtered out since it's not installed
      assert.strictEqual(workflows.length, 1);
      assert.strictEqual(workflows[0].id, 'dev-story');
    });

    test('returns empty array when no workflows are installed', async () => {
      setup(createMockPaths(), []);
      await service.discoverInstalledWorkflows();
      const state = createState({ sprint: null });
      const workflows = service.discoverWorkflows(state);
      assert.strictEqual(workflows.length, 0);
    });
  });

  suite('discoverWorkflows - primary workflow marking', () => {
    test('exactly one workflow is marked as primary', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({
          'epic-1': 'in-progress',
          '1-1-first-story': 'review',
        }),
        currentStory: {
          key: '1-1-first-story',
          epicNumber: 1,
          storyNumber: 1,
          title: 'First Story',
          userStory: 'As a...',
          acceptanceCriteria: [],
          tasks: [],
          filePath: 'stories/1-1-first-story.md',
          status: 'review',
          totalTasks: 0,
          completedTasks: 0,
          totalSubtasks: 0,
          completedSubtasks: 0,
        },
      });
      const workflows = service.discoverWorkflows(state);
      const primaryCount = workflows.filter((w) => w.isPrimary).length;
      assert.strictEqual(primaryCount, 1);
    });
  });

  suite('discoverWorkflows - graceful degradation', () => {
    test('handles partial state with no sprint gracefully', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: null,
        epics: [],
        currentStory: null,
      });
      const workflows = service.discoverWorkflows(state);
      assert.ok(workflows.length > 0);
      assert.strictEqual(workflows[0].id, 'sprint-planning');
    });

    test('handles sprint with empty development_status', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({
        sprint: createMockSprintStatus({}),
        currentStory: null,
      });
      const workflows = service.discoverWorkflows(state);
      assert.ok(workflows.length > 0);
      // No stories at all → create-story
      assert.strictEqual(workflows[0].id, 'create-story');
    });

    test('never throws an exception', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      // Pass various degenerate states
      const states: DashboardState[] = [
        createState({ sprint: null }),
        createState({ sprint: createMockSprintStatus({}), currentStory: null }),
        createState({
          sprint: createMockSprintStatus({ 'epic-1': 'in-progress' }),
          currentStory: null,
        }),
      ];
      for (const state of states) {
        assert.doesNotThrow(() => service.discoverWorkflows(state));
      }
    });
  });

  suite('workflow properties', () => {
    test('workflows have correct structure', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({ sprint: null });
      const workflows = service.discoverWorkflows(state);
      for (const w of workflows) {
        assert.ok(typeof w.id === 'string' && w.id.length > 0);
        assert.ok(typeof w.name === 'string' && w.name.length > 0);
        assert.ok(typeof w.command === 'string' && w.command.length > 0);
        assert.ok(typeof w.description === 'string' && w.description.length > 0);
        assert.ok(typeof w.isPrimary === 'boolean');
      }
    });

    test('commands follow /bmad-bmm- pattern without CLI prefix', async () => {
      setup();
      await service.discoverInstalledWorkflows();
      const state = createState({ sprint: null });
      const workflows = service.discoverWorkflows(state);
      for (const w of workflows) {
        assert.ok(
          w.command.startsWith('/bmad-bmm-'),
          `Expected command to start with '/bmad-bmm-', got '${w.command}'`
        );
        assert.ok(
          !w.command.startsWith('claude'),
          `Command should not include CLI prefix, got '${w.command}'`
        );
      }
    });
  });

  suite('dispose', () => {
    test('can be disposed without errors', () => {
      setup();
      assert.doesNotThrow(() => service.dispose());
    });
  });
});
