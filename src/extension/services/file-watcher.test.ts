import { suite, test, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { FileWatcher, FileChangeEvent, FileWatcherError, FileWatcherState } from './file-watcher';
import { BmadDetector, BmadPaths } from './bmad-detector';

/**
 * Test subclass that exposes protected methods for testing edge cases.
 */
class TestableFileWatcher extends FileWatcher {
  public setTestState(state: FileWatcherState): void {
    this.setStateForTesting(state);
  }
}

/**
 * Create a mock VS Code FileSystemWatcher.
 */
interface MockFileSystemWatcher extends vscode.FileSystemWatcher {
  _onDidCreate: vscode.EventEmitter<vscode.Uri>;
  _onDidChange: vscode.EventEmitter<vscode.Uri>;
  _onDidDelete: vscode.EventEmitter<vscode.Uri>;
  dispose: sinon.SinonStub;
}

function createMockFileSystemWatcher(): MockFileSystemWatcher {
  const onDidCreate = new vscode.EventEmitter<vscode.Uri>();
  const onDidChange = new vscode.EventEmitter<vscode.Uri>();
  const onDidDelete = new vscode.EventEmitter<vscode.Uri>();

  return {
    _onDidCreate: onDidCreate,
    _onDidChange: onDidChange,
    _onDidDelete: onDidDelete,
    onDidCreate: onDidCreate.event,
    onDidChange: onDidChange.event,
    onDidDelete: onDidDelete.event,
    ignoreCreateEvents: false,
    ignoreChangeEvents: false,
    ignoreDeleteEvents: false,
    dispose: sinon.stub(),
  };
}

suite('FileWatcher', () => {
  let sandbox: sinon.SinonSandbox;
  let mockDetector: sinon.SinonStubbedInstance<BmadDetector>;
  let mockYamlWatcher: MockFileSystemWatcher;
  let mockMdWatcher: MockFileSystemWatcher;
  let createFileSystemWatcherStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Create mock detector
    mockDetector = sandbox.createStubInstance(BmadDetector);

    // Create mock watchers
    mockYamlWatcher = createMockFileSystemWatcher();
    mockMdWatcher = createMockFileSystemWatcher();

    // Stub workspace.createFileSystemWatcher to return our mocks
    let watcherCallCount = 0;
    createFileSystemWatcherStub = sandbox.stub(vscode.workspace, 'createFileSystemWatcher');
    createFileSystemWatcherStub.callsFake(() => {
      watcherCallCount++;
      // First call is for YAML, second for MD
      return watcherCallCount === 1 ? mockYamlWatcher : mockMdWatcher;
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  suite('Initialization', () => {
    test('initializes in stopped state', () => {
      const watcher = new FileWatcher(mockDetector);
      assert.strictEqual(watcher.state, 'stopped');
      watcher.dispose();
    });

    test('starts watching with valid outputRoot', () => {
      const outputRoot = vscode.Uri.file('/test/_bmad-output');
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot,
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      assert.strictEqual(watcher.state, 'running');
      assert.ok(createFileSystemWatcherStub.calledTwice, 'Should create two watchers');
      watcher.dispose();
    });

    test('stays stopped when outputRoot is null', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: null,
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      assert.strictEqual(watcher.state, 'stopped');
      assert.ok(createFileSystemWatcherStub.notCalled, 'Should not create watchers');
      watcher.dispose();
    });

    test('stays stopped when getBmadPaths returns null', () => {
      mockDetector.getBmadPaths.returns(null);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      assert.strictEqual(watcher.state, 'stopped');
      watcher.dispose();
    });
  });

  suite('Idempotent start()', () => {
    test('start() is idempotent when already running', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();
      const callCountAfterFirstStart = createFileSystemWatcherStub.callCount;

      watcher.start(); // Second call should be no-op

      assert.strictEqual(watcher.state, 'running');
      assert.strictEqual(createFileSystemWatcherStub.callCount, callCountAfterFirstStart);
      watcher.dispose();
    });

    test('start() is idempotent when in starting state', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new TestableFileWatcher(mockDetector);

      // Manually set to starting state (simulating slow initialization)
      watcher.setTestState('starting');

      watcher.start();

      assert.strictEqual(watcher.state, 'starting');
      assert.ok(createFileSystemWatcherStub.notCalled);
      watcher.dispose();
    });
  });

  suite('Debounce Logic', () => {
    let clock: sinon.SinonFakeTimers;

    beforeEach(() => {
      clock = sandbox.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
    });

    test('debounces rapid changes into single event', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      const events: FileChangeEvent[] = [];
      watcher.onDidChange((e) => events.push(e));

      // Simulate rapid file changes
      const uri1 = vscode.Uri.file('/test/_bmad-output/file1.yaml');
      const uri2 = vscode.Uri.file('/test/_bmad-output/file2.yaml');
      const uri3 = vscode.Uri.file('/test/_bmad-output/file3.md');

      mockYamlWatcher._onDidChange.fire(uri1);
      clock.tick(100);
      mockYamlWatcher._onDidChange.fire(uri2);
      clock.tick(100);
      mockMdWatcher._onDidChange.fire(uri3);

      // Before debounce completes, no events should have fired
      assert.strictEqual(events.length, 0);

      // Advance past debounce window
      clock.tick(500);

      // Now exactly one event should have fired with all changes batched
      assert.strictEqual(events.length, 1);
      assert.strictEqual(events[0].changes.size, 3);

      watcher.dispose();
    });

    test('resets debounce window on new changes', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      const events: FileChangeEvent[] = [];
      watcher.onDidChange((e) => events.push(e));

      const uri1 = vscode.Uri.file('/test/_bmad-output/file1.yaml');
      const uri2 = vscode.Uri.file('/test/_bmad-output/file2.yaml');

      // First change
      mockYamlWatcher._onDidChange.fire(uri1);
      clock.tick(400); // 400ms < 500ms debounce

      // Second change resets the timer
      mockYamlWatcher._onDidChange.fire(uri2);
      clock.tick(400); // Another 400ms, total 800ms but timer was reset

      // No event yet
      assert.strictEqual(events.length, 0);

      // Complete the debounce
      clock.tick(100); // Now 500ms since last change

      assert.strictEqual(events.length, 1);
      watcher.dispose();
    });

    test('change event includes all affected paths', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      const events: FileChangeEvent[] = [];
      watcher.onDidChange((e) => events.push(e));

      const uri1 = vscode.Uri.file('/test/_bmad-output/sprint-status.yaml');
      const uri2 = vscode.Uri.file('/test/_bmad-output/story.md');

      mockYamlWatcher._onDidChange.fire(uri1);
      mockMdWatcher._onDidCreate.fire(uri2);

      clock.tick(500);

      assert.strictEqual(events.length, 1);
      const changes = events[0].changes;
      assert.strictEqual(changes.get(uri1.fsPath), 'change');
      assert.strictEqual(changes.get(uri2.fsPath), 'create');

      watcher.dispose();
    });

    test('handles different change types correctly', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      const events: FileChangeEvent[] = [];
      watcher.onDidChange((e) => events.push(e));

      const createUri = vscode.Uri.file('/test/_bmad-output/new.yaml');
      const changeUri = vscode.Uri.file('/test/_bmad-output/existing.yaml');
      const deleteUri = vscode.Uri.file('/test/_bmad-output/deleted.md');

      mockYamlWatcher._onDidCreate.fire(createUri);
      mockYamlWatcher._onDidChange.fire(changeUri);
      mockMdWatcher._onDidDelete.fire(deleteUri);

      clock.tick(500);

      assert.strictEqual(events.length, 1);
      const changes = events[0].changes;
      assert.strictEqual(changes.get(createUri.fsPath), 'create');
      assert.strictEqual(changes.get(changeUri.fsPath), 'change');
      assert.strictEqual(changes.get(deleteUri.fsPath), 'delete');

      watcher.dispose();
    });
  });

  suite('Error Handling', () => {
    test('emits error event on watcher creation failure', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      createFileSystemWatcherStub.throws(new Error('Watcher creation failed'));

      const watcher = new FileWatcher(mockDetector);
      const errors: FileWatcherError[] = [];
      watcher.onError((e) => errors.push(e));

      watcher.start();

      assert.strictEqual(watcher.state, 'error');
      assert.strictEqual(errors.length, 1);
      assert.ok(errors[0].message.includes('Watcher creation failed'));
      assert.strictEqual(errors[0].recoverable, true);

      watcher.dispose();
    });

    test('isHealthy() returns false when in error state', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      createFileSystemWatcherStub.throws(new Error('Test error'));

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      assert.strictEqual(watcher.isHealthy(), false);
      watcher.dispose();
    });

    test('isHealthy() returns true when running', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      assert.strictEqual(watcher.isHealthy(), true);
      watcher.dispose();
    });
  });

  suite('Lifecycle Management', () => {
    test('stop() transitions from running to stopped', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();
      assert.strictEqual(watcher.state, 'running');

      watcher.stop();
      assert.strictEqual(watcher.state, 'stopped');

      watcher.dispose();
    });

    test('restart() recovers from error state', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      // First call throws, second succeeds
      createFileSystemWatcherStub.onFirstCall().throws(new Error('Test error'));
      createFileSystemWatcherStub.onSecondCall().returns(mockYamlWatcher);
      createFileSystemWatcherStub.onThirdCall().returns(mockMdWatcher);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();
      assert.strictEqual(watcher.state, 'error');

      watcher.restart();
      assert.strictEqual(watcher.state, 'running');

      watcher.dispose();
    });

    test('dispose() cleans up all watchers', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      watcher.dispose();

      assert.ok(mockYamlWatcher.dispose.called, 'YAML watcher should be disposed');
      assert.ok(mockMdWatcher.dispose.called, 'MD watcher should be disposed');
    });

    test('stop() clears pending debounce', () => {
      const clock = sandbox.useFakeTimers();
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      const events: FileChangeEvent[] = [];
      watcher.onDidChange((e) => events.push(e));

      // Trigger a change
      const uri = vscode.Uri.file('/test/_bmad-output/file.yaml');
      mockYamlWatcher._onDidChange.fire(uri);

      // Stop before debounce completes
      watcher.stop();

      // Advance time past debounce
      clock.tick(600);

      // No event should fire
      assert.strictEqual(events.length, 0);

      clock.restore();
      watcher.dispose();
    });

    test('can restart after stop', () => {
      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();
      assert.strictEqual(watcher.state, 'running');

      watcher.stop();
      assert.strictEqual(watcher.state, 'stopped');

      // Reset stub for second start
      createFileSystemWatcherStub.resetHistory();

      watcher.start();
      assert.strictEqual(watcher.state, 'running');

      watcher.dispose();
    });

    test('restart() initializes watchers when outputRoot becomes available later', () => {
      // Initially, outputRoot is null (no _bmad-output/ directory)
      const pathsWithoutOutput: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: null,
      };
      mockDetector.getBmadPaths.returns(pathsWithoutOutput);

      const watcher = new FileWatcher(mockDetector);
      watcher.start();

      // Should stay stopped because outputRoot is null
      assert.strictEqual(watcher.state, 'stopped');
      assert.ok(createFileSystemWatcherStub.notCalled, 'No watchers should be created');

      // Now outputRoot becomes available (user created _bmad-output/)
      const pathsWithOutput: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(pathsWithOutput);

      // Restart should now successfully initialize watchers
      watcher.restart();

      assert.strictEqual(watcher.state, 'running');
      assert.ok(
        createFileSystemWatcherStub.calledTwice,
        'Should create two watchers after restart'
      );

      watcher.dispose();
    });
  });

  suite('State Property', () => {
    test('exposes state property for status queries', () => {
      const watcher = new FileWatcher(mockDetector);

      assert.strictEqual(watcher.state, 'stopped');

      const paths: BmadPaths = {
        bmadRoot: vscode.Uri.file('/test/_bmad'),
        outputRoot: vscode.Uri.file('/test/_bmad-output'),
      };
      mockDetector.getBmadPaths.returns(paths);

      watcher.start();
      assert.strictEqual(watcher.state, 'running');

      watcher.stop();
      assert.strictEqual(watcher.state, 'stopped');

      watcher.dispose();
    });
  });
});
