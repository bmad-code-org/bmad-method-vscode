import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

describe('useVSCodeApi', () => {
  const mockPostMessage = vi.fn();
  const mockGetState = vi.fn();
  const mockSetState = vi.fn();

  beforeEach(() => {
    vi.resetModules();
    mockPostMessage.mockClear();
    mockGetState.mockClear();
    mockSetState.mockClear();

    // Mock acquireVsCodeApi on window (matches implementation's window access)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (window as any).acquireVsCodeApi = vi.fn(() => ({
      postMessage: mockPostMessage,
      getState: mockGetState,
      setState: mockSetState,
    }));
  });

  it('returns the VS Code API object', async () => {
    const { useVSCodeApi } = await import('./use-vscode-api');
    const { result } = renderHook(() => useVSCodeApi());
    expect(result.current).toBeDefined();
    expect(result.current.postMessage).toBeDefined();
    expect(result.current.getState).toBeDefined();
    expect(result.current.setState).toBeDefined();
  });

  it('calls acquireVsCodeApi only once (singleton)', async () => {
    const { useVSCodeApi } = await import('./use-vscode-api');
    renderHook(() => useVSCodeApi());
    renderHook(() => useVSCodeApi());
    renderHook(() => useVSCodeApi());

    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    expect((window as any).acquireVsCodeApi).toHaveBeenCalledTimes(1);
  });

  it('postMessage sends correctly typed messages', async () => {
    const { useVSCodeApi } = await import('./use-vscode-api');
    const { result } = renderHook(() => useVSCodeApi());

    const message = { type: 'REFRESH' as const };
    result.current.postMessage(message);

    expect(mockPostMessage).toHaveBeenCalledWith(message);
  });
});
