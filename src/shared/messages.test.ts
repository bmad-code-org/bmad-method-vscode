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
  // Factory functions
  createStateUpdateMessage,
  createDocumentContentMessage,
  createErrorMessage,
  createOpenDocumentMessage,
  createExecuteWorkflowMessage,
  createCopyCommandMessage,
  createRefreshMessage,
} from './messages';
import type { DashboardState } from './types/dashboard-state';

describe('Message Type Constants', () => {
  describe('ToWebviewType', () => {
    it('has SCREAMING_SNAKE_CASE naming convention', () => {
      expect(ToWebviewType.STATE_UPDATE).toBe('STATE_UPDATE');
      expect(ToWebviewType.DOCUMENT_CONTENT).toBe('DOCUMENT_CONTENT');
      expect(ToWebviewType.ERROR).toBe('ERROR');
    });
  });

  describe('ToExtensionType', () => {
    it('has SCREAMING_SNAKE_CASE naming convention', () => {
      expect(ToExtensionType.OPEN_DOCUMENT).toBe('OPEN_DOCUMENT');
      expect(ToExtensionType.EXECUTE_WORKFLOW).toBe('EXECUTE_WORKFLOW');
      expect(ToExtensionType.COPY_COMMAND).toBe('COPY_COMMAND');
      expect(ToExtensionType.REFRESH).toBe('REFRESH');
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
    };

    function handleToWebview(message: ToWebview): string {
      switch (message.type) {
        case 'STATE_UPDATE':
          return `State: loading=${message.payload.loading}`;
        case 'DOCUMENT_CONTENT':
          return `Document: ${message.payload.path}`;
        case 'ERROR':
          return `Error: ${message.payload.message}`;
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
