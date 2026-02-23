import type { Story } from '@shared/types/story';

/** IDs of workflows that are story-specific and should include a story reference. */
const STORY_AWARE_WORKFLOW_IDS = new Set(['dev-story', 'code-review', 'create-story']);

/** Append ` story X.Y` suffix to a command when the workflow is story-aware and a story is available. */
export function buildCommandWithStory(
  command: string,
  story: Story | null | undefined,
  workflowId: string
): string {
  if (!story || !STORY_AWARE_WORKFLOW_IDS.has(workflowId)) {
    return command;
  }
  const ref = `${story.epicNumber}.${story.storyNumber}${story.storySuffix || ''}`;
  return `${command} story ${ref}`;
}
