import type { ToExtension } from '@shared/messages';
import { createOpenDocumentMessage } from '@shared/messages';

interface PostMessageApi {
  postMessage: (message: ToExtension) => void;
}

type ClickEvent = { shiftKey: boolean };

/**
 * Create an onClick handler for a document link.
 * - Normal click: opens markdown in viewer, other files in text editor
 * - Shift+click: always opens in raw text editor
 */
export function createDocumentLinkHandler(
  vscodeApi: PostMessageApi,
  path: string
): (e: ClickEvent) => void {
  return (e: ClickEvent) => {
    vscodeApi.postMessage(createOpenDocumentMessage(path, e.shiftKey));
  };
}

/**
 * Create an onClick handler where click performs a primary action
 * and shift+click opens the document in raw text editor.
 *
 * Used for elements like epic titles where click toggles expand/collapse.
 */
export function createShiftOpenHandler(
  vscodeApi: PostMessageApi,
  path: string,
  primaryAction: () => void
): (e: ClickEvent) => void {
  return (e: ClickEvent) => {
    if (e.shiftKey) {
      vscodeApi.postMessage(createOpenDocumentMessage(path, true));
    } else {
      primaryAction();
    }
  };
}
