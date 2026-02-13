import React from 'react';
import { Play, Copy } from 'lucide-react';
import { useSprint, useCurrentStory, useWorkflows } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createExecuteWorkflowMessage, createCopyCommandMessage } from '@shared/messages';
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

const actionButtonClass =
  'rounded bg-[var(--vscode-button-background)] p-1 text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)] focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none';

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
  const workflows = useWorkflows();
  const vscodeApi = useVSCodeApi();

  const action = getNextAction(sprint, currentStory);
  const icon = actionIcons[action.type];
  const primaryWorkflow = workflows.find((w) => w.isPrimary);

  const handleExecute = () => {
    if (primaryWorkflow) {
      vscodeApi.postMessage(createExecuteWorkflowMessage(primaryWorkflow.command));
    }
  };

  const handleCopy = () => {
    if (primaryWorkflow) {
      vscodeApi.postMessage(createCopyCommandMessage(primaryWorkflow.command));
    }
  };

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
        {primaryWorkflow && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              data-testid="next-action-execute"
              onClick={handleExecute}
              title={primaryWorkflow.description}
              aria-label={`Execute ${primaryWorkflow.name}`}
              className={actionButtonClass}
            >
              <Play size={12} />
            </button>
            <button
              type="button"
              data-testid="next-action-copy"
              onClick={handleCopy}
              title={`Copy: ${primaryWorkflow.command}`}
              aria-label={`Copy ${primaryWorkflow.name} command`}
              className={actionButtonClass}
            >
              <Copy size={12} />
            </button>
          </div>
        )}
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
