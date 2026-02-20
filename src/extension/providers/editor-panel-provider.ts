import * as vscode from 'vscode';
import type { StateManager } from '../services/state-manager';
import { createStateUpdateMessage } from '../../shared/messages';
import { handleWebviewMessage } from './message-handler';
import { getNonce } from './webview-utils';

/**
 * Provider for the BMAD Editor Panel webview in the editor area.
 * Uses singleton pattern — only one editor panel instance exists at a time.
 */
export class EditorPanelProvider implements vscode.Disposable {
  public static readonly viewType = 'bmad.editorPanel';
  private static currentPanel: EditorPanelProvider | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  /**
   * Dispose the current singleton panel if it exists.
   * Called from extension deactivation to ensure cleanup.
   */
  public static disposePanel(): void {
    EditorPanelProvider.currentPanel?.dispose();
  }

  public static createOrShow(
    extensionUri: vscode.Uri,
    stateManager: StateManager
  ): EditorPanelProvider {
    // If panel exists, reveal it
    if (EditorPanelProvider.currentPanel) {
      EditorPanelProvider.currentPanel.panel.reveal(vscode.ViewColumn.One);
      return EditorPanelProvider.currentPanel;
    }
    // Create new panel
    const panel = vscode.window.createWebviewPanel(
      EditorPanelProvider.viewType,
      'BMAD Project',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'out'),
          vscode.Uri.joinPath(extensionUri, 'src', 'webviews'),
        ],
        retainContextWhenHidden: true,
      }
    );
    EditorPanelProvider.currentPanel = new EditorPanelProvider(panel, extensionUri, stateManager);
    return EditorPanelProvider.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    extensionUri: vscode.Uri,
    private readonly stateManager: StateManager
  ) {
    this.panel = panel;

    // Set HTML content
    this.panel.webview.html = this.getHtmlForWebview(extensionUri);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      (message: unknown) => {
        handleWebviewMessage(message, this.stateManager);
      },
      undefined,
      this.disposables
    );

    // Subscribe to state changes and forward to webview
    this.disposables.push(
      this.stateManager.onStateChange((state) => {
        void this.panel.webview.postMessage(createStateUpdateMessage(state));
      })
    );

    // Send current state immediately
    void this.panel.webview.postMessage(createStateUpdateMessage(this.stateManager.state));

    // On dispose: clear singleton ref
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
  }

  public dispose(): void {
    if (EditorPanelProvider.currentPanel !== this) {
      return; // Already disposed or not the active panel
    }
    EditorPanelProvider.currentPanel = undefined;
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables.length = 0;
  }

  private getHtmlForWebview(extensionUri: vscode.Uri): string {
    const webview = this.panel.webview;

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(extensionUri, 'out', 'webview', 'index.css')
    );

    const nonce = getNonce();

    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}'; img-src ${webview.cspSource} data:;">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${styleUri.toString()}" rel="stylesheet" />
        <title>BMAD Project</title>
      </head>
      <body>
        <div id="root" data-view="editor-panel"></div>
        <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
      </body>
      </html>
    `;
  }
}
