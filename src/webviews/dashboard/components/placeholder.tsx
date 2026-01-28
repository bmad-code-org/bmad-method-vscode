import React from 'react';

/**
 * Placeholder component for the BMAD Dashboard
 * Displays initialization success state and upcoming feature preview
 */
export function Placeholder(): React.ReactElement {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-lg font-semibold text-[var(--vscode-foreground)]">BMAD Dashboard</h1>

      <div className="flex items-center gap-2 text-[var(--vscode-testing-iconPassed)]">
        <span aria-hidden="true">✓</span>
        <span>Ready for development</span>
      </div>

      <p className="text-sm text-[var(--vscode-descriptionForeground)]">
        This dashboard will display:
      </p>

      <ul className="list-inside list-disc space-y-1 text-sm text-[var(--vscode-descriptionForeground)]">
        <li>Sprint status</li>
        <li>Epic and story progress</li>
        <li>Workflow actions</li>
      </ul>

      <p className="mt-2 text-xs text-[var(--vscode-descriptionForeground)]">
        Coming in future stories...
      </p>
    </div>
  );
}
