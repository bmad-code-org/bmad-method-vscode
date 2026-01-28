import * as vscode from 'vscode';
import { BmadDetector } from './services';
import { DashboardViewProvider } from './providers/dashboard-view-provider';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Detect BMAD project in current workspace
  const detector = new BmadDetector();
  const detectionResult = await detector.detectBmadProject();

  // Log detection result to debug console (do NOT create OutputChannel yet — per story spec)
  // eslint-disable-next-line no-console
  console.log('[BMAD] Detection result:', JSON.stringify(detectionResult));

  // Register the dashboard webview view provider for the sidebar
  // MUST always register — VS Code requires it for contributes.views entries
  const dashboardProvider = new DashboardViewProvider(context.extensionUri, detectionResult);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(DashboardViewProvider.viewType, dashboardProvider)
  );

  // Register the refresh command
  context.subscriptions.push(
    vscode.commands.registerCommand('bmad.refresh', () => {
      dashboardProvider.refresh();
    })
  );
}

export function deactivate(): void {
  // Cleanup if needed
}
