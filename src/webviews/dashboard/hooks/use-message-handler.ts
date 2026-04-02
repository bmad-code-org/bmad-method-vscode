import { useEffect } from 'react';
import { useDashboardStore } from '../store';
import { ToWebviewType } from '@shared/messages';
import type { ToWebview } from '@shared/messages';

export function useMessageHandler(): void {
  const updateState = useDashboardStore((s) => s.updateState);
  const setError = useDashboardStore((s) => s.setError);

  useEffect(() => {
    const handler = (event: MessageEvent<ToWebview>) => {
      const message = event.data;
      switch (message.type) {
        case ToWebviewType.STATE_UPDATE:
          updateState(message.payload);
          break;
        case ToWebviewType.ERROR:
          setError(message.payload.message);
          break;
        default:
          // Ignore unknown message types gracefully
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [updateState, setError]);
}
