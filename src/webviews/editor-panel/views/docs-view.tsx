import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  useEditorPanelStore,
  useFileTree,
  useFileTreeLoading,
  useSelectedDocContent,
  useSelectedDocPath,
  useSelectedDocLoading,
} from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import {
  createRequestFileTreeMessage,
  createRequestDocumentContentMessage,
} from '@shared/messages';
import { FileTree } from '../components/file-tree';
import { MarkdownRenderer } from '../components/markdown-renderer';
import { PanelLeft } from 'lucide-react';

// ============================================================================
// Skeleton Loading Components
// ============================================================================

const SKELETON_WIDTHS = ['60%', '75%', '50%', '68%', '55%'];

function FileTreeSkeleton(): React.ReactElement {
  return (
    <div data-testid="file-tree-skeleton" className="flex animate-pulse flex-col gap-1.5 p-2">
      {SKELETON_WIDTHS.map((width, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
          <div
            className="h-3 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]"
            style={{ width }}
          />
        </div>
      ))}
    </div>
  );
}

function ContentSkeleton(): React.ReactElement {
  return (
    <div data-testid="content-skeleton" className="flex animate-pulse flex-col gap-3 p-4">
      <div className="h-6 w-2/3 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-full rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-3 w-5/6 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-3 w-4/6 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
      <div className="h-4 w-1/2 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      <div className="flex flex-col gap-1.5">
        <div className="h-3 w-full rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
        <div className="h-3 w-3/4 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      </div>
    </div>
  );
}

// ============================================================================
// File extension helpers
// ============================================================================

function isMarkdownFile(path: string): boolean {
  return path.endsWith('.md');
}

function getLanguageTag(path: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    yaml: 'yaml',
    yml: 'yaml',
  };
  return langMap[ext] ?? ext;
}

// ============================================================================
// DocsView Component
// ============================================================================

export function DocsView(): React.ReactElement {
  const vscodeApi = useVSCodeApi();
  const navigateTo = useEditorPanelStore((s) => s.navigateTo);
  const setSelectedDocLoading = useEditorPanelStore((s) => s.setSelectedDocLoading);

  const fileTree = useFileTree();
  const fileTreeLoading = useFileTreeLoading();
  const selectedDocPath = useSelectedDocPath();
  const selectedDocContent = useSelectedDocContent();
  const selectedDocLoading = useSelectedDocLoading();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Key for FileTree to force remount when tree structure changes (resets expand state)
  const fileTreeKey = useMemo(
    () => (fileTree ? fileTree.map((n) => n.path).join(',') : ''),
    [fileTree]
  );

  // Request file tree on mount (only if not already loaded)
  useEffect(() => {
    const store = useEditorPanelStore.getState();
    if (store.fileTree === null && !store.fileTreeLoading) {
      store.setFileTreeLoading(true);
      vscodeApi.postMessage(createRequestFileTreeMessage());
    }
  }, [vscodeApi]);

  // Handle file selection
  const handleFileSelect = useCallback(
    (path: string) => {
      setSelectedDocLoading(true);
      vscodeApi.postMessage(createRequestDocumentContentMessage(path));
      navigateTo({ view: 'docs', params: { filePath: path } });
    },
    [vscodeApi, setSelectedDocLoading, navigateTo]
  );

  // Render content area
  const renderContent = () => {
    if (selectedDocLoading) {
      return <ContentSkeleton />;
    }

    if (!selectedDocPath || selectedDocContent === null) {
      return (
        <div
          data-testid="docs-empty-state"
          className="flex flex-1 items-center justify-center p-8 text-center opacity-60"
        >
          Select a document from the tree to view
        </div>
      );
    }

    if (isMarkdownFile(selectedDocPath)) {
      return (
        <div className="overflow-y-auto p-4">
          <MarkdownRenderer content={selectedDocContent} showToc={true} />
        </div>
      );
    }

    // Non-markdown files: render as syntax-highlighted code
    const lang = getLanguageTag(selectedDocPath);
    const codeContent = `\`\`\`${lang}\n${selectedDocContent}\n\`\`\``;
    return (
      <div className="overflow-y-auto p-4">
        <MarkdownRenderer content={codeContent} showToc={false} />
      </div>
    );
  };

  return (
    <div data-testid="docs-view" className="flex h-full flex-col">
      {/* Mobile sidebar toggle */}
      <div
        className="flex items-center border-b p-1 md:hidden"
        style={{ borderColor: 'var(--vscode-panel-border)' }}
      >
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded p-1 hover:bg-[var(--vscode-list-hoverBackground)]"
          title={sidebarOpen ? 'Hide file tree' : 'Show file tree'}
          data-testid="docs-sidebar-toggle"
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <div
          data-testid="docs-sidebar"
          className={`shrink-0 overflow-y-auto border-r ${sidebarOpen ? 'block' : 'hidden'} w-full md:block md:w-64`}
          style={{ borderColor: 'var(--vscode-panel-border)' }}
        >
          {fileTreeLoading ? (
            <FileTreeSkeleton />
          ) : fileTree && fileTree.length > 0 ? (
            <div className="p-1">
              <FileTree
                key={fileTreeKey}
                nodes={fileTree}
                selectedPath={selectedDocPath}
                onFileSelect={handleFileSelect}
              />
            </div>
          ) : (
            <div className="p-4 text-center text-sm opacity-60">No documents found</div>
          )}
        </div>

        {/* Content area */}
        <div
          data-testid="docs-content-area"
          className={`flex flex-1 flex-col overflow-hidden ${sidebarOpen ? 'hidden md:flex' : 'flex'}`}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
