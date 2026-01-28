import { describe, it, expect } from 'vitest';
import {
  type ParseResult,
  isParseSuccess,
  isParseFailure,
  parseSuccess,
  parseFailure,
} from './parse-result';

describe('ParseResult type guards', () => {
  describe('isParseSuccess', () => {
    it('returns true for successful results', () => {
      const result: ParseResult<string> = { success: true, data: 'test data' };
      expect(isParseSuccess(result)).toBe(true);
    });

    it('returns false for failed results', () => {
      const result: ParseResult<string> = { success: false, error: 'test error' };
      expect(isParseSuccess(result)).toBe(false);
    });

    it('narrows type correctly for success', () => {
      const result: ParseResult<{ name: string }> = { success: true, data: { name: 'test' } };
      if (isParseSuccess(result)) {
        // TypeScript should know result.data exists and is { name: string }
        expect(result.data.name).toBe('test');
      } else {
        // This branch should not be reached
        expect.fail('Should have been a success result');
      }
    });
  });

  describe('isParseFailure', () => {
    it('returns true for failed results', () => {
      const result: ParseResult<string> = { success: false, error: 'test error' };
      expect(isParseFailure(result)).toBe(true);
    });

    it('returns false for successful results', () => {
      const result: ParseResult<string> = { success: true, data: 'test data' };
      expect(isParseFailure(result)).toBe(false);
    });

    it('narrows type correctly for failure', () => {
      const result: ParseResult<string> = { success: false, error: 'parsing failed' };
      if (isParseFailure(result)) {
        // TypeScript should know result.error exists
        expect(result.error).toBe('parsing failed');
      } else {
        expect.fail('Should have been a failure result');
      }
    });

    it('provides access to partial data on failure', () => {
      interface TestData {
        required: string;
        optional?: string;
      }
      const result: ParseResult<TestData> = {
        success: false,
        error: 'incomplete data',
        partial: { required: 'partial value' },
      };

      if (isParseFailure(result)) {
        expect(result.partial?.required).toBe('partial value');
      } else {
        expect.fail('Should have been a failure result');
      }
    });
  });

  describe('factory functions', () => {
    describe('parseSuccess', () => {
      it('creates a successful parse result', () => {
        const result = parseSuccess({ id: 1, name: 'test' });
        expect(result.success).toBe(true);
        expect(result.data).toEqual({ id: 1, name: 'test' });
      });

      it('works with primitive types', () => {
        const result = parseSuccess('simple string');
        expect(result.success).toBe(true);
        expect(result.data).toBe('simple string');
      });

      it('works with array types', () => {
        const result = parseSuccess([1, 2, 3]);
        expect(result.success).toBe(true);
        expect(result.data).toEqual([1, 2, 3]);
      });
    });

    describe('parseFailure', () => {
      it('creates a failed parse result without partial data', () => {
        const result = parseFailure<string>('error message');
        expect(result.success).toBe(false);
        expect(result.error).toBe('error message');
        expect(result.partial).toBeUndefined();
      });

      it('creates a failed parse result with partial data', () => {
        interface TestData {
          field1: string;
          field2: number;
        }
        const result = parseFailure<TestData>('partial failure', { field1: 'recovered' });
        expect(result.success).toBe(false);
        expect(result.error).toBe('partial failure');
        expect(result.partial).toEqual({ field1: 'recovered' });
      });
    });
  });

  describe('discriminated union type narrowing', () => {
    it('allows exhaustive handling of both cases', () => {
      function handleResult(result: ParseResult<number>): string {
        if (result.success) {
          return `Value: ${result.data}`;
        } else {
          return `Error: ${result.error}`;
        }
      }

      expect(handleResult({ success: true, data: 42 })).toBe('Value: 42');
      expect(handleResult({ success: false, error: 'failed' })).toBe('Error: failed');
    });

    it('works with complex nested types', () => {
      interface NestedData {
        items: Array<{ id: number; value: string }>;
        metadata: { count: number };
      }

      const successResult: ParseResult<NestedData> = {
        success: true,
        data: {
          items: [{ id: 1, value: 'a' }],
          metadata: { count: 1 },
        },
      };

      if (isParseSuccess(successResult)) {
        expect(successResult.data.items[0].id).toBe(1);
        expect(successResult.data.metadata.count).toBe(1);
      }
    });
  });
});
