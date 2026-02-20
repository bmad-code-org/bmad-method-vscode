import React, { useEffect } from 'react';
import { EditorPanelPlaceholder } from './components';
import { useMessageHandler } from './hooks';
import { useLoading } from './store';
import { useVSCodeApi } from '../shared/hooks';
import { createRefreshMessage } from '@shared/messages';

export function EditorPanel(): React.ReactElement {
  useMessageHandler();
  const loading = useLoading();
  const vscodeApi = useVSCodeApi();

  // Send initial REFRESH message to extension on mount to request state
  useEffect(() => {
    vscodeApi.postMessage(createRefreshMessage());
  }, [vscodeApi]);

  if (loading) {
    return (
      <div data-testid="editor-panel-loading" className="flex h-full items-center justify-center">
        <p className="text-sm text-[var(--vscode-descriptionForeground)]">Loading...</p>
      </div>
    );
  }

  return <EditorPanelPlaceholder />;
}

export default EditorPanel;
