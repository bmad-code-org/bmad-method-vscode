import { describe, test, expect, vi } from 'vitest';
import { createDocumentLinkHandler, createShiftOpenHandler } from './document-link';

function mockClickEvent(shiftKey: boolean) {
  return { shiftKey };
}

describe('createDocumentLinkHandler', () => {
  test('normal click sends OPEN_DOCUMENT with forceTextEditor false', () => {
    const mockApi = { postMessage: vi.fn() };
    const handler = createDocumentLinkHandler(mockApi, 'docs/readme.md');
    handler(mockClickEvent(false));
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: false },
    });
  });

  test('shift+click sends OPEN_DOCUMENT with forceTextEditor true', () => {
    const mockApi = { postMessage: vi.fn() };
    const handler = createDocumentLinkHandler(mockApi, 'docs/readme.md');
    handler(mockClickEvent(true));
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });
  });
});

describe('createShiftOpenHandler', () => {
  test('normal click calls primaryAction, does not post message', () => {
    const mockApi = { postMessage: vi.fn() };
    const primaryAction = vi.fn();
    const handler = createShiftOpenHandler(mockApi, 'docs/readme.md', primaryAction);
    handler(mockClickEvent(false));
    expect(primaryAction).toHaveBeenCalled();
    expect(mockApi.postMessage).not.toHaveBeenCalled();
  });

  test('shift+click posts OPEN_DOCUMENT with forceTextEditor true, does not call primaryAction', () => {
    const mockApi = { postMessage: vi.fn() };
    const primaryAction = vi.fn();
    const handler = createShiftOpenHandler(mockApi, 'docs/readme.md', primaryAction);
    handler(mockClickEvent(true));
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });
    expect(primaryAction).not.toHaveBeenCalled();
  });
});
