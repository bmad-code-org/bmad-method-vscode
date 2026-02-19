import * as path from 'path';
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
  private static readonly VALID_COMMAND_PATTERN = /^\/bmad-[a-z0-9-]+$/;
  private static readonly VALID_CLI_PREFIX_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
  private static readonly STORY_PATH_REGEX =
    /^(.+)\/implementation-artifacts\/(\d+)-(\d+[a-z]?)-[\w-]+\.md$/;

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
        this.executeWorkflow(msg.payload.command);
        break;
      case ToExtensionType.COPY_COMMAND:
        void this.copyCommand(msg.payload.command);
        break;
    }
  }

  /**
   * Open a document in the editor by relative path.
   * Markdown files open in preview by default; pass forceTextEditor to open as text.
   * Story files that don't exist yet fall back to opening epics.md at the story heading.
   */
  private async openDocument(relativePath: string, forceTextEditor?: boolean): Promise<void> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      return;
    }

    if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
      return;
    }

    const documentUri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);

    // Check if this is a story file that might not exist yet
    const storyMatch = relativePath.match(DashboardViewProvider.STORY_PATH_REGEX);
    if (storyMatch) {
      const exists = await this.fileExists(documentUri);
      if (!exists) {
        const outputRoot = storyMatch[1];
        const epicNum = parseInt(storyMatch[2], 10);
        const storyNumRaw = storyMatch[3]; // e.g., "5" or "5a"
        const storyNum = parseInt(storyNumRaw, 10);
        const storySuffix = storyNumRaw.replace(/^\d+/, ''); // "" or "a"
        try {
          await this.openStoryFallback(
            workspaceFolder.uri,
            outputRoot,
            epicNum,
            storyNum,
            storySuffix,
            forceTextEditor
          );
        } catch {
          void vscode.window.showErrorMessage(`Could not open: ${relativePath}`);
        }
        return;
      }
    }

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
   * Check if a file exists using VS Code's workspace.fs API.
   */
  private async fileExists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fall back to opening epics.md scrolled to a story heading when the story file doesn't exist.
   * Normal click: opens markdown preview with URI fragment to scroll to the heading.
   * Ctrl+click (forceTextEditor): opens text editor scrolled to the heading line.
   */
  private async openStoryFallback(
    workspaceFolderUri: vscode.Uri,
    outputRoot: string,
    epicNum: number,
    storyNum: number,
    storySuffix: string,
    forceTextEditor?: boolean
  ): Promise<void> {
    const epicsPath = `${outputRoot}/planning-artifacts/epics.md`;
    const epicsUri = vscode.Uri.joinPath(workspaceFolderUri, epicsPath);

    // Read file content to find the story heading
    const document = await vscode.workspace.openTextDocument(epicsUri);
    const searchPattern = `### Story ${epicNum}.${storyNum}${storySuffix}:`;
    const text = document.getText();
    const lines = text.split('\n');
    const lineIndex = lines.findIndex((line) => line.startsWith(searchPattern));

    if (forceTextEditor) {
      const editor = await vscode.window.showTextDocument(document, { preview: true });
      if (lineIndex >= 0) {
        const range = new vscode.Range(lineIndex, 0, lineIndex, 0);
        editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
        editor.selection = new vscode.Selection(lineIndex, 0, lineIndex, 0);
      }
    } else {
      // Build URI with fragment for markdown preview scroll-to-heading
      let previewUri = epicsUri;
      if (lineIndex >= 0) {
        const headingText = lines[lineIndex].replace(/^#+\s*/, '');
        const fragment = DashboardViewProvider.slugifyHeading(headingText);
        previewUri = epicsUri.with({ fragment });
      }
      await vscode.commands.executeCommand('markdown.showPreview', previewUri);
    }
  }

  /**
   * Slugify a heading into a GitHub-compatible anchor fragment.
   * Mirrors VS Code's built-in github slugifier algorithm.
   */
  private static slugifyHeading(heading: string): string {
    return heading
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{Nd}\p{Nl}\p{Pc}\- ]/gu, '')
      .replace(/\s/g, '-');
  }

  /**
   * Execute a workflow command in a BMAD terminal.
   * Prepends the configured CLI prefix (bmad.cliPrefix, default "claude") to the command.
   * Validates command matches expected /bmad- pattern to prevent command injection.
   */
  private executeWorkflow(command: string): void {
    try {
      if (!DashboardViewProvider.VALID_COMMAND_PATTERN.test(command)) {
        void vscode.window.showErrorMessage('Invalid workflow command');
        return;
      }
      const config = vscode.workspace.getConfiguration('bmad');
      const cliPrefix = config.get<string>('cliPrefix', 'claude');
      if (!DashboardViewProvider.VALID_CLI_PREFIX_PATTERN.test(cliPrefix)) {
        void vscode.window.showErrorMessage(
          'Invalid bmad.cliPrefix setting. Must be a single command name (e.g., "claude").'
        );
        return;
      }
      let terminal = vscode.window.terminals.find(
        (t) => t.name === DashboardViewProvider.TERMINAL_NAME
      );
      if (!terminal) {
        terminal = vscode.window.createTerminal({ name: DashboardViewProvider.TERMINAL_NAME });
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
