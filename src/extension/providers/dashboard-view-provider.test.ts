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
    assert.strictEqual(createTerminalStub.firstCall.args[0], 'BMAD');
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
});
