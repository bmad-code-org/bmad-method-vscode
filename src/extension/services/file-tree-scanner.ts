import * as vscode from 'vscode';
import type { FileTreeNode } from '../../shared/types/file-tree';

/** File extensions to include in the document library tree */
const INCLUDED_EXTENSIONS = new Set(['.md', '.yaml', '.yml', '.json', '.ts', '.tsx']);

/** Maximum directory nesting depth to prevent runaway scanning */
const MAX_DEPTH = 5;

/** Known output subfolders that resolve relative to outputRoot */
const OUTPUT_SUBFOLDERS = new Set(['planning-artifacts', 'implementation-artifacts']);

/**
 * Service that scans configured directories and builds a FileTreeNode[] tree
 * for the document library view.
 *
 * Uses vscode.workspace.fs (NOT Node.js fs) for remote development compatibility.
 */
export class FileTreeScanner {
  /**
   * Scan configured doc library paths and return the file tree.
   * Each configured path becomes a root node in the returned array.
   */
  async scan(): Promise<FileTreeNode[]> {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return [];

    const config = vscode.workspace.getConfiguration('bmad');
    const paths = config.get<string[]>('docLibraryPaths', [
      'planning-artifacts',
      'implementation-artifacts',
      'docs',
    ]);
    const outputRoot = config.get<string>('outputRoot', '_bmad-output');

    const roots: FileTreeNode[] = [];

    for (const folderPath of paths) {
      const resolved = this.resolvePath(workspaceFolder.uri, folderPath, outputRoot);
      // eslint-disable-next-line no-await-in-loop -- sequential directory traversal is intentional
      const node = await this.scanDirectory(resolved, folderPath, 0);
      if (node) {
        roots.push(node);
      }
    }

    return roots;
  }

  /**
   * Resolve a configured path to an absolute URI.
   * Output subfolders (planning-artifacts, implementation-artifacts) resolve
   * relative to outputRoot. Other paths resolve relative to workspace root.
   */
  protected resolvePath(
    workspaceRoot: vscode.Uri,
    folderPath: string,
    outputRoot: string
  ): vscode.Uri {
    if (OUTPUT_SUBFOLDERS.has(folderPath)) {
      return vscode.Uri.joinPath(workspaceRoot, outputRoot, folderPath);
    }
    return vscode.Uri.joinPath(workspaceRoot, folderPath);
  }

  /**
   * Recursively scan a directory and build a FileTreeNode.
   * Returns null if the directory doesn't exist or is empty.
   */
  private async scanDirectory(
    uri: vscode.Uri,
    displayName: string,
    depth: number
  ): Promise<FileTreeNode | null> {
    if (depth > MAX_DEPTH) return null;

    let entries: [string, vscode.FileType][];
    try {
      entries = await this.readDirectory(uri);
    } catch {
      // Directory doesn't exist or isn't readable — skip silently
      return null;
    }

    const children: FileTreeNode[] = [];

    // Separate directories and files
    const dirs: [string, vscode.FileType][] = [];
    const files: [string, vscode.FileType][] = [];

    for (const entry of entries) {
      if (entry[1] & vscode.FileType.Directory) {
        dirs.push(entry);
      } else if (entry[1] & vscode.FileType.File) {
        const ext = this.getExtension(entry[0]);
        if (INCLUDED_EXTENSIONS.has(ext)) {
          files.push(entry);
        }
      }
    }

    // Sort directories alphabetically
    dirs.sort((a, b) => a[0].localeCompare(b[0]));
    // Sort files: index.md first, then alphabetically
    files.sort((a, b) => {
      if (a[0] === 'index.md') return -1;
      if (b[0] === 'index.md') return 1;
      return a[0].localeCompare(b[0]);
    });

    // Process directories first
    for (const [name] of dirs) {
      const childUri = vscode.Uri.joinPath(uri, name);
      const relativePath = this.getRelativePath(childUri);
      // eslint-disable-next-line no-await-in-loop -- sequential directory traversal is intentional
      const child = await this.scanDirectory(childUri, name, depth + 1);
      if (child) {
        // Use the computed relative path instead of recursion's displayName-based path
        child.path = relativePath;
        children.push(child);
      }
    }

    // Then files
    for (const [name] of files) {
      const childUri = vscode.Uri.joinPath(uri, name);
      children.push({
        name,
        path: this.getRelativePath(childUri),
        type: 'file',
      });
    }

    const relativePath = this.getRelativePath(uri);

    return {
      name: displayName,
      path: relativePath,
      type: 'directory',
      children,
    };
  }

  /**
   * Read directory entries. Protected for testability.
   */
  protected async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    return vscode.workspace.fs.readDirectory(uri);
  }

  /**
   * Get path relative to workspace root.
   */
  private getRelativePath(uri: vscode.Uri): string {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) return uri.fsPath;
    return vscode.workspace.asRelativePath(uri, false);
  }

  /**
   * Get file extension (lowercase) from filename.
   */
  private getExtension(filename: string): string {
    const dot = filename.lastIndexOf('.');
    if (dot === -1) return '';
    return filename.slice(dot).toLowerCase();
  }
}
