import React, { useEffect } from 'react';
import { NavigationShell } from './components';
import { useMessageHandler } from './hooks';
import { useVSCodeApi } from '../shared/hooks';
import { createRefreshMessage } from '@shared/messages';

export function EditorPanel(): React.ReactElement {
  useMessageHandler();
  const vscodeApi = useVSCodeApi();

  // Send initial REFRESH message to extension on mount to request state
  useEffect(() => {
    vscodeApi.postMessage(createRefreshMessage());
  }, [vscodeApi]);

  return <NavigationShell />;
}

export default EditorPanel;
