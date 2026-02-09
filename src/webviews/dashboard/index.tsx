import React, { useEffect } from 'react';
import { Placeholder } from './components/placeholder';
import { useMessageHandler } from './hooks';
import { useLoading } from './store';
import { useVSCodeApi } from '../shared/hooks';
import { createRefreshMessage } from '@shared/messages';

export function Dashboard(): React.ReactElement {
  useMessageHandler();
  const loading = useLoading();
  const vscodeApi = useVSCodeApi();

  // Send initial REFRESH message to extension on mount to request state
  useEffect(() => {
    vscodeApi.postMessage(createRefreshMessage());
  }, [vscodeApi]);

  if (loading) {
    return (
      <div data-testid="dashboard-loading" className="flex flex-col gap-4 p-4">
        <h1 className="text-lg font-semibold text-[var(--vscode-foreground)]">BMAD Dashboard</h1>
        <div className="flex animate-pulse flex-col gap-3">
          <div className="h-4 w-3/4 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
          <div className="h-8 w-full rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
          <div className="h-4 w-2/3 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        </div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-content">
      <Placeholder />
    </div>
  );
}

export default Dashboard;
