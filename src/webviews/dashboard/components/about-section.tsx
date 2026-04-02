import React from 'react';
import { useBmadMetadata } from '../store';

const formatDate = (isoDate: string): string => {
  try {
    const date = new Date(isoDate);
    if (isNaN(date.getTime())) return 'Unknown';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'Unknown';
  }
};

export function AboutSectionSkeleton(): React.ReactElement {
  return (
    <section data-testid="about-section-skeleton" className="flex animate-pulse flex-col gap-1">
      <div className="h-3 w-12 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-3 w-32 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-3 w-28 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-3 w-24 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
    </section>
  );
}

export interface AboutSectionProps {
  bmadMetadata?: import('@shared/types').BmadMetadata | null;
}

export function AboutSection({
  bmadMetadata: metadataProp,
}: AboutSectionProps = {}): React.ReactElement {
  const metadataFromStore = useBmadMetadata();
  const metadata = metadataProp !== undefined ? metadataProp : metadataFromStore;

  const version = metadata?.version ?? 'Unknown';
  const lastUpdated = metadata?.lastUpdated ? formatDate(metadata.lastUpdated) : 'Unknown';
  const moduleList =
    metadata?.modules && metadata.modules.length > 0
      ? metadata.modules.map((m) => m.name).join(', ')
      : 'Unknown';

  return (
    <section data-testid="about-section" aria-label="About BMAD" className="flex flex-col gap-0.5">
      <h2 className="text-xs font-semibold tracking-wide text-[var(--vscode-descriptionForeground)] uppercase">
        About
      </h2>
      <div className="text-xs">
        <span className="text-[var(--vscode-descriptionForeground)]">Version: </span>
        <span className="text-[var(--vscode-foreground)]">{version}</span>
      </div>
      <div className="text-xs">
        <span className="text-[var(--vscode-descriptionForeground)]">Updated: </span>
        <span className="text-[var(--vscode-foreground)]">{lastUpdated}</span>
      </div>
      <div className="text-xs">
        <span className="text-[var(--vscode-descriptionForeground)]">Modules: </span>
        <span className="text-[var(--vscode-foreground)]">{moduleList}</span>
      </div>
    </section>
  );
}
