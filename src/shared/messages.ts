// Message protocol types for extension <-> webview communication
// These types are shared between Node.js (extension) and browser (webview) contexts

/**
 * Base message type for all messages between extension and webview
 */
export interface BaseMessage {
  type: string;
}

/**
 * Message types will be expanded in Story 2.1: Shared Types and Message Protocol
 */
