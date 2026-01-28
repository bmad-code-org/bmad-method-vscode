// Message protocol types for extension <-> webview communication
// These types are shared between Node.js (extension) and browser (webview) contexts
// All message types use SCREAMING_SNAKE_CASE naming convention

import type { DashboardState } from './types/dashboard-state';

// ============================================================================
// Message Type Constants
// ============================================================================

/**
 * Message types sent from Extension to Webview
 */
export const ToWebviewType = {
  STATE_UPDATE: 'STATE_UPDATE',
  DOCUMENT_CONTENT: 'DOCUMENT_CONTENT',
  ERROR: 'ERROR',
} as const;

/**
 * Message types sent from Webview to Extension
 */
export const ToExtensionType = {
  OPEN_DOCUMENT: 'OPEN_DOCUMENT',
  EXECUTE_WORKFLOW: 'EXECUTE_WORKFLOW',
  COPY_COMMAND: 'COPY_COMMAND',
  REFRESH: 'REFRESH',
} as const;

// ============================================================================
// Extension -> Webview Messages (ToWebview)
// ============================================================================

/**
 * State update message - sends full dashboard state to webview
 */
export interface StateUpdateMessage {
  type: typeof ToWebviewType.STATE_UPDATE;
  payload: DashboardState;
}

/**
 * Document content message - sends document content for viewing
 */
export interface DocumentContentMessage {
  type: typeof ToWebviewType.DOCUMENT_CONTENT;
  payload: {
    /** File path relative to project root */
    path: string;
    /** Raw file content */
    content: string;
    /** Parsed frontmatter (if any) */
    frontmatter: unknown;
  };
}

/**
 * Error message - notifies webview of an error
 */
export interface ErrorMessage {
  type: typeof ToWebviewType.ERROR;
  payload: {
    /** Error message to display */
    message: string;
    /** Whether the error is recoverable (app can continue) */
    recoverable: boolean;
  };
}

/**
 * Discriminated union of all messages from Extension to Webview
 */
export type ToWebview = StateUpdateMessage | DocumentContentMessage | ErrorMessage;

// ============================================================================
// Webview -> Extension Messages (ToExtension)
// ============================================================================

/**
 * Open document message - requests opening a document in editor or viewer
 */
export interface OpenDocumentMessage {
  type: typeof ToExtensionType.OPEN_DOCUMENT;
  payload: {
    /** File path to open (relative to project root) */
    path: string;
  };
}

/**
 * Execute workflow message - requests running a BMAD workflow
 */
export interface ExecuteWorkflowMessage {
  type: typeof ToExtensionType.EXECUTE_WORKFLOW;
  payload: {
    /** Workflow command to execute */
    command: string;
  };
}

/**
 * Copy command message - requests copying a command to clipboard
 */
export interface CopyCommandMessage {
  type: typeof ToExtensionType.COPY_COMMAND;
  payload: {
    /** Command to copy to clipboard */
    command: string;
  };
}

/**
 * Refresh message - requests refreshing dashboard data
 */
export interface RefreshMessage {
  type: typeof ToExtensionType.REFRESH;
}

/**
 * Discriminated union of all messages from Webview to Extension
 */
export type ToExtension =
  | OpenDocumentMessage
  | ExecuteWorkflowMessage
  | CopyCommandMessage
  | RefreshMessage;

// ============================================================================
// Type Guards for Message Type Narrowing
// ============================================================================

// ToWebview type guards

/**
 * Type guard for STATE_UPDATE messages
 */
export function isStateUpdateMessage(message: ToWebview): message is StateUpdateMessage {
  return message.type === ToWebviewType.STATE_UPDATE;
}

/**
 * Type guard for DOCUMENT_CONTENT messages
 */
export function isDocumentContentMessage(message: ToWebview): message is DocumentContentMessage {
  return message.type === ToWebviewType.DOCUMENT_CONTENT;
}

/**
 * Type guard for ERROR messages
 */
export function isErrorMessage(message: ToWebview): message is ErrorMessage {
  return message.type === ToWebviewType.ERROR;
}

// ToExtension type guards

/**
 * Type guard for OPEN_DOCUMENT messages
 */
export function isOpenDocumentMessage(message: ToExtension): message is OpenDocumentMessage {
  return message.type === ToExtensionType.OPEN_DOCUMENT;
}

/**
 * Type guard for EXECUTE_WORKFLOW messages
 */
export function isExecuteWorkflowMessage(message: ToExtension): message is ExecuteWorkflowMessage {
  return message.type === ToExtensionType.EXECUTE_WORKFLOW;
}

/**
 * Type guard for COPY_COMMAND messages
 */
export function isCopyCommandMessage(message: ToExtension): message is CopyCommandMessage {
  return message.type === ToExtensionType.COPY_COMMAND;
}

/**
 * Type guard for REFRESH messages
 */
export function isRefreshMessage(message: ToExtension): message is RefreshMessage {
  return message.type === ToExtensionType.REFRESH;
}

// ============================================================================
// Message Factory Functions
// ============================================================================

/**
 * Create a STATE_UPDATE message
 */
export function createStateUpdateMessage(state: DashboardState): StateUpdateMessage {
  return { type: ToWebviewType.STATE_UPDATE, payload: state };
}

/**
 * Create a DOCUMENT_CONTENT message
 */
export function createDocumentContentMessage(
  path: string,
  content: string,
  frontmatter: unknown = null
): DocumentContentMessage {
  return { type: ToWebviewType.DOCUMENT_CONTENT, payload: { path, content, frontmatter } };
}

/**
 * Create an ERROR message
 */
export function createErrorMessage(message: string, recoverable: boolean): ErrorMessage {
  return { type: ToWebviewType.ERROR, payload: { message, recoverable } };
}

/**
 * Create an OPEN_DOCUMENT message
 */
export function createOpenDocumentMessage(path: string): OpenDocumentMessage {
  return { type: ToExtensionType.OPEN_DOCUMENT, payload: { path } };
}

/**
 * Create an EXECUTE_WORKFLOW message
 */
export function createExecuteWorkflowMessage(command: string): ExecuteWorkflowMessage {
  return { type: ToExtensionType.EXECUTE_WORKFLOW, payload: { command } };
}

/**
 * Create a COPY_COMMAND message
 */
export function createCopyCommandMessage(command: string): CopyCommandMessage {
  return { type: ToExtensionType.COPY_COMMAND, payload: { command } };
}

/**
 * Create a REFRESH message
 */
export function createRefreshMessage(): RefreshMessage {
  return { type: ToExtensionType.REFRESH };
}
