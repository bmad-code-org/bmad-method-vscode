import React from 'react';
import { useVSCodeApi } from '../../shared/hooks';
import { createOpenDocumentMessage } from '@shared/messages';

export interface ArtifactLink {
  label: string;
  path: string;
}

const DEFAULT_PLANNING_ARTIFACTS: ArtifactLink[] = [
  { label: 'PRD', path: '_bmad-output/planning-artifacts/prd.md' },
  { label: 'Architecture', path: '_bmad-output/planning-artifacts/architecture.md' },
];

interface PlanningArtifactLinksProps {
  links?: ArtifactLink[];
}

export function PlanningArtifactLinks({
  links = DEFAULT_PLANNING_ARTIFACTS,
}: PlanningArtifactLinksProps): React.ReactElement | null {
  const vscodeApi = useVSCodeApi();

  if (links.length === 0) {
    return null;
  }

  return (
    <div data-testid="planning-artifact-links" className="flex flex-col gap-2">
      <h3 className="text-xs font-medium text-[var(--vscode-descriptionForeground)]">
        Planning Artifacts
      </h3>
      <div className="flex gap-3">
        {links.map(({ label, path }) => (
          <button
            key={path}
            type="button"
            className="text-xs text-[var(--vscode-textLink-foreground)] hover:underline"
            onClick={() => vscodeApi.postMessage(createOpenDocumentMessage(path))}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
