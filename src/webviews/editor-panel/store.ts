import { create } from 'zustand';
import type { DashboardState, Story, FileTreeNode } from '@shared/types';
import { createInitialDashboardState } from '@shared/types';
import type { ViewRoute, BreadcrumbItem } from './types';

const MAX_HISTORY = 10;

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  epics: 'Epics',
  stories: 'Stories',
  docs: 'Docs',
};

function buildBreadcrumbs(
  route: ViewRoute,
  state?: { epics: DashboardState['epics']; storySummaries: DashboardState['storySummaries'] }
): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: 'Dashboard', route: { view: 'dashboard' } }];

  if (route.view === 'dashboard') return crumbs;

  const params = route.params;

  if (route.view === 'epics') {
    // Epics list level
    crumbs.push({
      label: 'Epics',
      route: { view: 'epics' },
    });

    if (params?.epicId) {
      // Epic detail level
      let epicLabel = `Epic ${params.epicId}`;
      if (state) {
        const epic = state.epics.find((e) => String(e.number) === params.epicId);
        if (epic) epicLabel = `Epic ${epic.number}: ${epic.title}`;
      }
      crumbs.push({
        label: epicLabel,
        route: { view: 'epics', params: { epicId: params.epicId } },
      });

      if (params.storyKey) {
        // Story detail level
        let storyLabel = params.storyKey;
        if (state) {
          const summary = state.storySummaries.find((s) => s.key === params.storyKey);
          if (summary) {
            storyLabel = `Story ${summary.epicNumber}.${summary.storyNumber}${summary.storySuffix ?? ''}: ${summary.title}`;
          }
        }
        crumbs.push({
          label: storyLabel,
          route: { view: 'epics', params: { epicId: params.epicId, storyKey: params.storyKey } },
        });
      }
    }
  } else if (route.view === 'stories') {
    // Stories list level
    crumbs.push({
      label: 'Stories',
      route: { view: 'stories' },
    });

    if (params?.storyKey) {
      // Story detail level (from stories view)
      let storyLabel = params.storyKey;
      if (state) {
        const summary = state.storySummaries.find((s) => s.key === params.storyKey);
        if (summary) {
          storyLabel = `Story ${summary.epicNumber}.${summary.storyNumber}${summary.storySuffix ?? ''}: ${summary.title}`;
        }
      }
      crumbs.push({
        label: storyLabel,
        route: { view: 'stories', params: { storyKey: params.storyKey } },
      });
    }
  } else if (route.view === 'docs') {
    crumbs.push({
      label: 'Docs',
      route: { view: 'docs' },
    });

    if (params?.filePath) {
      // Extract filename from path
      const parts = params.filePath.split('/');
      const fileName = parts[parts.length - 1] || params.filePath;
      crumbs.push({
        label: fileName,
        route: { view: 'docs', params: { filePath: params.filePath } },
      });
    }
  } else {
    crumbs.push({
      label: VIEW_LABELS[route.view] ?? route.view,
      route,
    });
  }

  return crumbs;
}

interface StoryDetailState {
  storyDetail: Story | null;
  storyDetailLoading: boolean;
}

interface DocumentLibraryState {
  fileTree: FileTreeNode[] | null;
  fileTreeLoading: boolean;
  selectedDocPath: string | null;
  selectedDocContent: string | null;
  selectedDocLoading: boolean;
}

interface NavigationState {
  currentRoute: ViewRoute;
  breadcrumbs: BreadcrumbItem[];
  navigationHistory: ViewRoute[];
}

interface EditorPanelStore
  extends DashboardState, NavigationState, StoryDetailState, DocumentLibraryState {
  updateState: (state: DashboardState) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  navigateTo: (route: ViewRoute) => void;
  goBack: () => void;
  navigateToBreadcrumb: (index: number) => void;
  setStoryDetail: (story: Story) => void;
  setStoryDetailLoading: (loading: boolean) => void;
  clearStoryDetail: () => void;
  setFileTree: (roots: FileTreeNode[]) => void;
  setFileTreeLoading: (loading: boolean) => void;
  setSelectedDoc: (path: string, content: string) => void;
  setSelectedDocLoading: (loading: boolean) => void;
  clearSelectedDoc: () => void;
}

export function createInitialEditorPanelState(): DashboardState &
  NavigationState &
  StoryDetailState &
  DocumentLibraryState {
  return {
    ...createInitialDashboardState(),
    currentRoute: { view: 'dashboard' },
    breadcrumbs: [{ label: 'Dashboard', route: { view: 'dashboard' } }],
    navigationHistory: [],
    storyDetail: null,
    storyDetailLoading: false,
    fileTree: null,
    fileTreeLoading: false,
    selectedDocPath: null,
    selectedDocContent: null,
    selectedDocLoading: false,
  };
}

export const useEditorPanelStore = create<EditorPanelStore>()((set) => ({
  ...createInitialEditorPanelState(),

  updateState: (state: DashboardState) =>
    set({
      sprint: state.sprint,
      epics: state.epics,
      currentStory: state.currentStory,
      errors: state.errors,
      loading: state.loading,
      outputRoot: state.outputRoot,
      workflows: state.workflows,
      bmadMetadata: state.bmadMetadata,
      planningArtifacts: state.planningArtifacts,
      defaultClickBehavior: state.defaultClickBehavior,
      storySummaries: state.storySummaries,
    }),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (message: string) =>
    set((prev) => ({
      errors: [...prev.errors, { message, recoverable: true }],
    })),

  navigateTo: (route: ViewRoute) =>
    set((prev) => {
      const history = [...prev.navigationHistory, prev.currentRoute];
      if (history.length > MAX_HISTORY) {
        history.splice(0, history.length - MAX_HISTORY);
      }
      return {
        currentRoute: route,
        breadcrumbs: buildBreadcrumbs(route, {
          epics: prev.epics,
          storySummaries: prev.storySummaries,
        }),
        navigationHistory: history,
      };
    }),

  goBack: () =>
    set((prev) => {
      if (prev.navigationHistory.length === 0) return prev;
      const history = [...prev.navigationHistory];
      const previousRoute = history.pop()!;
      return {
        currentRoute: previousRoute,
        breadcrumbs: buildBreadcrumbs(previousRoute, {
          epics: prev.epics,
          storySummaries: prev.storySummaries,
        }),
        navigationHistory: history,
      };
    }),

  navigateToBreadcrumb: (index: number) =>
    set((prev) => {
      if (index < 0 || index >= prev.breadcrumbs.length) return prev;
      const targetCrumb = prev.breadcrumbs[index];
      const truncatedBreadcrumbs = prev.breadcrumbs.slice(0, index + 1);
      // Truncate history to match breadcrumb level
      const truncatedHistory = prev.navigationHistory.slice(0, index);
      return {
        currentRoute: targetCrumb.route,
        breadcrumbs: truncatedBreadcrumbs,
        navigationHistory: truncatedHistory,
      };
    }),

  setStoryDetail: (story: Story) => set({ storyDetail: story, storyDetailLoading: false }),

  setStoryDetailLoading: (loading: boolean) => set({ storyDetailLoading: loading }),

  clearStoryDetail: () => set({ storyDetail: null, storyDetailLoading: false }),

  setFileTree: (roots: FileTreeNode[]) => set({ fileTree: roots, fileTreeLoading: false }),

  setFileTreeLoading: (loading: boolean) => set({ fileTreeLoading: loading }),

  setSelectedDoc: (path: string, content: string) =>
    set({ selectedDocPath: path, selectedDocContent: content, selectedDocLoading: false }),

  setSelectedDocLoading: (loading: boolean) => set({ selectedDocLoading: loading }),

  clearSelectedDoc: () =>
    set({ selectedDocPath: null, selectedDocContent: null, selectedDocLoading: false }),
}));

// Selector hooks for individual state slices
export const useSprint = () => useEditorPanelStore((s) => s.sprint);
export const useEpics = () => useEditorPanelStore((s) => s.epics);
export const useCurrentStory = () => useEditorPanelStore((s) => s.currentStory);
export const useErrors = () => useEditorPanelStore((s) => s.errors);
export const useLoading = () => useEditorPanelStore((s) => s.loading);
export const useOutputRoot = () => useEditorPanelStore((s) => s.outputRoot);
export const useWorkflows = () => useEditorPanelStore((s) => s.workflows);
export const useBmadMetadata = () => useEditorPanelStore((s) => s.bmadMetadata);
export const usePlanningArtifacts = () => useEditorPanelStore((s) => s.planningArtifacts);
export const useStorySummaries = () => useEditorPanelStore((s) => s.storySummaries);
export const useStoryDetail = () => useEditorPanelStore((s) => s.storyDetail);
export const useStoryDetailLoading = () => useEditorPanelStore((s) => s.storyDetailLoading);

// Document library selector hooks
export const useFileTree = () => useEditorPanelStore((s) => s.fileTree);
export const useFileTreeLoading = () => useEditorPanelStore((s) => s.fileTreeLoading);
export const useSelectedDocPath = () => useEditorPanelStore((s) => s.selectedDocPath);
export const useSelectedDocContent = () => useEditorPanelStore((s) => s.selectedDocContent);
export const useSelectedDocLoading = () => useEditorPanelStore((s) => s.selectedDocLoading);

// Navigation selector hooks
export const useCurrentRoute = () => useEditorPanelStore((s) => s.currentRoute);
export const useBreadcrumbs = () => useEditorPanelStore((s) => s.breadcrumbs);
export const useCanGoBack = () => useEditorPanelStore((s) => s.navigationHistory.length > 0);
