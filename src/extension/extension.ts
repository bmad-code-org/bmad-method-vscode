import * as vscode from 'vscode';
import { DashboardViewProvider } from './providers/dashboard-view-provider';

export function activate(context: vscode.ExtensionContext): void {
  // Register the dashboard webview view provider for the sidebar
  const dashboardProvider = new DashboardViewProvider(context.extensionUri);

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
