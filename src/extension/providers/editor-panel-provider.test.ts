import { suite, test, beforeEach, afterEach } from 'mocha';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as sinon from 'sinon';
import { EditorPanelProvider } from './editor-panel-provider';

/**
 * Create a mock StateManager with controllable state and event emission.
 */
function createMockStateManager() {
  const stateChangeHandlers: ((state: unknown) => void)[] = [];

  return {
    state: {
      sprint: null,
      epics: [],
      currentStory: null,
      errors: [],
      loading: false,
      outputRoot: null,
      workflows: [],
      bmadMetadata: null,
      planningArtifacts: {
        hasProductBrief: false,
        hasPrd: false,
        hasArchitecture: false,
        hasEpics: false,
        hasReadinessReport: false,
      },
    },
    onStateChange: (handler: (state: unknown) => void) => {
      stateChangeHandlers.push(handler);
      return { dispose: () => {} };
    },
    refresh: sinon.stub().resolves(),
    emitStateChange: (state: unknown) => {
      for (const handler of stateChangeHandlers) {
        handler(state);
      }
    },
  };
}

suite('EditorPanelProvider - Singleton lifecycle', () => {
  let sandbox: sinon.SinonSandbox;
  let createWebviewPanelStub: sinon.SinonStub;
  let mockPanel: {
    webview: {
      html: string;
      onDidReceiveMessage: sinon.SinonStub;
      postMessage: sinon.SinonStub;
      asWebviewUri: (uri: vscode.Uri) => vscode.Uri;
      cspSource: string;
      options: vscode.WebviewOptions;
    };
    reveal: sinon.SinonStub;
    onDidDispose: sinon.SinonStub;
    dispose: sinon.SinonStub;
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Reset singleton - access via any since it's private static
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (EditorPanelProvider as any).currentPanel = undefined;

    mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: sandbox.stub().returns({ dispose: () => {} }),
        postMessage: sandbox.stub().resolves(true),
        asWebviewUri: (uri: vscode.Uri) => uri,
        cspSource: 'https://test.csp',
        options: {},
      },
      reveal: sandbox.stub(),
      onDidDispose: sandbox.stub().returns({ dispose: () => {} }),
      dispose: sandbox.stub(),
    };

    createWebviewPanelStub = sandbox
      .stub(vscode.window, 'createWebviewPanel')
      .returns(mockPanel as unknown as vscode.WebviewPanel);
  });

  afterEach(() => {
    // Reset singleton after each test
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (EditorPanelProvider as any).currentPanel = undefined;
    sandbox.restore();
  });

  test('createOrShow creates a new panel on first call', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    assert.ok(createWebviewPanelStub.calledOnce, 'Should create a new webview panel');
    assert.strictEqual(
      createWebviewPanelStub.firstCall.args[0],
      'bmad.editorPanel',
      'Should use correct viewType'
    );
    assert.strictEqual(
      createWebviewPanelStub.firstCall.args[1],
      'BMAD Project',
      'Should use correct title'
    );
  });

  test('createOrShow reveals existing panel on second call', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    assert.ok(createWebviewPanelStub.calledOnce, 'Should NOT create a second panel');
    assert.ok(mockPanel.reveal.calledOnce, 'Should reveal existing panel');
  });

  test('panel HTML contains data-view="editor-panel" attribute', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    const html = mockPanel.webview.html;
    assert.ok(
      html.includes('data-view="editor-panel"'),
      'HTML should contain data-view="editor-panel"'
    );
  });

  test('panel HTML uses same script and style bundles as sidebar', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    const html = mockPanel.webview.html;
    assert.ok(html.includes('index.js'), 'HTML should reference index.js bundle');
    assert.ok(html.includes('index.css'), 'HTML should reference index.css bundle');
  });

  test('panel HTML has CSP nonce', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    const html = mockPanel.webview.html;
    assert.ok(html.includes('nonce-'), 'HTML should contain CSP nonce');
  });

  test('sends current state immediately on creation', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    assert.ok(mockPanel.webview.postMessage.calledOnce, 'Should post initial state');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const sentMessageType = mockPanel.webview.postMessage.firstCall.args[0].type;
    assert.strictEqual(sentMessageType, 'STATE_UPDATE', 'Should send STATE_UPDATE');
  });

  test('onDidDispose clears singleton reference allowing new panel creation', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    // Simulate dispose
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const disposeCallback: () => void = mockPanel.onDidDispose.firstCall.args[0];
    disposeCallback();

    // Now createOrShow should create a new panel
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    assert.ok(createWebviewPanelStub.calledTwice, 'Should create a second panel after dispose');
  });

  test('panel options include retainContextWhenHidden', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const options1 = createWebviewPanelStub.firstCall.args[3];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    assert.strictEqual(options1.retainContextWhenHidden, true, 'Should retain context when hidden');
  });

  test('panel options enable scripts', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const options2 = createWebviewPanelStub.firstCall.args[3];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    assert.strictEqual(options2.enableScripts, true, 'Should enable scripts');
  });
});

suite('EditorPanelProvider - Message handling', () => {
  let sandbox: sinon.SinonSandbox;
  let mockPanel: {
    webview: {
      html: string;
      onDidReceiveMessage: sinon.SinonStub;
      postMessage: sinon.SinonStub;
      asWebviewUri: (uri: vscode.Uri) => vscode.Uri;
      cspSource: string;
      options: vscode.WebviewOptions;
    };
    reveal: sinon.SinonStub;
    onDidDispose: sinon.SinonStub;
    dispose: sinon.SinonStub;
  };

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    // Reset singleton
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (EditorPanelProvider as any).currentPanel = undefined;

    mockPanel = {
      webview: {
        html: '',
        onDidReceiveMessage: sandbox.stub().returns({ dispose: () => {} }),
        postMessage: sandbox.stub().resolves(true),
        asWebviewUri: (uri: vscode.Uri) => uri,
        cspSource: 'https://test.csp',
        options: {},
      },
      reveal: sandbox.stub(),
      onDidDispose: sandbox.stub().returns({ dispose: () => {} }),
      dispose: sandbox.stub(),
    };

    sandbox
      .stub(vscode.window, 'createWebviewPanel')
      .returns(mockPanel as unknown as vscode.WebviewPanel);
  });

  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (EditorPanelProvider as any).currentPanel = undefined;
    sandbox.restore();
  });

  test('handles REFRESH message by calling stateManager.refresh', async () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    // Get the message handler registered via onDidReceiveMessage
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const messageHandler: (msg: unknown) => void =
      mockPanel.webview.onDidReceiveMessage.firstCall.args[0];
    messageHandler({ type: 'REFRESH' });

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.ok(stateManager.refresh.calledOnce, 'Should call stateManager.refresh');
  });

  test('forwards state changes to webview', () => {
    const stateManager = createMockStateManager();
    EditorPanelProvider.createOrShow(vscode.Uri.file('/test'), stateManager as never);

    // Reset post count (initial state already sent)
    mockPanel.webview.postMessage.resetHistory();

    const newState = { ...stateManager.state, loading: true };
    stateManager.emitStateChange(newState);

    assert.ok(mockPanel.webview.postMessage.calledOnce, 'Should forward state change');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const sentType = mockPanel.webview.postMessage.firstCall.args[0].type;
    assert.strictEqual(sentType, 'STATE_UPDATE');
  });
});
