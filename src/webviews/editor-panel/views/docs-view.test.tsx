import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocsView } from './docs-view';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks/use-vscode-api', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

vi.mock('../components/markdown-renderer', () => ({
  MarkdownRenderer: ({ content, showToc }: { content: string; showToc?: boolean }) => (
    <div data-testid="markdown-renderer" data-show-toc={showToc}>
      {content}
    </div>
  ),
}));

describe('DocsView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useEditorPanelStore.setState(createInitialEditorPanelState());
  });

  it('renders with data-testid', () => {
    render(<DocsView />);
    expect(screen.getByTestId('docs-view')).toBeInTheDocument();
  });

  it('renders sidebar and content area', () => {
    render(<DocsView />);
    expect(screen.getByTestId('docs-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('docs-content-area')).toBeInTheDocument();
  });

  it('requests file tree on mount', () => {
    render(<DocsView />);
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'REQUEST_FILE_TREE' });
  });

  it('shows file tree skeleton while loading', () => {
    useEditorPanelStore.setState({ fileTreeLoading: true, fileTree: null });
    render(<DocsView />);
    expect(screen.getByTestId('file-tree-skeleton')).toBeInTheDocument();
  });

  it('shows empty state when no file selected', () => {
    useEditorPanelStore.setState({
      fileTree: [{ name: 'docs', path: 'docs', type: 'directory', children: [] }],
      fileTreeLoading: false,
    });
    render(<DocsView />);
    expect(screen.getByTestId('docs-empty-state')).toBeInTheDocument();
    expect(screen.getByText('Select a document from the tree to view')).toBeInTheDocument();
  });

  it('shows content skeleton while document is loading', () => {
    useEditorPanelStore.setState({
      fileTree: [{ name: 'docs', path: 'docs', type: 'directory', children: [] }],
      fileTreeLoading: false,
      selectedDocLoading: true,
    });
    render(<DocsView />);
    expect(screen.getByTestId('content-skeleton')).toBeInTheDocument();
  });

  it('renders file tree when loaded', () => {
    useEditorPanelStore.setState({
      fileTree: [
        {
          name: 'docs',
          path: 'docs',
          type: 'directory',
          children: [{ name: 'readme.md', path: 'docs/readme.md', type: 'file' }],
        },
      ],
      fileTreeLoading: false,
    });
    render(<DocsView />);
    expect(screen.getByTestId('file-tree')).toBeInTheDocument();
    expect(screen.getByText('readme.md')).toBeInTheDocument();
  });

  it('loads document on file select', () => {
    useEditorPanelStore.setState({
      fileTree: [
        {
          name: 'docs',
          path: 'docs',
          type: 'directory',
          children: [{ name: 'readme.md', path: 'docs/readme.md', type: 'file' }],
        },
      ],
      fileTreeLoading: false,
    });
    render(<DocsView />);

    // Clear the mount-time REQUEST_FILE_TREE call
    mockPostMessage.mockClear();

    fireEvent.click(screen.getByTestId('file-tree-item-docs/readme.md'));

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'REQUEST_DOCUMENT_CONTENT',
      payload: { path: 'docs/readme.md' },
    });
  });

  it('renders markdown content for .md files', () => {
    useEditorPanelStore.setState({
      fileTree: [],
      fileTreeLoading: false,
      selectedDocPath: 'docs/readme.md',
      selectedDocContent: '# Hello World',
      selectedDocLoading: false,
    });
    render(<DocsView />);
    const renderer = screen.getByTestId('markdown-renderer');
    expect(renderer).toBeInTheDocument();
    expect(renderer).toHaveAttribute('data-show-toc', 'true');
  });

  it('renders code files with syntax highlighting', () => {
    useEditorPanelStore.setState({
      fileTree: [],
      fileTreeLoading: false,
      selectedDocPath: 'config.yaml',
      selectedDocContent: 'key: value',
      selectedDocLoading: false,
    });
    render(<DocsView />);
    const renderer = screen.getByTestId('markdown-renderer');
    expect(renderer).toBeInTheDocument();
    expect(renderer).toHaveAttribute('data-show-toc', 'false');
  });

  it('has responsive layout classes', () => {
    render(<DocsView />);
    const sidebar = screen.getByTestId('docs-sidebar');
    expect(sidebar.className).toContain('md:w-64');
    expect(sidebar.className).toContain('md:block');
  });

  it('has sidebar toggle button for mobile', () => {
    render(<DocsView />);
    expect(screen.getByTestId('docs-sidebar-toggle')).toBeInTheDocument();
  });

  it('toggles sidebar visibility', () => {
    render(<DocsView />);
    const toggle = screen.getByTestId('docs-sidebar-toggle');
    const sidebar = screen.getByTestId('docs-sidebar');

    // Initially visible
    expect(sidebar.className).toContain('block');

    // Toggle off
    fireEvent.click(toggle);
    expect(sidebar.className).toContain('hidden');

    // Toggle on
    fireEvent.click(toggle);
    expect(sidebar.className).toContain('block');
  });
});
