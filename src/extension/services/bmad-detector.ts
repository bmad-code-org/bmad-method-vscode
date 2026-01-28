import * as vscode from 'vscode';

/**
 * Result of BMAD project detection.
 */
export type DetectionResult =
  | { detected: true; bmadRoot: vscode.Uri; outputRoot: vscode.Uri | null }
  | {
      detected: false;
      reason: 'no-workspace' | 'not-found' | 'not-directory' | 'error';
      message?: string;
    };

/**
 * Result of a directory existence check.
 */
export type DirectoryCheckResult =
  | { exists: true; uri: vscode.Uri }
  | { exists: false; reason?: 'not-found' | 'not-directory' | 'error'; message?: string };

/**
 * Resolved BMAD project paths.
 */
export interface BmadPaths {
  bmadRoot: vscode.Uri;
  outputRoot: vscode.Uri | null;
}

/**
 * Service for detecting BMAD projects in the current workspace.
 *
 * Uses vscode.workspace.fs (NOT Node.js fs) for remote development compatibility.
 */
export class BmadDetector {
  private lastDetectionResult: DetectionResult | null = null;

  /**
   * Detect whether the current workspace contains a BMAD project.
   *
   * Checks the first workspace folder only (single-context model, see Architecture doc).
   */
  async detectBmadProject(): Promise<DetectionResult> {
    const folders = vscode.workspace.workspaceFolders;
    return this.detectWithFolders(folders);
  }

  /**
   * Detect BMAD project given explicit workspace folders.
   * Exposed for testing the no-workspace scenario.
   */
  async detectWithFolders(
    folders: readonly vscode.WorkspaceFolder[] | undefined
  ): Promise<DetectionResult> {
    // Handle no workspace open
    if (!folders || folders.length === 0) {
      const result: DetectionResult = {
        detected: false,
        reason: 'no-workspace',
        message: 'No workspace folder is open',
      };
      this.lastDetectionResult = result;
      return result;
    }

    // Single-context model: check first workspace folder only (see Architecture doc)
    const workspaceRoot = folders[0].uri;
    const bmadUri = vscode.Uri.joinPath(workspaceRoot, '_bmad');

    const bmadCheck = await this.checkDirectory(bmadUri);

    if (!bmadCheck.exists) {
      const result: DetectionResult = {
        detected: false,
        reason: bmadCheck.reason ?? 'not-found',
        message: bmadCheck.message,
      };
      this.lastDetectionResult = result;
      return result;
    }

    // _bmad/ exists — also check for _bmad-output/ (optional, null if absent)
    const outputUri = vscode.Uri.joinPath(workspaceRoot, '_bmad-output');
    const outputCheck = await this.checkDirectory(outputUri);

    const result: DetectionResult = {
      detected: true,
      bmadRoot: bmadUri,
      outputRoot: outputCheck.exists ? outputUri : null,
    };
    this.lastDetectionResult = result;
    return result;
  }

  /**
   * Check whether a URI points to an existing directory.
   */
  private async checkDirectory(uri: vscode.Uri): Promise<DirectoryCheckResult> {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      if (stat.type & vscode.FileType.Directory) {
        return { exists: true, uri };
      }
      return {
        exists: false,
        reason: 'not-directory',
        message: `${uri.fsPath} exists but is not a directory`,
      };
    } catch (err) {
      const isNotFound = err instanceof vscode.FileSystemError && err.code === 'FileNotFound';
      return {
        exists: false,
        reason: isNotFound ? 'not-found' : 'error',
        message: `${uri.fsPath} ${isNotFound ? 'not found' : 'inaccessible'}`,
      };
    }
  }

  /**
   * Get resolved BMAD paths from the last detection result.
   * Returns null if detection hasn't been run or project was not detected.
   */
  getBmadPaths(): BmadPaths | null {
    if (!this.lastDetectionResult || !this.lastDetectionResult.detected) {
      return null;
    }
    return {
      bmadRoot: this.lastDetectionResult.bmadRoot,
      outputRoot: this.lastDetectionResult.outputRoot,
    };
  }
}
