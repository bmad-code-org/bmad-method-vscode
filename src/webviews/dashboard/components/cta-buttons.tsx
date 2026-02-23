import React, { useCallback } from 'react';
import { Copy } from 'lucide-react';
import { useWorkflows, useCurrentStory } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createExecuteWorkflowMessage, createCopyCommandMessage } from '@shared/messages';
import type { AvailableWorkflow } from '@shared/types';
import { buildCommandWithStory } from '../utils/build-command-with-story';

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

function WorkflowButtonRow({
  workflow,
  resolvedCommand,
  onExecute,
  onCopy,
  variant,
}: {
  workflow: AvailableWorkflow;
  resolvedCommand: string;
  onExecute: (command: string) => void;
  onCopy: (command: string) => void;
  variant: 'mandatory' | 'optional';
}): React.ReactElement {
  const bgClass =
    variant === 'mandatory'
      ? 'bg-[var(--vscode-button-background)] text-[var(--vscode-button-foreground)] hover:bg-[var(--vscode-button-hoverBackground)]'
      : 'bg-[var(--vscode-button-secondaryBackground)] text-[var(--vscode-button-secondaryForeground)] hover:bg-[var(--vscode-button-secondaryHoverBackground)]';

  return (
    <div className="flex items-stretch">
      <button
        type="button"
        data-testid={`cta-execute-${workflow.id}`}
        onClick={() => onExecute(resolvedCommand)}
        title={workflow.description}
        className={`flex-1 rounded-l px-3 py-1.5 text-xs font-medium transition-colors focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none ${bgClass}`}
      >
        {workflow.name}
      </button>
      <button
        type="button"
        data-testid={`cta-copy-${workflow.id}`}
        onClick={() => onCopy(resolvedCommand)}
        title={`Copy: ${resolvedCommand}`}
        aria-label={`Copy ${workflow.name} command`}
        className={`rounded-r border-l border-[var(--vscode-contrastBorder)] px-2 py-1.5 text-xs transition-colors focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none ${bgClass}`}
      >
        <Copy size={12} />
      </button>
    </div>
  );
}

export interface CTAButtonsProps {
  workflows?: AvailableWorkflow[];
}

export function CTAButtons({
  workflows: workflowsProp,
}: CTAButtonsProps = {}): React.ReactElement | null {
  const workflowsFromStore = useWorkflows();
  const workflows = workflowsProp !== undefined ? workflowsProp : workflowsFromStore;
  const currentStory = useCurrentStory();
  const vscodeApi = useVSCodeApi();

  const handleExecute = useCallback(
    (command: string) => {
      vscodeApi.postMessage(createExecuteWorkflowMessage(command));
    },
    [vscodeApi]
  );

  const handleCopy = useCallback(
    (command: string) => {
      vscodeApi.postMessage(createCopyCommandMessage(command));
    },
    [vscodeApi]
  );

  const mandatoryWorkflows = workflows.filter((w) => w.kind === 'mandatory');
  const optionalWorkflows = workflows.filter((w) => w.kind === 'optional');

  if (mandatoryWorkflows.length === 0 && optionalWorkflows.length === 0) {
    return null;
  }

  return (
    <>
      {mandatoryWorkflows.length > 0 && (
        <section data-testid="cta-mandatory" className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">
            Required Actions
          </h2>
          {mandatoryWorkflows.map((workflow) => (
            <WorkflowButtonRow
              key={workflow.id}
              workflow={workflow}
              resolvedCommand={buildCommandWithStory(workflow.command, currentStory, workflow.id)}
              onExecute={handleExecute}
              onCopy={handleCopy}
              variant="mandatory"
            />
          ))}
        </section>
      )}
      {optionalWorkflows.length > 0 && (
        <section data-testid="cta-buttons" className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">
            Other Actions
          </h2>
          {optionalWorkflows.map((workflow) => (
            <WorkflowButtonRow
              key={workflow.id}
              workflow={workflow}
              resolvedCommand={buildCommandWithStory(workflow.command, currentStory, workflow.id)}
              onExecute={handleExecute}
              onCopy={handleCopy}
              variant="optional"
            />
          ))}
        </section>
      )}
    </>
  );
}
