/**
 * Represents a node in the document library file tree.
 * Used for communication between extension host (scanner) and webview (renderer).
 */
export interface FileTreeNode {
  /** Display name (filename or directory name) */
  name: string;
  /** Full path relative to workspace root */
  path: string;
  /** Whether this is a file or directory */
  type: 'file' | 'directory';
  /** Child nodes (only present for directories) */
  children?: FileTreeNode[];
}
