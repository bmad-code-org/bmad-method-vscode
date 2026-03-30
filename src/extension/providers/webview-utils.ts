import * as crypto from 'crypto';

/**
 * Generate a random nonce string for CSP script-src attributes.
 */
export function getNonce(): string {
  return crypto.randomBytes(16).toString('hex');
}
