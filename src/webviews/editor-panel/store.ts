import { create } from 'zustand';
import type { DashboardState } from '@shared/types';
import { createInitialDashboardState } from '@shared/types';

interface EditorPanelStore extends DashboardState {
  updateState: (state: DashboardState) => void;
  setLoading: (loading: boolean) => void;
  setError: (message: string) => void;
}

export const useEditorPanelStore = create<EditorPanelStore>()((set) => ({
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
