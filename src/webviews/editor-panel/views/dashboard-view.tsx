import React from 'react';
import {
  SprintStatus,
  SprintStatusSkeleton,
  EpicList,
  EpicListSkeleton,
  ActiveStoryCard,
  ActiveStoryCardSkeleton,
  NextActionRecommendation,
  NextActionRecommendationSkeleton,
  CTAButtons,
  CTAButtonsSkeleton,
  PlanningArtifactLinks,
  AboutSection,
  AboutSectionSkeleton,
} from '../../dashboard/components';
import {
  useEditorPanelStore,
  useLoading,
  useSprint,
  useEpics,
  useCurrentStory,
  useOutputRoot,
  useWorkflows,
  usePlanningArtifacts,
  useBmadMetadata,
} from '../store';
import type { ViewType } from '../types';

const VIEWS: { label: string; view: ViewType; params?: Record<string, string> }[] = [
  { label: 'Dashboard', view: 'dashboard' },
  { label: 'Epics', view: 'epics' },
  { label: 'Stories', view: 'stories' },
  { label: 'Kanban', view: 'stories', params: { mode: 'kanban' } },
  { label: 'Docs', view: 'docs' },
];

function TabBar(): React.ReactElement {
  const navigateTo = useEditorPanelStore((s) => s.navigateTo);
  const currentRoute = useEditorPanelStore((s) => s.currentRoute);

  return (
    <div
      data-testid="dashboard-tab-bar"
      className="flex gap-0 border-b border-[var(--vscode-panel-border)]"
    >
      {VIEWS.map(({ label, view, params }) => {
        const isActive = params
          ? currentRoute.view === view && currentRoute.params?.mode === params.mode
          : currentRoute.view === view && !currentRoute.params?.mode;
        return (
          <button
            key={label}
            type="button"
            data-testid={`tab-${label.toLowerCase()}`}
            onClick={() => {
              if (!isActive) navigateTo({ view, ...(params && { params }) });
            }}
            className={
              isActive
                ? 'border-b-2 border-[var(--vscode-focusBorder)] px-3 py-2 text-xs font-medium text-[var(--vscode-foreground)]'
                : 'cursor-pointer px-3 py-2 text-xs text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)]'
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function DashboardView(): React.ReactElement {
  const loading = useLoading();
  const sprint = useSprint();
  const epics = useEpics();
  const currentStory = useCurrentStory();
  const outputRoot = useOutputRoot();
  const workflows = useWorkflows();
  const planningArtifacts = usePlanningArtifacts();
  const bmadMetadata = useBmadMetadata();

  if (loading) {
    return (
      <div data-testid="editor-dashboard-loading" className="flex flex-col gap-4 p-4">
        <TabBar />
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <SprintStatusSkeleton />
            <ActiveStoryCardSkeleton />
            <NextActionRecommendationSkeleton />
          </div>
          <div className="flex flex-col gap-4">
            <EpicListSkeleton />
            <CTAButtonsSkeleton />
          </div>
        </div>
        <AboutSectionSkeleton />
      </div>
    );
  }

  return (
    <div data-testid="editor-dashboard" className="flex flex-col gap-4 p-4">
      <TabBar />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <SprintStatus sprint={sprint} />
          <ActiveStoryCard currentStory={currentStory} />
          <NextActionRecommendation
            sprint={sprint}
            currentStory={currentStory}
            workflows={workflows}
            planningArtifacts={planningArtifacts}
          />
        </div>
        <div className="flex flex-col gap-4">
          <EpicList sprint={sprint} epics={epics} outputRoot={outputRoot} />
          <CTAButtons workflows={workflows} />
        </div>
      </div>
      <PlanningArtifactLinks outputRoot={outputRoot} />
      <AboutSection bmadMetadata={bmadMetadata} />
    </div>
  );
}
