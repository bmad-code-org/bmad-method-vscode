import * as vscode from 'vscode';
import { BmadDetector, FileWatcher, StateManager, WorkflowDiscoveryService } from './services';
import { DashboardViewProvider } from './providers/dashboard-view-provider';
import { EditorPanelProvider } from './providers/editor-panel-provider';

function showCommandError(action: string, err: unknown): Thenable<string | undefined> {
  const msg = err instanceof Error ? err.message : String(err);
  return vscode.window.showErrorMessage(`BMAD ${action} failed: ${msg}`);
}

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Detect BMAD project in current workspace
  const detector = new BmadDetector();
  const detectionResult = await detector.detectBmadProject();

  // Log detection result to debug console (do NOT create OutputChannel yet — per story spec)
  // eslint-disable-next-line no-console
  console.log('[BMAD] Detection result:', JSON.stringify(detectionResult));

  if (detectionResult.detected) {
    // Create services
    const fileWatcher = new FileWatcher(detector);
    const workflowDiscovery = new WorkflowDiscoveryService(detector);
    await workflowDiscovery.discoverInstalledWorkflows();
    const stateManager = new StateManager(detector, fileWatcher, workflowDiscovery);

    // Start services
    fileWatcher.start();
    await stateManager.initialize();

    // Register dashboard with StateManager dependency
    const dashboardProvider = new DashboardViewProvider(
      context.extensionUri,
      detectionResult,
      stateManager
    );

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(DashboardViewProvider.viewType, dashboardProvider),
      vscode.commands.registerCommand('bmad.refresh', async () => {
        try {
          await stateManager.refresh();
        } catch (err) {
          void showCommandError('refresh', err);
        }
      }),
      vscode.commands.registerCommand('bmad.openEditorPanel', () => {
        try {
          EditorPanelProvider.createOrShow(context.extensionUri, stateManager);
        } catch (err) {
          void showCommandError('open panel', err);
        }
      }),
      // Dispose editor panel on extension deactivation (singleton may be open)
      { dispose: () => EditorPanelProvider.disposePanel() },
      fileWatcher,
      stateManager,
      workflowDiscovery
    );
  } else {
    // Non-BMAD workspace - register provider without state manager
    const dashboardProvider = new DashboardViewProvider(context.extensionUri, detectionResult);

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(DashboardViewProvider.viewType, dashboardProvider)
    );
  }
}

export function deactivate(): void {
  // Cleanup if needed
}
