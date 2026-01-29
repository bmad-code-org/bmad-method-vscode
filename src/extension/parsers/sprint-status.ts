// Sprint Status Parser for BMAD Extension
// Parses sprint-status.yaml files into SprintStatus type

import yaml from 'js-yaml';
import type { SprintStatus, ParseResult, DevelopmentStatusValue } from '@shared/types';
import {
  parseSuccess,
  parseFailure,
  isEpicKey,
  isStoryKey,
  isRetrospectiveKey,
  isEpicStatus,
  isStoryStatus,
  isRetrospectiveStatus,
} from '@shared/types';
import { promises as fs } from 'node:fs';

/**
 * Valid status values for each key type
 */
const EPIC_STATUS_VALUES = ['backlog', 'in-progress', 'done'] as const;
const STORY_STATUS_VALUES = ['backlog', 'ready-for-dev', 'in-progress', 'review', 'done'] as const;
const RETROSPECTIVE_STATUS_VALUES = ['optional', 'done'] as const;

/**
 * Validate a string is a non-empty string
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

/**
 * Convert a value to string if it's a valid date or string
 * js-yaml parses YAML dates like "2026-01-27" as Date objects
 */
function toStringValue(value: unknown): string | undefined {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  // js-yaml parses bare dates (2026-01-27) as Date objects
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().split('T')[0];
  }
  return undefined;
}

/**
 * Extract partial SprintStatus data from raw parsed YAML
 * Used for graceful degradation when full parsing fails
 */
function extractPartialData(raw: Record<string, unknown>): Partial<SprintStatus> {
  const partial: Partial<SprintStatus> = {};

  const generated = toStringValue(raw.generated);
  if (generated) {
    partial.generated = generated;
  }
  if (isNonEmptyString(raw.project)) {
    partial.project = raw.project;
  }
  if (isNonEmptyString(raw.project_key)) {
    partial.project_key = raw.project_key;
  }
  if (raw.tracking_system === 'file-system') {
    partial.tracking_system = raw.tracking_system;
  }
  if (isNonEmptyString(raw.story_location)) {
    partial.story_location = raw.story_location;
  }

  return partial;
}

/**
 * Validate and extract development_status entries
 * Returns tuple of [validEntries, errors]
 */
function validateDevelopmentStatus(
  devStatus: Record<string, unknown>
): [Record<string, DevelopmentStatusValue>, string[]] {
  const validEntries: Record<string, DevelopmentStatusValue> = {};
  const errors: string[] = [];

  for (const [key, value] of Object.entries(devStatus)) {
    if (typeof value !== 'string') {
      errors.push(`Invalid status type for '${key}': expected string, got ${typeof value}`);
      continue;
    }

    // Determine key type and validate status accordingly
    // Type guards now accept string, so no unsafe casting needed
    if (isEpicKey(key)) {
      if (isEpicStatus(value)) {
        validEntries[key] = value;
      } else {
        errors.push(
          `Invalid status '${value}' for epic '${key}', expected one of: ${EPIC_STATUS_VALUES.join(', ')}`
        );
      }
    } else if (isRetrospectiveKey(key)) {
      if (isRetrospectiveStatus(value)) {
        validEntries[key] = value;
      } else {
        errors.push(
          `Invalid status '${value}' for retrospective '${key}', expected one of: ${RETROSPECTIVE_STATUS_VALUES.join(', ')}`
        );
      }
    } else if (isStoryKey(key)) {
      if (isStoryStatus(value)) {
        validEntries[key] = value;
      } else {
        errors.push(
          `Invalid status '${value}' for story '${key}', expected one of: ${STORY_STATUS_VALUES.join(', ')}`
        );
      }
    } else {
      errors.push(
        `Invalid key pattern '${key}': expected epic-N, N-N-name, or epic-N-retrospective`
      );
    }
  }

  return [validEntries, errors];
}

/**
 * Parse sprint-status.yaml content into SprintStatus
 *
 * @param content - Raw YAML content as string
 * @returns ParseResult<SprintStatus> - never throws
 */
export function parseSprintStatus(content: string): ParseResult<SprintStatus> {
  try {
    // Handle empty content
    if (!content || content.trim().length === 0) {
      return parseFailure('Empty content: sprint-status.yaml is empty');
    }

    // Parse YAML
    const raw = yaml.load(content);

    // Handle YAML that parses to null/undefined (e.g., only comments)
    if (raw === null || raw === undefined) {
      return parseFailure('Invalid YAML: file contains only comments or is empty');
    }

    // Validate top-level structure
    if (typeof raw !== 'object' || Array.isArray(raw)) {
      return parseFailure('Invalid YAML: expected object at root level');
    }

    const rawObj = raw as Record<string, unknown>;

    // Extract partial data for graceful degradation
    const partial = extractPartialData(rawObj);

    // Validate required header fields
    const requiredFields = [
      'generated',
      'project',
      'project_key',
      'tracking_system',
      'story_location',
      'development_status',
    ] as const;

    for (const field of requiredFields) {
      if (!(field in rawObj)) {
        return parseFailure(
          `Missing required field '${field}'`,
          Object.keys(partial).length > 0 ? partial : undefined
        );
      }
    }

    // Validate field types
    // Note: js-yaml parses bare dates like "2026-01-27" as Date objects
    const generatedValue = toStringValue(rawObj.generated);
    if (!generatedValue) {
      return parseFailure("Invalid 'generated' field: expected date string or Date", partial);
    }
    if (!isNonEmptyString(rawObj.project)) {
      return parseFailure("Invalid 'project' field: expected non-empty string", partial);
    }
    if (!isNonEmptyString(rawObj.project_key)) {
      return parseFailure("Invalid 'project_key' field: expected non-empty string", partial);
    }
    if (rawObj.tracking_system !== 'file-system') {
      return parseFailure(
        `Invalid 'tracking_system' field: expected 'file-system', got '${String(rawObj.tracking_system)}'`,
        partial
      );
    }
    if (!isNonEmptyString(rawObj.story_location)) {
      return parseFailure("Invalid 'story_location' field: expected non-empty string", partial);
    }

    // Validate development_status
    if (typeof rawObj.development_status !== 'object' || rawObj.development_status === null) {
      return parseFailure("Invalid 'development_status' field: expected object", partial);
    }

    if (Array.isArray(rawObj.development_status)) {
      return parseFailure(
        "Invalid 'development_status' field: expected object, got array",
        partial
      );
    }

    const devStatusRaw = rawObj.development_status as Record<string, unknown>;
    const [validEntries, validationErrors] = validateDevelopmentStatus(devStatusRaw);

    // If there are validation errors but some valid entries, return partial success
    if (validationErrors.length > 0) {
      // Include valid development_status entries in partial data
      const partialWithStatus: Partial<SprintStatus> = {
        ...partial,
        development_status: Object.keys(validEntries).length > 0 ? validEntries : undefined,
      };

      return parseFailure(
        `Development status validation errors: ${validationErrors.join('; ')}`,
        partialWithStatus
      );
    }

    // Success - all validation passed
    const sprintStatus: SprintStatus = {
      generated: generatedValue,
      project: rawObj.project,
      project_key: rawObj.project_key,
      tracking_system: 'file-system',
      story_location: rawObj.story_location,
      development_status: validEntries,
    };

    return parseSuccess(sprintStatus);
  } catch (error) {
    // Handle YAML syntax errors and other unexpected errors
    const message = error instanceof Error ? error.message : 'Unknown error';
    return parseFailure(`YAML parse error: ${message}`);
  }
}

/**
 * Parse sprint-status.yaml file from disk
 *
 * @param filePath - Absolute path to sprint-status.yaml file
 * @returns Promise<ParseResult<SprintStatus>> - never throws
 */
export async function parseSprintStatusFile(filePath: string): Promise<ParseResult<SprintStatus>> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return parseSprintStatus(content);
  } catch (error) {
    if (error instanceof Error) {
      // Handle specific error codes
      if ('code' in error) {
        const nodeError = error as NodeJS.ErrnoException;
        if (nodeError.code === 'ENOENT') {
          return parseFailure(`File not found: ${filePath}`);
        }
        if (nodeError.code === 'EACCES') {
          return parseFailure(`Permission denied: ${filePath}`);
        }
        if (nodeError.code === 'EISDIR') {
          return parseFailure(`Path is a directory, not a file: ${filePath}`);
        }
      }
      return parseFailure(`Failed to read file: ${error.message}`);
    }
    return parseFailure(`Failed to read file: Unknown error`);
  }
}
