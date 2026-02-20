import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMessageHandler } from './use-message-handler';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';
import type { DashboardState, Story } from '@shared/types';
import { ToWebviewType } from '@shared/messages';
import { parseStoryContent } from '../utils/parse-story-content';

vi.mock('../utils/parse-story-content', () => ({
  parseStoryContent: vi.fn(),
}));

describe('useMessageHandler (editor panel)', () => {
  beforeEach(() => {
    useEditorPanelStore.setState(createInitialEditorPanelState());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registers message event listener on mount', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');
    renderHook(() => useMessageHandler());
    expect(addSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('removes event listener on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => useMessageHandler());
    unmount();
    expect(removeSpy).toHaveBeenCalledWith('message', expect.any(Function));
  });

  it('handles STATE_UPDATE messages by updating store', () => {
    renderHook(() => useMessageHandler());

    const newState: DashboardState = {
      sprint: {
        generated: '2026-01-01',
        project: 'test',
        project_key: 'test',
        tracking_system: 'file-system',
        story_location: 'stories',
        development_status: {},
      },
      epics: [],
      currentStory: null,
      errors: [],
      loading: false,
      outputRoot: null,
      workflows: [],
      bmadMetadata: null,
      planningArtifacts: {
        hasProductBrief: false,
        hasPrd: false,
        hasArchitecture: false,
        hasEpics: false,
        hasReadinessReport: false,
      },
      defaultClickBehavior: 'markdown-preview',
      storySummaries: [],
    };

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: ToWebviewType.STATE_UPDATE, payload: newState },
      })
    );

    const state = useEditorPanelStore.getState();
    expect(state.sprint).toEqual(newState.sprint);
    expect(state.loading).toBe(false);
  });

  it('handles ERROR messages by setting error state', () => {
    renderHook(() => useMessageHandler());

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: ToWebviewType.ERROR,
          payload: { message: 'Test error', recoverable: true },
        },
      })
    );

    const state = useEditorPanelStore.getState();
    expect(state.errors).toHaveLength(1);
    expect(state.errors[0].message).toBe('Test error');
  });

  it('ignores unknown message types gracefully', () => {
    renderHook(() => useMessageHandler());
    const stateBefore = useEditorPanelStore.getState();

    window.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'UNKNOWN_TYPE', payload: {} },
      })
    );

    const stateAfter = useEditorPanelStore.getState();
    expect(stateAfter.sprint).toEqual(stateBefore.sprint);
    expect(stateAfter.epics).toEqual(stateBefore.epics);
    expect(stateAfter.errors).toEqual(stateBefore.errors);
  });

  it('handles DOCUMENT_CONTENT with valid story content by setting storyDetail in store', () => {
    const mockStory: Story = {
      key: '3-1-test-story',
      epicNumber: 3,
      storyNumber: 1,
      title: 'Test Story',
      userStory: 'As a developer, I want to test, so that things work.',
      acceptanceCriteria: [],
      tasks: [],
      filePath: 'stories/3-1-test-story.md',
      status: 'in-progress',
      totalTasks: 0,
      completedTasks: 0,
      totalSubtasks: 0,
      completedSubtasks: 0,
    };

    vi.mocked(parseStoryContent).mockReturnValue(mockStory);

    renderHook(() => useMessageHandler());

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: ToWebviewType.DOCUMENT_CONTENT,
          payload: {
            path: 'stories/3-1-test-story.md',
            content: '# Story 3.1: Test Story',
            frontmatter: null,
          },
        },
      })
    );

    const state = useEditorPanelStore.getState();
    expect(parseStoryContent).toHaveBeenCalledWith(
      '# Story 3.1: Test Story',
      'stories/3-1-test-story.md'
    );
    expect(state.storyDetail).toEqual(mockStory);
    expect(state.storyDetailLoading).toBe(false);
  });

  it('handles DOCUMENT_CONTENT with unparseable content by stopping loading', () => {
    vi.mocked(parseStoryContent).mockReturnValue(null);

    // Set loading to true before the message arrives
    useEditorPanelStore.setState({ storyDetailLoading: true });

    renderHook(() => useMessageHandler());

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: ToWebviewType.DOCUMENT_CONTENT,
          payload: {
            path: 'stories/invalid.md',
            content: 'not a valid story',
            frontmatter: null,
          },
        },
      })
    );

    const state = useEditorPanelStore.getState();
    expect(state.storyDetail).toBeNull();
    expect(state.storyDetailLoading).toBe(false);
  });

  it('handles NAVIGATE_TO_VIEW message by navigating to the correct view and params', () => {
    renderHook(() => useMessageHandler());

    window.dispatchEvent(
      new MessageEvent('message', {
        data: {
          type: ToWebviewType.NAVIGATE_TO_VIEW,
          payload: { view: 'epics', params: { epicId: '5' } },
        },
      })
    );

    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({ view: 'epics', params: { epicId: '5' } });
  });
});
