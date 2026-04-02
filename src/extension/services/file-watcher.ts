import * as vscode from 'vscode';
import { BmadDetector } from './bmad-detector';

/**
 * Type of file change event.
 */
export type FileChangeType = 'create' | 'change' | 'delete';

/**
 * Event emitted when BMAD files change.
 */
export interface FileChangeEvent {
  /** Map of file path to change type */
  changes: Map<string, FileChangeType>;
}

/**
 * Error event emitted when file watcher encounters an error.
 */
export interface FileWatcherError {
  message: string;
  recoverable: boolean;
}

/**
 * State of the file watcher.
 */
export type FileWatcherState = 'stopped' | 'starting' | 'running' | 'error';

/**
 * Service for watching BMAD artifact file changes.
 *
 * Monitors `_bmad-output/` for `.yaml` and `.md` file patterns
 * and debounces changes for 500ms to batch rapid updates.
 *
 * Uses VS Code's FileSystemWatcher API (NOT Node.js fs) for remote development compatibility.
 */
export class FileWatcher implements vscode.Disposable {
  /** Disposables that live for the lifetime of the FileWatcher instance */
  private readonly instanceDisposables: vscode.Disposable[] = [];
  /** Disposables that are recreated on each start/restart cycle */
  private watcherDisposables: vscode.Disposable[] = [];

  private yamlWatcher: vscode.FileSystemWatcher | null = null;
  private mdWatcher: vscode.FileSystemWatcher | null = null;

  private _state: FileWatcherState = 'stopped';
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly pendingChanges: Map<string, FileChangeType> = new Map();

  private readonly _onDidChange = new vscode.EventEmitter<FileChangeEvent>();
  public readonly onDidChange = this._onDidChange.event;

  private readonly _onError = new vscode.EventEmitter<FileWatcherError>();
  public readonly onError = this._onError.event;

  /** Debounce delay in milliseconds (per Architecture spec) */
  private static readonly DEBOUNCE_MS = 500;

  /**
   * Create a new FileWatcher instance.
   * @param bmadDetector - The BMAD detector service to get outputRoot path
   */
  constructor(private readonly bmadDetector: BmadDetector) {
    this.instanceDisposables.push(this._onDidChange);
    this.instanceDisposables.push(this._onError);
  }

  /**
   * Get the current state of the file watcher.
   */
  get state(): FileWatcherState {
    return this._state;
  }

  /**
   * Check if the file watcher is healthy (running without errors).
   */
  isHealthy(): boolean {
    return this._state === 'running';
  }

  /**
   * Start watching for file changes.
   * Idempotent - safe to call multiple times.
   */
  start(): void {
    // Idempotent: don't start if already running or starting
    if (this._state === 'running' || this._state === 'starting') {
      return;
    }

    this._state = 'starting';

    const paths = this.bmadDetector.getBmadPaths();
    if (!paths || !paths.outputRoot) {
      // No _bmad-output/ directory - stay in stopped state but don't error
      this._state = 'stopped';
      return;
    }

    try {
      this.createWatchers(paths.outputRoot);
      this._state = 'running';
    } catch (err) {
      this._state = 'error';
      this._onError.fire({
        message: `Failed to create file watcher: ${err instanceof Error ? err.message : 'Unknown error'}`,
        recoverable: true,
      });
    }
  }

  /**
   * Stop watching for file changes.
   */
  stop(): void {
    this.clearDebounce();
    this.pendingChanges.clear();
    this.disposeWatchers();
    this._state = 'stopped';
  }

  /**
   * Restart the file watcher.
   * Useful for recovery after an error state.
   */
  restart(): void {
    this.stop();
    this.start();
  }

  /**
   * Dispose all resources.
   */
  dispose(): void {
    this.stop();
    for (const d of this.instanceDisposables) {
      d.dispose();
    }
  }

  /**
   * Create file system watchers for YAML and MD files.
   */
  private createWatchers(outputRoot: vscode.Uri): void {
    // Watch pattern: _bmad-output/**/*.yaml for sprint status files
    const yamlPattern = new vscode.RelativePattern(outputRoot, '**/*.yaml');
    this.yamlWatcher = vscode.workspace.createFileSystemWatcher(yamlPattern);
    this.setupWatcherListeners(this.yamlWatcher);
    this.watcherDisposables.push(this.yamlWatcher);

    // Watch pattern: _bmad-output/**/*.md for epic and story files
    const mdPattern = new vscode.RelativePattern(outputRoot, '**/*.md');
    this.mdWatcher = vscode.workspace.createFileSystemWatcher(mdPattern);
    this.setupWatcherListeners(this.mdWatcher);
    this.watcherDisposables.push(this.mdWatcher);
  }

  /**
   * Set up event listeners for a file system watcher.
   * Event subscriptions are tracked in watcherDisposables for proper cleanup.
   */
  private setupWatcherListeners(watcher: vscode.FileSystemWatcher): void {
    this.watcherDisposables.push(
      watcher.onDidCreate((uri) => this.handleChange(uri, 'create')),
      watcher.onDidChange((uri) => this.handleChange(uri, 'change')),
      watcher.onDidDelete((uri) => this.handleChange(uri, 'delete'))
    );
  }

  /**
   * Handle a file change event with debouncing.
   */
  private handleChange(uri: vscode.Uri, type: FileChangeType): void {
    // Accumulate changes
    this.pendingChanges.set(uri.fsPath, type);

    // Reset debounce timer
    this.clearDebounce();

    this.debounceTimer = setTimeout(() => {
      this.flushChanges();
    }, FileWatcher.DEBOUNCE_MS);
  }

  /**
   * Flush accumulated changes and fire the change event.
   */
  private flushChanges(): void {
    if (this.pendingChanges.size === 0) {
      return;
    }

    const changes = new Map(this.pendingChanges);
    this.pendingChanges.clear();
    this.debounceTimer = undefined;

    this._onDidChange.fire({ changes });
  }

  /**
   * Clear the debounce timer.
   */
  private clearDebounce(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = undefined;
    }
  }

  /**
   * Dispose file system watchers and their event subscriptions.
   */
  private disposeWatchers(): void {
    // Dispose all watcher-related disposables (watchers + event subscriptions)
    for (const d of this.watcherDisposables) {
      d.dispose();
    }
    this.watcherDisposables = [];
    this.yamlWatcher = null;
    this.mdWatcher = null;
  }
}
