import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useEditorPanelStore,
  useSprint,
  useEpics,
  useCurrentStory,
  useErrors,
  useLoading,
  useOutputRoot,
  useWorkflows,
  useBmadMetadata,
  usePlanningArtifacts,
} from './store';
import { createInitialDashboardState } from '@shared/types';
import type { DashboardState } from '@shared/types';

describe('useEditorPanelStore', () => {
  beforeEach(() => {
    useEditorPanelStore.setState(createInitialDashboardState());
  });

  it('initializes with createInitialDashboardState()', () => {
    const state = useEditorPanelStore.getState();
    const initial = createInitialDashboardState();
    expect(state.sprint).toEqual(initial.sprint);
    expect(state.epics).toEqual(initial.epics);
    expect(state.currentStory).toEqual(initial.currentStory);
    expect(state.errors).toEqual(initial.errors);
    expect(state.loading).toEqual(initial.loading);
    expect(state.outputRoot).toEqual(initial.outputRoot);
  });

  describe('updateState', () => {
    it('replaces full state snapshot', () => {
      const newState: DashboardState = {
        sprint: {
          generated: '2026-01-01',
          project: 'test',
          project_key: 'test',
          tracking_system: 'file-system',
          story_location: 'stories',
          development_status: { 'epic-1': 'in-progress' },
        },
        epics: [
          {
            number: 1,
            key: 'epic-1',
            title: 'Test Epic',
            description: 'A test epic',
            metadata: {},
            status: 'in-progress',
            stories: [],
            filePath: 'test.md',
          },
        ],
        currentStory: null,
        errors: [],
        loading: false,
        outputRoot: '_bmad-output',
        workflows: [],
        bmadMetadata: null,
        planningArtifacts: {
          hasProductBrief: false,
          hasPrd: true,
          hasArchitecture: true,
          hasEpics: true,
          hasReadinessReport: false,
        },
      };

      useEditorPanelStore.getState().updateState(newState);

      const state = useEditorPanelStore.getState();
      expect(state.sprint).toEqual(newState.sprint);
      expect(state.epics).toEqual(newState.epics);
      expect(state.loading).toEqual(newState.loading);
      expect(state.outputRoot).toEqual(newState.outputRoot);
    });

    it('overwrites previous state completely', () => {
      const firstState: DashboardState = {
        sprint: null,
        epics: [
          {
            number: 1,
            key: 'epic-1',
            title: 'First',
            description: 'First epic',
            metadata: {},
            status: 'backlog',
            stories: [],
            filePath: 'first.md',
          },
        ],
        currentStory: null,
        errors: [{ message: 'old error', recoverable: true }],
        loading: false,
        outputRoot: '_bmad-output',
        workflows: [],
        bmadMetadata: null,
        planningArtifacts: {
          hasProductBrief: false,
          hasPrd: false,
          hasArchitecture: false,
          hasEpics: false,
          hasReadinessReport: false,
        },
      };

      const secondState: DashboardState = {
        sprint: null,
        epics: [],
        currentStory: null,
        errors: [],
        loading: true,
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
      };

      useEditorPanelStore.getState().updateState(firstState);
      useEditorPanelStore.getState().updateState(secondState);

      const state = useEditorPanelStore.getState();
      expect(state.epics).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.loading).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('toggles loading flag to true', () => {
      useEditorPanelStore.getState().setLoading(true);
      expect(useEditorPanelStore.getState().loading).toBe(true);
    });

    it('toggles loading flag to false', () => {
      useEditorPanelStore.getState().setLoading(true);
      useEditorPanelStore.getState().setLoading(false);
      expect(useEditorPanelStore.getState().loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('adds error to state', () => {
      useEditorPanelStore.getState().setError('Something went wrong');
      const state = useEditorPanelStore.getState();
      expect(state.errors).toHaveLength(1);
      expect(state.errors[0]).toEqual({
        message: 'Something went wrong',
        recoverable: true,
      });
    });

    it('appends to existing errors', () => {
      useEditorPanelStore.getState().setError('First error');
      useEditorPanelStore.getState().setError('Second error');
      const state = useEditorPanelStore.getState();
      expect(state.errors).toHaveLength(2);
      expect(state.errors[0].message).toBe('First error');
      expect(state.errors[1].message).toBe('Second error');
    });
  });

  describe('selector hooks return correct slices', () => {
    it('useSprint returns sprint slice', () => {
      const { result } = renderHook(() => useSprint());
      expect(result.current).toBeNull();
    });

    it('useEpics returns epics slice', () => {
      const { result } = renderHook(() => useEpics());
      expect(result.current).toEqual([]);
    });

    it('useCurrentStory returns currentStory slice', () => {
      const { result } = renderHook(() => useCurrentStory());
      expect(result.current).toBeNull();
    });

    it('useErrors returns errors slice', () => {
      const { result } = renderHook(() => useErrors());
      expect(result.current).toEqual([]);
    });

    it('useLoading returns loading slice', () => {
      const { result } = renderHook(() => useLoading());
      expect(result.current).toBe(true);
    });

    it('useOutputRoot returns outputRoot slice', () => {
      const { result } = renderHook(() => useOutputRoot());
      expect(result.current).toBeNull();
    });

    it('useWorkflows returns workflows slice', () => {
      const { result } = renderHook(() => useWorkflows());
      expect(result.current).toEqual([]);
    });

    it('useBmadMetadata returns bmadMetadata slice', () => {
      const { result } = renderHook(() => useBmadMetadata());
      expect(result.current).toBeNull();
    });

    it('usePlanningArtifacts returns planningArtifacts slice', () => {
      const { result } = renderHook(() => usePlanningArtifacts());
      expect(result.current).toEqual({
        hasProductBrief: false,
        hasPrd: false,
        hasArchitecture: false,
        hasEpics: false,
        hasReadinessReport: false,
      });
    });
  });
});
