import React from 'react';
import { useVSCodeApi } from '../../shared/hooks';
import { useDefaultClickBehavior, useOutputRoot } from '../store';
import { createDocumentLinkHandler } from '../../shared/utils/document-link';
import { createNavigateEditorPanelMessage } from '@shared/messages';

export interface ArtifactLink {
  label: string;
  path: string;
}

function getDefaultPlanningArtifacts(outputRoot: string): ArtifactLink[] {
  return [
    { label: 'PRD', path: `${outputRoot}/planning-artifacts/prd.md` },
    { label: 'Architecture', path: `${outputRoot}/planning-artifacts/architecture.md` },
  ];
}

export interface PlanningArtifactLinksProps {
  links?: ArtifactLink[];
  outputRoot?: string | null;
}

export function PlanningArtifactLinks({
  links,
  outputRoot: outputRootProp,
}: PlanningArtifactLinksProps): React.ReactElement | null {
  const vscodeApi = useVSCodeApi();
  const outputRootFromStore = useOutputRoot();
  const defaultClickBehavior = useDefaultClickBehavior();
  const outputRoot =
    (outputRootProp !== undefined ? outputRootProp : outputRootFromStore) ?? '_bmad-output';
  const resolvedLinks = links ?? getDefaultPlanningArtifacts(outputRoot);

  if (resolvedLinks.length === 0) {
    return null;
  }

  const handleClick = (path: string) => (e: React.MouseEvent) => {
    if (e.shiftKey || e.ctrlKey || e.metaKey) {
      createDocumentLinkHandler(vscodeApi, path)(e);
    } else if (defaultClickBehavior === 'editor-panel') {
      vscodeApi.postMessage(createNavigateEditorPanelMessage('docs', { filePath: path }));
    } else {
      createDocumentLinkHandler(vscodeApi, path)(e);
    }
  };

  return (
    <div data-testid="planning-artifact-links" className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">
        Planning Artifacts
      </h3>
      <div className="flex gap-3">
        {resolvedLinks.map(({ label, path }) => (
          <button
            key={path}
            type="button"
            className="text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
            onClick={handleClick(path)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
