import { suite, test, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { StateManager } from './state-manager';
import { BmadDetector, BmadPaths } from './bmad-detector';
import { FileWatcher, FileChangeEvent, FileWatcherError } from './file-watcher';
import type { DashboardState, SprintStatus } from '../../shared/types';
import { createInitialDashboardState } from '../../shared/types';

/**
 * Testable StateManager subclass that allows mocking file system operations.
 * This is necessary because vscode.workspace.fs is non-configurable and cannot be stubbed.
 */
class TestableStateManager extends StateManager {
  private _mockReadFile: ((uri: vscode.Uri) => Promise<string | null>) | null = null;
  private _mockReadDirectory: ((uri: vscode.Uri) => Promise<[string, vscode.FileType][]>) | null =
    null;

  /**
   * Set a mock implementation for readFile.
   */
  setReadFileMock(mockFn: (uri: vscode.Uri) => Promise<string | null>): void {
    this._mockReadFile = mockFn;
  }

  /**
   * Set a mock implementation for readDirectory.
   */
  setReadDirectoryMock(mockFn: (uri: vscode.Uri) => Promise<[string, vscode.FileType][]>): void {
    this._mockReadDirectory = mockFn;
  }

  protected override async readFile(uri: vscode.Uri): Promise<string | null> {
    if (this._mockReadFile) {
      return this._mockReadFile(uri);
    }
    return super.readFile(uri);
  }

  protected override async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    if (this._mockReadDirectory) {
      return this._mockReadDirectory(uri);
    }
    return super.readDirectory(uri);
  }
}

/**
 * Create mock BMAD paths for testing.
 */
function createMockPaths(): BmadPaths {
  return {
    bmadRoot: vscode.Uri.file('/test/_bmad'),
    outputRoot: vscode.Uri.file('/test/_bmad-output'),
  };
}

/**
 * Create a valid sprint status YAML string.
 */
function createSprintStatusYaml(overrides: Partial<SprintStatus> = {}): string {
  const defaults = {
    generated: '2026-01-27',
    project: 'test-project',
    project_key: 'test-project',
    tracking_system: 'file-system',
    story_location: '_bmad-output/implementation-artifacts',
    development_status: {
      'epic-1': 'in-progress',
      '1-1-first-story': 'done',
      '1-2-second-story': 'in-progress',
      '1-3-third-story': 'ready-for-dev',
    },
  };

  const merged = { ...defaults, ...overrides };
  const lines = [
    `generated: ${merged.generated}`,
    `project: ${merged.project}`,
    `project_key: ${merged.project_key}`,
    `tracking_system: ${merged.tracking_system}`,
    `story_location: ${merged.story_location}`,
    'development_status:',
    ...Object.entries(merged.development_status).map(([k, v]) => `  ${k}: ${v}`),
  ];
  return lines.join('\n');
}

/**
 * Create a valid story markdown string.
 */
function createStoryMarkdown(key: string, title: string): string {
  const [epic, story] = key.split('-').slice(0, 2);
  return `# Story ${epic}.${story}: ${title}

Status: in-progress

## Story

As a developer,
I want to test this story,
So that everything works correctly.

## Acceptance Criteria

1. **Test Criterion**
   - **Given** a test
   - **When** I run it
   - **Then** it passes

## Tasks / Subtasks

- [ ] Task 1: Do something (AC: #1)
  - [ ] 1.1: First subtask
  - [x] 1.2: Second subtask
- [x] Task 2: Do another thing (AC: #1)
`;
}

/**
 * Create a read file mock function that returns content based on file path.
 */
function createReadFileMock(
  fileMap: Record<string, string | null>
): (uri: vscode.Uri) => Promise<string | null> {
  return async (uri: vscode.Uri) => {
    for (const [suffix, content] of Object.entries(fileMap)) {
      if (uri.fsPath.endsWith(suffix)) {
        return Promise.resolve(content);
      }
    }
    return Promise.resolve(null);
  };
}

/**
 * Create a read directory mock function that returns entries.
 */
function createReadDirMock(
  entries: [string, vscode.FileType][]
): (uri: vscode.Uri) => Promise<[string, vscode.FileType][]> {
  return async () => Promise.resolve(entries);
}

suite('StateManager', () => {
  let sandbox: sinon.SinonSandbox;
  let mockDetector: sinon.SinonStubbedInstance<BmadDetector>;
  let mockFileWatcher: sinon.SinonStubbedInstance<FileWatcher>;
  let mockOnDidChange: vscode.EventEmitter<FileChangeEvent>;
  let mockOnError: vscode.EventEmitter<FileWatcherError>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    mockDetector = sandbox.createStubInstance(BmadDetector);

    mockOnDidChange = new vscode.EventEmitter<FileChangeEvent>();
    mockOnError = new vscode.EventEmitter<FileWatcherError>();
    mockFileWatcher = sandbox.createStubInstance(FileWatcher);
    Object.defineProperty(mockFileWatcher, 'onDidChange', {
      get: () => mockOnDidChange.event,
    });
    Object.defineProperty(mockFileWatcher, 'onError', {
      get: () => mockOnError.event,
    });
  });

  afterEach(() => {
    mockOnDidChange.dispose();
    mockOnError.dispose();
    sandbox.restore();
  });

  /**
   * Create a TestableStateManager with file system mocks pre-configured.
   */
  function createTestableManager(
    readFileMock: (uri: vscode.Uri) => Promise<string | null>,
    readDirMock: (uri: vscode.Uri) => Promise<[string, vscode.FileType][]> = async () =>
      Promise.resolve([])
  ): TestableStateManager {
    const manager = new TestableStateManager(mockDetector, mockFileWatcher);
    manager.setReadFileMock(readFileMock);
    manager.setReadDirectoryMock(readDirMock);
    return manager;
  }

  suite('Initial State', () => {
    test('initial state matches createInitialDashboardState()', () => {
      const manager = new StateManager(mockDetector, mockFileWatcher);
      const expected = createInitialDashboardState();
      assert.deepStrictEqual(manager.state, expected);
      manager.dispose();
    });

    test('initial state has loading: true', () => {
      const manager = new StateManager(mockDetector, mockFileWatcher);
      assert.strictEqual(manager.state.loading, true);
      manager.dispose();
    });

    test('initial state has empty errors array', () => {
      const manager = new StateManager(mockDetector, mockFileWatcher);
      assert.deepStrictEqual(manager.state.errors, []);
      manager.dispose();
    });

    test('initial state has null sprint', () => {
      const manager = new StateManager(mockDetector, mockFileWatcher);
      assert.strictEqual(manager.state.sprint, null);
      manager.dispose();
    });

    test('initial state has empty epics array', () => {
      const manager = new StateManager(mockDetector, mockFileWatcher);
      assert.deepStrictEqual(manager.state.epics, []);
      manager.dispose();
    });

    test('initial state has null currentStory', () => {
      const manager = new StateManager(mockDetector, mockFileWatcher);
      assert.strictEqual(manager.state.currentStory, null);
      manager.dispose();
    });
  });

  suite('initialize()', () => {
    test('sets loading to false after initialization', async () => {
      mockDetector.getBmadPaths.returns(createMockPaths());

      const manager = createTestableManager(createReadFileMock({}));
      await manager.initialize();

      assert.strictEqual(manager.state.loading, false);
      manager.dispose();
    });

    test('parses sprint status file successfully', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);
      const yamlContent = createSprintStatusYaml();

      const manager = createTestableManager(
        createReadFileMock({ 'sprint-status.yaml': yamlContent })
      );
      await manager.initialize();

      assert.ok(manager.state.sprint);
      assert.strictEqual(manager.state.sprint.project, 'test-project');
      manager.dispose();
    });

    test('handles missing BMAD output directory', async () => {
      mockDetector.getBmadPaths.returns(null);

      const manager = createTestableManager(createReadFileMock({}));
      await manager.initialize();

      assert.strictEqual(manager.state.loading, false);
      assert.strictEqual(manager.state.sprint, null);
      manager.dispose();
    });

    test('handles null outputRoot', async () => {
      mockDetector.getBmadPaths.returns({
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: null,
      });

      const manager = createTestableManager(createReadFileMock({}));
      await manager.initialize();

      assert.strictEqual(manager.state.loading, false);
      manager.dispose();
    });
  });

  suite('Parse Error Collection', () => {
    test('collects errors in errors array', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const manager = createTestableManager(
        createReadFileMock({ 'sprint-status.yaml': 'invalid: yaml: content:' })
      );
      await manager.initialize();

      assert.ok(manager.state.errors.length > 0);
      assert.ok(manager.state.errors[0].filePath?.includes('sprint-status.yaml'));
      manager.dispose();
    });

    test('error deduplication - same file error replaces previous error', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      let callCount = 0;
      const manager = createTestableManager(async (uri: vscode.Uri) => {
        if (uri.fsPath.endsWith('sprint-status.yaml')) {
          callCount++;
          return Promise.resolve(
            callCount === 1 ? 'invalid: yaml: content:' : 'still: invalid: yaml: data:'
          );
        }
        return Promise.resolve(null);
      });

      await manager.initialize();

      const errorCountAfterInit = manager.state.errors.length;
      assert.ok(errorCountAfterInit > 0);

      await manager.refresh();

      const errorCountAfterRefresh = manager.state.errors.filter((e) =>
        e.filePath?.includes('sprint-status.yaml')
      ).length;
      assert.strictEqual(errorCountAfterRefresh, 1);
      manager.dispose();
    });

    test('clears error for file on successful re-parse', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      let callCount = 0;
      const manager = createTestableManager(async (uri: vscode.Uri) => {
        if (uri.fsPath.endsWith('sprint-status.yaml')) {
          callCount++;
          return Promise.resolve(
            callCount === 1 ? 'invalid: yaml: content:' : createSprintStatusYaml()
          );
        }
        return Promise.resolve(null);
      });

      await manager.initialize();

      assert.ok(manager.state.errors.length > 0);

      await manager.refresh();

      const sprintErrors = manager.state.errors.filter((e) =>
        e.filePath?.includes('sprint-status.yaml')
      );
      assert.strictEqual(sprintErrors.length, 0);
      manager.dispose();
    });

    test('partial data is available when parse fails', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const partialYaml = `
generated: 2026-01-27
project: partial-project
project_key: partial-project
tracking_system: file-system
`;

      const manager = createTestableManager(
        createReadFileMock({ 'sprint-status.yaml': partialYaml })
      );
      await manager.initialize();

      assert.ok(manager.state.errors.length > 0);
      manager.dispose();
    });
  });

  suite('onStateChange Event', () => {
    test('fires event after state updates during initialize', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const manager = createTestableManager(createReadFileMock({}));

      const states: DashboardState[] = [];
      manager.onStateChange((state) => states.push(state));

      await manager.initialize();

      assert.ok(states.length > 0);
      assert.strictEqual(states[states.length - 1].loading, false);
      manager.dispose();
    });

    test('fires event after refresh', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const manager = createTestableManager(createReadFileMock({}));
      await manager.initialize();

      const states: DashboardState[] = [];
      manager.onStateChange((state) => states.push(state));

      await manager.refresh();

      assert.ok(states.length >= 2);
      assert.strictEqual(states[0].loading, true);
      assert.strictEqual(states[states.length - 1].loading, false);
      manager.dispose();
    });
  });

  suite('File Watcher Integration', () => {
    test('selective re-parse on sprint-status.yaml change', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      let project = 'initial-project';
      const manager = createTestableManager(async (uri: vscode.Uri) => {
        if (uri.fsPath.endsWith('sprint-status.yaml')) {
          return Promise.resolve(createSprintStatusYaml({ project }));
        }
        return Promise.resolve(null);
      });

      await manager.initialize();

      assert.ok(manager.state.sprint);
      assert.strictEqual(manager.state.sprint.project, 'initial-project');

      // Update the mock to return different project name
      project = 'updated-project';

      const changeEvent: FileChangeEvent = {
        changes: new Map([
          [`${paths.outputRoot!.fsPath}/implementation-artifacts/sprint-status.yaml`, 'change'],
        ]),
      };
      mockOnDidChange.fire(changeEvent);

      // Wait for async processing
      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      assert.ok(manager.state.sprint);
      assert.strictEqual(manager.state.sprint.project, 'updated-project');
      manager.dispose();
    });

    test('file deletion removes data from state', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const manager = createTestableManager(
        createReadFileMock({ 'sprint-status.yaml': createSprintStatusYaml() })
      );

      await manager.initialize();

      assert.ok(manager.state.sprint);

      const deleteEvent: FileChangeEvent = {
        changes: new Map([
          [`${paths.outputRoot!.fsPath}/implementation-artifacts/sprint-status.yaml`, 'delete'],
        ]),
      };
      mockOnDidChange.fire(deleteEvent);

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      assert.strictEqual(manager.state.sprint, null);
      manager.dispose();
    });

    test('file creation adds data to state', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      let hasSprintFile = false;
      const manager = createTestableManager(async (uri: vscode.Uri) => {
        if (uri.fsPath.endsWith('sprint-status.yaml') && hasSprintFile) {
          return Promise.resolve(createSprintStatusYaml());
        }
        return Promise.resolve(null);
      });

      await manager.initialize();

      assert.strictEqual(manager.state.sprint, null);

      hasSprintFile = true;

      const createEvent: FileChangeEvent = {
        changes: new Map([
          [`${paths.outputRoot!.fsPath}/implementation-artifacts/sprint-status.yaml`, 'create'],
        ]),
      };
      mockOnDidChange.fire(createEvent);

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      assert.ok(manager.state.sprint);
      manager.dispose();
    });

    test('FileWatcher error is added to errors array', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const manager = createTestableManager(createReadFileMock({}));
      await manager.initialize();

      const errorsBefore = manager.state.errors.length;

      mockOnError.fire({
        message: 'Test watcher error',
        recoverable: true,
      });

      await new Promise((resolve) => {
        setTimeout(resolve, 10);
      });

      assert.strictEqual(manager.state.errors.length, errorsBefore + 1);
      assert.ok(manager.state.errors.some((e) => e.message.includes('Test watcher error')));
      manager.dispose();
    });

    test('file change during initialize is queued and processed after', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      let changeEventFired = false;

      const manager = createTestableManager(async (uri: vscode.Uri) => {
        if (uri.fsPath.endsWith('sprint-status.yaml')) {
          // Fire a change event during initialization
          if (!changeEventFired) {
            changeEventFired = true;
            const changeEvent: FileChangeEvent = {
              changes: new Map([
                [
                  `${paths.outputRoot!.fsPath}/implementation-artifacts/sprint-status.yaml`,
                  'change',
                ],
              ]),
            };
            mockOnDidChange.fire(changeEvent);
          }
          return Promise.resolve(createSprintStatusYaml({ project: 'initial-project' }));
        }
        return Promise.resolve(null);
      });

      await manager.initialize();

      assert.strictEqual(manager.state.loading, false);
      manager.dispose();
    });
  });

  suite('refresh()', () => {
    test('clears all errors before re-parse', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      let callCount = 0;
      const manager = createTestableManager(async (uri: vscode.Uri) => {
        if (uri.fsPath.endsWith('sprint-status.yaml')) {
          callCount++;
          return Promise.resolve(
            callCount === 1 ? 'invalid: yaml: content:' : createSprintStatusYaml()
          );
        }
        return Promise.resolve(null);
      });

      await manager.initialize();

      assert.ok(manager.state.errors.length > 0);

      const states: DashboardState[] = [];
      manager.onStateChange((state) => states.push(state));

      await manager.refresh();

      // First state update should have cleared errors
      assert.strictEqual(states[0].errors.length, 0);
      manager.dispose();
    });

    test('fires state change event when refresh completes', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const manager = createTestableManager(createReadFileMock({}));
      await manager.initialize();

      const states: DashboardState[] = [];
      manager.onStateChange((state) => states.push(state));

      await manager.refresh();

      assert.ok(states.length > 0);
      manager.dispose();
    });
  });

  suite('Story File Filtering', () => {
    test('only X-Y-*.md files are parsed as stories', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const sprintYaml = createSprintStatusYaml({
        development_status: {
          'epic-1': 'in-progress',
          '1-1-valid-story': 'in-progress',
        },
      });

      const manager = createTestableManager(
        createReadFileMock({
          'sprint-status.yaml': sprintYaml,
          '1-1-valid-story.md': createStoryMarkdown('1-1-valid-story', 'Valid Story'),
        }),
        createReadDirMock([
          ['1-1-valid-story.md', vscode.FileType.File],
          ['readme.md', vscode.FileType.File],
          ['notes.md', vscode.FileType.File],
          ['sprint-status.yaml', vscode.FileType.File],
        ])
      );

      await manager.initialize();

      assert.ok(manager.state.currentStory);
      assert.strictEqual(manager.state.currentStory.key, '1-1-valid-story');
      manager.dispose();
    });
  });

  suite('Current Story Determination', () => {
    test('finds first story with in-progress status', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const sprintYaml = createSprintStatusYaml({
        development_status: {
          'epic-1': 'in-progress',
          '1-1-first-story': 'done',
          '1-2-second-story': 'in-progress',
          '1-3-third-story': 'ready-for-dev',
        },
      });

      const manager = createTestableManager(
        createReadFileMock({
          'sprint-status.yaml': sprintYaml,
          '1-2-second-story.md': createStoryMarkdown('1-2-second-story', 'Second Story'),
        }),
        createReadDirMock([['1-2-second-story.md', vscode.FileType.File]])
      );

      await manager.initialize();

      assert.ok(manager.state.currentStory);
      assert.strictEqual(manager.state.currentStory.key, '1-2-second-story');
      manager.dispose();
    });

    test('finds first story with ready-for-dev status if no in-progress', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const sprintYaml = createSprintStatusYaml({
        development_status: {
          'epic-1': 'in-progress',
          '1-1-first-story': 'done',
          '1-2-second-story': 'done',
          '1-3-third-story': 'ready-for-dev',
        },
      });

      const manager = createTestableManager(
        createReadFileMock({
          'sprint-status.yaml': sprintYaml,
          '1-3-third-story.md': createStoryMarkdown('1-3-third-story', 'Third Story'),
        }),
        createReadDirMock([['1-3-third-story.md', vscode.FileType.File]])
      );

      await manager.initialize();

      assert.ok(manager.state.currentStory);
      assert.strictEqual(manager.state.currentStory.key, '1-3-third-story');
      manager.dispose();
    });

    test('returns null when no active stories', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const sprintYaml = createSprintStatusYaml({
        development_status: {
          'epic-1': 'done',
          '1-1-first-story': 'done',
        },
      });

      const manager = createTestableManager(
        createReadFileMock({ 'sprint-status.yaml': sprintYaml })
      );
      await manager.initialize();

      assert.strictEqual(manager.state.currentStory, null);
      manager.dispose();
    });

    test('returns null when sprint status is not available', async () => {
      mockDetector.getBmadPaths.returns(createMockPaths());

      const manager = createTestableManager(createReadFileMock({}));
      await manager.initialize();

      assert.strictEqual(manager.state.currentStory, null);
      manager.dispose();
    });

    test('skips epic entries when determining current story', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const sprintYaml = createSprintStatusYaml({
        development_status: {
          'epic-1': 'in-progress',
          '1-1-first-story': 'ready-for-dev',
        },
      });

      const manager = createTestableManager(
        createReadFileMock({
          'sprint-status.yaml': sprintYaml,
          '1-1-first-story.md': createStoryMarkdown('1-1-first-story', 'First Story'),
        }),
        createReadDirMock([['1-1-first-story.md', vscode.FileType.File]])
      );

      await manager.initialize();

      assert.ok(manager.state.currentStory);
      assert.strictEqual(manager.state.currentStory.key, '1-1-first-story');
      manager.dispose();
    });

    test('skips retrospective entries when determining current story', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const sprintYaml = createSprintStatusYaml({
        development_status: {
          'epic-1': 'done',
          'epic-1-retrospective': 'optional',
          '1-1-first-story': 'ready-for-dev',
        },
      });

      const manager = createTestableManager(
        createReadFileMock({
          'sprint-status.yaml': sprintYaml,
          '1-1-first-story.md': createStoryMarkdown('1-1-first-story', 'First Story'),
        }),
        createReadDirMock([['1-1-first-story.md', vscode.FileType.File]])
      );

      await manager.initialize();

      assert.ok(manager.state.currentStory);
      assert.strictEqual(manager.state.currentStory.key, '1-1-first-story');
      manager.dispose();
    });
  });

  suite('dispose()', () => {
    test('cleans up all disposables', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const manager = createTestableManager(createReadFileMock({}));
      await manager.initialize();

      // Should not throw when disposed twice
      manager.dispose();
      manager.dispose();
    });
  });

  suite('State Immutability', () => {
    test('state updates are immutable (new object reference)', async () => {
      const paths = createMockPaths();
      mockDetector.getBmadPaths.returns(paths);

      const manager = createTestableManager(createReadFileMock({}));
      const initialState = manager.state;

      await manager.initialize();
      const afterInit = manager.state;

      assert.notStrictEqual(initialState, afterInit);
      manager.dispose();
    });
  });
});
