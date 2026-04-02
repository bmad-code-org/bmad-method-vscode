import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  useEditorPanelStore,
  createInitialEditorPanelState,
  useSprint,
  useEpics,
  useCurrentStory,
  useErrors,
  useLoading,
  useOutputRoot,
  useWorkflows,
  useBmadMetadata,
  usePlanningArtifacts,
  useCurrentRoute,
  useBreadcrumbs,
  useCanGoBack,
  useFileTree,
  useFileTreeLoading,
  useSelectedDocPath,
  useSelectedDocContent,
  useSelectedDocLoading,
} from './store';
import { createInitialDashboardState } from '@shared/types';
import type { DashboardState } from '@shared/types';

describe('useEditorPanelStore', () => {
  beforeEach(() => {
    useEditorPanelStore.setState(createInitialEditorPanelState());
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

  it('initializes with default navigation state', () => {
    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({ view: 'dashboard' });
    expect(state.breadcrumbs).toEqual([{ label: 'Dashboard', route: { view: 'dashboard' } }]);
    expect(state.navigationHistory).toEqual([]);
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
        defaultClickBehavior: 'markdown-preview',
        storySummaries: [],
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
        defaultClickBehavior: 'markdown-preview',
        storySummaries: [],
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
        defaultClickBehavior: 'markdown-preview',
        storySummaries: [],
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

  describe('navigateTo', () => {
    it('pushes route and updates breadcrumbs', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });

      const state = useEditorPanelStore.getState();
      expect(state.currentRoute).toEqual({ view: 'epics' });
      expect(state.breadcrumbs).toHaveLength(2);
      expect(state.breadcrumbs[0]).toEqual({ label: 'Dashboard', route: { view: 'dashboard' } });
      expect(state.breadcrumbs[1]).toEqual({ label: 'Epics', route: { view: 'epics' } });
    });

    it('saves previous route to history', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });

      const state = useEditorPanelStore.getState();
      expect(state.navigationHistory).toHaveLength(1);
      expect(state.navigationHistory[0]).toEqual({ view: 'dashboard' });
    });

    it('navigating to dashboard shows single breadcrumb', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });
      useEditorPanelStore.getState().navigateTo({ view: 'dashboard' });

      const state = useEditorPanelStore.getState();
      expect(state.currentRoute).toEqual({ view: 'dashboard' });
      expect(state.breadcrumbs).toHaveLength(1);
      expect(state.breadcrumbs[0].label).toBe('Dashboard');
    });

    it('preserves route params', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics', params: { epicNum: '3' } });

      const state = useEditorPanelStore.getState();
      expect(state.currentRoute.params).toEqual({ epicNum: '3' });
    });

    it('caps history at 10 entries', () => {
      for (let i = 0; i < 12; i++) {
        useEditorPanelStore
          .getState()
          .navigateTo({ view: 'epics', params: { epicNum: String(i) } });
      }

      const state = useEditorPanelStore.getState();
      expect(state.navigationHistory).toHaveLength(10);
    });

    it('drops oldest entries when history exceeds cap', () => {
      // Start at dashboard, navigate 11 times
      for (let i = 0; i < 11; i++) {
        useEditorPanelStore
          .getState()
          .navigateTo({ view: 'epics', params: { epicNum: String(i) } });
      }

      const state = useEditorPanelStore.getState();
      expect(state.navigationHistory).toHaveLength(10);
      // The initial dashboard route and first navigation should be dropped
      expect(state.navigationHistory[0]).toEqual({ view: 'epics', params: { epicNum: '0' } });
    });
  });

  describe('buildBreadcrumbs for stories view', () => {
    it('generates Dashboard / Stories breadcrumbs for stories view', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'stories' });

      const state = useEditorPanelStore.getState();
      expect(state.breadcrumbs).toHaveLength(2);
      expect(state.breadcrumbs[0]).toEqual({ label: 'Dashboard', route: { view: 'dashboard' } });
      expect(state.breadcrumbs[1]).toEqual({ label: 'Stories', route: { view: 'stories' } });
    });

    it('generates Dashboard / Stories / Story N.M: Title breadcrumbs with storyKey', () => {
      useEditorPanelStore.setState({
        ...createInitialEditorPanelState(),
        storySummaries: [
          {
            key: '2-1-feature-a',
            title: 'Feature Alpha',
            status: 'in-progress',
            epicNumber: 2,
            storyNumber: 1,
            totalTasks: 5,
            completedTasks: 2,
            totalSubtasks: 10,
            completedSubtasks: 4,
            filePath: 'impl/2-1-feature-a.md',
          },
        ],
      });
      useEditorPanelStore
        .getState()
        .navigateTo({ view: 'stories', params: { storyKey: '2-1-feature-a' } });

      const state = useEditorPanelStore.getState();
      expect(state.breadcrumbs).toHaveLength(3);
      expect(state.breadcrumbs[0]).toEqual({ label: 'Dashboard', route: { view: 'dashboard' } });
      expect(state.breadcrumbs[1]).toEqual({ label: 'Stories', route: { view: 'stories' } });
      expect(state.breadcrumbs[2]).toEqual({
        label: 'Story 2.1: Feature Alpha',
        route: { view: 'stories', params: { storyKey: '2-1-feature-a' } },
      });
    });

    it('uses storyKey as fallback label when summary not found', () => {
      useEditorPanelStore
        .getState()
        .navigateTo({ view: 'stories', params: { storyKey: '9-9-unknown' } });

      const state = useEditorPanelStore.getState();
      expect(state.breadcrumbs).toHaveLength(3);
      expect(state.breadcrumbs[2].label).toBe('9-9-unknown');
    });

    it('stories breadcrumbs not affected by mode param', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'stories', params: { mode: 'kanban' } });

      const state = useEditorPanelStore.getState();
      expect(state.breadcrumbs).toHaveLength(2);
      expect(state.breadcrumbs[1]).toEqual({
        label: 'Stories',
        route: { view: 'stories' },
      });
    });
  });

  describe('goBack', () => {
    it('returns to previous route', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });
      useEditorPanelStore.getState().goBack();

      const state = useEditorPanelStore.getState();
      expect(state.currentRoute).toEqual({ view: 'dashboard' });
      expect(state.navigationHistory).toHaveLength(0);
    });

    it('updates breadcrumbs when going back', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });
      useEditorPanelStore.getState().goBack();

      const state = useEditorPanelStore.getState();
      expect(state.breadcrumbs).toHaveLength(1);
      expect(state.breadcrumbs[0].label).toBe('Dashboard');
    });

    it('does nothing when history is empty', () => {
      const before = useEditorPanelStore.getState();
      useEditorPanelStore.getState().goBack();
      const after = useEditorPanelStore.getState();

      expect(after.currentRoute).toEqual(before.currentRoute);
      expect(after.breadcrumbs).toEqual(before.breadcrumbs);
    });

    it('pops history stack correctly through multiple navigations', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });
      useEditorPanelStore.getState().navigateTo({ view: 'stories' });
      useEditorPanelStore.getState().navigateTo({ view: 'docs' });

      expect(useEditorPanelStore.getState().navigationHistory).toHaveLength(3);

      useEditorPanelStore.getState().goBack();
      expect(useEditorPanelStore.getState().currentRoute).toEqual({ view: 'stories' });
      expect(useEditorPanelStore.getState().navigationHistory).toHaveLength(2);

      useEditorPanelStore.getState().goBack();
      expect(useEditorPanelStore.getState().currentRoute).toEqual({ view: 'epics' });
      expect(useEditorPanelStore.getState().navigationHistory).toHaveLength(1);

      useEditorPanelStore.getState().goBack();
      expect(useEditorPanelStore.getState().currentRoute).toEqual({ view: 'dashboard' });
      expect(useEditorPanelStore.getState().navigationHistory).toHaveLength(0);
    });
  });

  describe('navigateToBreadcrumb', () => {
    it('navigates to breadcrumb at index', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });
      useEditorPanelStore.getState().navigateToBreadcrumb(0);

      const state = useEditorPanelStore.getState();
      expect(state.currentRoute).toEqual({ view: 'dashboard' });
      expect(state.breadcrumbs).toHaveLength(1);
    });

    it('truncates history to match breadcrumb level', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });
      useEditorPanelStore.getState().navigateTo({ view: 'stories' });

      // Navigate to first breadcrumb (Dashboard)
      useEditorPanelStore.getState().navigateToBreadcrumb(0);

      const state = useEditorPanelStore.getState();
      expect(state.navigationHistory).toHaveLength(0);
    });

    it('does nothing for out-of-bounds index', () => {
      const before = useEditorPanelStore.getState();
      useEditorPanelStore.getState().navigateToBreadcrumb(5);
      const after = useEditorPanelStore.getState();

      expect(after.currentRoute).toEqual(before.currentRoute);
    });

    it('does nothing for negative index', () => {
      const before = useEditorPanelStore.getState();
      useEditorPanelStore.getState().navigateToBreadcrumb(-1);
      const after = useEditorPanelStore.getState();

      expect(after.currentRoute).toEqual(before.currentRoute);
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

    it('useCurrentRoute returns currentRoute slice', () => {
      const { result } = renderHook(() => useCurrentRoute());
      expect(result.current).toEqual({ view: 'dashboard' });
    });

    it('useBreadcrumbs returns breadcrumbs slice', () => {
      const { result } = renderHook(() => useBreadcrumbs());
      expect(result.current).toEqual([{ label: 'Dashboard', route: { view: 'dashboard' } }]);
    });

    it('useCanGoBack returns false when history is empty', () => {
      const { result } = renderHook(() => useCanGoBack());
      expect(result.current).toBe(false);
    });

    it('useCanGoBack returns true when history has entries', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'epics' });
      const { result } = renderHook(() => useCanGoBack());
      expect(result.current).toBe(true);
    });
  });

  describe('document library state', () => {
    it('initializes with null/false defaults', () => {
      const state = useEditorPanelStore.getState();
      expect(state.fileTree).toBeNull();
      expect(state.fileTreeLoading).toBe(false);
      expect(state.selectedDocPath).toBeNull();
      expect(state.selectedDocContent).toBeNull();
      expect(state.selectedDocLoading).toBe(false);
    });

    it('setFileTree stores roots and clears loading', () => {
      useEditorPanelStore.getState().setFileTreeLoading(true);
      useEditorPanelStore
        .getState()
        .setFileTree([{ name: 'docs', path: 'docs', type: 'directory', children: [] }]);

      const state = useEditorPanelStore.getState();
      expect(state.fileTree).toHaveLength(1);
      expect(state.fileTree![0].name).toBe('docs');
      expect(state.fileTreeLoading).toBe(false);
    });

    it('setFileTreeLoading toggles loading state', () => {
      useEditorPanelStore.getState().setFileTreeLoading(true);
      expect(useEditorPanelStore.getState().fileTreeLoading).toBe(true);

      useEditorPanelStore.getState().setFileTreeLoading(false);
      expect(useEditorPanelStore.getState().fileTreeLoading).toBe(false);
    });

    it('setSelectedDoc stores path and content, clears loading', () => {
      useEditorPanelStore.getState().setSelectedDocLoading(true);
      useEditorPanelStore.getState().setSelectedDoc('docs/readme.md', '# Hello');

      const state = useEditorPanelStore.getState();
      expect(state.selectedDocPath).toBe('docs/readme.md');
      expect(state.selectedDocContent).toBe('# Hello');
      expect(state.selectedDocLoading).toBe(false);
    });

    it('setSelectedDocLoading toggles loading state', () => {
      useEditorPanelStore.getState().setSelectedDocLoading(true);
      expect(useEditorPanelStore.getState().selectedDocLoading).toBe(true);
    });

    it('clearSelectedDoc resets doc state', () => {
      useEditorPanelStore.getState().setSelectedDoc('docs/readme.md', '# Hello');
      useEditorPanelStore.getState().clearSelectedDoc();

      const state = useEditorPanelStore.getState();
      expect(state.selectedDocPath).toBeNull();
      expect(state.selectedDocContent).toBeNull();
      expect(state.selectedDocLoading).toBe(false);
    });
  });

  describe('document library selector hooks', () => {
    it('useFileTree returns fileTree slice', () => {
      const { result } = renderHook(() => useFileTree());
      expect(result.current).toBeNull();
    });

    it('useFileTreeLoading returns fileTreeLoading slice', () => {
      const { result } = renderHook(() => useFileTreeLoading());
      expect(result.current).toBe(false);
    });

    it('useSelectedDocPath returns selectedDocPath slice', () => {
      const { result } = renderHook(() => useSelectedDocPath());
      expect(result.current).toBeNull();
    });

    it('useSelectedDocContent returns selectedDocContent slice', () => {
      const { result } = renderHook(() => useSelectedDocContent());
      expect(result.current).toBeNull();
    });

    it('useSelectedDocLoading returns selectedDocLoading slice', () => {
      const { result } = renderHook(() => useSelectedDocLoading());
      expect(result.current).toBe(false);
    });
  });

  describe('buildBreadcrumbs for docs view', () => {
    it('generates Dashboard / Docs breadcrumbs', () => {
      useEditorPanelStore.getState().navigateTo({ view: 'docs' });

      const state = useEditorPanelStore.getState();
      expect(state.breadcrumbs).toHaveLength(2);
      expect(state.breadcrumbs[0]).toEqual({ label: 'Dashboard', route: { view: 'dashboard' } });
      expect(state.breadcrumbs[1]).toEqual({ label: 'Docs', route: { view: 'docs' } });
    });

    it('generates Dashboard / Docs / filename.md with filePath param', () => {
      useEditorPanelStore
        .getState()
        .navigateTo({ view: 'docs', params: { filePath: 'docs/architecture.md' } });

      const state = useEditorPanelStore.getState();
      expect(state.breadcrumbs).toHaveLength(3);
      expect(state.breadcrumbs[0]).toEqual({ label: 'Dashboard', route: { view: 'dashboard' } });
      expect(state.breadcrumbs[1]).toEqual({ label: 'Docs', route: { view: 'docs' } });
      expect(state.breadcrumbs[2]).toEqual({
        label: 'architecture.md',
        route: { view: 'docs', params: { filePath: 'docs/architecture.md' } },
      });
    });

    it('extracts filename from nested path', () => {
      useEditorPanelStore.getState().navigateTo({
        view: 'docs',
        params: { filePath: '_bmad-output/planning-artifacts/prd.md' },
      });

      const state = useEditorPanelStore.getState();
      expect(state.breadcrumbs[2].label).toBe('prd.md');
    });
  });
});
