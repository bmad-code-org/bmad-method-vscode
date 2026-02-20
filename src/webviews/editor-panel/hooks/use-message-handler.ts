import { useEffect } from 'react';
import { useEditorPanelStore } from '../store';
import { ToWebviewType } from '@shared/messages';
import type { ToWebview } from '@shared/messages';
import { parseStoryContent } from '../utils/parse-story-content';
import type { ViewType } from '../types';

export function useMessageHandler(): void {
  const updateState = useEditorPanelStore((s) => s.updateState);
  const setError = useEditorPanelStore((s) => s.setError);
  const setStoryDetail = useEditorPanelStore((s) => s.setStoryDetail);
  const setStoryDetailLoading = useEditorPanelStore((s) => s.setStoryDetailLoading);
  const navigateTo = useEditorPanelStore((s) => s.navigateTo);
  const setFileTree = useEditorPanelStore((s) => s.setFileTree);
  const setSelectedDoc = useEditorPanelStore((s) => s.setSelectedDoc);

  useEffect(() => {
    const handler = (event: MessageEvent<ToWebview>) => {
      const message = event.data;
      switch (message.type) {
        case ToWebviewType.STATE_UPDATE:
          updateState(message.payload);
          break;
        case ToWebviewType.DOCUMENT_CONTENT: {
          // Route to docs view if selectedDocLoading, otherwise to story detail
          const state = useEditorPanelStore.getState();
          if (state.selectedDocLoading) {
            setSelectedDoc(message.payload.path, message.payload.content);
          } else {
            const story = parseStoryContent(message.payload.content, message.payload.path);
            if (story) {
              setStoryDetail(story);
            } else {
              setStoryDetailLoading(false);
            }
          }
          break;
        }
        case ToWebviewType.FILE_TREE:
          setFileTree(message.payload.roots);
          break;
        case ToWebviewType.NAVIGATE_TO_VIEW:
          navigateTo({
            view: message.payload.view as ViewType,
            params: message.payload.params,
          });
          break;
        case ToWebviewType.ERROR:
          setError(message.payload.message);
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [
    updateState,
    setError,
    setStoryDetail,
    setStoryDetailLoading,
    navigateTo,
    setFileTree,
    setSelectedDoc,
  ]);
}
