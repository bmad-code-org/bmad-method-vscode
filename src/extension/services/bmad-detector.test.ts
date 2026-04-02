import { suite, test } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { BmadDetector, DetectionResult } from './bmad-detector';

/**
 * Create a minimal WorkspaceFolder pointing to the given URI.
 */
function makeWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder {
  return { uri, name: 'test', index: 0 };
}

suite('BmadDetector', () => {
  test('detects BMAD project when _bmad/ directory exists', async () => {
    // This test workspace (bmad-extension) contains a _bmad/ directory
    const detector = new BmadDetector();
    const result: DetectionResult = await detector.detectBmadProject();

    assert.strictEqual(result.detected, true, 'Should detect BMAD project');
    if (result.detected) {
      assert.ok(result.bmadRoot, 'Should have bmadRoot URI');
      assert.ok(
        result.bmadRoot.fsPath.endsWith('_bmad'),
        'bmadRoot should point to _bmad directory'
      );
    }
  });

  test('returns not-detected when _bmad/ directory is missing', async () => {
    const detector = new BmadDetector();
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders, 'Workspace folders should exist for this test');

    // Point to a subdirectory that does not contain _bmad/
    const nonexistentRoot = vscode.Uri.joinPath(
      workspaceFolders[0].uri,
      '__nonexistent_workspace__'
    );
    const result = await detector.detectWithFolders([makeWorkspaceFolder(nonexistentRoot)]);

    assert.strictEqual(result.detected, false, 'Should not detect BMAD project');
    if (!result.detected) {
      assert.strictEqual(result.reason, 'not-found', 'Reason should be not-found');
    }
  });

  test('handles no workspace open gracefully', async () => {
    const detector = new BmadDetector();
    const result = await detector.detectWithFolders(undefined);

    assert.strictEqual(result.detected, false, 'Should return not-detected');
    if (!result.detected) {
      assert.strictEqual(result.reason, 'no-workspace', 'Reason should be no-workspace');
    }
  });

  test('handles file system errors without throwing', async () => {
    const detector = new BmadDetector();
    // Use a valid-structure URI with a non-file scheme to provoke a file system error at stat time
    const badRoot = vscode.Uri.from({ scheme: 'invalid-scheme', path: '/not/a/real/path' });
    const result = await detector.detectWithFolders([makeWorkspaceFolder(badRoot)]);

    assert.strictEqual(result.detected, false, 'Should return not-detected on error');
  });

  test('returns not-detected when _bmad exists as a file (not a directory)', async () => {
    const detector = new BmadDetector();
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders, 'Workspace folders should exist for this test');

    // Point to the directory containing package.json, renamed as _bmad — not feasible,
    // so we use the src/ directory as workspace root: src/_bmad does not exist
    // Instead, verify via a direct stat that package.json (a known file) is not a directory.
    // We test the full flow by pointing the workspace root at a path where _bmad is a file.
    // Since we can't create files in tests, we verify the not-directory path via the
    // internal method. The TypeScript private modifier is compile-time only, so we
    // can access it for this edge case test.
    const fileUri = vscode.Uri.joinPath(workspaceFolders[0].uri, 'package.json');
    // Access private method via compile-time-only TypeScript restriction for edge case testing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const result = await (detector as any).checkDirectory(fileUri);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    assert.strictEqual(result.exists, false, 'A file should not be detected as a directory');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    assert.strictEqual(result.reason, 'not-directory', 'Reason should be not-directory');
  });

  test('getBmadPaths returns resolved paths when BMAD project detected', async () => {
    const detector = new BmadDetector();
    const result = await detector.detectBmadProject();

    assert.strictEqual(result.detected, true, 'Detection must succeed for this test');
    const paths = detector.getBmadPaths();
    assert.ok(paths, 'Should return paths');
    assert.ok(paths.bmadRoot, 'Should have bmadRoot path');
  });
});
