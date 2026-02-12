import React from 'react';
import { useVSCodeApi } from '../../shared/hooks';
import { createRefreshMessage } from '@shared/messages';
import { useLoading } from '../store';
import { cn } from '../../shared/utils/cn';

export function RefreshButton(): React.ReactElement {
  const vscodeApi = useVSCodeApi();
  const loading = useLoading();

  const handleRefresh = () => {
    vscodeApi.postMessage(createRefreshMessage());
  };

  return (
    <button
      type="button"
      data-testid="refresh-button"
      disabled={loading}
      onClick={handleRefresh}
      aria-label="Refresh dashboard"
      title="Refresh dashboard data"
      className={cn(
        'text-xs text-[var(--vscode-textLink-foreground)]',
        loading ? 'cursor-not-allowed opacity-50' : 'hover:underline'
      )}
    >
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
  );
}
