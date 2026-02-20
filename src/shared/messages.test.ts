import { describe, it, expect } from 'vitest';
import {
  type ToWebview,
  type ToExtension,
  ToWebviewType,
  ToExtensionType,
  // Type guards
  isStateUpdateMessage,
  isDocumentContentMessage,
  isErrorMessage,
  isOpenDocumentMessage,
  isExecuteWorkflowMessage,
  isCopyCommandMessage,
  isRefreshMessage,
  isRequestDocumentContentMessage,
  isNavigateEditorPanelMessage,
  isNavigateToViewMessage,
  isFileTreeMessage,
  isRequestFileTreeMessage,
  // Factory functions
  createStateUpdateMessage,
  createDocumentContentMessage,
  createErrorMessage,
  createOpenDocumentMessage,
  createExecuteWorkflowMessage,
  createCopyCommandMessage,
  createRefreshMessage,
  createRequestDocumentContentMessage,
  createNavigateEditorPanelMessage,
  createNavigateToViewMessage,
  createFileTreeMessage,
  createRequestFileTreeMessage,
} from './messages';
import type { DashboardState } from './types/dashboard-state';
import type { FileTreeNode } from './types/file-tree';

describe('Message Type Constants', () => {
  describe('ToWebviewType', () => {
    it('has SCREAMING_SNAKE_CASE naming convention', () => {
      expect(ToWebviewType.STATE_UPDATE).toBe('STATE_UPDATE');
      expect(ToWebviewType.DOCUMENT_CONTENT).toBe('DOCUMENT_CONTENT');
      expect(ToWebviewType.ERROR).toBe('ERROR');
      expect(ToWebviewType.NAVIGATE_TO_VIEW).toBe('NAVIGATE_TO_VIEW');
      expect(ToWebviewType.FILE_TREE).toBe('FILE_TREE');
    });
  });

  describe('ToExtensionType', () => {
    it('has SCREAMING_SNAKE_CASE naming convention', () => {
      expect(ToExtensionType.OPEN_DOCUMENT).toBe('OPEN_DOCUMENT');
      expect(ToExtensionType.EXECUTE_WORKFLOW).toBe('EXECUTE_WORKFLOW');
      expect(ToExtensionType.COPY_COMMAND).toBe('COPY_COMMAND');
      expect(ToExtensionType.REFRESH).toBe('REFRESH');
      expect(ToExtensionType.REQUEST_DOCUMENT_CONTENT).toBe('REQUEST_DOCUMENT_CONTENT');
      expect(ToExtensionType.NAVIGATE_EDITOR_PANEL).toBe('NAVIGATE_EDITOR_PANEL');
      expect(ToExtensionType.REQUEST_FILE_TREE).toBe('REQUEST_FILE_TREE');
    });
  });
});

describe('ToWebview message type guards', () => {
  const mockDashboardState: DashboardState = {
    sprint: null,
    epics: [],
    currentStory: null,
    errors: [],
    loading: false,
    outputRoot: null,
    workflows: [],
    bmadMetadata: null,
    planningArtifacts: {
      hasProductBrief: false,
      hasPrd: false,
      hasArchitecture: false,
      hasEpics: false,
      hasReadinessReport: false,
    },
    defaultClickBehavior: 'markdown-preview',
    storySummaries: [],
  };

  describe('isStateUpdateMessage', () => {
    it('returns true for STATE_UPDATE messages', () => {
      const message: ToWebview = {
        type: ToWebviewType.STATE_UPDATE,
        payload: mockDashboardState,
      };
      expect(isStateUpdateMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToWebview = {
        type: ToWebviewType.ERROR,
        payload: { message: 'error', recoverable: true },
      };
      expect(isStateUpdateMessage(message)).toBe(false);
    });

    it('narrows type correctly', () => {
      const message: ToWebview = {
        type: ToWebviewType.STATE_UPDATE,
        payload: mockDashboardState,
      };
      if (isStateUpdateMessage(message)) {
        // TypeScript should know payload is DashboardState
        expect(message.payload.loading).toBe(false);
        expect(message.payload.epics).toEqual([]);
      }
    });
  });

  describe('isDocumentContentMessage', () => {
    it('returns true for DOCUMENT_CONTENT messages', () => {
      const message: ToWebview = {
        type: ToWebviewType.DOCUMENT_CONTENT,
        payload: { path: '/test.md', content: '# Test', frontmatter: null },
      };
      expect(isDocumentContentMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToWebview = {
        type: ToWebviewType.STATE_UPDATE,
        payload: mockDashboardState,
      };
      expect(isDocumentContentMessage(message)).toBe(false);
    });

    it('narrows type correctly', () => {
      const message: ToWebview = {
        type: ToWebviewType.DOCUMENT_CONTENT,
        payload: { path: '/test.md', content: '# Test', frontmatter: { title: 'Test' } },
      };
      if (isDocumentContentMessage(message)) {
        expect(message.payload.path).toBe('/test.md');
        expect(message.payload.content).toBe('# Test');
      }
    });
  });

  describe('isErrorMessage', () => {
    it('returns true for ERROR messages', () => {
      const message: ToWebview = {
        type: ToWebviewType.ERROR,
        payload: { message: 'Something went wrong', recoverable: false },
      };
      expect(isErrorMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToWebview = {
        type: ToWebviewType.STATE_UPDATE,
        payload: mockDashboardState,
      };
      expect(isErrorMessage(message)).toBe(false);
    });

    it('narrows type correctly', () => {
      const message: ToWebview = {
        type: ToWebviewType.ERROR,
        payload: { message: 'Error occurred', recoverable: true },
      };
      if (isErrorMessage(message)) {
        expect(message.payload.message).toBe('Error occurred');
        expect(message.payload.recoverable).toBe(true);
      }
    });
  });
});

describe('ToExtension message type guards', () => {
  describe('isOpenDocumentMessage', () => {
    it('returns true for OPEN_DOCUMENT messages', () => {
      const message: ToExtension = {
        type: ToExtensionType.OPEN_DOCUMENT,
        payload: { path: '/docs/readme.md' },
      };
      expect(isOpenDocumentMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToExtension = { type: ToExtensionType.REFRESH };
      expect(isOpenDocumentMessage(message)).toBe(false);
    });

    it('narrows type correctly', () => {
      const message: ToExtension = {
        type: ToExtensionType.OPEN_DOCUMENT,
        payload: { path: '/test/file.md' },
      };
      if (isOpenDocumentMessage(message)) {
        expect(message.payload.path).toBe('/test/file.md');
      }
    });
  });

  describe('isExecuteWorkflowMessage', () => {
    it('returns true for EXECUTE_WORKFLOW messages', () => {
      const message: ToExtension = {
        type: ToExtensionType.EXECUTE_WORKFLOW,
        payload: { command: 'dev-story' },
      };
      expect(isExecuteWorkflowMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToExtension = { type: ToExtensionType.REFRESH };
      expect(isExecuteWorkflowMessage(message)).toBe(false);
    });

    it('narrows type correctly', () => {
      const message: ToExtension = {
        type: ToExtensionType.EXECUTE_WORKFLOW,
        payload: { command: 'create-story' },
      };
      if (isExecuteWorkflowMessage(message)) {
        expect(message.payload.command).toBe('create-story');
      }
    });
  });

  describe('isCopyCommandMessage', () => {
    it('returns true for COPY_COMMAND messages', () => {
      const message: ToExtension = {
        type: ToExtensionType.COPY_COMMAND,
        payload: { command: '/bmad-bmm-dev-story' },
      };
      expect(isCopyCommandMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToExtension = { type: ToExtensionType.REFRESH };
      expect(isCopyCommandMessage(message)).toBe(false);
    });

    it('narrows type correctly', () => {
      const message: ToExtension = {
        type: ToExtensionType.COPY_COMMAND,
        payload: { command: '/bmad-bmm-code-review' },
      };
      if (isCopyCommandMessage(message)) {
        expect(message.payload.command).toBe('/bmad-bmm-code-review');
      }
    });
  });

  describe('isRefreshMessage', () => {
    it('returns true for REFRESH messages', () => {
      const message: ToExtension = { type: ToExtensionType.REFRESH };
      expect(isRefreshMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToExtension = {
        type: ToExtensionType.OPEN_DOCUMENT,
        payload: { path: '/test.md' },
      };
      expect(isRefreshMessage(message)).toBe(false);
    });
  });

  describe('isRequestDocumentContentMessage', () => {
    it('returns true for REQUEST_DOCUMENT_CONTENT messages', () => {
      const message: ToExtension = {
        type: ToExtensionType.REQUEST_DOCUMENT_CONTENT,
        payload: { path: '/story.md' },
      };
      expect(isRequestDocumentContentMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToExtension = { type: ToExtensionType.REFRESH };
      expect(isRequestDocumentContentMessage(message)).toBe(false);
    });

    it('narrows type correctly', () => {
      const message: ToExtension = {
        type: ToExtensionType.REQUEST_DOCUMENT_CONTENT,
        payload: { path: '/impl/3-2.md' },
      };
      if (isRequestDocumentContentMessage(message)) {
        expect(message.payload.path).toBe('/impl/3-2.md');
      }
    });
  });

  describe('isNavigateEditorPanelMessage', () => {
    it('returns true for NAVIGATE_EDITOR_PANEL messages', () => {
      const message: ToExtension = {
        type: ToExtensionType.NAVIGATE_EDITOR_PANEL,
        payload: { view: 'epics' },
      };
      expect(isNavigateEditorPanelMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToExtension = { type: ToExtensionType.REFRESH };
      expect(isNavigateEditorPanelMessage(message)).toBe(false);
    });

    it('narrows type correctly with params', () => {
      const message: ToExtension = {
        type: ToExtensionType.NAVIGATE_EDITOR_PANEL,
        payload: { view: 'epics', params: { epicId: '3' } },
      };
      if (isNavigateEditorPanelMessage(message)) {
        expect(message.payload.view).toBe('epics');
        expect(message.payload.params).toEqual({ epicId: '3' });
      }
    });
  });
});

describe('ToWebview type guards (new)', () => {
  describe('isNavigateToViewMessage', () => {
    it('returns true for NAVIGATE_TO_VIEW messages', () => {
      const message: ToWebview = {
        type: ToWebviewType.NAVIGATE_TO_VIEW,
        payload: { view: 'epics' },
      };
      expect(isNavigateToViewMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToWebview = {
        type: ToWebviewType.ERROR,
        payload: { message: 'err', recoverable: true },
      };
      expect(isNavigateToViewMessage(message)).toBe(false);
    });

    it('narrows type correctly with params', () => {
      const message: ToWebview = {
        type: ToWebviewType.NAVIGATE_TO_VIEW,
        payload: { view: 'epics', params: { epicId: '5', storyKey: '5-1-setup' } },
      };
      if (isNavigateToViewMessage(message)) {
        expect(message.payload.view).toBe('epics');
        expect(message.payload.params).toEqual({ epicId: '5', storyKey: '5-1-setup' });
      }
    });
  });

  describe('isFileTreeMessage', () => {
    it('returns true for FILE_TREE messages', () => {
      const message: ToWebview = {
        type: ToWebviewType.FILE_TREE,
        payload: { roots: [] },
      };
      expect(isFileTreeMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToWebview = {
        type: ToWebviewType.ERROR,
        payload: { message: 'err', recoverable: true },
      };
      expect(isFileTreeMessage(message)).toBe(false);
    });

    it('narrows type correctly', () => {
      const roots: FileTreeNode[] = [
        {
          name: 'docs',
          path: 'docs',
          type: 'directory',
          children: [{ name: 'readme.md', path: 'docs/readme.md', type: 'file' }],
        },
      ];
      const message: ToWebview = {
        type: ToWebviewType.FILE_TREE,
        payload: { roots },
      };
      if (isFileTreeMessage(message)) {
        expect(message.payload.roots).toHaveLength(1);
        expect(message.payload.roots[0].name).toBe('docs');
        expect(message.payload.roots[0].children).toHaveLength(1);
      }
    });
  });
});

describe('ToExtension type guards (file tree)', () => {
  describe('isRequestFileTreeMessage', () => {
    it('returns true for REQUEST_FILE_TREE messages', () => {
      const message: ToExtension = {
        type: ToExtensionType.REQUEST_FILE_TREE,
      };
      expect(isRequestFileTreeMessage(message)).toBe(true);
    });

    it('returns false for other message types', () => {
      const message: ToExtension = { type: ToExtensionType.REFRESH };
      expect(isRequestFileTreeMessage(message)).toBe(false);
    });
  });
});

describe('Message factory functions', () => {
  describe('createStateUpdateMessage', () => {
    it('creates a STATE_UPDATE message', () => {
      const state: DashboardState = {
        sprint: null,
        epics: [],
        currentStory: null,
        errors: [],
        loading: true,
        outputRoot: null,
        workflows: [],
        bmadMetadata: null,
        planningArtifacts: {
          hasProductBrief: false,
          hasPrd: false,
          hasArchitecture: false,
          hasEpics: false,
          hasReadinessReport: false,
        },
        defaultClickBehavior: 'markdown-preview',
        storySummaries: [],
      };
      const message = createStateUpdateMessage(state);
      expect(message.type).toBe('STATE_UPDATE');
      expect(message.payload).toBe(state);
    });
  });

  describe('createDocumentContentMessage', () => {
    it('creates a DOCUMENT_CONTENT message with frontmatter', () => {
      const message = createDocumentContentMessage('/path/file.md', '# Content', { title: 'Test' });
      expect(message.type).toBe('DOCUMENT_CONTENT');
      expect(message.payload.path).toBe('/path/file.md');
      expect(message.payload.content).toBe('# Content');
      expect(message.payload.frontmatter).toEqual({ title: 'Test' });
    });

    it('creates a DOCUMENT_CONTENT message with default null frontmatter', () => {
      const message = createDocumentContentMessage('/path/file.md', '# Content');
      expect(message.payload.frontmatter).toBeNull();
    });
  });

  describe('createErrorMessage', () => {
    it('creates an ERROR message', () => {
      const message = createErrorMessage('Something failed', false);
      expect(message.type).toBe('ERROR');
      expect(message.payload.message).toBe('Something failed');
      expect(message.payload.recoverable).toBe(false);
    });
  });

  describe('createOpenDocumentMessage', () => {
    it('creates an OPEN_DOCUMENT message', () => {
      const message = createOpenDocumentMessage('/docs/readme.md');
      expect(message.type).toBe('OPEN_DOCUMENT');
      expect(message.payload.path).toBe('/docs/readme.md');
    });

    it('includes forceTextEditor when provided', () => {
      const message = createOpenDocumentMessage('/docs/readme.md', true);
      expect(message.payload.forceTextEditor).toBe(true);
    });

    it('leaves forceTextEditor undefined when not provided', () => {
      const message = createOpenDocumentMessage('/docs/readme.md');
      expect(message.payload.forceTextEditor).toBeUndefined();
    });
  });

  describe('createExecuteWorkflowMessage', () => {
    it('creates an EXECUTE_WORKFLOW message', () => {
      const message = createExecuteWorkflowMessage('dev-story');
      expect(message.type).toBe('EXECUTE_WORKFLOW');
      expect(message.payload.command).toBe('dev-story');
    });
  });

  describe('createCopyCommandMessage', () => {
    it('creates a COPY_COMMAND message', () => {
      const message = createCopyCommandMessage('/bmad-bmm-dev-story');
      expect(message.type).toBe('COPY_COMMAND');
      expect(message.payload.command).toBe('/bmad-bmm-dev-story');
    });
  });

  describe('createRefreshMessage', () => {
    it('creates a REFRESH message', () => {
      const message = createRefreshMessage();
      expect(message.type).toBe('REFRESH');
    });
  });

  describe('createRequestDocumentContentMessage', () => {
    it('creates a REQUEST_DOCUMENT_CONTENT message', () => {
      const message = createRequestDocumentContentMessage('/impl/3-2-feature.md');
      expect(message.type).toBe('REQUEST_DOCUMENT_CONTENT');
      expect(message.payload.path).toBe('/impl/3-2-feature.md');
    });
  });

  describe('createNavigateEditorPanelMessage', () => {
    it('creates a NAVIGATE_EDITOR_PANEL message without params', () => {
      const message = createNavigateEditorPanelMessage('epics');
      expect(message.type).toBe('NAVIGATE_EDITOR_PANEL');
      expect(message.payload.view).toBe('epics');
      expect(message.payload.params).toBeUndefined();
    });

    it('creates a NAVIGATE_EDITOR_PANEL message with params', () => {
      const message = createNavigateEditorPanelMessage('epics', { epicId: '3' });
      expect(message.type).toBe('NAVIGATE_EDITOR_PANEL');
      expect(message.payload.view).toBe('epics');
      expect(message.payload.params).toEqual({ epicId: '3' });
    });
  });

  describe('createNavigateToViewMessage', () => {
    it('creates a NAVIGATE_TO_VIEW message without params', () => {
      const message = createNavigateToViewMessage('dashboard');
      expect(message.type).toBe('NAVIGATE_TO_VIEW');
      expect(message.payload.view).toBe('dashboard');
      expect(message.payload.params).toBeUndefined();
    });

    it('creates a NAVIGATE_TO_VIEW message with params', () => {
      const message = createNavigateToViewMessage('epics', {
        epicId: '5',
        storyKey: '5-1-setup',
      });
      expect(message.type).toBe('NAVIGATE_TO_VIEW');
      expect(message.payload.view).toBe('epics');
      expect(message.payload.params).toEqual({ epicId: '5', storyKey: '5-1-setup' });
    });
  });

  describe('createFileTreeMessage', () => {
    it('creates a FILE_TREE message with roots', () => {
      const roots: FileTreeNode[] = [
        { name: 'docs', path: 'docs', type: 'directory', children: [] },
      ];
      const message = createFileTreeMessage(roots);
      expect(message.type).toBe('FILE_TREE');
      expect(message.payload.roots).toBe(roots);
    });

    it('creates a FILE_TREE message with empty roots', () => {
      const message = createFileTreeMessage([]);
      expect(message.type).toBe('FILE_TREE');
      expect(message.payload.roots).toEqual([]);
    });
  });

  describe('createRequestFileTreeMessage', () => {
    it('creates a REQUEST_FILE_TREE message', () => {
      const message = createRequestFileTreeMessage();
      expect(message.type).toBe('REQUEST_FILE_TREE');
    });
  });
});

describe('Discriminated union type narrowing', () => {
  it('allows exhaustive handling of ToWebview messages', () => {
    const mockState: DashboardState = {
      sprint: null,
      epics: [],
      currentStory: null,
      errors: [],
      loading: false,
      outputRoot: null,
      workflows: [],
      bmadMetadata: null,
      planningArtifacts: {
        hasProductBrief: false,
        hasPrd: false,
        hasArchitecture: false,
        hasEpics: false,
        hasReadinessReport: false,
      },
      defaultClickBehavior: 'markdown-preview',
      storySummaries: [],
    };

    function handleToWebview(message: ToWebview): string {
      switch (message.type) {
        case 'STATE_UPDATE':
          return `State: loading=${message.payload.loading}`;
        case 'DOCUMENT_CONTENT':
          return `Document: ${message.payload.path}`;
        case 'ERROR':
          return `Error: ${message.payload.message}`;
        case 'NAVIGATE_TO_VIEW':
          return `Navigate: ${message.payload.view}`;
        case 'FILE_TREE':
          return `FileTree: ${message.payload.roots.length} roots`;
      }
    }

    expect(handleToWebview({ type: 'STATE_UPDATE', payload: mockState })).toBe(
      'State: loading=false'
    );
    expect(
      handleToWebview({
        type: 'DOCUMENT_CONTENT',
        payload: { path: '/a.md', content: '', frontmatter: null },
      })
    ).toBe('Document: /a.md');
    expect(
      handleToWebview({ type: 'ERROR', payload: { message: 'test', recoverable: true } })
    ).toBe('Error: test');
  });

  it('allows exhaustive handling of ToExtension messages', () => {
    function handleToExtension(message: ToExtension): string {
      switch (message.type) {
        case 'OPEN_DOCUMENT':
          return `Open: ${message.payload.path}`;
        case 'EXECUTE_WORKFLOW':
          return `Execute: ${message.payload.command}`;
        case 'COPY_COMMAND':
          return `Copy: ${message.payload.command}`;
        case 'REFRESH':
          return 'Refresh';
        case 'REQUEST_DOCUMENT_CONTENT':
          return `Request: ${message.payload.path}`;
        case 'NAVIGATE_EDITOR_PANEL':
          return `Navigate: ${message.payload.view}`;
        case 'REQUEST_FILE_TREE':
          return 'RequestFileTree';
      }
    }

    expect(handleToExtension({ type: 'OPEN_DOCUMENT', payload: { path: '/test.md' } })).toBe(
      'Open: /test.md'
    );
    expect(handleToExtension({ type: 'EXECUTE_WORKFLOW', payload: { command: 'dev' } })).toBe(
      'Execute: dev'
    );
    expect(handleToExtension({ type: 'COPY_COMMAND', payload: { command: 'cmd' } })).toBe(
      'Copy: cmd'
    );
    expect(handleToExtension({ type: 'REFRESH' })).toBe('Refresh');
  });
});
