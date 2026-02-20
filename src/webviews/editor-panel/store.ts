import { create } from 'zustand';
import type { DashboardState } from '@shared/types';
import { createInitialDashboardState } from '@shared/types';
import type { ViewRoute, BreadcrumbItem } from './types';

const MAX_HISTORY = 10;

const VIEW_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  epics: 'Epics',
  stories: 'Stories',
  kanban: 'Kanban',
  docs: 'Docs',
};

function buildBreadcrumbs(route: ViewRoute): BreadcrumbItem[] {
  const crumbs: BreadcrumbItem[] = [{ label: 'Dashboard', route: { view: 'dashboard' } }];

  if (route.view !== 'dashboard') {
    crumbs.push({
      label: VIEW_LABELS[route.view] ?? route.view,
      route,
    });
  }

  return crumbs;
}

interface NavigationState {
  currentRoute: ViewRoute;
  breadcrumbs: BreadcrumbItem[];
  navigationHistory: ViewRoute[];
}

interface EditorPanelStore extends DashboardState, NavigationState {
  updateState: (state: DashboardState) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
  navigateTo: (route: ViewRoute) => void;
  goBack: () => void;
  navigateToBreadcrumb: (index: number) => void;
}

export function createInitialEditorPanelState(): DashboardState & NavigationState {
  return {
    ...createInitialDashboardState(),
    currentRoute: { view: 'dashboard' },
    breadcrumbs: [{ label: 'Dashboard', route: { view: 'dashboard' } }],
    navigationHistory: [],
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
        breadcrumbs: buildBreadcrumbs(route),
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
        breadcrumbs: buildBreadcrumbs(previousRoute),
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

// Navigation selector hooks
export const useCurrentRoute = () => useEditorPanelStore((s) => s.currentRoute);
export const useBreadcrumbs = () => useEditorPanelStore((s) => s.breadcrumbs);
export const useCanGoBack = () => useEditorPanelStore((s) => s.navigationHistory.length > 0);
