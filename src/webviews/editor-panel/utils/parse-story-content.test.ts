import { describe, it, expect } from 'vitest';
import { parseStoryContent } from './parse-story-content';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const FULL_STORY_MARKDOWN = `# Story 5.6: Epics Browser and Story Detail Views

Status: in-progress

## User Story

As a developer using the BMAD extension,
I want to browse epics and view detailed story information in the editor panel,
so that I can understand project progress without leaving VS Code.

## Acceptance Criteria

1. **Epics list renders correctly**
   - Given the editor panel is open
   - When the user navigates to the epics view
   - Then all epics are displayed with their status

2. **Story detail shows tasks**
   - Given a story has been selected
   - When the story detail view loads
   - Then all tasks and subtasks are visible with completion status

3. **Navigation breadcrumbs update**
   - Given the user is on a story detail view
   - When they look at the breadcrumb bar
   - Then the breadcrumb shows Epic > Story hierarchy

## Tasks / Subtasks

- [x] Task 1: Create EpicsView component with epic cards (AC: #1)
  - [x] 1.1: Build epic card component with status badge
  - [x] 1.2: Add click handler to navigate to epic detail
- [ ] Task 2: Implement StoryDetailView with full story rendering (AC: #2, #3)
  - [x] 2.1: Render story header with status and progress bar
  - [ ] 2.2: Render acceptance criteria section
  - [ ] 2.3: Render tasks and subtasks with checkboxes
- [ ] Task 3: Wire up breadcrumb navigation for epic and story views (AC: #3)
`;

const MINIMAL_STORY_MARKDOWN = `# Story 2.1: Shared Types and Message Protocol

Status: done

## User Story

As a developer,
I want shared type definitions between extension and webviews,
so that communication is type-safe.

## Acceptance Criteria

1. **Types are shared**
   - Types exist in a shared directory

## Tasks / Subtasks

- [x] Task 1: Define shared types
`;

const STORY_WITH_FRONTMATTER = `---
title: Some Metadata
date: 2026-01-15
---
# Story 3.2: Authentication Flow

Status: review

## User Story

As an end user,
I want to authenticate with the extension,
so that my settings are synced.

## Acceptance Criteria

1. **Login works**
   - Given valid credentials
   - When the user logs in
   - Then they see a success message

## Tasks / Subtasks

- [x] Task 1: Implement login endpoint
- [x] Task 2: Create auth token storage
`;

describe('parseStoryContent', () => {
  // --------------------------------------------------------------------------
  // 1. Full valid story
  // --------------------------------------------------------------------------
  describe('parsing a valid story markdown', () => {
    it('returns a Story object with all sections populated', () => {
      const result = parseStoryContent(
        FULL_STORY_MARKDOWN,
        'stories/5-6-epics-browser-and-story-detail-views.md'
      );

      expect(result).not.toBeNull();
      expect(result!.epicNumber).toBe(5);
      expect(result!.storyNumber).toBe(6);
      expect(result!.storySuffix).toBeUndefined();
      expect(result!.title).toBe('Epics Browser and Story Detail Views');
      expect(result!.status).toBe('in-progress');
      expect(result!.userStory).toContain('As a developer');
      expect(result!.acceptanceCriteria).toHaveLength(3);
      expect(result!.tasks).toHaveLength(3);
      expect(result!.filePath).toBe('stories/5-6-epics-browser-and-story-detail-views.md');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Returns null for invalid header
  // --------------------------------------------------------------------------
  describe('invalid or missing story header', () => {
    it('returns null when there is no Story header', () => {
      const result = parseStoryContent('# Some Random Title\n\nBody text here.', 'file.md');
      expect(result).toBeNull();
    });

    it('returns null for completely empty content', () => {
      const result = parseStoryContent('', 'file.md');
      expect(result).toBeNull();
    });

    it('returns null when the header format is wrong', () => {
      const result = parseStoryContent('# Story: Missing Numbers', 'file.md');
      expect(result).toBeNull();
    });

    it('returns null when header uses wrong separator', () => {
      const result = parseStoryContent('# Story 5-6: Wrong Separator', 'file.md');
      expect(result).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Header extraction: epicNumber, storyNumber, storySuffix, title
  // --------------------------------------------------------------------------
  describe('header extraction', () => {
    it('extracts epicNumber and storyNumber correctly', () => {
      const result = parseStoryContent(
        '# Story 12.34: Large Numbers\n\nStatus: backlog',
        'stories/12-34-large-numbers.md'
      );

      expect(result).not.toBeNull();
      expect(result!.epicNumber).toBe(12);
      expect(result!.storyNumber).toBe(34);
      expect(result!.title).toBe('Large Numbers');
    });

    it('sets storySuffix to undefined when no suffix is present', () => {
      const result = parseStoryContent(
        '# Story 1.1: Basic Setup\n\nStatus: backlog',
        'stories/1-1-basic-setup.md'
      );

      expect(result).not.toBeNull();
      expect(result!.storySuffix).toBeUndefined();
    });

    it('extracts title with special characters', () => {
      const result = parseStoryContent(
        '# Story 4.2: CI/CD Pipeline & Deployment\n\nStatus: backlog',
        'stories/4-2-ci-cd-pipeline.md'
      );

      expect(result).not.toBeNull();
      expect(result!.title).toBe('CI/CD Pipeline & Deployment');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Split stories with suffix
  // --------------------------------------------------------------------------
  describe('split stories with suffix', () => {
    it('parses a story with a single-letter suffix', () => {
      const result = parseStoryContent(
        '# Story 5.5a: Editor Panel Infrastructure\n\nStatus: done',
        'stories/5-5a-editor-panel-infrastructure.md'
      );

      expect(result).not.toBeNull();
      expect(result!.epicNumber).toBe(5);
      expect(result!.storyNumber).toBe(5);
      expect(result!.storySuffix).toBe('a');
      expect(result!.title).toBe('Editor Panel Infrastructure');
      expect(result!.key).toBe('5-5a-editor-panel-infrastructure');
    });

    it('parses suffix b for a second split', () => {
      const result = parseStoryContent(
        '# Story 5.5b: Navigation Shell and Breadcrumbs\n\nStatus: in-progress',
        'stories/5-5b-navigation-shell-breadcrumbs.md'
      );

      expect(result).not.toBeNull();
      expect(result!.storySuffix).toBe('b');
      expect(result!.key).toBe('5-5b-navigation-shell-breadcrumbs');
    });

    it('parses suffix c for a third split', () => {
      const result = parseStoryContent(
        '# Story 5.5c: Dashboard View Integration\n\nStatus: backlog',
        'stories/5-5c-dashboard-view-integration.md'
      );

      expect(result).not.toBeNull();
      expect(result!.storySuffix).toBe('c');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Status extraction
  // --------------------------------------------------------------------------
  describe('status extraction', () => {
    it('extracts in-progress status', () => {
      const result = parseStoryContent(
        '# Story 1.1: Test\n\nStatus: in-progress',
        'stories/1-1-test.md'
      );
      expect(result!.status).toBe('in-progress');
    });

    it('extracts review status', () => {
      const result = parseStoryContent(
        '# Story 1.1: Test\n\nStatus: review',
        'stories/1-1-test.md'
      );
      expect(result!.status).toBe('review');
    });

    it('extracts done status', () => {
      const result = parseStoryContent('# Story 1.1: Test\n\nStatus: done', 'stories/1-1-test.md');
      expect(result!.status).toBe('done');
    });

    it('extracts backlog status', () => {
      const result = parseStoryContent(
        '# Story 1.1: Test\n\nStatus: backlog',
        'stories/1-1-test.md'
      );
      expect(result!.status).toBe('backlog');
    });

    it('extracts ready-for-dev status', () => {
      const result = parseStoryContent(
        '# Story 1.1: Test\n\nStatus: ready-for-dev',
        'stories/1-1-test.md'
      );
      expect(result!.status).toBe('ready-for-dev');
    });

    it('defaults to backlog for unknown status values', () => {
      const result = parseStoryContent(
        '# Story 1.1: Test\n\nStatus: unknown-status',
        'stories/1-1-test.md'
      );
      expect(result!.status).toBe('backlog');
    });

    it('defaults to backlog when no Status line is present', () => {
      const result = parseStoryContent(
        '# Story 1.1: Test\n\nSome body text.',
        'stories/1-1-test.md'
      );
      expect(result!.status).toBe('backlog');
    });
  });

  // --------------------------------------------------------------------------
  // 6. User story extraction
  // --------------------------------------------------------------------------
  describe('user story extraction', () => {
    it('extracts user story text matching the As a / I want / so that pattern', () => {
      const result = parseStoryContent(
        FULL_STORY_MARKDOWN,
        'stories/5-6-epics-browser-and-story-detail-views.md'
      );

      expect(result!.userStory).toContain('As a developer using the BMAD extension');
      expect(result!.userStory).toContain('I want to browse epics');
      expect(result!.userStory).toContain('so that I can understand project progress');
    });

    it('extracts user story with "an" instead of "a"', () => {
      const markdown = `# Story 7.1: Admin Panel

Status: backlog

## User Story

As an administrator,
I want to manage user roles,
so that access control is enforced.
`;
      const result = parseStoryContent(markdown, 'stories/7-1-admin-panel.md');

      expect(result!.userStory).toContain('As an administrator');
      expect(result!.userStory).toContain('I want to manage user roles');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Returns empty string for user story when pattern not found
  // --------------------------------------------------------------------------
  describe('user story missing', () => {
    it('returns empty string when no user story pattern is found', () => {
      const markdown = `# Story 1.1: Test

Status: backlog

## User Story

This story is about doing something but no standard format.

## Acceptance Criteria

1. **Something works**
   - It works
`;
      const result = parseStoryContent(markdown, 'stories/1-1-test.md');
      expect(result!.userStory).toBe('');
    });

    it('returns empty string when user story section is absent entirely', () => {
      const result = parseStoryContent(
        '# Story 1.1: Test\n\nStatus: backlog\n\n## Tasks / Subtasks\n\n- [x] Task 1: Do stuff\n',
        'stories/1-1-test.md'
      );
      expect(result!.userStory).toBe('');
    });
  });

  // --------------------------------------------------------------------------
  // 8. Acceptance criteria extraction
  // --------------------------------------------------------------------------
  describe('acceptance criteria extraction', () => {
    it('extracts numbered acceptance criteria with bold titles', () => {
      const result = parseStoryContent(
        FULL_STORY_MARKDOWN,
        'stories/5-6-epics-browser-and-story-detail-views.md'
      );

      expect(result!.acceptanceCriteria).toHaveLength(3);

      expect(result!.acceptanceCriteria[0].number).toBe(1);
      expect(result!.acceptanceCriteria[0].title).toBe('Epics list renders correctly');
      expect(result!.acceptanceCriteria[0].content).toContain('Given the editor panel is open');

      expect(result!.acceptanceCriteria[1].number).toBe(2);
      expect(result!.acceptanceCriteria[1].title).toBe('Story detail shows tasks');
      expect(result!.acceptanceCriteria[1].content).toContain('tasks and subtasks are visible');

      expect(result!.acceptanceCriteria[2].number).toBe(3);
      expect(result!.acceptanceCriteria[2].title).toBe('Navigation breadcrumbs update');
      expect(result!.acceptanceCriteria[2].content).toContain('breadcrumb shows Epic > Story');
    });

    it('returns empty array when no acceptance criteria section exists', () => {
      const markdown = `# Story 1.1: Test

Status: backlog

## User Story

As a developer,
I want something,
so that something happens.
`;
      const result = parseStoryContent(markdown, 'stories/1-1-test.md');
      expect(result!.acceptanceCriteria).toEqual([]);
    });

    it('returns empty array when acceptance criteria section has no numbered items', () => {
      const markdown = `# Story 1.1: Test

Status: backlog

## Acceptance Criteria

Just some freeform text without numbered bold items.

## Tasks / Subtasks

- [x] Task 1: Do a thing
`;
      const result = parseStoryContent(markdown, 'stories/1-1-test.md');
      expect(result!.acceptanceCriteria).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // 9. Tasks extraction with completion status
  // --------------------------------------------------------------------------
  describe('tasks extraction', () => {
    it('extracts tasks with correct completion status', () => {
      const result = parseStoryContent(
        FULL_STORY_MARKDOWN,
        'stories/5-6-epics-browser-and-story-detail-views.md'
      );

      expect(result!.tasks).toHaveLength(3);

      expect(result!.tasks[0].number).toBe(1);
      expect(result!.tasks[0].description).toBe('Create EpicsView component with epic cards');
      expect(result!.tasks[0].completed).toBe(true);

      expect(result!.tasks[1].number).toBe(2);
      expect(result!.tasks[1].description).toBe(
        'Implement StoryDetailView with full story rendering'
      );
      expect(result!.tasks[1].completed).toBe(false);

      expect(result!.tasks[2].number).toBe(3);
      expect(result!.tasks[2].description).toBe(
        'Wire up breadcrumb navigation for epic and story views'
      );
      expect(result!.tasks[2].completed).toBe(false);
    });

    it('extracts acceptance criteria references from tasks', () => {
      const result = parseStoryContent(
        FULL_STORY_MARKDOWN,
        'stories/5-6-epics-browser-and-story-detail-views.md'
      );

      expect(result!.tasks[0].acceptanceCriteria).toEqual([1]);
      expect(result!.tasks[1].acceptanceCriteria).toEqual([2, 3]);
      expect(result!.tasks[2].acceptanceCriteria).toEqual([3]);
    });

    it('returns empty array when no tasks section exists', () => {
      const markdown = `# Story 1.1: Test

Status: backlog

## User Story

As a developer,
I want something,
so that something happens.
`;
      const result = parseStoryContent(markdown, 'stories/1-1-test.md');
      expect(result!.tasks).toEqual([]);
    });
  });

  // --------------------------------------------------------------------------
  // 10. Subtasks extraction
  // --------------------------------------------------------------------------
  describe('subtasks extraction', () => {
    it('extracts subtasks nested under their parent tasks', () => {
      const result = parseStoryContent(
        FULL_STORY_MARKDOWN,
        'stories/5-6-epics-browser-and-story-detail-views.md'
      );

      // Task 1 subtasks
      expect(result!.tasks[0].subtasks).toHaveLength(2);
      expect(result!.tasks[0].subtasks[0]).toEqual({
        id: '1.1',
        description: 'Build epic card component with status badge',
        completed: true,
      });
      expect(result!.tasks[0].subtasks[1]).toEqual({
        id: '1.2',
        description: 'Add click handler to navigate to epic detail',
        completed: true,
      });

      // Task 2 subtasks
      expect(result!.tasks[1].subtasks).toHaveLength(3);
      expect(result!.tasks[1].subtasks[0]).toEqual({
        id: '2.1',
        description: 'Render story header with status and progress bar',
        completed: true,
      });
      expect(result!.tasks[1].subtasks[1]).toEqual({
        id: '2.2',
        description: 'Render acceptance criteria section',
        completed: false,
      });
      expect(result!.tasks[1].subtasks[2]).toEqual({
        id: '2.3',
        description: 'Render tasks and subtasks with checkboxes',
        completed: false,
      });

      // Task 3 has no subtasks
      expect(result!.tasks[2].subtasks).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // 11. Task and subtask counting
  // --------------------------------------------------------------------------
  describe('task and subtask counting', () => {
    it('correctly counts totalTasks and completedTasks', () => {
      const result = parseStoryContent(
        FULL_STORY_MARKDOWN,
        'stories/5-6-epics-browser-and-story-detail-views.md'
      );

      expect(result!.totalTasks).toBe(3);
      expect(result!.completedTasks).toBe(1); // Only Task 1 is [x]
    });

    it('correctly counts totalSubtasks and completedSubtasks', () => {
      const result = parseStoryContent(
        FULL_STORY_MARKDOWN,
        'stories/5-6-epics-browser-and-story-detail-views.md'
      );

      // Task 1: 2 subtasks, both complete
      // Task 2: 3 subtasks, 1 complete
      // Task 3: 0 subtasks
      expect(result!.totalSubtasks).toBe(5);
      expect(result!.completedSubtasks).toBe(3); // 1.1, 1.2, 2.1
    });

    it('reports zero counts when there are no tasks', () => {
      const markdown = `# Story 1.1: Empty Story

Status: backlog
`;
      const result = parseStoryContent(markdown, 'stories/1-1-empty-story.md');

      expect(result!.totalTasks).toBe(0);
      expect(result!.completedTasks).toBe(0);
      expect(result!.totalSubtasks).toBe(0);
      expect(result!.completedSubtasks).toBe(0);
    });

    it('counts all tasks as completed when all are checked', () => {
      const result = parseStoryContent(
        STORY_WITH_FRONTMATTER,
        'stories/3-2-authentication-flow.md'
      );

      expect(result!.totalTasks).toBe(2);
      expect(result!.completedTasks).toBe(2);
      expect(result!.totalSubtasks).toBe(0);
      expect(result!.completedSubtasks).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 12. Frontmatter stripping
  // --------------------------------------------------------------------------
  describe('frontmatter stripping', () => {
    it('strips YAML frontmatter before parsing', () => {
      const result = parseStoryContent(
        STORY_WITH_FRONTMATTER,
        'stories/3-2-authentication-flow.md'
      );

      expect(result).not.toBeNull();
      expect(result!.epicNumber).toBe(3);
      expect(result!.storyNumber).toBe(2);
      expect(result!.title).toBe('Authentication Flow');
      expect(result!.status).toBe('review');
    });

    it('handles content that starts with --- but has no closing ---', () => {
      const markdown = `---
# Story 1.1: Test

Status: backlog
`;
      // The opening --- has no closing ---, so nothing is stripped and
      // the header still needs to be parsed from the full content.
      // Since the content starts with "---\n# Story 1.1: Test" and
      // there is no second "---", the code skips stripping.
      // The regex should still find "# Story 1.1: Test" via multiline.
      const result = parseStoryContent(markdown, 'stories/1-1-test.md');
      // The header is on line 2 of the content, and STORY_HEADER_REGEX uses /m flag
      expect(result).not.toBeNull();
      expect(result!.epicNumber).toBe(1);
      expect(result!.storyNumber).toBe(1);
    });

    it('does not strip anything when content does not start with ---', () => {
      const result = parseStoryContent(
        MINIMAL_STORY_MARKDOWN,
        'stories/2-1-shared-types-and-message-protocol.md'
      );

      expect(result).not.toBeNull();
      expect(result!.title).toBe('Shared Types and Message Protocol');
    });
  });

  // --------------------------------------------------------------------------
  // 13. Key extraction from filePath
  // --------------------------------------------------------------------------
  describe('key extraction from filePath', () => {
    it('extracts key from a standard story filename', () => {
      const result = parseStoryContent(
        MINIMAL_STORY_MARKDOWN,
        'stories/2-1-shared-types-and-message-protocol.md'
      );

      expect(result!.key).toBe('2-1-shared-types-and-message-protocol');
    });

    it('extracts key from a nested file path', () => {
      const result = parseStoryContent(
        MINIMAL_STORY_MARKDOWN,
        '_bmad-output/stories/2-1-shared-types-and-message-protocol.md'
      );

      expect(result!.key).toBe('2-1-shared-types-and-message-protocol');
    });

    it('extracts key from a split story filename with suffix', () => {
      const result = parseStoryContent(
        '# Story 5.5a: Editor Panel Infrastructure\n\nStatus: done',
        'stories/5-5a-editor-panel-infrastructure.md'
      );

      expect(result!.key).toBe('5-5a-editor-panel-infrastructure');
    });

    it('extracts key with hyphenated multi-word names', () => {
      const result = parseStoryContent(
        '# Story 4.3: Build System And CI Pipeline\n\nStatus: backlog',
        'stories/4-3-build-system-and-ci-pipeline.md'
      );

      expect(result!.key).toBe('4-3-build-system-and-ci-pipeline');
    });
  });

  // --------------------------------------------------------------------------
  // 14. Fallback key generation
  // --------------------------------------------------------------------------
  describe('fallback key generation', () => {
    it('generates a fallback key when filePath does not match expected pattern', () => {
      const result = parseStoryContent(
        '# Story 3.7: Awesome Feature\n\nStatus: backlog',
        'notes/random-file.txt'
      );

      expect(result).not.toBeNull();
      // Fallback: `${epicNumber}-${storyNumber}${storySuffix ?? ''}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      expect(result!.key).toBe('3-7-awesome-feature');
    });

    it('generates a fallback key with suffix for split stories', () => {
      const result = parseStoryContent(
        '# Story 5.5b: Navigation Shell\n\nStatus: backlog',
        'documents/untitled.md'
      );

      expect(result!.key).toBe('5-5b-navigation-shell');
    });

    it('normalizes special characters in fallback key', () => {
      const result = parseStoryContent(
        '# Story 2.3: CI/CD & Build Pipeline\n\nStatus: backlog',
        'other/my-notes.md'
      );

      // Special chars become hyphens: "CI/CD & Build Pipeline" -> "ci-cd-build-pipeline"
      expect(result!.key).toBe('2-3-ci-cd-build-pipeline');
    });

    it('generates fallback key when filePath is a bare filename without numbers', () => {
      const result = parseStoryContent('# Story 1.2: Quick Test\n\nStatus: done', 'story.md');

      expect(result!.key).toBe('1-2-quick-test');
    });
  });

  // --------------------------------------------------------------------------
  // Edge cases
  // --------------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles a minimal story with only a header', () => {
      const result = parseStoryContent(
        '# Story 1.1: Just a Header',
        'stories/1-1-just-a-header.md'
      );

      expect(result).not.toBeNull();
      expect(result!.epicNumber).toBe(1);
      expect(result!.storyNumber).toBe(1);
      expect(result!.title).toBe('Just a Header');
      expect(result!.status).toBe('backlog');
      expect(result!.userStory).toBe('');
      expect(result!.acceptanceCriteria).toEqual([]);
      expect(result!.tasks).toEqual([]);
      expect(result!.totalTasks).toBe(0);
      expect(result!.completedTasks).toBe(0);
      expect(result!.totalSubtasks).toBe(0);
      expect(result!.completedSubtasks).toBe(0);
    });

    it('preserves filePath as-is in the returned Story object', () => {
      const filePath = '_bmad-output/stories/5-6-epics-browser-and-story-detail-views.md';
      const result = parseStoryContent(FULL_STORY_MARKDOWN, filePath);

      expect(result!.filePath).toBe(filePath);
    });

    it('handles uppercase X in task checkbox', () => {
      const markdown = `# Story 1.1: Uppercase Checkbox

Status: backlog

## Tasks / Subtasks

- [X] Task 1: Something done
- [ ] Task 2: Something pending
`;
      const result = parseStoryContent(markdown, 'stories/1-1-uppercase-checkbox.md');

      expect(result!.tasks).toHaveLength(2);
      expect(result!.tasks[0].completed).toBe(true);
      expect(result!.tasks[1].completed).toBe(false);
      expect(result!.completedTasks).toBe(1);
    });

    it('handles tasks without AC references', () => {
      const result = parseStoryContent(
        MINIMAL_STORY_MARKDOWN,
        'stories/2-1-shared-types-and-message-protocol.md'
      );

      expect(result!.tasks).toHaveLength(1);
      expect(result!.tasks[0].acceptanceCriteria).toBeUndefined();
    });
  });
});
