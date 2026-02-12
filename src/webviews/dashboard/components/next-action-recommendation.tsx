import React from 'react';
import { useSprint, useCurrentStory } from '../store';
import { getNextAction } from '../utils/get-next-action';
import type { NextAction } from '../utils/get-next-action';

const actionIcons: Record<NextAction['type'], string> = {
  'sprint-planning': '📋',
  'create-story': '📝',
  'dev-story': '🚀',
  'code-review': '🔍',
  retrospective: '🔄',
  'sprint-complete': '🎉',
};

export function NextActionRecommendationSkeleton(): React.ReactElement {
  return (
    <div
      data-testid="next-action-recommendation-skeleton"
      className="flex animate-pulse flex-col gap-2"
    >
      <div className="h-3 w-24 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="flex items-center gap-2">
        <div className="h-5 w-5 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-4 w-40 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
      <div className="h-3 w-56 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
    </div>
  );
}

export function NextActionRecommendation(): React.ReactElement {
  const sprint = useSprint();
  const currentStory = useCurrentStory();

  const action = getNextAction(sprint, currentStory);
  const icon = actionIcons[action.type];

  return (
    <section data-testid="next-action-recommendation" className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">
        Next Action
      </h2>
      <div className="flex items-center gap-2">
        <span data-testid="next-action-icon" className="text-base" role="img" aria-hidden="true">
          {icon}
        </span>
        <span
          data-testid="next-action-label"
          className="text-sm font-medium text-[var(--vscode-textLink-foreground)]"
        >
          {action.label}
        </span>
      </div>
      <p
        data-testid="next-action-description"
        className="text-xs text-[var(--vscode-descriptionForeground)]"
      >
        {action.description}
      </p>
    </section>
  );
}
