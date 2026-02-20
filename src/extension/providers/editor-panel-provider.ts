import * as vscode from 'vscode';
import matter from 'gray-matter';
import type { StateManager } from '../services/state-manager';
import {
  createStateUpdateMessage,
  createDocumentContentMessage,
  createNavigateToViewMessage,
  ToExtensionType,
} from '../../shared/messages';
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
        if (this.handleLocalMessage(message)) return;
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

  /**
   * Post a NAVIGATE_TO_VIEW message to the editor panel webview.
   * Used by the extension host to drive navigation from external triggers (e.g., sidebar).
   */
  public static postNavigateToView(view: string, params?: Record<string, string>): void {
    if (EditorPanelProvider.currentPanel) {
      void EditorPanelProvider.currentPanel.panel.webview.postMessage(
        createNavigateToViewMessage(view, params)
      );
    }
  }

  /**
   * Handle messages that require access to the panel's webview postMessage.
   * Returns true if the message was handled locally.
   */
  private handleLocalMessage(message: unknown): boolean {
    if (!message || typeof message !== 'object' || !('type' in message)) return false;
    const msg = message as { type: string; payload?: unknown };

    if (msg.type === ToExtensionType.REQUEST_DOCUMENT_CONTENT) {
      const payload = msg.payload as { path: string } | undefined;
      if (payload?.path) {
        void this.readAndSendDocumentContent(payload.path);
      }
      return true;
    }
    return false;
  }

  /**
   * Read a file and send its content back to the webview via DOCUMENT_CONTENT.
   */
  private async readAndSendDocumentContent(relativePath: string): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return;

    const documentUri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);
    try {
      const content = await vscode.workspace.fs.readFile(documentUri);
      const text = Buffer.from(content).toString('utf-8');
      let frontmatter: unknown = null;
      try {
        const parsed = matter(text);
        frontmatter = parsed.data && Object.keys(parsed.data).length > 0 ? parsed.data : null;
      } catch {
        // Frontmatter parse failure is non-fatal
      }
      void this.panel.webview.postMessage(
        createDocumentContentMessage(relativePath, text, frontmatter)
      );
    } catch {
      // File not found or unreadable — send empty content so loading stops
      void this.panel.webview.postMessage(createDocumentContentMessage(relativePath, ''));
    }
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
