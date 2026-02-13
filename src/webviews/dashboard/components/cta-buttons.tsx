import React, { useCallback } from 'react';
import { Copy } from 'lucide-react';
import { useWorkflows } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createExecuteWorkflowMessage, createCopyCommandMessage } from '@shared/messages';
import type { AvailableWorkflow } from '@shared/types';

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

  const secondaryWorkflows = workflows.filter((w) => !w.isPrimary);

  if (secondaryWorkflows.length === 0) {
    return null;
  }

  return (
    <section data-testid="cta-buttons" className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">
        Other Actions
      </h2>
      {secondaryWorkflows.map((workflow) => (
        <div key={workflow.id} className="flex items-stretch">
          <button
            type="button"
            data-testid={`cta-execute-${workflow.id}`}
            onClick={() => handleExecute(workflow)}
            title={workflow.description}
            className="flex-1 rounded-l bg-[var(--vscode-button-secondaryBackground)] px-3 py-1.5 text-xs font-medium text-[var(--vscode-button-secondaryForeground)] transition-colors hover:bg-[var(--vscode-button-secondaryHoverBackground)] focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none"
          >
            {workflow.name}
          </button>
          <button
            type="button"
            data-testid={`cta-copy-${workflow.id}`}
            onClick={() => handleCopy(workflow)}
            title={`Copy: ${workflow.command}`}
            aria-label={`Copy ${workflow.name} command`}
            className="rounded-r border-l border-[var(--vscode-contrastBorder)] bg-[var(--vscode-button-secondaryBackground)] px-2 py-1.5 text-xs text-[var(--vscode-button-secondaryForeground)] transition-colors hover:bg-[var(--vscode-button-secondaryHoverBackground)] focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none"
          >
            <Copy size={12} />
          </button>
        </div>
      ))}
    </section>
  );
}
