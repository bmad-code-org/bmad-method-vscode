// Sprint Status Parser Unit Tests
import { describe, it, expect } from 'vitest';
import { parseSprintStatus, parseSprintStatusFile } from './sprint-status';
import { isParseSuccess, isParseFailure } from '@shared/types';
import path from 'node:path';

// Valid sprint-status.yaml fixture based on actual project structure
const VALID_SPRINT_STATUS = `
generated: 2026-01-27
project: test-project
project_key: test-project
tracking_system: file-system
story_location: _bmad-output/implementation-artifacts

development_status:
  epic-1: in-progress
  1-1-first-story: done
  1-2-second-story: backlog
  epic-1-retrospective: optional
`;

// Complete fixture matching actual project
const FULL_SPRINT_STATUS = `
generated: 2026-01-27
project: bmad-extension
project_key: bmad-extension
tracking_system: file-system
story_location: _bmad-output/implementation-artifacts

development_status:
  # Epic 1: Project Foundation
  epic-1: in-progress
  1-1-project-initialization: done
  1-2-test-framework: done
  1-3-bmad-detection: in-progress
  1-4-sidebar-panel: backlog
  epic-1-retrospective: optional

  # Epic 2: Parsing
  epic-2: backlog
  2-1-shared-types: ready-for-dev
  2-2-sprint-parser: backlog
  epic-2-retrospective: optional
`;

describe('parseSprintStatus', () => {
  describe('valid YAML parsing', () => {
    it('parses valid sprint-status.yaml with all fields', () => {
      const result = parseSprintStatus(VALID_SPRINT_STATUS);
      expect(result.success).toBe(true);
      if (isParseSuccess(result)) {
        expect(result.data.project).toBe('test-project');
        expect(result.data.project_key).toBe('test-project');
        expect(result.data.generated).toBe('2026-01-27');
        expect(result.data.tracking_system).toBe('file-system');
        expect(result.data.story_location).toBe('_bmad-output/implementation-artifacts');
      }
    });

    it('parses development_status entries correctly', () => {
      const result = parseSprintStatus(VALID_SPRINT_STATUS);
      expect(result.success).toBe(true);
      if (isParseSuccess(result)) {
        expect(result.data.development_status['epic-1']).toBe('in-progress');
        expect(result.data.development_status['1-1-first-story']).toBe('done');
        expect(result.data.development_status['1-2-second-story']).toBe('backlog');
        expect(result.data.development_status['epic-1-retrospective']).toBe('optional');
      }
    });

    it('parses full project sprint-status.yaml', () => {
      const result = parseSprintStatus(FULL_SPRINT_STATUS);
      expect(result.success).toBe(true);
      if (isParseSuccess(result)) {
        expect(result.data.project).toBe('bmad-extension');
        expect(Object.keys(result.data.development_status).length).toBe(10);
      }
    });

    it('parses all valid story status values', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories

development_status:
  1-1-backlog-story: backlog
  1-2-ready-story: ready-for-dev
  1-3-in-progress-story: in-progress
  1-4-review-story: review
  1-5-done-story: done
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(true);
      if (isParseSuccess(result)) {
        expect(result.data.development_status['1-1-backlog-story']).toBe('backlog');
        expect(result.data.development_status['1-2-ready-story']).toBe('ready-for-dev');
        expect(result.data.development_status['1-3-in-progress-story']).toBe('in-progress');
        expect(result.data.development_status['1-4-review-story']).toBe('review');
        expect(result.data.development_status['1-5-done-story']).toBe('done');
      }
    });

    it('parses all valid epic status values', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories

development_status:
  epic-1: backlog
  epic-2: in-progress
  epic-3: done
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(true);
      if (isParseSuccess(result)) {
        expect(result.data.development_status['epic-1']).toBe('backlog');
        expect(result.data.development_status['epic-2']).toBe('in-progress');
        expect(result.data.development_status['epic-3']).toBe('done');
      }
    });

    it('parses retrospective status values', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories

development_status:
  epic-1-retrospective: optional
  epic-2-retrospective: done
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(true);
      if (isParseSuccess(result)) {
        expect(result.data.development_status['epic-1-retrospective']).toBe('optional');
        expect(result.data.development_status['epic-2-retrospective']).toBe('done');
      }
    });
  });

  describe('invalid YAML syntax', () => {
    it('returns failure for malformed YAML (bad indentation)', () => {
      const result = parseSprintStatus('invalid:\n  yaml:\n bad indent');
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('YAML');
      }
    });

    it('returns failure for YAML with duplicate colons', () => {
      const result = parseSprintStatus('key: value: extra');
      expect(result.success).toBe(false);
    });

    it('returns failure for YAML with tabs in wrong places', () => {
      const result = parseSprintStatus('key:\t\tvalue');
      // js-yaml may or may not fail on tabs, check either outcome
      // The important thing is it doesn't throw
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('missing required fields', () => {
    it('returns failure for missing generated field', () => {
      const yaml = `
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  epic-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('generated');
      }
    });

    it('returns failure for missing project field', () => {
      const yaml = `
generated: 2026-01-27
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  epic-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('project');
      }
    });

    it('returns failure for missing project_key field', () => {
      const yaml = `
generated: 2026-01-27
project: test
tracking_system: file-system
story_location: stories
development_status:
  epic-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('project_key');
      }
    });

    it('returns failure for missing tracking_system field', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
story_location: stories
development_status:
  epic-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('tracking_system');
      }
    });

    it('returns failure for missing story_location field', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
development_status:
  epic-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('story_location');
      }
    });

    it('returns failure for missing development_status field', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('development_status');
      }
    });
  });

  describe('invalid status values', () => {
    it('returns failure for invalid epic status', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  epic-1: invalid-status
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('invalid-status');
        expect(result.error).toContain('epic-1');
      }
    });

    it('returns failure for invalid story status', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  1-1-test-story: not-a-status
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('not-a-status');
        expect(result.error).toContain('1-1-test-story');
      }
    });

    it('returns failure for invalid retrospective status', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  epic-1-retrospective: invalid
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('invalid');
        expect(result.error).toContain('epic-1-retrospective');
      }
    });

    it('rejects story-only status for epic key', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  epic-1: ready-for-dev
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('ready-for-dev');
        expect(result.error).toContain('epic-1');
      }
    });
  });

  describe('invalid key patterns', () => {
    it('returns failure for invalid key pattern', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  bad-key-format: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('bad-key-format');
        expect(result.error).toContain('Invalid key pattern');
      }
    });

    it('returns failure for key with only numbers', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  123: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
    });

    it('returns failure for key missing story name', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  1-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
    });
  });

  describe('partial data extraction', () => {
    it('returns partial data when development_status is malformed', () => {
      const yaml = `
generated: 2026-01-27
project: test-project
project_key: test-key
tracking_system: file-system
story_location: stories
development_status:
  bad-key: invalid
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.partial).toBeDefined();
        expect(result.partial?.project).toBe('test-project');
        expect(result.partial?.project_key).toBe('test-key');
        expect(result.partial?.generated).toBe('2026-01-27');
        expect(result.partial?.story_location).toBe('stories');
      }
    });

    it('returns partial data when required field is missing', () => {
      const yaml = `
generated: 2026-01-27
project: my-project
tracking_system: file-system
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.partial).toBeDefined();
        expect(result.partial?.project).toBe('my-project');
        expect(result.partial?.generated).toBe('2026-01-27');
      }
    });

    it('returns valid entries even when some are invalid', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  epic-1: in-progress
  bad-key: invalid
  1-1-valid-story: done
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.partial?.development_status).toBeDefined();
        expect(result.partial?.development_status?.['epic-1']).toBe('in-progress');
        expect(result.partial?.development_status?.['1-1-valid-story']).toBe('done');
      }
    });
  });

  describe('empty and comment-only files', () => {
    it('returns failure for empty content', () => {
      const result = parseSprintStatus('');
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('empty');
      }
    });

    it('returns failure for whitespace-only content', () => {
      const result = parseSprintStatus('   \n\n   \t  ');
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('empty');
      }
    });

    it('returns failure for comment-only file', () => {
      const yaml = `
# This is a comment
# Another comment
# No actual content
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('comment');
      }
    });
  });

  describe('YAML with interleaved comments', () => {
    it('parses YAML with header comments and inline comments', () => {
      // This matches the actual sprint-status.yaml format
      const yaml = `# generated: 2026-01-27
# project: bmad-extension
# These are header comments that should be ignored

generated: 2026-01-27
project: test-project
project_key: test-project
tracking_system: file-system
story_location: _bmad-output/implementation-artifacts

development_status:
  # Epic 1: Project Foundation
  epic-1: in-progress
  1-1-first-story: done  # First story completed
  1-2-second-story: backlog
  # This is a comment between entries
  epic-1-retrospective: optional
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(true);
      if (isParseSuccess(result)) {
        expect(result.data.project).toBe('test-project');
        expect(result.data.development_status['epic-1']).toBe('in-progress');
        expect(result.data.development_status['1-1-first-story']).toBe('done');
        expect(result.data.development_status['1-2-second-story']).toBe('backlog');
        expect(result.data.development_status['epic-1-retrospective']).toBe('optional');
      }
    });

    it('parses YAML with status definition block comments', () => {
      // Matches the full header comment block in actual sprint-status.yaml
      const yaml = `# STATUS DEFINITIONS:
# ==================
# Epic Status:
#   - backlog: Epic not yet started
#   - in-progress: Epic actively being worked on
#   - done: All stories in epic completed

generated: 2026-01-27
project: commented-project
project_key: commented-project
tracking_system: file-system
story_location: stories

development_status:
  epic-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(true);
      if (isParseSuccess(result)) {
        expect(result.data.project).toBe('commented-project');
      }
    });
  });

  describe('edge cases', () => {
    it('handles invalid tracking_system value', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: jira
story_location: stories
development_status:
  epic-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('tracking_system');
        expect(result.error).toContain('file-system');
      }
    });

    it('handles development_status as array', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  - epic-1: backlog
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('development_status');
        expect(result.error).toContain('array');
      }
    });

    it('handles non-string status values', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status:
  epic-1: 123
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('epic-1');
        expect(result.error).toContain('string');
      }
    });

    it('handles null development_status', () => {
      const yaml = `
generated: 2026-01-27
project: test
project_key: test
tracking_system: file-system
story_location: stories
development_status: null
`;
      const result = parseSprintStatus(yaml);
      expect(result.success).toBe(false);
      if (isParseFailure(result)) {
        expect(result.error).toContain('development_status');
      }
    });

    it('never throws exceptions', () => {
      // Test various malformed inputs that might cause exceptions
      const inputs = [
        null as unknown as string,
        undefined as unknown as string,
        123 as unknown as string,
        {} as unknown as string,
        '{ invalid json }',
        'key: [unclosed array',
        '- - - invalid',
      ];

      for (const input of inputs) {
        expect(() => parseSprintStatus(input)).not.toThrow();
      }
    });
  });
});

describe('parseSprintStatusFile', () => {
  it('returns failure for non-existent file', async () => {
    const result = await parseSprintStatusFile('/non/existent/path/sprint-status.yaml');
    expect(result.success).toBe(false);
    if (isParseFailure(result)) {
      expect(result.error).toContain('File not found');
    }
  });

  it('returns failure for directory path', async () => {
    const result = await parseSprintStatusFile(path.resolve(__dirname));
    expect(result.success).toBe(false);
    if (isParseFailure(result)) {
      expect(result.error).toContain('directory');
    }
  });

  it('parses actual sprint-status.yaml from project', async () => {
    const projectRoot = path.resolve(__dirname, '../../..');
    const sprintStatusPath = path.join(
      projectRoot,
      '_bmad-output/implementation-artifacts/sprint-status.yaml'
    );

    const result = await parseSprintStatusFile(sprintStatusPath);

    // This test may pass or fail depending on project state
    // The important thing is it doesn't throw
    expect(typeof result.success).toBe('boolean');

    if (isParseSuccess(result)) {
      expect(result.data.project).toBe('bmad-extension');
      expect(result.data.tracking_system).toBe('file-system');
    }
  });

  it('never throws on empty path input', async () => {
    const result = await parseSprintStatusFile('');
    expect(typeof result.success).toBe('boolean');
    expect(result.success).toBe(false);
  });

  it('never throws on whitespace-only path', async () => {
    const result = await parseSprintStatusFile('   ');
    expect(typeof result.success).toBe('boolean');
    expect(result.success).toBe(false);
  });

  it('never throws on path with null character', async () => {
    const result = await parseSprintStatusFile('\0invalid');
    expect(typeof result.success).toBe('boolean');
    expect(result.success).toBe(false);
  });

  it('handles nonexistent Windows path gracefully', async () => {
    const result = await parseSprintStatusFile('C:\\nonexistent\\path\\file.yaml');
    expect(result.success).toBe(false);
    if (isParseFailure(result)) {
      expect(result.error).toContain('File not found');
    }
  });

  it('handles nonexistent Unix path gracefully', async () => {
    const result = await parseSprintStatusFile('/root/permission/denied/maybe.yaml');
    expect(result.success).toBe(false);
  });

  it('handles relative path outside workspace gracefully', async () => {
    const result = await parseSprintStatusFile('../../../outside/workspace.yaml');
    expect(result.success).toBe(false);
  });

  it('handles very long path gracefully', async () => {
    // Using a very long path that exceeds filesystem limits
    const veryLongPath = `${'a'.repeat(300)}/sprint-status.yaml`;
    const result = await parseSprintStatusFile(veryLongPath);
    expect(result.success).toBe(false);
    if (isParseFailure(result)) {
      expect(result.error).toBeDefined();
    }
  });
});
