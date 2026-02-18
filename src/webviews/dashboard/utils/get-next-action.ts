import type { SprintStatus } from '@shared/types/sprint-status';
import {
  isEpicKey,
  isStoryKey,
  isStoryStatus,
  isRetrospectiveKey,
} from '@shared/types/sprint-status';
import type { Story } from '@shared/types/story';
import type { PlanningArtifacts } from '@shared/types/dashboard-state';

export interface NextAction {
  type:
    | 'create-prd'
    | 'create-architecture'
    | 'create-epics'
    | 'check-implementation-readiness'
    | 'sprint-planning'
    | 'create-story'
    | 'dev-story'
    | 'code-review'
    | 'retrospective'
    | 'sprint-complete';
  /** Short action label, e.g., "Continue Story 3.4" */
  label: string;
  /** Brief context, e.g., "Story is in progress - keep working on implementation" */
  description: string;
  /** Optional story reference when relevant */
  storyKey?: string;
}

function formatStoryLabel(story: Story): string {
  return `${story.epicNumber}.${story.storyNumber}`;
}

export function getNextAction(
  sprint: SprintStatus | null,
  currentStory: Story | null,
  planningArtifacts?: PlanningArtifacts
): NextAction {
  // 1. No sprint data → check planning artifacts to determine BMAD lifecycle phase
  if (!sprint) {
    if (planningArtifacts) {
      if (!planningArtifacts.hasPrd) {
        return {
          type: 'create-prd',
          label: 'Create PRD',
          description: 'No PRD found — create your Product Requirements Document to get started',
        };
      }
      if (!planningArtifacts.hasArchitecture) {
        return {
          type: 'create-architecture',
          label: 'Create Architecture',
          description: 'PRD exists — define your technical architecture next',
        };
      }
      if (!planningArtifacts.hasEpics) {
        return {
          type: 'create-epics',
          label: 'Create Epics & Stories',
          description: 'Architecture is ready — break down your project into epics and stories',
        };
      }
      if (!planningArtifacts.hasReadinessReport) {
        return {
          type: 'check-implementation-readiness',
          label: 'Check Implementation Readiness',
          description:
            'Epics are ready — validate alignment before starting implementation',
        };
      }
    }

    return {
      type: 'sprint-planning',
      label: 'Run Sprint Planning',
      description: 'Planning artifacts are ready — set up your sprint to start implementation',
    };
  }

  // 2. Active story in-progress → continue working
  if (currentStory?.status === 'in-progress') {
    return {
      type: 'dev-story',
      label: `Continue Story ${formatStoryLabel(currentStory)}`,
      description: 'Story is in progress — keep working on implementation',
      storyKey: currentStory.key,
    };
  }

  // 3. Story in review → run code review
  if (currentStory?.status === 'review') {
    return {
      type: 'code-review',
      label: 'Run Code Review',
      description: `Story ${formatStoryLabel(currentStory)} is ready for code review`,
      storyKey: currentStory.key,
    };
  }

  // 4. Story ready-for-dev → start dev
  if (currentStory?.status === 'ready-for-dev') {
    return {
      type: 'dev-story',
      label: `Start Dev Story ${formatStoryLabel(currentStory)}`,
      description: 'Story is ready for development — start implementing',
      storyKey: currentStory.key,
    };
  }

  // 5. No active story - analyze development_status per epic
  const entries = Object.entries(sprint.development_status);
  let hasBacklogStory = false;
  let allStoriesDone = true;
  let hasStories = false;

  // Track per-epic story completion and retrospective status
  const epicStories = new Map<number, { total: number; done: number }>();
  const retroDone = new Set<number>();

  // Collect epic keys and retrospective statuses
  for (const [key, status] of entries) {
    if (isEpicKey(key)) {
      const epicNum = parseInt(key.replace('epic-', ''), 10);
      epicStories.set(epicNum, { total: 0, done: 0 });
    } else if (isRetrospectiveKey(key) && status === 'done') {
      const epicNum = parseInt(key.replace('epic-', '').replace('-retrospective', ''), 10);
      retroDone.add(epicNum);
    }
  }

  for (const [key, status] of entries) {
    if (!isStoryKey(key)) continue;
    if (!isStoryStatus(status)) continue;
    hasStories = true;

    const epicNum = parseInt(key.split('-')[0], 10);
    const counts = epicStories.get(epicNum);
    if (counts) {
      counts.total++;
      if (status === 'done') {
        counts.done++;
      }
    }

    if (status === 'backlog') {
      hasBacklogStory = true;
      allStoriesDone = false;
    } else if (status !== 'done') {
      allStoriesDone = false;
    }
  }

  if (!hasStories) {
    return {
      type: 'create-story',
      label: 'Create Next Story',
      description: 'No stories found in sprint — create your first story from the epics',
    };
  }

  // All stories across all epics are done → sprint complete
  if (allStoriesDone) {
    return {
      type: 'sprint-complete',
      label: 'Sprint Complete',
      description: 'All stories are done — run a retrospective or plan the next sprint',
    };
  }

  // Check if any single epic has all its stories done (per-epic retrospective)
  // Skip epics whose retrospective is already done
  for (const [epicNum, counts] of epicStories) {
    if (counts.total > 0 && counts.done === counts.total && !retroDone.has(epicNum)) {
      return {
        type: 'retrospective',
        label: `Run Retrospective for Epic ${epicNum}`,
        description: `All stories in Epic ${epicNum} are complete — review what went well and what to improve`,
      };
    }
  }

  if (hasBacklogStory) {
    return {
      type: 'create-story',
      label: 'Create Next Story',
      description: 'No active story — create the next story from your backlog',
    };
  }

  // Fallback: some stories exist in non-backlog, non-done states but no currentStory
  return {
    type: 'create-story',
    label: 'Create Next Story',
    description: 'Check sprint status and create the next story to work on',
  };
}
