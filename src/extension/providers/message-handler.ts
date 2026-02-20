import * as path from 'path';
import * as vscode from 'vscode';
import type { StateManager } from '../services/state-manager';
import type { ToExtension } from '../../shared/messages';
import { ToExtensionType } from '../../shared/messages';

const TERMINAL_NAME = 'BMAD';
const VALID_COMMAND_PATTERN = /^\/bmad-[a-z0-9-]+$/;
const VALID_CLI_PREFIX_PATTERN = /^[a-zA-Z][a-zA-Z0-9._-]*$/;
const STORY_PATH_REGEX = /^(.+)\/implementation-artifacts\/(\d+)-(\d+[a-z]?)-[\w-]+\.md$/;

export interface MessageHandlerOptions {
  onNavigateEditorPanel?: (view: string, params?: Record<string, string>) => void;
}

/**
 * Handle messages from a webview (shared between sidebar and editor panel).
 */
export function handleWebviewMessage(
  message: unknown,
  stateManager: StateManager | undefined,
  options?: MessageHandlerOptions
): void {
  if (!message || typeof message !== 'object' || !('type' in message)) {
    return;
  }
  const msg = message as ToExtension;
  switch (msg.type) {
    case ToExtensionType.REFRESH:
      if (stateManager) {
        void stateManager.refresh();
      }
      break;
    case ToExtensionType.OPEN_DOCUMENT:
      void openDocument(msg.payload.path, msg.payload.forceTextEditor);
      break;
    case ToExtensionType.EXECUTE_WORKFLOW:
      executeWorkflow(msg.payload.command);
      break;
    case ToExtensionType.COPY_COMMAND:
      void copyCommand(msg.payload.command);
      break;
    case ToExtensionType.NAVIGATE_EDITOR_PANEL:
      if (options?.onNavigateEditorPanel) {
        options.onNavigateEditorPanel(msg.payload.view, msg.payload.params);
      }
      break;
    case ToExtensionType.REQUEST_DOCUMENT_CONTENT:
    case ToExtensionType.REQUEST_FILE_TREE:
      // Handled locally by EditorPanelProvider, not here
      break;
  }
}

/**
 * Open a document in the editor by relative path.
 * Markdown files open in preview by default; pass forceTextEditor to open as text.
 * Story files that don't exist yet fall back to opening epics.md at the story heading.
 */
async function openDocument(relativePath: string, forceTextEditor?: boolean): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return;
  }

  if (relativePath.includes('..') || path.isAbsolute(relativePath)) {
    return;
  }

  const documentUri = vscode.Uri.joinPath(workspaceFolder.uri, relativePath);

  const storyMatch = relativePath.match(STORY_PATH_REGEX);
  if (storyMatch) {
    const exists = await fileExists(documentUri);
    if (!exists) {
      const outputRoot = storyMatch[1];
      const epicNum = parseInt(storyMatch[2], 10);
      const storyNumRaw = storyMatch[3];
      const storyNum = parseInt(storyNumRaw, 10);
      const storySuffix = storyNumRaw.replace(/^\d+/, '');
      try {
        await openStoryFallback(
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

async function fileExists(uri: vscode.Uri): Promise<boolean> {
  try {
    await vscode.workspace.fs.stat(uri);
    return true;
  } catch {
    return false;
  }
}

async function openStoryFallback(
  workspaceFolderUri: vscode.Uri,
  outputRoot: string,
  epicNum: number,
  storyNum: number,
  storySuffix: string,
  forceTextEditor?: boolean
): Promise<void> {
  const epicsPath = `${outputRoot}/planning-artifacts/epics.md`;
  const epicsUri = vscode.Uri.joinPath(workspaceFolderUri, epicsPath);

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
    let previewUri = epicsUri;
    if (lineIndex >= 0) {
      const headingText = lines[lineIndex].replace(/^#+\s*/, '');
      const fragment = slugifyHeading(headingText);
      previewUri = epicsUri.with({ fragment });
    }
    await vscode.commands.executeCommand('markdown.showPreview', previewUri);
  }
}

function slugifyHeading(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{Nd}\p{Nl}\p{Pc}\- ]/gu, '')
    .replace(/\s/g, '-');
}

/**
 * Execute a workflow command in a BMAD terminal.
 */
function executeWorkflow(command: string): void {
  try {
    if (!VALID_COMMAND_PATTERN.test(command)) {
      void vscode.window.showErrorMessage('Invalid workflow command');
      return;
    }
    const config = vscode.workspace.getConfiguration('bmad');
    const cliPrefix = config.get<string>('cliPrefix', 'claude');
    if (!VALID_CLI_PREFIX_PATTERN.test(cliPrefix)) {
      void vscode.window.showErrorMessage(
        'Invalid bmad.cliPrefix setting. Must be a single command name (e.g., "claude").'
      );
      return;
    }
    let terminal = vscode.window.terminals.find((t) => t.name === TERMINAL_NAME);
    if (!terminal) {
      terminal = vscode.window.createTerminal({ name: TERMINAL_NAME });
    }
    terminal.show();
    terminal.sendText(`${cliPrefix} ${command}`);
  } catch {
    void vscode.window.showErrorMessage('Failed to execute workflow command');
  }
}

/**
 * Copy a command string to the clipboard.
 */
async function copyCommand(command: string): Promise<void> {
  try {
    await vscode.env.clipboard.writeText(command);
    void vscode.window.showInformationMessage('Command copied to clipboard');
  } catch {
    void vscode.window.showErrorMessage('Failed to copy command to clipboard');
  }
}
