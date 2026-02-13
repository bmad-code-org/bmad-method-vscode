import React, { useEffect } from 'react';
import {
  SprintStatus,
  SprintStatusSkeleton,
  PlanningArtifactLinks,
  EpicList,
  EpicListSkeleton,
  ActiveStoryCard,
  ActiveStoryCardSkeleton,
  NextActionRecommendation,
  NextActionRecommendationSkeleton,
  HeaderToolbar,
  HeaderToolbarSkeleton,
  CTAButtons,
  CTAButtonsSkeleton,
  AboutSection,
  AboutSectionSkeleton,
} from './components';
import { useMessageHandler } from './hooks';
import { useLoading } from './store';
import { useVSCodeApi } from '../shared/hooks';
import { createRefreshMessage } from '@shared/messages';

export function Dashboard(): React.ReactElement {
  useMessageHandler();
  const loading = useLoading();
  const vscodeApi = useVSCodeApi();

  // Send initial REFRESH message to extension on mount to request state
  useEffect(() => {
    vscodeApi.postMessage(createRefreshMessage());
  }, [vscodeApi]);

  if (loading) {
    return (
      <div data-testid="dashboard-loading" className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--vscode-foreground)]">BMAD Dashboard</h1>
          <HeaderToolbarSkeleton />
        </div>
        <SprintStatusSkeleton />
        <EpicListSkeleton />
        <ActiveStoryCardSkeleton />
        <NextActionRecommendationSkeleton />
        <CTAButtonsSkeleton />
        <AboutSectionSkeleton />
      </div>
    );
  }

  return (
    <div data-testid="dashboard-content" className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-[var(--vscode-foreground)]">BMAD Dashboard</h1>
        <HeaderToolbar />
      </div>
      <SprintStatus />
      <EpicList />
      <ActiveStoryCard />
      <NextActionRecommendation />
      <CTAButtons />
      <PlanningArtifactLinks />
      <AboutSection />
    </div>
  );
}

export default Dashboard;
