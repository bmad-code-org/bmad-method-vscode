import { describe, it, expect } from 'vitest';
import {
  type DevelopmentStatusValue,
  isEpicStatus,
  isStoryStatus,
  isRetrospectiveStatus,
  isEpicKey,
  isStoryKey,
  isRetrospectiveKey,
} from './sprint-status';

describe('Sprint Status Type Guards', () => {
  describe('isEpicStatus', () => {
    it('returns true for valid epic status values', () => {
      expect(isEpicStatus('backlog')).toBe(true);
      expect(isEpicStatus('in-progress')).toBe(true);
      expect(isEpicStatus('done')).toBe(true);
    });

    it('returns false for story-only status values', () => {
      expect(isEpicStatus('ready-for-dev' as DevelopmentStatusValue)).toBe(false);
      expect(isEpicStatus('review' as DevelopmentStatusValue)).toBe(false);
    });

    it('returns false for retrospective-only status values', () => {
      expect(isEpicStatus('optional' as DevelopmentStatusValue)).toBe(false);
    });
  });

  describe('isStoryStatus', () => {
    it('returns true for all valid story status values', () => {
      expect(isStoryStatus('backlog')).toBe(true);
      expect(isStoryStatus('ready-for-dev')).toBe(true);
      expect(isStoryStatus('in-progress')).toBe(true);
      expect(isStoryStatus('review')).toBe(true);
      expect(isStoryStatus('done')).toBe(true);
    });

    it('returns false for retrospective-only status values', () => {
      expect(isStoryStatus('optional' as DevelopmentStatusValue)).toBe(false);
    });
  });

  describe('isRetrospectiveStatus', () => {
    it('returns true for valid retrospective status values', () => {
      expect(isRetrospectiveStatus('optional')).toBe(true);
      expect(isRetrospectiveStatus('done')).toBe(true);
    });

    it('returns false for non-retrospective status values', () => {
      expect(isRetrospectiveStatus('backlog' as DevelopmentStatusValue)).toBe(false);
      expect(isRetrospectiveStatus('in-progress' as DevelopmentStatusValue)).toBe(false);
      expect(isRetrospectiveStatus('ready-for-dev' as DevelopmentStatusValue)).toBe(false);
      expect(isRetrospectiveStatus('review' as DevelopmentStatusValue)).toBe(false);
    });
  });
});

describe('Sprint Status Key Pattern Functions', () => {
  describe('isEpicKey', () => {
    it('returns true for valid epic keys', () => {
      expect(isEpicKey('epic-1')).toBe(true);
      expect(isEpicKey('epic-12')).toBe(true);
      expect(isEpicKey('epic-999')).toBe(true);
    });

    it('returns false for story keys', () => {
      expect(isEpicKey('1-1-project-init')).toBe(false);
      expect(isEpicKey('2-3-auth-flow')).toBe(false);
    });

    it('returns false for retrospective keys', () => {
      expect(isEpicKey('epic-1-retrospective')).toBe(false);
    });

    it('returns false for malformed epic keys', () => {
      expect(isEpicKey('epic-')).toBe(false);
      expect(isEpicKey('epic')).toBe(false);
      expect(isEpicKey('epic-abc')).toBe(false);
      expect(isEpicKey('Epic-1')).toBe(false);
      expect(isEpicKey('epic-1-extra')).toBe(false);
    });
  });

  describe('isStoryKey', () => {
    it('returns true for valid story keys', () => {
      expect(isStoryKey('1-1-project-init')).toBe(true);
      expect(isStoryKey('2-3-auth-flow')).toBe(true);
      expect(isStoryKey('12-34-long-story-name-here')).toBe(true);
      expect(isStoryKey('1-1-a')).toBe(true);
    });

    it('returns false for epic keys', () => {
      expect(isStoryKey('epic-1')).toBe(false);
      expect(isStoryKey('epic-12')).toBe(false);
    });

    it('returns false for retrospective keys', () => {
      expect(isStoryKey('epic-1-retrospective')).toBe(false);
    });

    it('returns false for malformed story keys', () => {
      expect(isStoryKey('1-1-')).toBe(false);
      expect(isStoryKey('1-1')).toBe(false);
      expect(isStoryKey('1--name')).toBe(false);
      expect(isStoryKey('-1-name')).toBe(false);
      expect(isStoryKey('a-1-name')).toBe(false);
      expect(isStoryKey('1-a-name')).toBe(false);
    });

    it('handles story keys with various valid characters', () => {
      expect(isStoryKey('1-1-name_with_underscores')).toBe(true);
      expect(isStoryKey('1-1-name-with-dashes')).toBe(true);
      expect(isStoryKey('1-1-name123')).toBe(true);
    });
  });

  describe('isRetrospectiveKey', () => {
    it('returns true for valid retrospective keys', () => {
      expect(isRetrospectiveKey('epic-1-retrospective')).toBe(true);
      expect(isRetrospectiveKey('epic-12-retrospective')).toBe(true);
      expect(isRetrospectiveKey('epic-999-retrospective')).toBe(true);
    });

    it('returns false for epic keys', () => {
      expect(isRetrospectiveKey('epic-1')).toBe(false);
      expect(isRetrospectiveKey('epic-12')).toBe(false);
    });

    it('returns false for story keys', () => {
      expect(isRetrospectiveKey('1-1-project-init')).toBe(false);
    });

    it('returns false for malformed retrospective keys', () => {
      expect(isRetrospectiveKey('epic--retrospective')).toBe(false);
      expect(isRetrospectiveKey('epic-retrospective')).toBe(false);
      expect(isRetrospectiveKey('epic-1-retro')).toBe(false);
      expect(isRetrospectiveKey('Epic-1-retrospective')).toBe(false);
    });
  });
});
