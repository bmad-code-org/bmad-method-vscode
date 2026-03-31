import React, { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { HelpCircle, EllipsisVertical, RefreshCw, Play, PanelRight } from 'lucide-react';
import { useWorkflows } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import {
  createRefreshMessage,
  createExecuteWorkflowMessage,
  createCopyCommandMessage,
  createNavigateEditorPanelMessage,
} from '@shared/messages';

export function HeaderToolbar(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const workflows = useWorkflows();
  const vscodeApi = useVSCodeApi();

  const handleHelpClick = useCallback(() => {
    vscodeApi.postMessage(createCopyCommandMessage('bmad help'));
  }, [vscodeApi]);

  const handleOpenPanel = useCallback(() => {
    vscodeApi.postMessage(createNavigateEditorPanelMessage('dashboard'));
    setIsOpen(false);
  }, [vscodeApi]);

  const handleRefresh = useCallback(() => {
    vscodeApi.postMessage(createRefreshMessage());
    setIsOpen(false);
  }, [vscodeApi]);

  const handleWorkflowClick = useCallback(
    (command: string) => {
      vscodeApi.postMessage(createExecuteWorkflowMessage(command));
      setIsOpen(false);
    },
    [vscodeApi]
  );

  const toggleMenu = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  // Click-outside dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Escape key dismiss
  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Focus first menu item when menu opens
  const menuItemsRef = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    if (isOpen) {
      menuItemsRef.current[0]?.focus();
    }
  }, [isOpen]);

  // Arrow key navigation for menu items
  const handleMenuKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const items = menuItemsRef.current.filter(Boolean) as HTMLButtonElement[];
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    let nextIndex = -1;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = currentIndex + 1 >= items.length ? 0 : currentIndex + 1;
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = currentIndex - 1 < 0 ? items.length - 1 : currentIndex - 1;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = items.length - 1;
        break;
    }

    if (nextIndex >= 0) {
      items[nextIndex].focus();
    }
  }, []);

  const iconButtonClass =
    'rounded p-1 text-[var(--vscode-descriptionForeground)] hover:text-[var(--vscode-foreground)] hover:bg-[var(--vscode-toolbar-hoverBackground)] focus:ring-1 focus:ring-[var(--vscode-focusBorder)] focus:outline-none';

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        data-testid="help-icon"
        onClick={handleHelpClick}
        aria-label="Help - copy bmad help command"
        title="Copy 'bmad help' command"
        className={iconButtonClass}
      >
        <HelpCircle size={14} />
      </button>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          data-testid="overflow-menu-button"
          onClick={toggleMenu}
          aria-label="More actions"
          aria-expanded={isOpen}
          title="More actions"
          className={iconButtonClass}
        >
          <EllipsisVertical size={14} />
        </button>

        {isOpen && (
          <div
            role="menu"
            data-testid="overflow-menu-dropdown"
            onKeyDown={handleMenuKeyDown}
            className="animate-expand-in absolute top-full right-0 z-10 mt-1 min-w-[160px] rounded border border-[var(--vscode-menu-border)] bg-[var(--vscode-menu-background)] py-1 shadow-md"
          >
            <button
              ref={(el) => {
                menuItemsRef.current[0] = el;
              }}
              role="menuitem"
              type="button"
              tabIndex={-1}
              data-testid="overflow-menu-open-panel"
              onClick={handleOpenPanel}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--vscode-menu-foreground)] hover:bg-[var(--vscode-menu-selectionBackground)]"
            >
              <PanelRight size={12} />
              Open Tab View
            </button>
            <button
              ref={(el) => {
                menuItemsRef.current[1] = el;
              }}
              role="menuitem"
              type="button"
              tabIndex={-1}
              data-testid="overflow-menu-refresh"
              onClick={handleRefresh}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--vscode-menu-foreground)] hover:bg-[var(--vscode-menu-selectionBackground)]"
            >
              <RefreshCw size={12} />
              Refresh
            </button>
            {workflows.map((workflow, index) => (
              <button
                ref={(el) => {
                  menuItemsRef.current[index + 2] = el;
                }}
                key={workflow.id}
                role="menuitem"
                type="button"
                tabIndex={-1}
                data-testid={`overflow-menu-workflow-${workflow.id}`}
                onClick={() => handleWorkflowClick(workflow.command)}
                title={workflow.description}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-[var(--vscode-menu-foreground)] hover:bg-[var(--vscode-menu-selectionBackground)]"
              >
                <Play size={12} />
                {workflow.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function HeaderToolbarSkeleton(): React.ReactElement {
  return (
    <div data-testid="header-toolbar-skeleton" className="flex items-center gap-1">
      <div className="h-6 w-6 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="h-6 w-6 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
    </div>
  );
}
