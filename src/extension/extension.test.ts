import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension', () => {
  test('extension should be present', () => {
    const extension = vscode.extensions.getExtension('elvince.bmad-dashboard');
    assert.ok(extension, 'Extension should be found by ID');
  });

  test('extension should activate', async () => {
    const extension = vscode.extensions.getExtension('elvince.bmad-dashboard');
    assert.ok(extension, 'Extension should be found');
    if (!extension.isActive) {
      await extension.activate();
    }
    assert.ok(extension.isActive, 'Extension should be active');
  });
});
