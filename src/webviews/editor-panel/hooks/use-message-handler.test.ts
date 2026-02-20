import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMessageHandler } from './use-message-handler';
import { useEditorPanelStore } from '../store';
import { createInitialDashboardState } from '@shared/types';
import type { DashboardState } from '@shared/types';
import { ToWebviewType } from '@shared/messages';

describe('useMessageHandler (editor panel)', () => {
  beforeEach(() => {
    useEditorPanelStore.setState(createInitialDashboardState());
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
});
