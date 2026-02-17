import { create } from 'zustand';
import type { DashboardState } from '@shared/types';
import { createInitialDashboardState } from '@shared/types';

interface DashboardStore extends DashboardState {
  /** Replace entire state with new snapshot from extension host */
  updateState: (state: DashboardState) => void;
  /** Set loading state */
  setLoading: (loading: boolean) => void;
  /** Set local webview error */
  setError: (message: string) => void;
}

export const useDashboardStore = create<DashboardStore>()((set) => ({
  ...createInitialDashboardState(),

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
    }),

  setLoading: (loading: boolean) => set({ loading }),

  setError: (message: string) =>
    set((prev) => ({
      errors: [...prev.errors, { message, recoverable: true }],
    })),
}));

// Selector hooks for individual state slices (prevents unnecessary re-renders)
export const useSprint = () => useDashboardStore((s) => s.sprint);
export const useEpics = () => useDashboardStore((s) => s.epics);
export const useCurrentStory = () => useDashboardStore((s) => s.currentStory);
export const useErrors = () => useDashboardStore((s) => s.errors);
export const useLoading = () => useDashboardStore((s) => s.loading);
export const useOutputRoot = () => useDashboardStore((s) => s.outputRoot);
export const useWorkflows = () => useDashboardStore((s) => s.workflows);
export const useBmadMetadata = () => useDashboardStore((s) => s.bmadMetadata);
export const usePlanningArtifacts = () => useDashboardStore((s) => s.planningArtifacts);
