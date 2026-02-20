import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileTree } from './file-tree';
import type { FileTreeNode } from '@shared/types';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks/use-vscode-api', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const sampleTree: FileTreeNode[] = [
  {
    name: 'docs',
    path: 'docs',
    type: 'directory',
    children: [
      { name: 'readme.md', path: 'docs/readme.md', type: 'file' },
      { name: 'guide.md', path: 'docs/guide.md', type: 'file' },
      {
        name: 'sub',
        path: 'docs/sub',
        type: 'directory',
        children: [{ name: 'nested.md', path: 'docs/sub/nested.md', type: 'file' }],
      },
    ],
  },
  {
    name: 'planning-artifacts',
    path: '_bmad-output/planning-artifacts',
    type: 'directory',
    children: [{ name: 'prd.md', path: '_bmad-output/planning-artifacts/prd.md', type: 'file' }],
  },
];

describe('FileTree', () => {
  const onFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with data-testid', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);
    expect(screen.getByTestId('file-tree')).toBeInTheDocument();
  });

  it('renders tree structure with directories and files', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);
    expect(screen.getByText('docs')).toBeInTheDocument();
    expect(screen.getByText('readme.md')).toBeInTheDocument();
    expect(screen.getByText('guide.md')).toBeInTheDocument();
    expect(screen.getByText('planning-artifacts')).toBeInTheDocument();
  });

  it('root directories start expanded', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);
    // Files inside root dirs should be visible
    expect(screen.getByText('readme.md')).toBeInTheDocument();
    expect(screen.getByText('prd.md')).toBeInTheDocument();
  });

  it('collapses directory on click', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);

    // 'docs' is expanded, readme.md is visible
    expect(screen.getByText('readme.md')).toBeInTheDocument();

    // Click docs to collapse
    fireEvent.click(screen.getByTestId('file-tree-item-docs'));

    // Files should be hidden
    expect(screen.queryByText('readme.md')).not.toBeInTheDocument();
  });

  it('expands collapsed directory on click', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);

    // Collapse docs
    fireEvent.click(screen.getByTestId('file-tree-item-docs'));
    expect(screen.queryByText('readme.md')).not.toBeInTheDocument();

    // Expand docs
    fireEvent.click(screen.getByTestId('file-tree-item-docs'));
    expect(screen.getByText('readme.md')).toBeInTheDocument();
  });

  it('calls onFileSelect when clicking a file', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);

    fireEvent.click(screen.getByTestId('file-tree-item-docs/readme.md'));
    expect(onFileSelect).toHaveBeenCalledWith('docs/readme.md');
  });

  it('highlights selected file', () => {
    render(
      <FileTree nodes={sampleTree} selectedPath="docs/readme.md" onFileSelect={onFileSelect} />
    );

    const item = screen.getByTestId('file-tree-item-docs/readme.md');
    expect(item.style.background).toContain('var(--vscode-list-activeSelectionBackground)');
  });

  it('does not highlight non-selected files', () => {
    render(
      <FileTree nodes={sampleTree} selectedPath="docs/readme.md" onFileSelect={onFileSelect} />
    );

    const item = screen.getByTestId('file-tree-item-docs/guide.md');
    expect(item.style.background).toBe('');
  });

  it('modifier+click on file opens in VS Code text editor', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);

    fireEvent.click(screen.getByTestId('file-tree-item-docs/readme.md'), {
      shiftKey: true,
    });

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: 'docs/readme.md', forceTextEditor: true },
    });
    // onFileSelect should NOT be called for modifier clicks
    expect(onFileSelect).not.toHaveBeenCalled();
  });

  it('renders items with data-testid for each path', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);

    expect(screen.getByTestId('file-tree-item-docs')).toBeInTheDocument();
    expect(screen.getByTestId('file-tree-item-docs/readme.md')).toBeInTheDocument();
    expect(screen.getByTestId('file-tree-item-docs/guide.md')).toBeInTheDocument();
    expect(
      screen.getByTestId('file-tree-item-_bmad-output/planning-artifacts')
    ).toBeInTheDocument();
  });

  it('renders nested directories', () => {
    render(<FileTree nodes={sampleTree} selectedPath={null} onFileSelect={onFileSelect} />);

    // Sub-directory 'sub' is not a root so it doesn't start expanded
    expect(screen.getByText('sub')).toBeInTheDocument();
    // Click to expand
    fireEvent.click(screen.getByTestId('file-tree-item-docs/sub'));
    expect(screen.getByText('nested.md')).toBeInTheDocument();
  });
});
