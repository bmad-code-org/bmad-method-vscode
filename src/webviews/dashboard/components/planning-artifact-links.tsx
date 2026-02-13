import React from 'react';
import { useVSCodeApi } from '../../shared/hooks';
import { useOutputRoot } from '../store';
import { createDocumentLinkHandler } from '../../shared/utils/document-link';

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

interface PlanningArtifactLinksProps {
  links?: ArtifactLink[];
}

export function PlanningArtifactLinks({
  links,
}: PlanningArtifactLinksProps): React.ReactElement | null {
  const vscodeApi = useVSCodeApi();
  const outputRoot = useOutputRoot() ?? '_bmad-output';
  const resolvedLinks = links ?? getDefaultPlanningArtifacts(outputRoot);

  if (resolvedLinks.length === 0) {
    return null;
  }

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
            onClick={createDocumentLinkHandler(vscodeApi, path)}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
