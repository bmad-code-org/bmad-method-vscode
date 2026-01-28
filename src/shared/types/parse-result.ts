// Parse Result Types for BMAD Extension
// Discriminated union for parser results - "never throw" pattern (NFR5-7)

/**
 * Error information from parsing operations
 */
export interface ParseError {
  /** Error message */
  message: string;
  /** Source file path (if applicable) */
  filePath?: string;
  /** Line number where error occurred (if applicable) */
  line?: number;
  /** Whether the error is recoverable (partial data may be available) */
  recoverable: boolean;
}

/**
 * Successful parse result
 */
export interface ParseSuccess<T> {
  success: true;
  data: T;
}

/**
 * Failed parse result with optional partial data for graceful degradation
 */
export interface ParseFailure<T> {
  success: false;
  error: string;
  /** Partial data recovered before failure (for graceful degradation per NFR7) */
  partial?: Partial<T>;
}

/**
 * Discriminated union for parse results
 * Enables type narrowing after checking `success` property
 *
 * @example
 * ```typescript
 * const result: ParseResult<SprintStatus> = parseSprintStatus(content);
 * if (isParseSuccess(result)) {
 *   // TypeScript knows result.data exists and is SprintStatus
 *   console.log(result.data.project);
 * } else {
 *   // TypeScript knows result.error exists
 *   console.error(result.error);
 *   // Partial data may be available for graceful degradation
 *   if (result.partial) {
 *     console.log('Partial data:', result.partial);
 *   }
 * }
 * ```
 */
export type ParseResult<T> = ParseSuccess<T> | ParseFailure<T>;

/**
 * Type guard to check if a ParseResult is successful
 */
export function isParseSuccess<T>(result: ParseResult<T>): result is ParseSuccess<T> {
  return result.success === true;
}

/**
 * Type guard to check if a ParseResult is a failure
 */
export function isParseFailure<T>(result: ParseResult<T>): result is ParseFailure<T> {
  return result.success === false;
}

/**
 * Create a successful parse result
 */
export function parseSuccess<T>(data: T): ParseSuccess<T> {
  return { success: true, data };
}

/**
 * Create a failed parse result
 */
export function parseFailure<T>(error: string, partial?: Partial<T>): ParseFailure<T> {
  return { success: false, error, partial };
}
