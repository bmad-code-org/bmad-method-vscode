import * as vscode from 'vscode';
import type { DetectionResult } from '../services/bmad-detector';
import type { StateManager } from '../services/state-manager';
import type { ToExtension } from '../../shared/messages';
import { ToExtensionType, createStateUpdateMessage } from '../../shared/messages';

/**
 * Provider for the BMAD Dashboard webview in the sidebar
 */
export class DashboardViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'bmad.dashboardView';

  private view?: vscode.WebviewView;
  private readonly disposables: vscode.Disposable[] = [];

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly detectionResult: DetectionResult,
    private readonly stateManager?: StateManager
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this.view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'out'),
        vscode.Uri.joinPath(this.extensionUri, 'src', 'webviews'),
      ],
    };

    webviewView.webview.html = this.getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(
      (message: unknown) => {
        this.handleMessage(message);
      },
      undefined,
      this.disposables
    );

    // Subscribe to state changes and forward to webview
    if (this.stateManager) {
      this.disposables.push(
        this.stateManager.onStateChange((state) => {
          if (this.view) {
            void this.view.webview.postMessage(createStateUpdateMessage(state));
          }
        })
      );

      // Send current state immediately so webview doesn't need a round-trip REFRESH
      void webviewView.webview.postMessage(createStateUpdateMessage(this.stateManager.state));

      // Send initial state when webview becomes visible again after being hidden
      webviewView.onDidChangeVisibility(
        () => {
          if (webviewView.visible && this.stateManager) {
            void this.view!.webview.postMessage(createStateUpdateMessage(this.stateManager.state));
          }
        },
        undefined,
        this.disposables
      );
    }
  }

  /**
   * Handle messages from the webview
   */
  private handleMessage(message: unknown): void {
    if (!message || typeof message !== 'object' || !('type' in message)) {
      return;
    }
    const msg = message as ToExtension;
    switch (msg.type) {
      case ToExtensionType.REFRESH:
        if (this.stateManager) {
          void this.stateManager.refresh();
        }
        break;
      case ToExtensionType.OPEN_DOCUMENT:
        // Placeholder for Epic 5
        break;
      case ToExtensionType.EXECUTE_WORKFLOW:
      case ToExtensionType.COPY_COMMAND:
        // Placeholder for Epic 4
        break;
    }
  }

  /**
   * Generate the HTML content for the webview
   */
  private getHtmlForWebview(webview: vscode.Webview): string {
    if (!this.detectionResult.detected) {
      return this.getNotDetectedHtml(webview);
    }

    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'out', 'webview', 'index.css')
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
        <title>BMAD Dashboard</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri.toString()}"></script>
      </body>
      </html>
    `;
  }

  /**
   * Generate HTML for non-BMAD workspaces
   */
  private getNotDetectedHtml(_webview: vscode.Webview): string {
    return /* html */ `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>BMAD Dashboard</title>
      </head>
      <body>
        <div style="padding: 16px; text-align: center; color: var(--vscode-descriptionForeground);">
          <p>Not a BMAD project</p>
          <p style="font-size: 12px;">Open a workspace with a <code>_bmad/</code> directory to use the BMAD Dashboard.</p>
        </div>
      </body>
      </html>
    `;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
