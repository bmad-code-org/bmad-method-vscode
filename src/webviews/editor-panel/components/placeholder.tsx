import React from 'react';

export function EditorPanelPlaceholder(): React.ReactElement {
  return (
    <div
      className="flex h-full items-center justify-center p-8"
      data-testid="editor-panel-placeholder"
    >
      <div className="text-center">
        <h1 className="mb-2 text-lg font-semibold">BMAD Project</h1>
        <p className="text-sm text-[var(--vscode-descriptionForeground)]">
          Editor panel views coming soon.
        </p>
      </div>
    </div>
  );
}
