import React, { useCallback } from 'react';
import { Copy } from 'lucide-react';
import { useWorkflows } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createExecuteWorkflowMessage, createCopyCommandMessage } from '@shared/messages';
import type { AvailableWorkflow } from '@shared/types';
import { cn } from '../../shared/utils/cn';

export function CTAButtonsSkeleton(): React.ReactElement {
  return (
    <div data-testid="cta-buttons-skeleton" className="flex animate-pulse flex-col gap-2">
      <div className="h-3 w-16 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="flex items-stretch">
        <div className="h-7 flex-1 rounded-l bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-7 w-8 rounded-r bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
      <div className="flex items-stretch">
        <div className="h-7 flex-1 rounded-l bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-7 w-8 rounded-r bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
    </div>
  );
}

export function CTAButtons(): React.ReactElement | null {
  const workflows = useWorkflows();
  const vscodeApi = useVSCodeApi();

  const handleExecute = useCallback(
    (workflow: AvailableWorkflow) => {
      vscodeApi.postMessage(createExecuteWorkflowMessage(workflow.command));
    },
    [vscodeApi]
  );

  const handleCopy = useCallback(
    (workflow: AvailableWorkflow) => {
      vscodeApi.postMessage(createCopyCommandMessage(workflow.command));
    },
    [vscodeApi]
  );

  if (workflows.length === 0) {
    return null;
  }

  return (
    <section data-testid="cta-buttons" className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">
        Actions
      </h2>
      {workflows.map((workflow) => (
        <div key={workflow.id} className="flex items-stretch">
          <button
            type="button"
            data-testid={`cta-execute-${workflow.id}`}
            onClick={() => handleExecute(workflow)}
            title={workflow.description}
            className={cn(
              'flex-1 rounded-l px-3 py-1.5 text-xs font-medium transition-colors',
              'focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none',
              workflow.isPrimary
                ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]'
                : 'bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]'
            )}
          >
            {workflow.name}
          </button>
          <button
            type="button"
            data-testid={`cta-copy-${workflow.id}`}
            onClick={() => handleCopy(workflow)}
            title={`Copy: ${workflow.command}`}
            aria-label={`Copy ${workflow.name} command`}
            className={cn(
              'rounded-r border-l border-[var(--vscode-contrastBorder)] px-2 py-1.5 text-xs transition-colors',
              'focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none',
              workflow.isPrimary
                ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]'
                : 'bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]'
            )}
          >
            <Copy size={12} />
          </button>
        </div>
      ))}
    </section>
  );
}
