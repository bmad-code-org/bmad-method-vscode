import { useMemo } from 'react';
import type { ToExtension } from '@shared/messages';

interface VSCodeApi {
  postMessage: (message: ToExtension) => void;
  getState: () => unknown;
  setState: (state: unknown) => void;
}

// Singleton - acquireVsCodeApi() can only be called once
let vscodeApi: VSCodeApi | undefined;

function getVSCodeApi(): VSCodeApi {
  if (!vscodeApi) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    vscodeApi = (window as any).acquireVsCodeApi();
  }
  return vscodeApi!;
}

export function useVSCodeApi(): VSCodeApi {
  return useMemo(() => getVSCodeApi(), []);
}
