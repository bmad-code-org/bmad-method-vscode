import * as vscode from 'vscode';
import { BmadDetector } from './bmad-detector';
import { FileWatcher, FileChangeEvent, FileWatcherError } from './file-watcher';
import { parseSprintStatus, parseEpics, parseStory } from '../parsers';
import type { DashboardState, ParseError, SprintStatus, Epic, Story } from '../../shared/types';
import { createInitialDashboardState, isStoryKey, isEpicKey } from '../../shared/types';

/**
 * Story file validation regex - only files matching X-Y-name.md are stories
 * Examples:
 *   '2-6-state-manager.md' → true (story)
 *   'sprint-status.yaml' → false (not .md)
 *   'readme.md' → false (doesn't match X-Y-name pattern)
 */
const STORY_FILE_REGEX = /^\d+-\d+-[\w-]+\.md$/;

/**
 * Service for managing aggregated BMAD dashboard state.
 *
 * Aggregates parsed data from sprint status, epics, and stories,
 * collects parse errors, and notifies subscribers on state changes.
 *
 * Uses VS Code's workspace.fs API (NOT Node.js fs) for remote development compatibility.
 */
export class StateManager implements vscode.Disposable {
  /** Disposables that live for the lifetime of the StateManager instance */
  private readonly disposables: vscode.Disposable[] = [];

  /** Aggregated dashboard state */
  private _state: DashboardState;

  /** Internal story storage - NOT exposed in DashboardState */
  private readonly _parsedStories: Map<string, Story> = new Map();

  /** Flag to prevent race conditions during initialization */
  private _initializing = false;

  /** Queue for file changes that arrive during initialization */
  private readonly _pendingChanges: FileChangeEvent[] = [];

  /** Event emitter for state changes */
  private readonly _onStateChange = new vscode.EventEmitter<DashboardState>();

  /** Event fired when dashboard state changes */
  public readonly onStateChange = this._onStateChange.event;

  /**
   * Create a new StateManager instance.
   * @param bmadDetector - The BMAD detector service for path resolution
   * @param fileWatcher - The FileWatcher service for change events
   */
  constructor(
    private readonly bmadDetector: BmadDetector,
    private readonly fileWatcher: FileWatcher
  ) {
    this._state = createInitialDashboardState();
    this.disposables.push(this._onStateChange);
  }

  /**
   * Get the current dashboard state (read-only).
   */
  get state(): DashboardState {
    return this._state;
  }

  /**
   * Initialize the state manager by performing a full parse.
   * Subscribes to file watcher events for ongoing updates.
   */
  async initialize(): Promise<void> {
    this._initializing = true;
    try {
      // Subscribe to file watcher events
      this.disposables.push(
        this.fileWatcher.onDidChange((event) => {
          void this.handleFileChanges(event);
        })
      );
      this.disposables.push(
        this.fileWatcher.onError((error) => this.handleFileWatcherError(error))
      );

      await this.parseAll();
    } finally {
      this._initializing = false;
      // Process any changes that arrived during initialization
      await this.processPendingChanges();
    }
  }

  /**
   * Trigger a full re-parse of all BMAD artifacts.
   * Clears errors before re-parsing.
   */
  async refresh(): Promise<void> {
    // Set loading state and clear errors
    this._state = { ...this._state, loading: true, errors: [] };
    this._onStateChange.fire(this._state);

    await this.parseAll();
  }

  /**
   * Dispose all resources.
   */
  dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
  }

  /**
   * Parse all BMAD artifacts (sprint status, epics, stories).
   * Updates state with results and fires state change event.
   */
  private async parseAll(): Promise<void> {
    const paths = this.bmadDetector.getBmadPaths();
    if (!paths || !paths.outputRoot) {
      // No BMAD output directory - set loading to false and keep defaults
      this._state = { ...this._state, loading: false };
      this._onStateChange.fire(this._state);
      return;
    }

    // Populate outputRoot from config so webview can construct document paths
    const config = vscode.workspace.getConfiguration('bmad');
    this._state = { ...this._state, outputRoot: config.get<string>('outputRoot', '_bmad-output') };

    // Parse sprint status
    await this.parseSprintStatus(paths.outputRoot);

    // Parse epics
    await this.parseEpics(paths.outputRoot);

    // Parse stories
    await this.parseStories(paths.outputRoot);

    // Determine current story from sprint status
    this.determineCurrentStory();

    // Mark loading complete
    this._state = { ...this._state, loading: false };
    this._onStateChange.fire(this._state);
  }

  /**
   * Parse sprint status file.
   */
  private async parseSprintStatus(outputRoot: vscode.Uri): Promise<void> {
    const sprintStatusPath = vscode.Uri.joinPath(
      outputRoot,
      'implementation-artifacts',
      'sprint-status.yaml'
    );

    try {
      const content = await this.readFile(sprintStatusPath);
      if (content === null) {
        // File doesn't exist - not an error, just no sprint status
        this._state = { ...this._state, sprint: null };
        return;
      }

      const result = parseSprintStatus(content);
      if (result.success) {
        this.clearErrorForFile(sprintStatusPath.fsPath);
        this._state = { ...this._state, sprint: result.data };
      } else {
        this.collectError({
          message: result.error,
          filePath: sprintStatusPath.fsPath,
          recoverable: true,
        });
        // Use partial data if available
        if (result.partial) {
          this._state = { ...this._state, sprint: result.partial as SprintStatus };
        }
      }
    } catch {
      // Unexpected error - already handled by readFile returning null
    }
  }

  /**
   * Parse epic files.
   */
  private async parseEpics(outputRoot: vscode.Uri): Promise<void> {
    const planningArtifactsPath = vscode.Uri.joinPath(outputRoot, 'planning-artifacts');

    try {
      // Look for epics.md file (the consolidated epics file)
      const epicsFilePath = vscode.Uri.joinPath(planningArtifactsPath, 'epics.md');
      const content = await this.readFile(epicsFilePath);

      if (content === null) {
        // No epics file found
        this._state = { ...this._state, epics: [] };
        return;
      }

      const result = parseEpics(content, epicsFilePath.fsPath);
      if (result.success) {
        this.clearErrorForFile(epicsFilePath.fsPath);
        // Merge status from sprint status if available
        const epicsWithStatus = result.data.map((epic) => this.mergeEpicStatus(epic));
        this._state = { ...this._state, epics: epicsWithStatus };
      } else {
        this.collectError({
          message: result.error,
          filePath: epicsFilePath.fsPath,
          recoverable: true,
        });
      }
    } catch {
      // Error reading directory - not critical
    }
  }

  /**
   * Merge epic status from sprint status data.
   */
  private mergeEpicStatus(epic: Epic): Epic {
    if (!this._state.sprint) {
      return epic;
    }

    const statusKey = `epic-${epic.number}`;
    const status = this._state.sprint.development_status[statusKey];
    if (status && (status === 'backlog' || status === 'in-progress' || status === 'done')) {
      return { ...epic, status };
    }
    return epic;
  }

  /**
   * Parse story files from implementation-artifacts directory.
   */
  private async parseStories(outputRoot: vscode.Uri): Promise<void> {
    const implementationArtifactsPath = vscode.Uri.joinPath(outputRoot, 'implementation-artifacts');

    this._parsedStories.clear();

    // Read directory contents using protected method (for testability)
    const entries = await this.readDirectory(implementationArtifactsPath);

    // Filter to only story files and map to parse promises
    const storyParsePromises = entries
      .filter(([name, type]) => type === vscode.FileType.File && this.isStoryFile(name))
      .map(async ([name]) =>
        this.parseStoryFile(vscode.Uri.joinPath(implementationArtifactsPath, name))
      );

    await Promise.all(storyParsePromises);
  }

  /**
   * Parse a single story file and add to internal storage.
   */
  private async parseStoryFile(storyPath: vscode.Uri): Promise<void> {
    const content = await this.readFile(storyPath);
    if (content === null) {
      return;
    }

    const result = parseStory(content, storyPath.fsPath);
    if (result.success) {
      this.clearErrorForFile(storyPath.fsPath);
      this._parsedStories.set(result.data.key, result.data);
    } else {
      this.collectError({
        message: result.error,
        filePath: storyPath.fsPath,
        recoverable: true,
      });
      // Store partial data if available
      if (result.partial && 'key' in result.partial && result.partial.key) {
        this._parsedStories.set(result.partial.key, result.partial as Story);
      }
    }
  }

  /**
   * Check if a filename matches the story file pattern (X-Y-name.md).
   */
  private isStoryFile(fileName: string): boolean {
    return STORY_FILE_REGEX.test(fileName);
  }

  /**
   * Determine the current story based on sprint status.
   * Finds the first story with status 'in-progress', 'ready-for-dev', or 'review'.
   */
  private determineCurrentStory(): void {
    if (!this._state.sprint || !this._state.sprint.development_status) {
      this._state = { ...this._state, currentStory: null };
      return;
    }

    // Find first story with an active status (in-progress, ready-for-dev, or review)
    const activeStatuses = ['in-progress', 'ready-for-dev', 'review'];
    const entries = Object.entries(this._state.sprint.development_status);

    for (const [key, status] of entries) {
      // Skip epic entries (epic-X) and retrospectives
      if (isEpicKey(key) || key.includes('retrospective')) {
        continue;
      }

      // Only process story keys
      if (!isStoryKey(key)) {
        continue;
      }

      if (activeStatuses.includes(status)) {
        // Find matching story in internal _parsedStories map
        const story = this._parsedStories.get(key);
        if (story) {
          this._state = { ...this._state, currentStory: story };
          return;
        }
      }
    }

    this._state = { ...this._state, currentStory: null };
  }

  /**
   * Handle file change events from FileWatcher.
   */
  private async handleFileChanges(event: FileChangeEvent): Promise<void> {
    // Queue changes if still initializing
    if (this._initializing) {
      this._pendingChanges.push(event);
      return;
    }

    const paths = this.bmadDetector.getBmadPaths();
    if (!paths || !paths.outputRoot) {
      return;
    }

    // Process deletes synchronously (no I/O needed)
    const deleteChanges = Array.from(event.changes.entries()).filter(
      ([, changeType]) => changeType === 'delete'
    );
    for (const [filePath] of deleteChanges) {
      this.removeFromState(filePath);
    }

    // Process creates/changes in parallel
    const updateChanges = Array.from(event.changes.entries()).filter(
      ([, changeType]) => changeType !== 'delete'
    );
    const updatePromises = updateChanges.map(async ([filePath]) =>
      this.handleFileUpdate(filePath, paths.outputRoot!)
    );
    await Promise.all(updatePromises);

    this.determineCurrentStory();
    this.notifyWebviews();
  }

  /**
   * Handle a file update (create or change).
   */
  private async handleFileUpdate(filePath: string, outputRoot: vscode.Uri): Promise<void> {
    const fileName = this.getFileName(filePath);

    if (fileName === 'sprint-status.yaml') {
      await this.parseSprintStatus(outputRoot);
    } else if (filePath.includes('planning-artifacts') && fileName === 'epics.md') {
      await this.parseEpics(outputRoot);
    } else if (filePath.includes('implementation-artifacts') && this.isStoryFile(fileName)) {
      await this.parseStoryFile(vscode.Uri.file(filePath));
    }
    // Other files are ignored (not relevant to BMAD dashboard)
  }

  /**
   * Remove data from state when a file is deleted.
   */
  private removeFromState(filePath: string): void {
    const fileName = this.getFileName(filePath);

    // Clear error for this file
    this.clearErrorForFile(filePath);

    if (fileName === 'sprint-status.yaml') {
      this._state = { ...this._state, sprint: null };
    } else if (fileName === 'epics.md') {
      this._state = { ...this._state, epics: [] };
    } else if (this.isStoryFile(fileName)) {
      // Find and remove the story from internal map
      const storyKey = this.extractStoryKeyFromFileName(fileName);
      if (storyKey) {
        this._parsedStories.delete(storyKey);
        // If deleted story was the current story, clear it
        if (this._state.currentStory?.key === storyKey) {
          this._state = { ...this._state, currentStory: null };
        }
      }
    }
  }

  /**
   * Extract story key from filename.
   * E.g., "2-6-state-manager.md" → "2-6-state-manager"
   */
  private extractStoryKeyFromFileName(fileName: string): string | null {
    const match = fileName.match(/^(\d+-\d+-[\w-]+)\.md$/);
    return match ? match[1] : null;
  }

  /**
   * Get the filename from a file path.
   */
  private getFileName(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1];
  }

  /**
   * Process any file changes that were queued during initialization.
   * Must be sequential to maintain event ordering.
   */
  private async processPendingChanges(): Promise<void> {
    // Process sequentially to maintain ordering
    while (this._pendingChanges.length > 0) {
      const event = this._pendingChanges.shift()!;
      await this.handleFileChanges(event); // eslint-disable-line no-await-in-loop -- intentional sequential processing
    }
  }

  /**
   * Handle file watcher errors by adding to errors array.
   */
  private handleFileWatcherError(error: FileWatcherError): void {
    this.collectError({
      message: `File watcher error: ${error.message}`,
      recoverable: error.recoverable,
    });
  }

  /**
   * Collect a parse error into state.
   * Errors are deduplicated by filePath - new error replaces existing error for same file.
   */
  private collectError(error: ParseError): void {
    // Remove any existing error for this file
    const errors = error.filePath
      ? this._state.errors.filter((e) => e.filePath !== error.filePath)
      : this._state.errors;

    // Add the new error
    this._state = { ...this._state, errors: [...errors, error] };
  }

  /**
   * Clear error for a specific file on successful parse.
   */
  private clearErrorForFile(filePath: string): void {
    const errors = this._state.errors.filter((e) => e.filePath !== filePath);
    if (errors.length !== this._state.errors.length) {
      this._state = { ...this._state, errors };
    }
  }

  /**
   * Notify webviews of state change (placeholder for Epic 3 integration).
   */
  private notifyWebviews(): void {
    this._onStateChange.fire(this._state);
  }

  /**
   * Read a file using VS Code's workspace.fs API.
   * Returns null if file doesn't exist or can't be read.
   *
   * Protected to allow subclassing for testing (vscode.workspace.fs is non-configurable).
   */
  protected async readFile(uri: vscode.Uri): Promise<string | null> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      return Buffer.from(content).toString('utf-8');
    } catch {
      // File doesn't exist or can't be read
      return null;
    }
  }

  /**
   * Read directory using VS Code's workspace.fs API.
   * Returns empty array if directory doesn't exist or can't be read.
   *
   * Protected to allow subclassing for testing (vscode.workspace.fs is non-configurable).
   */
  protected async readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
    try {
      return await vscode.workspace.fs.readDirectory(uri);
    } catch {
      // Directory doesn't exist or can't be read
      return [];
    }
  }
}
