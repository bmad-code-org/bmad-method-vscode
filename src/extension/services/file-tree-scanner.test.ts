/* eslint-disable @typescript-eslint/require-await -- mock readDirectory functions return Promise without await */
import { suite, test, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { FileTreeScanner } from './file-tree-scanner';

/**
 * Testable subclass that allows mocking file system operations.
 */
class TestableFileTreeScanner extends FileTreeScanner {
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

  public testResolvePath(
    workspaceRoot: vscode.Uri,
    folderPath: string,
    outputRoot: string
  ): vscode.Uri {
    return this.resolvePath(workspaceRoot, folderPath, outputRoot);
  }
}

suite('FileTreeScanner', () => {
  let scanner: TestableFileTreeScanner;
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    scanner = new TestableFileTreeScanner();
  });

  afterEach(() => {
    sandbox.restore();
  });

  suite('resolvePath', () => {
    const workspaceRoot = vscode.Uri.file('/test/workspace');

    test('resolves planning-artifacts relative to outputRoot', () => {
      const result = scanner.testResolvePath(workspaceRoot, 'planning-artifacts', '_bmad-output');
      assert.ok(result.fsPath.includes('_bmad-output'));
      assert.ok(result.fsPath.includes('planning-artifacts'));
    });

    test('resolves implementation-artifacts relative to outputRoot', () => {
      const result = scanner.testResolvePath(
        workspaceRoot,
        'implementation-artifacts',
        '_bmad-output'
      );
      assert.ok(result.fsPath.includes('_bmad-output'));
      assert.ok(result.fsPath.includes('implementation-artifacts'));
    });

    test('resolves other paths relative to workspace root', () => {
      const result = scanner.testResolvePath(workspaceRoot, 'docs', '_bmad-output');
      assert.ok(!result.fsPath.includes('_bmad-output'));
      assert.ok(result.fsPath.includes('docs'));
    });

    test('resolves custom paths relative to workspace root', () => {
      const result = scanner.testResolvePath(workspaceRoot, 'my-custom-docs', '_bmad-output');
      assert.ok(!result.fsPath.includes('_bmad-output'));
      assert.ok(result.fsPath.includes('my-custom-docs'));
    });
  });

  suite('scan', () => {
    test('returns empty array when no workspace folder exists', async () => {
      sandbox.stub(vscode.workspace, 'workspaceFolders').value(undefined);
      const result = await scanner.scan();
      assert.deepStrictEqual(result, []);
    });

    test('returns roots for configured paths', async () => {
      sandbox
        .stub(vscode.workspace, 'workspaceFolders')
        .value([{ uri: vscode.Uri.file('/test/workspace'), name: 'workspace', index: 0 }]);

      sandbox.stub(vscode.workspace, 'getConfiguration').returns({
        get: (key: string, defaultValue?: unknown) => {
          if (key === 'docLibraryPaths') return ['docs'];
          if (key === 'outputRoot') return '_bmad-output';
          return defaultValue;
        },
      } as unknown as vscode.WorkspaceConfiguration);

      scanner.setReadDirectoryMock(async () => [
        ['readme.md', vscode.FileType.File],
        ['guide.md', vscode.FileType.File],
      ]);

      // Mock asRelativePath to return predictable paths
      sandbox
        .stub(vscode.workspace, 'asRelativePath')
        .callsFake((pathOrUri: string | vscode.Uri) => {
          const p = typeof pathOrUri === 'string' ? pathOrUri : pathOrUri.fsPath;
          // Return just the portion after workspace root
          return p.replace(/.*[/\\]test[/\\]workspace[/\\]?/, '') || 'docs';
        });

      const result = await scanner.scan();
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'docs');
      assert.strictEqual(result[0].type, 'directory');
      assert.strictEqual(result[0].children?.length, 2);
    });

    test('filters out non-included file extensions', async () => {
      sandbox
        .stub(vscode.workspace, 'workspaceFolders')
        .value([{ uri: vscode.Uri.file('/test/workspace'), name: 'workspace', index: 0 }]);

      sandbox.stub(vscode.workspace, 'getConfiguration').returns({
        get: (key: string, defaultValue?: unknown) => {
          if (key === 'docLibraryPaths') return ['docs'];
          if (key === 'outputRoot') return '_bmad-output';
          return defaultValue;
        },
      } as unknown as vscode.WorkspaceConfiguration);

      scanner.setReadDirectoryMock(async () => [
        ['readme.md', vscode.FileType.File],
        ['image.png', vscode.FileType.File],
        ['binary.exe', vscode.FileType.File],
        ['config.yaml', vscode.FileType.File],
        ['data.json', vscode.FileType.File],
      ]);

      sandbox
        .stub(vscode.workspace, 'asRelativePath')
        .callsFake((pathOrUri: string | vscode.Uri) => {
          const p = typeof pathOrUri === 'string' ? pathOrUri : pathOrUri.fsPath;
          return p.replace(/.*[/\\]test[/\\]workspace[/\\]?/, '') || 'docs';
        });

      const result = await scanner.scan();
      assert.strictEqual(result[0].children?.length, 3); // .md, .yaml, .json
      const names = result[0].children?.map((c) => c.name);
      assert.ok(names?.includes('readme.md'));
      assert.ok(names?.includes('config.yaml'));
      assert.ok(names?.includes('data.json'));
      assert.ok(!names?.includes('image.png'));
      assert.ok(!names?.includes('binary.exe'));
    });

    test('sorts directories first, then files alphabetically with index.md first', async () => {
      sandbox
        .stub(vscode.workspace, 'workspaceFolders')
        .value([{ uri: vscode.Uri.file('/test/workspace'), name: 'workspace', index: 0 }]);

      sandbox.stub(vscode.workspace, 'getConfiguration').returns({
        get: (key: string, defaultValue?: unknown) => {
          if (key === 'docLibraryPaths') return ['docs'];
          if (key === 'outputRoot') return '_bmad-output';
          return defaultValue;
        },
      } as unknown as vscode.WorkspaceConfiguration);

      const callCount = { n: 0 };
      scanner.setReadDirectoryMock(async () => {
        callCount.n++;
        if (callCount.n === 1) {
          // Root directory
          return [
            ['zebra.md', vscode.FileType.File],
            ['subdir', vscode.FileType.Directory],
            ['index.md', vscode.FileType.File],
            ['alpha.md', vscode.FileType.File],
          ] as [string, vscode.FileType][];
        }
        // Subdirectory
        return [['nested.md', vscode.FileType.File]] as [string, vscode.FileType][];
      });

      sandbox
        .stub(vscode.workspace, 'asRelativePath')
        .callsFake((pathOrUri: string | vscode.Uri) => {
          const p = typeof pathOrUri === 'string' ? pathOrUri : pathOrUri.fsPath;
          return p.replace(/.*[/\\]test[/\\]workspace[/\\]?/, '') || 'docs';
        });

      const result = await scanner.scan();
      const children = result[0].children!;

      // Directory first
      assert.strictEqual(children[0].type, 'directory');
      assert.strictEqual(children[0].name, 'subdir');

      // Then index.md first among files
      assert.strictEqual(children[1].name, 'index.md');
      assert.strictEqual(children[2].name, 'alpha.md');
      assert.strictEqual(children[3].name, 'zebra.md');
    });

    test('skips missing directories silently', async () => {
      sandbox
        .stub(vscode.workspace, 'workspaceFolders')
        .value([{ uri: vscode.Uri.file('/test/workspace'), name: 'workspace', index: 0 }]);

      sandbox.stub(vscode.workspace, 'getConfiguration').returns({
        get: (key: string, defaultValue?: unknown) => {
          if (key === 'docLibraryPaths') return ['nonexistent', 'docs'];
          if (key === 'outputRoot') return '_bmad-output';
          return defaultValue;
        },
      } as unknown as vscode.WorkspaceConfiguration);

      const callCount = { n: 0 };
      scanner.setReadDirectoryMock(async (uri: vscode.Uri) => {
        callCount.n++;
        if (uri.fsPath.includes('nonexistent')) {
          throw new Error('Directory not found');
        }
        return [['readme.md', vscode.FileType.File]] as [string, vscode.FileType][];
      });

      sandbox
        .stub(vscode.workspace, 'asRelativePath')
        .callsFake((pathOrUri: string | vscode.Uri) => {
          const p = typeof pathOrUri === 'string' ? pathOrUri : pathOrUri.fsPath;
          return p.replace(/.*[/\\]test[/\\]workspace[/\\]?/, '') || 'docs';
        });

      const result = await scanner.scan();
      // Only 'docs' should appear, 'nonexistent' is skipped
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].name, 'docs');
    });
  });
});
