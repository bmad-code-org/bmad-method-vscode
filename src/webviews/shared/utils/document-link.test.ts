import { describe, test, expect, vi } from 'vitest';
import { createDocumentLinkHandler, createShiftOpenHandler } from './document-link';

function mockClickEvent({ shiftKey = false, ctrlKey = false, metaKey = false } = {}) {
  return { shiftKey, ctrlKey, metaKey };
}

describe('createDocumentLinkHandler', () => {
  test('normal click sends OPEN_DOCUMENT with forceTextEditor false', () => {
    const mockApi = { postMessage: vi.fn() };
    const handler = createDocumentLinkHandler(mockApi, 'docs/readme.md');
    handler(mockClickEvent());
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: false },
    });
  });

  test('shift+click sends OPEN_DOCUMENT with forceTextEditor true', () => {
    const mockApi = { postMessage: vi.fn() };
    const handler = createDocumentLinkHandler(mockApi, 'docs/readme.md');
    handler(mockClickEvent({ shiftKey: true }));
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });
  });

  test('ctrl+click sends OPEN_DOCUMENT with forceTextEditor true', () => {
    const mockApi = { postMessage: vi.fn() };
    const handler = createDocumentLinkHandler(mockApi, 'docs/readme.md');
    handler(mockClickEvent({ ctrlKey: true }));
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });
  });

  test('cmd+click (metaKey) sends OPEN_DOCUMENT with forceTextEditor true', () => {
    const mockApi = { postMessage: vi.fn() };
    const handler = createDocumentLinkHandler(mockApi, 'docs/readme.md');
    handler(mockClickEvent({ metaKey: true }));
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
    handler(mockClickEvent());
    expect(primaryAction).toHaveBeenCalled();
    expect(mockApi.postMessage).not.toHaveBeenCalled();
  });

  test('shift+click posts OPEN_DOCUMENT with forceTextEditor true, does not call primaryAction', () => {
    const mockApi = { postMessage: vi.fn() };
    const primaryAction = vi.fn();
    const handler = createShiftOpenHandler(mockApi, 'docs/readme.md', primaryAction);
    handler(mockClickEvent({ shiftKey: true }));
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });
    expect(primaryAction).not.toHaveBeenCalled();
  });

  test('ctrl+click posts OPEN_DOCUMENT with forceTextEditor true, does not call primaryAction', () => {
    const mockApi = { postMessage: vi.fn() };
    const primaryAction = vi.fn();
    const handler = createShiftOpenHandler(mockApi, 'docs/readme.md', primaryAction);
    handler(mockClickEvent({ ctrlKey: true }));
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });
    expect(primaryAction).not.toHaveBeenCalled();
  });

  test('cmd+click (metaKey) posts OPEN_DOCUMENT with forceTextEditor true, does not call primaryAction', () => {
    const mockApi = { postMessage: vi.fn() };
    const primaryAction = vi.fn();
    const handler = createShiftOpenHandler(mockApi, 'docs/readme.md', primaryAction);
    handler(mockClickEvent({ metaKey: true }));
    expect(mockApi.postMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });
    expect(primaryAction).not.toHaveBeenCalled();
  });
});
