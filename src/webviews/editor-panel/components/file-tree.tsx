import React, { useState, useCallback } from 'react';
import { FileText, FileCode, FolderOpen, FolderClosed, File } from 'lucide-react';
import type { FileTreeNode } from '@shared/types';
import { createOpenDocumentMessage } from '@shared/messages';
import { useVSCodeApi } from '../../shared/hooks/use-vscode-api';

// ============================================================================
// File icon helper
// ============================================================================

function getFileIcon(name: string) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase();
  if (ext === '.md') return <FileText size={14} className="shrink-0" />;
  if (['.ts', '.tsx', '.js', '.jsx', '.json', '.yaml', '.yml'].includes(ext))
    return <FileCode size={14} className="shrink-0" />;
  return <File size={14} className="shrink-0" />;
}

function getRootDirectoryPaths(nodes: FileTreeNode[]): Set<string> {
  const paths = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'directory') {
      paths.add(node.path);
    }
  }
  return paths;
}

// ============================================================================
// FileTree Component
// ============================================================================

interface FileTreeProps {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  onFileSelect: (path: string) => void;
}

export function FileTree({ nodes, selectedPath, onFileSelect }: FileTreeProps) {
  const vscodeApi = useVSCodeApi();

  // Root directories start expanded
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() =>
    getRootDirectoryPaths(nodes)
  );

  const toggleExpanded = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleModifierClick = useCallback(
    (path: string) => {
      vscodeApi.postMessage(createOpenDocumentMessage(path, true));
    },
    [vscodeApi]
  );

  return (
    <div data-testid="file-tree" className="text-sm" role="tree">
      {nodes.map((node) => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          expandedPaths={expandedPaths}
          onFileSelect={onFileSelect}
          onToggleExpanded={toggleExpanded}
          onModifierClick={handleModifierClick}
        />
      ))}
    </div>
  );
}

// ============================================================================
// FileTreeItem Component (recursive)
// ============================================================================

interface FileTreeItemProps {
  node: FileTreeNode;
  depth: number;
  selectedPath: string | null;
  expandedPaths: Set<string>;
  onFileSelect: (path: string) => void;
  onToggleExpanded: (path: string) => void;
  onModifierClick: (path: string) => void;
}

function FileTreeItem({
  node,
  depth,
  selectedPath,
  expandedPaths,
  onFileSelect,
  onToggleExpanded,
  onModifierClick,
}: FileTreeItemProps) {
  const isDirectory = node.type === 'directory';
  const isExpanded = expandedPaths.has(node.path);
  const isSelected = node.path === selectedPath;

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDirectory) {
        onToggleExpanded(node.path);
      } else {
        // Modifier click opens raw file in VS Code text editor
        if (e.shiftKey || e.ctrlKey || e.metaKey) {
          onModifierClick(node.path);
        } else {
          onFileSelect(node.path);
        }
      }
    },
    [isDirectory, node.path, onToggleExpanded, onFileSelect, onModifierClick]
  );

  return (
    <div role="treeitem">
      <button
        data-testid={`file-tree-item-${node.path}`}
        className="flex w-full items-center gap-1.5 rounded px-1.5 py-0.5 text-left hover:bg-[var(--vscode-list-hoverBackground)]"
        style={{
          paddingLeft: `${depth * 12 + 6}px`,
          background: isSelected ? 'var(--vscode-list-activeSelectionBackground)' : undefined,
          color: isSelected ? 'var(--vscode-list-activeSelectionForeground)' : undefined,
        }}
        onClick={handleClick}
      >
        {isDirectory ? (
          isExpanded ? (
            <FolderOpen
              size={14}
              className="shrink-0 text-[var(--vscode-symbolIcon-folderForeground,#dcb67a)]"
            />
          ) : (
            <FolderClosed
              size={14}
              className="shrink-0 text-[var(--vscode-symbolIcon-folderForeground,#dcb67a)]"
            />
          )
        ) : (
          getFileIcon(node.name)
        )}
        <span className="truncate">{node.name}</span>
      </button>
      {isDirectory && isExpanded && node.children && node.children.length > 0 && (
        <div role="group">
          {node.children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              expandedPaths={expandedPaths}
              onFileSelect={onFileSelect}
              onToggleExpanded={onToggleExpanded}
              onModifierClick={onModifierClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
