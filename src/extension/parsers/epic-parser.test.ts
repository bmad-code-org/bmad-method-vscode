// Epic File Parser Unit Tests
// Tests parseEpic and parseEpicFile functions

import { describe, it, expect } from 'vitest';
import { parseEpic, parseEpicFile } from './epic-parser';
import { isParseSuccess, isParseFailure } from '../../shared/types';
import path from 'node:path';

// Valid epic content based on actual epics.md structure
const VALID_EPIC_CONTENT = `---
stepsCompleted: [step-01, step-02]
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
---

## Epic 2: BMAD File Parsing & State Management

Developer has reliable parsing of all BMAD artifacts with graceful handling of malformed files.

### Story 2.1: Shared Types and Message Protocol

As a developer,
I want shared TypeScript types for BMAD data structures,
So that type safety is enforced across extension host and webview boundaries.

### Story 2.2: Sprint Status Parser

As a developer,
I want reliable parsing of sprint-status.yaml files,
So that the extension can extract workflow state.
`;

const EPIC_WITHOUT_FRONTMATTER = `## Epic 1: Project Foundation

Developer opens VS Code and the extension activates in BMAD projects.

### Story 1.1: Initialize Project

As a developer,
I want the project initialized,
So that I can start coding.
`;

const EPIC_WITH_EMPTY_FRONTMATTER = `---
---

## Epic 3: Dashboard State Visibility

Developer sees project state at a glance.

### Story 3.1: Dashboard Store

As a developer,
I want state management,
So that components update reactively.
`;

const EPIC_WITH_NO_STORIES = `---
stepsCompleted: [step-01]
---

## Epic 4: Workflow Actions

Developer can launch any BMAD workflow.
`;

const EPIC_WITH_INVALID_HEADER = `---
stepsCompleted: [step-01]
---

# Not an epic header

Some content here.
`;

const EPIC_WITH_MALFORMED_STORY = `---
---

## Epic 5: Testing

Some description.

### Story: Missing Numbers

As a developer,
I want something,
So that something happens.

### Story 5.1: Valid Story

As a developer,
I want valid parsing,
So that errors are handled.
`;

const EPIC_WITH_NO_DESCRIPTION_STORIES = `---
---

## Epic 6: Edge Cases

Testing edge cases.

### Story 6.1: No User Story

This story has no "As a" description.

### Story 6.2: Another Story

Also no description format.
`;

const INVALID_YAML_FRONTMATTER = `---
stepsCompleted: [
  - broken yaml
---

## Epic 7: Invalid YAML

Some content.
`;

const EMPTY_FILE = '';

const ONLY_FRONTMATTER = `---
stepsCompleted: [step-01]
inputDocuments:
  - 'doc.md'
---
`;

describe('parseEpic', () => {
  describe('valid epic files', () => {
    it('parses valid epic file with complete frontmatter and stories', () => {
      const result = parseEpic(VALID_EPIC_CONTENT, 'epics.md');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.number).toBe(2);
        expect(result.data.key).toBe('epic-2');
        expect(result.data.title).toBe('BMAD File Parsing & State Management');
        expect(result.data.description).toContain('Developer has reliable parsing');
        expect(result.data.filePath).toBe('epics.md');
        expect(result.data.status).toBe('backlog');

        // Metadata
        expect(result.data.metadata.stepsCompleted).toEqual(['step-01', 'step-02']);
        expect(result.data.metadata.inputDocuments).toEqual([
          '_bmad-output/planning-artifacts/prd.md',
          '_bmad-output/planning-artifacts/architecture.md',
        ]);

        // Stories
        expect(result.data.stories).toHaveLength(2);
        expect(result.data.stories[0].key).toBe('2-1-shared-types-and-message-protocol');
        expect(result.data.stories[0].title).toBe('Shared Types and Message Protocol');
        expect(result.data.stories[0].description).toContain('As a developer');
        expect(result.data.stories[0].status).toBe('backlog');

        expect(result.data.stories[1].key).toBe('2-2-sprint-status-parser');
        expect(result.data.stories[1].title).toBe('Sprint Status Parser');
      }
    });

    it('parses epic file without frontmatter', () => {
      const result = parseEpic(EPIC_WITHOUT_FRONTMATTER);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.number).toBe(1);
        expect(result.data.key).toBe('epic-1');
        expect(result.data.title).toBe('Project Foundation');
        expect(result.data.metadata.stepsCompleted).toBeUndefined();
        expect(result.data.metadata.inputDocuments).toBeUndefined();
        expect(result.data.stories).toHaveLength(1);
        expect(result.data.stories[0].key).toBe('1-1-initialize-project');
      }
    });

    it('parses epic file with empty frontmatter', () => {
      const result = parseEpic(EPIC_WITH_EMPTY_FRONTMATTER);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.number).toBe(3);
        expect(result.data.key).toBe('epic-3');
        expect(result.data.title).toBe('Dashboard State Visibility');
        expect(result.data.metadata.stepsCompleted).toBeUndefined();
        expect(result.data.stories).toHaveLength(1);
      }
    });

    it('parses epic file with no stories', () => {
      const result = parseEpic(EPIC_WITH_NO_STORIES);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.number).toBe(4);
        expect(result.data.key).toBe('epic-4');
        expect(result.data.title).toBe('Workflow Actions');
        expect(result.data.stories).toHaveLength(0);
        expect(result.data.metadata.stepsCompleted).toEqual(['step-01']);
      }
    });

    it('handles stories without user story description', () => {
      const result = parseEpic(EPIC_WITH_NO_DESCRIPTION_STORIES);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stories).toHaveLength(2);
        expect(result.data.stories[0].key).toBe('6-1-no-user-story');
        expect(result.data.stories[0].description).toBeUndefined();
        expect(result.data.stories[1].key).toBe('6-2-another-story');
        expect(result.data.stories[1].description).toBeUndefined();
      }
    });

    it('skips malformed story headings but parses valid ones', () => {
      const result = parseEpic(EPIC_WITH_MALFORMED_STORY);

      expect(result.success).toBe(true);
      if (result.success) {
        // Only the valid story should be parsed
        expect(result.data.stories).toHaveLength(1);
        expect(result.data.stories[0].key).toBe('5-1-valid-story');
        expect(result.data.stories[0].title).toBe('Valid Story');
      }
    });

    it('sets filePath from parameter', () => {
      const result = parseEpic(VALID_EPIC_CONTENT, 'path/to/epic-2.md');

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filePath).toBe('path/to/epic-2.md');
      }
    });

    it('uses empty string for filePath when not provided', () => {
      const result = parseEpic(VALID_EPIC_CONTENT);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.filePath).toBe('');
      }
    });
  });

  describe('invalid epic files', () => {
    it('returns failure for empty content', () => {
      const result = parseEpic(EMPTY_FILE);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('empty');
      }
    });

    it('returns failure for whitespace-only content', () => {
      const result = parseEpic('   \n\t\n   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('empty');
      }
    });

    it('returns failure for missing epic header', () => {
      const result = parseEpic(EPIC_WITH_INVALID_HEADER);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing epic header');
        expect(result.error).toContain('## Epic N: Title');
        // Partial data should include metadata
        expect(result.partial?.metadata).toBeDefined();
      }
    });

    it('returns failure for frontmatter-only content', () => {
      const result = parseEpic(ONLY_FRONTMATTER);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('missing epic header');
        // Should have partial metadata from successful frontmatter parse
        expect(result.partial?.metadata?.stepsCompleted).toEqual(['step-01']);
        expect(result.partial?.metadata?.inputDocuments).toEqual(['doc.md']);
      }
    });

    it('handles invalid YAML frontmatter gracefully', () => {
      // gray-matter handles most YAML errors gracefully
      // but syntax errors in frontmatter may cause issues
      const result = parseEpic(INVALID_YAML_FRONTMATTER);

      // Should either fail with descriptive error or succeed with empty metadata
      if (result.success) {
        // If gray-matter recovered, metadata should be empty/undefined
        expect(result.data.metadata.stepsCompleted).toBeUndefined();
      } else {
        // If it failed, should have descriptive error
        expect(result.error).toBeDefined();
      }
    });
  });

  describe('story key generation', () => {
    it('converts title to kebab-case correctly', () => {
      const result = parseEpic(VALID_EPIC_CONTENT);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stories[0].key).toBe('2-1-shared-types-and-message-protocol');
        expect(result.data.stories[1].key).toBe('2-2-sprint-status-parser');
      }
    });

    it('handles special characters in title', () => {
      const content = `## Epic 1: Test

Description.

### Story 1.1: Handle Special Characters (like & and !)

As a developer,
I want this parsed,
So that it works.
`;
      const result = parseEpic(content);

      expect(result.success).toBe(true);
      if (result.success) {
        // Special characters removed, spaces to dashes
        expect(result.data.stories[0].key).toBe('1-1-handle-special-characters-like-and');
      }
    });
  });

  describe('description extraction', () => {
    it('extracts epic description correctly', () => {
      const result = parseEpic(VALID_EPIC_CONTENT);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.description).toBe(
          'Developer has reliable parsing of all BMAD artifacts with graceful handling of malformed files.'
        );
      }
    });

    it('extracts user story description from "As a" pattern', () => {
      const result = parseEpic(VALID_EPIC_CONTENT);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.stories[0].description).toContain('As a developer');
        expect(result.data.stories[0].description).toContain('I want');
        expect(result.data.stories[0].description).toContain('So that');
      }
    });
  });

  describe('never throws', () => {
    it('never throws exceptions - returns ParseFailure instead', () => {
      // Test various malformed inputs
      const inputs = [null, undefined, 123, {}, [], '', '---\n---'];

      for (const input of inputs) {
        // Should not throw
        expect(() => parseEpic(input as string)).not.toThrow();

        // Result should be a valid ParseResult
        const result = parseEpic(input as string);
        expect(result).toHaveProperty('success');
      }
    });
  });
});

describe('parseEpicFile', () => {
  it('returns failure for non-existent file', async () => {
    const result = await parseEpicFile('/non/existent/path/epic.md');
    expect(result.success).toBe(false);
    if (isParseFailure(result)) {
      expect(result.error).toContain('file not found');
    }
  });

  it('returns failure for directory path', async () => {
    const result = await parseEpicFile(path.resolve(__dirname));
    expect(result.success).toBe(false);
    if (isParseFailure(result)) {
      expect(result.error).toContain('directory');
    }
  });

  it('parses actual epics.md from project if available', async () => {
    const projectRoot = path.resolve(__dirname, '../../..');
    const epicsPath = path.join(projectRoot, '_bmad-output/planning-artifacts/epics.md');

    const result = await parseEpicFile(epicsPath);

    // The important thing is it doesn't throw
    expect(typeof result.success).toBe('boolean');

    // Only validate structure if file exists and parses successfully
    // This makes the test resilient to CI environments without the fixture
    if (isParseSuccess(result)) {
      expect(result.data.number).toBeGreaterThanOrEqual(1);
      expect(result.data.filePath).toBe(epicsPath);
    } else {
      // File doesn't exist or is malformed - that's acceptable in CI
      // Verify we got a proper failure result, not an exception
      expect(result.error).toBeDefined();
    }
  });

  it('never throws on empty path input', async () => {
    const result = await parseEpicFile('');
    expect(typeof result.success).toBe('boolean');
    expect(result.success).toBe(false);
  });

  it('never throws on whitespace-only path', async () => {
    const result = await parseEpicFile('   ');
    expect(typeof result.success).toBe('boolean');
    expect(result.success).toBe(false);
  });

  it('never throws on path with null character', async () => {
    const result = await parseEpicFile('\0invalid');
    expect(typeof result.success).toBe('boolean');
    expect(result.success).toBe(false);
  });

  it('handles nonexistent Windows path gracefully', async () => {
    const result = await parseEpicFile('C:\\nonexistent\\path\\epic.md');
    expect(result.success).toBe(false);
    if (isParseFailure(result)) {
      expect(result.error).toContain('file not found');
    }
  });

  it('handles nonexistent Unix path gracefully', async () => {
    const result = await parseEpicFile('/root/permission/denied/maybe.md');
    expect(result.success).toBe(false);
  });

  it('handles relative path outside workspace gracefully', async () => {
    const result = await parseEpicFile('../../../outside/workspace.md');
    expect(result.success).toBe(false);
  });

  it('handles very long path gracefully', async () => {
    // Using a very long path that exceeds filesystem limits
    const veryLongPath = `${'a'.repeat(300)}/epic.md`;
    const result = await parseEpicFile(veryLongPath);
    expect(result.success).toBe(false);
    if (isParseFailure(result)) {
      expect(result.error).toBeDefined();
    }
  });
});

describe('performance with large files', () => {
  it('handles epic file with many stories efficiently', () => {
    // Generate a large epic with 50 stories to test regex performance
    let largeContent = `---
stepsCompleted: [step-01]
---

## Epic 99: Large Epic Performance Test

This epic tests parser performance with many stories.

`;
    // Add 50 stories
    for (let i = 1; i <= 50; i++) {
      largeContent += `### Story 99.${i}: Story Number ${i}

As a developer,
I want story ${i} to be parsed,
So that performance is validated.

`;
    }

    const startTime = performance.now();
    const result = parseEpic(largeContent, 'large-epic.md');
    const endTime = performance.now();

    // Should complete in under 100ms even with 50 stories
    expect(endTime - startTime).toBeLessThan(100);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stories).toHaveLength(50);
      expect(result.data.stories[0].key).toBe('99-1-story-number-1');
      expect(result.data.stories[49].key).toBe('99-50-story-number-50');
    }
  });

  it('handles epic file with very long description', () => {
    const longDescription = 'This is a very long description. '.repeat(500);
    const content = `---
stepsCompleted: [step-01]
---

## Epic 88: Long Description Test

${longDescription}

### Story 88.1: Single Story

As a developer,
I want this parsed,
So that it works.
`;

    const result = parseEpic(content, 'long-desc.md');

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description.length).toBeGreaterThan(10000);
      expect(result.data.stories).toHaveLength(1);
    }
  });
});

describe('partial data extraction on failure', () => {
  it('returns partial metadata when epic header is missing', () => {
    const content = `---
stepsCompleted: [step-01, step-02, step-03]
inputDocuments:
  - 'prd.md'
  - 'arch.md'
---

# This is not an epic header

Some content.
`;
    const result = parseEpic(content, 'test.md');

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.partial).toBeDefined();
      expect(result.partial?.metadata?.stepsCompleted).toEqual(['step-01', 'step-02', 'step-03']);
      expect(result.partial?.metadata?.inputDocuments).toEqual(['prd.md', 'arch.md']);
      expect(result.partial?.filePath).toBe('test.md');
    }
  });
});
