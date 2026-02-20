import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useEditorPanelStore, useBreadcrumbs, useCanGoBack } from '../store';
import { cn } from '../../shared/utils/cn';

export function BreadcrumbBar(): React.ReactElement {
  const breadcrumbs = useBreadcrumbs();
  const canGoBack = useCanGoBack();
  const goBack = useEditorPanelStore((s) => s.goBack);
  const navigateToBreadcrumb = useEditorPanelStore((s) => s.navigateToBreadcrumb);

  return (
    <div
      data-testid="breadcrumb-bar"
      className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)] px-4 py-2 text-xs"
    >
      <button
        type="button"
        data-testid="breadcrumb-back"
        onClick={goBack}
        disabled={!canGoBack}
        aria-label="Go back"
        className={cn(
          'shrink-0 rounded p-0.5',
          canGoBack
            ? 'cursor-pointer text-[var(--vscode-foreground)] hover:bg-[var(--vscode-list-hoverBackground)]'
            : 'cursor-default text-[var(--vscode-disabledForeground)]'
        )}
      >
        <ArrowLeft size={16} />
      </button>

      <nav aria-label="Breadcrumb" className="flex items-center gap-1 overflow-hidden">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <React.Fragment key={`${index}-${crumb.route.view}`}>
              {index > 0 && <span className="text-[var(--vscode-descriptionForeground)]">/</span>}
              {isLast ? (
                <span
                  data-testid={`breadcrumb-active`}
                  className="truncate font-medium text-[var(--vscode-foreground)]"
                >
                  {crumb.label}
                </span>
              ) : (
                <button
                  type="button"
                  data-testid={`breadcrumb-${index}`}
                  onClick={() => navigateToBreadcrumb(index)}
                  className="cursor-pointer truncate text-[var(--vscode-textLink-foreground)] hover:underline"
                >
                  {crumb.label}
                </button>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
