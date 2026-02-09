import * as vscode from 'vscode';
import { BmadDetector, FileWatcher, StateManager } from './services';
import { DashboardViewProvider } from './providers/dashboard-view-provider';

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
    const stateManager = new StateManager(detector, fileWatcher);

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
      vscode.commands.registerCommand('bmad.refresh', () => {
        void stateManager.refresh();
      }),
      fileWatcher,
      stateManager
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
