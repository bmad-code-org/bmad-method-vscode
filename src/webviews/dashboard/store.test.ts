import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useDashboardStore,
  useSprint,
  useEpics,
  useCurrentStory,
  useErrors,
  useLoading,
} from './store';
import { createInitialDashboardState } from '@shared/types';
import type { DashboardState } from '@shared/types';

describe('useDashboardStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useDashboardStore.setState(createInitialDashboardState());
  });

  it('initializes with createInitialDashboardState()', () => {
    const state = useDashboardStore.getState();
    const initial = createInitialDashboardState();
    expect(state.sprint).toEqual(initial.sprint);
    expect(state.epics).toEqual(initial.epics);
    expect(state.currentStory).toEqual(initial.currentStory);
    expect(state.errors).toEqual(initial.errors);
    expect(state.loading).toEqual(initial.loading);
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
      };

      useDashboardStore.getState().updateState(newState);

      const state = useDashboardStore.getState();
      expect(state.sprint).toEqual(newState.sprint);
      expect(state.epics).toEqual(newState.epics);
      expect(state.currentStory).toEqual(newState.currentStory);
      expect(state.errors).toEqual(newState.errors);
      expect(state.loading).toEqual(newState.loading);
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
      };

      const secondState: DashboardState = {
        sprint: null,
        epics: [],
        currentStory: null,
        errors: [],
        loading: true,
      };

      useDashboardStore.getState().updateState(firstState);
      useDashboardStore.getState().updateState(secondState);

      const state = useDashboardStore.getState();
      expect(state.epics).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.loading).toBe(true);
    });
  });

  describe('setLoading', () => {
    it('toggles loading flag to true', () => {
      useDashboardStore.getState().setLoading(true);
      expect(useDashboardStore.getState().loading).toBe(true);
    });

    it('toggles loading flag to false', () => {
      useDashboardStore.getState().setLoading(true);
      useDashboardStore.getState().setLoading(false);
      expect(useDashboardStore.getState().loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('adds error to state', () => {
      useDashboardStore.getState().setError('Something went wrong');
      const state = useDashboardStore.getState();
      expect(state.errors).toHaveLength(1);
      expect(state.errors[0]).toEqual({
        message: 'Something went wrong',
        recoverable: true,
      });
    });

    it('appends to existing errors', () => {
      useDashboardStore.getState().setError('First error');
      useDashboardStore.getState().setError('Second error');
      const state = useDashboardStore.getState();
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
  });
});
