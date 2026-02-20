import React from 'react';
import { BreadcrumbBar } from './breadcrumb-bar';
import { useCurrentRoute } from '../store';
import { DashboardView } from '../views/dashboard-view';
import { PlaceholderView } from '../views/placeholder-view';

export function NavigationShell(): React.ReactElement {
  const currentRoute = useCurrentRoute();

  return (
    <div data-testid="navigation-shell" className="flex h-full flex-col">
      <BreadcrumbBar />
      <div className="flex-1 overflow-y-auto">
        {currentRoute.view === 'dashboard' ? (
          <DashboardView />
        ) : (
          <PlaceholderView view={currentRoute.view} />
        )}
      </div>
    </div>
  );
}
