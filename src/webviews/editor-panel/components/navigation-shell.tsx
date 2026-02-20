import React from 'react';
import { BreadcrumbBar } from './breadcrumb-bar';
import { useCurrentRoute } from '../store';
import { DashboardView } from '../views/dashboard-view';
import { EpicsView } from '../views/epics-view';
import { EpicDetailView } from '../views/epic-detail-view';
import { StoryDetailView } from '../views/story-detail-view';
import { StoriesView } from '../views/stories-view';
import { PlaceholderView } from '../views/placeholder-view';

function renderView(view: string, params?: Record<string, string>): React.ReactElement {
  switch (view) {
    case 'dashboard':
      return <DashboardView />;
    case 'epics':
      if (params?.storyKey) return <StoryDetailView />;
      if (params?.epicId) return <EpicDetailView />;
      return <EpicsView />;
    case 'stories':
      if (params?.storyKey) return <StoryDetailView />;
      return <StoriesView />;
    default:
      return <PlaceholderView view={view as 'docs'} />;
  }
}

export function NavigationShell(): React.ReactElement {
  const currentRoute = useCurrentRoute();

  return (
    <div data-testid="navigation-shell" className="flex h-full flex-col">
      <BreadcrumbBar />
      <div className="flex-1 overflow-y-auto">
        {renderView(currentRoute.view, currentRoute.params)}
      </div>
    </div>
  );
}
