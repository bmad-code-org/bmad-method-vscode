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
  private static readonly TERMINAL_NAME = 'BMAD';

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
        void this.openDocument(msg.payload.path, msg.payload.forceTextEditor);
        break;
      case ToExtensionType.EXECUTE_WORKFLOW:
        void this.executeWorkflow(msg.payload.command);
        break;
      case ToExtensionType.COPY_COMMAND:
        void this.copyCommand(msg.payload.command);
        break;
    }
  }

  /**
   * Open a document in the editor by relative path.
   * Markdown files open in preview by default; pass forceTextEditor to open as text.
   */
  private async openDocument(relativePath: string, forceTextEditor?: boolean): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    const documentUri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);

    try {
      if (!forceTextEditor && relativePath.endsWith('.md')) {
        await vscode.commands.executeCommand('markdown.showPreview', documentUri);
      } else {
        const document = await vscode.workspace.openTextDocument(documentUri);
        await vscode.window.showTextDocument(document, { preview: true });
      }
    } catch {
      void vscode.window.showErrorMessage(`Could not open: ${relativePath}`);
    }
  }

  /**
   * Execute a workflow command in a BMAD terminal.
   * Prepends the configured CLI prefix (bmad.cliPrefix, default "claude") to the command.
   */
  private executeWorkflow(command: string): void {
    try {
      const config = vscode.workspace.getConfiguration('bmad');
      const cliPrefix = config.get<string>('cliPrefix', 'claude');
      let terminal = vscode.window.terminals.find(
        (t) => t.name === DashboardViewProvider.TERMINAL_NAME
      );
      if (!terminal) {
        terminal = vscode.window.createTerminal(DashboardViewProvider.TERMINAL_NAME);
      }
      terminal.show();
      terminal.sendText(`${cliPrefix} ${command}`);
    } catch {
      void vscode.window.showErrorMessage('Failed to execute workflow command');
    }
  }

  /**
   * Copy a command string to the clipboard
   */
  private async copyCommand(command: string): Promise<void> {
    try {
      await vscode.env.clipboard.writeText(command);
      void vscode.window.showInformationMessage('Command copied to clipboard');
    } catch {
      void vscode.window.showErrorMessage('Failed to copy command to clipboard');
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
