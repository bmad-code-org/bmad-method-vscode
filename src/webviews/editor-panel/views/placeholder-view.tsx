import React from 'react';
import type { ViewType } from '../types';

const COMING_SOON_MAP: Partial<Record<ViewType, string>> = {
  docs: 'Coming in Story 5.8',
};

interface PlaceholderViewProps {
  view: ViewType;
}

export function PlaceholderView({ view }: PlaceholderViewProps): React.ReactElement {
  const message = COMING_SOON_MAP[view] || 'Coming soon';

  return (
    <div data-testid="placeholder-view" className="flex h-full items-center justify-center p-8">
      <div className="text-center">
        <h2 className="mb-2 text-lg font-semibold text-[var(--vscode-foreground)] capitalize">
          {view}
        </h2>
        <p className="text-sm text-[var(--vscode-descriptionForeground)]">{message}</p>
      </div>
    </div>
  );
}
