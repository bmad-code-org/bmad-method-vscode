# Story 3.4: Active Story Card with Task Progress

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to view the current active story with task progress,
So that I know exactly where I left off and what remains.

## Acceptance Criteria

1. **Story Card Display**
   - **Given** the dashboard receives current story data
   - **When** the ActiveStoryCard component renders
   - **Then** it displays the story title and epic context (FR3, FR4)
   - **And** it shows task completion progress (e.g., "4/7 tasks done")
   - **And** it displays the story status (ready-for-dev, in-progress, review, done)

2. **Empty State**
   - **Given** no current story is active
   - **When** the component renders
   - **Then** it displays a message indicating no active story

3. **Story Document Navigation**
   - **Given** a story is displayed in the card
   - **When** the user clicks on the story title
   - **Then** the story document opens in the document viewer (sends OPEN_DOCUMENT message)

## Tasks / Subtasks

- [x] Task 1: Create ActiveStoryCard component (AC: #1, #2)
  - [x] 1.1: Create `src/webviews/dashboard/components/active-story-card.tsx`
  - [x] 1.2: Use `useCurrentStory()` selector from store to get the current active story
  - [x] 1.3: Display story title with epic context (e.g., "Epic 3 > Story 3.4: Active Story Card...")
  - [x] 1.4: Display task completion progress bar with text (e.g., "4/7 tasks done") using `calculateStoryProgress()` from `@shared/types/story`
  - [x] 1.5: Show subtask completion detail below tasks (e.g., "12/18 subtasks")
  - [x] 1.6: Display current story status as a styled badge (ready-for-dev, in-progress, review, done)
  - [x] 1.7: Handle empty state when `currentStory` is null - show "No active story" message
  - [x] 1.8: Use VS Code theme CSS variables for all colors

- [x] Task 2: Create ActiveStoryCardSkeleton component (AC: loading state)
  - [x] 2.1: Create skeleton loading UI within active-story-card.tsx (not a separate file)
  - [x] 2.2: Use `animate-pulse` with `bg-[var(--vscode-editor-inactiveSelectionBackground)]` to match existing skeleton pattern
  - [x] 2.3: Skeleton shape should approximate a story card with title, progress bar, and status

- [x] Task 3: Add story title click handler for document navigation (AC: #3)
  - [x] 3.1: Use `useVSCodeApi()` hook to send `OPEN_DOCUMENT` messages when story title is clicked
  - [x] 3.2: Use `createOpenDocumentMessage(path)` factory from `@shared/messages`
  - [x] 3.3: The path is `story.filePath` from the Story object (already relative to project root)
  - [x] 3.4: Style story title as clickable link using `text-[var(--vscode-textLink-foreground)]` with hover:underline

- [x] Task 4: Wire ActiveStoryCard into Dashboard (AC: #1, #2)
  - [x] 4.1: Update `src/webviews/dashboard/components/index.ts` to export ActiveStoryCard and ActiveStoryCardSkeleton
  - [x] 4.2: Update `src/webviews/dashboard/index.tsx` to render ActiveStoryCard component after EpicList
  - [x] 4.3: Add ActiveStoryCardSkeleton to the loading branch of Dashboard

- [x] Task 5: Write Unit Tests (AC: #1, #2, #3)
  - [x] 5.1: Create `src/webviews/dashboard/components/active-story-card.test.tsx`
  - [x] 5.2: Test renders story title with epic context
  - [x] 5.3: Test renders task completion progress (count and progress bar)
  - [x] 5.4: Test renders subtask completion count
  - [x] 5.5: Test renders story status badge with correct text
  - [x] 5.6: Test handles all story status values (ready-for-dev, in-progress, review, done)
  - [x] 5.7: Test renders empty state when currentStory is null
  - [x] 5.8: Test clicking story title sends OPEN_DOCUMENT message with correct filePath
  - [x] 5.9: Test renders skeleton UI via ActiveStoryCardSkeleton
  - [x] 5.10: Test renders correctly when story has zero tasks (0% progress)
  - [x] 5.11: Test renders correctly when all tasks and subtasks are complete (100% progress)

- [x] Task 6: Build and Lint Validation (AC: #1, #2, #3)
  - [x] 6.1: Run `pnpm typecheck` and verify no type errors
  - [x] 6.2: Run `pnpm lint` and verify no linting errors
  - [x] 6.3: Run `pnpm test` and verify all tests pass (existing + new)
  - [x] 6.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `active-story-card.tsx`, `active-story-card.test.tsx`
   - WRONG: `ActiveStoryCard.tsx`, `storyCard.tsx`

2. **Component Naming**: PascalCase for components, camelCase for functions/hooks

   ```typescript
   export function ActiveStoryCard(): React.ReactElement { ... }
   export function ActiveStoryCardSkeleton(): React.ReactElement { ... }
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

4. **Imports**: Use path aliases as established in the project
   - `@shared/messages` for message protocol types/factories
   - `@shared/types` for type interfaces
   - `@shared/types/story` for `calculateStoryProgress()` and `Story` type
   - `@shared/types/sprint-status` for `StoryStatusValue` type
   - Relative imports for local files (e.g., `../store`)

5. **Styling**: VS Code theme CSS variables via Tailwind arbitrary values
   - `text-[var(--vscode-foreground)]` for primary text
   - `text-[var(--vscode-descriptionForeground)]` for secondary text
   - `bg-[var(--vscode-editor-inactiveSelectionBackground)]` for skeleton loading and progress bar backgrounds
   - `text-[var(--vscode-textLink-foreground)]` for clickable story title
   - `text-[var(--vscode-testing-iconPassed)]` for success/done status and progress bar fill
   - `border-[var(--vscode-focusBorder)]` for active card highlight
   - `bg-[var(--vscode-list-activeSelectionBackground)]` for card background accent

6. **Zustand Store Usage**: Use existing selector hooks from `store.ts`

   ```typescript
   import { useCurrentStory } from '../store';
   // DO NOT create new store - use existing selectors
   // useCurrentStory() returns Story | null
   ```

7. **Message Protocol**: Use existing factories from `@shared/messages`

   ```typescript
   import { createOpenDocumentMessage } from '@shared/messages';
   import { useVSCodeApi } from '../../shared/hooks';
   // Send message: vscodeApi.postMessage(createOpenDocumentMessage(story.filePath));
   ```

8. **Testing**: Use Vitest + @testing-library/react
   - Co-locate tests: `active-story-card.test.tsx` next to `active-story-card.tsx`
   - Use `render` from `@testing-library/react`
   - Use `screen` queries for assertions
   - Mock Zustand store by setting state directly via `useDashboardStore.setState()`
   - Mock `useVSCodeApi` for message-sending tests

### Technical Specifications

**CRITICAL: Story Data Source**

The `currentStory` is determined by the StateManager on the extension host side. It finds the first story with `in-progress` or `ready-for-dev` status from parsed story files. The full `Story` object is already available in the Zustand store via `useCurrentStory()`.

**Story Type (from `src/shared/types/story.ts`):**

```typescript
interface Story {
  key: string; // "3-4-active-story-card-with-task-progress"
  epicNumber: number; // 3
  storyNumber: number; // 4
  title: string; // "Active Story Card with Task Progress"
  userStory: string; // "As a... I want... So that..."
  acceptanceCriteria: AcceptanceCriterion[];
  tasks: StoryTask[];
  filePath: string; // Relative path to story .md file
  status: StoryStatusValue; // 'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done'
  totalTasks: number;
  completedTasks: number;
  totalSubtasks: number;
  completedSubtasks: number;
}
```

**Progress Calculation Helper (already exists):**

```typescript
import { calculateStoryProgress } from '@shared/types/story';
// Returns 0-100 percentage based on (completedTasks + completedSubtasks) / (totalTasks + totalSubtasks)
```

**Status Display Mapping:**

```typescript
function getStatusLabel(status: StoryStatusValue): string {
  switch (status) {
    case 'ready-for-dev':
      return 'Ready for Dev';
    case 'in-progress':
      return 'In Progress';
    case 'review':
      return 'Review';
    case 'done':
      return 'Done';
    default:
      return 'Backlog';
  }
}
```

**OPEN_DOCUMENT Message Pattern (exact pattern from EpicList):**

```typescript
const vscodeApi = useVSCodeApi();
// story.filePath is already a relative path like "_bmad-output/implementation-artifacts/3-4-active-story-card-with-task-progress.md"
vscodeApi.postMessage(createOpenDocumentMessage(story.filePath));
```

**Component Structure Pattern (follow SprintStatus and EpicList patterns):**

```typescript
export function ActiveStoryCard(): React.ReactElement {
  const currentStory = useCurrentStory();
  const vscodeApi = useVSCodeApi();

  if (!currentStory) {
    return (
      <div data-testid="active-story-card-empty" className="...">
        No active story
      </div>
    );
  }

  const progressPercent = calculateStoryProgress(currentStory);

  return (
    <div data-testid="active-story-card" className="...">
      {/* Epic context + clickable story title */}
      {/* Task progress bar with count */}
      {/* Subtask count */}
      {/* Status badge */}
    </div>
  );
}
```

**cn() Utility for Conditional Classes:**

```typescript
import { cn } from '../../shared/utils/cn';
// Example: status-dependent styling
<span className={cn(
  'text-xs',
  status === 'done' && 'text-[var(--vscode-testing-iconPassed)]',
  status === 'in-progress' && 'text-[var(--vscode-foreground)]'
)} />
```

**Dashboard Integration (from `index.tsx`):**

The Dashboard renders components in vertical stack order: SprintStatus > EpicList > **ActiveStoryCard** > PlanningArtifactLinks. The loading branch renders skeletons in the same order. Follow the exact same import and wiring pattern as EpicList.

**Testing Mock Data Pattern (from `epic-list.test.tsx`):**

```typescript
import type { Story } from '@shared/types/story';

const mockStory: Story = {
  key: '3-4-active-story-card-with-task-progress',
  epicNumber: 3,
  storyNumber: 4,
  title: 'Active Story Card with Task Progress',
  userStory: 'As a developer, I want to view...',
  acceptanceCriteria: [],
  tasks: [],
  filePath: '_bmad-output/implementation-artifacts/3-4-active-story-card-with-task-progress.md',
  status: 'in-progress',
  totalTasks: 7,
  completedTasks: 4,
  totalSubtasks: 18,
  completedSubtasks: 12,
};

beforeEach(() => {
  mockPostMessage.mockClear();
  useDashboardStore.setState({
    sprint: mockSprintStatus,
    epics: [],
    currentStory: mockStory,
    errors: [],
    loading: false,
    outputRoot: '_bmad-output',
  });
});
```

### Project Structure Notes

**Files to Create:**

- `src/webviews/dashboard/components/active-story-card.tsx` - ActiveStoryCard and ActiveStoryCardSkeleton components
- `src/webviews/dashboard/components/active-story-card.test.tsx` - Unit tests for ActiveStoryCard and ActiveStoryCardSkeleton

**Files to Modify:**

- `src/webviews/dashboard/components/index.ts` - Add ActiveStoryCard and ActiveStoryCardSkeleton exports
- `src/webviews/dashboard/index.tsx` - Wire ActiveStoryCard + ActiveStoryCardSkeleton into Dashboard layout

**Files to NOT Modify (read-only references):**

- `src/webviews/dashboard/store.ts` - Use existing `useCurrentStory()` selector
- `src/shared/types/story.ts` - Use existing `Story` interface and `calculateStoryProgress()` helper
- `src/shared/types/sprint-status.ts` - Use existing `StoryStatusValue` type
- `src/shared/messages.ts` - Use existing `createOpenDocumentMessage()` factory
- `src/webviews/shared/hooks/use-vscode-api.ts` - Use existing `useVSCodeApi()` hook
- `src/webviews/shared/utils/cn.ts` - Use existing `cn()` utility for conditional classes

**Dependencies (all already installed - NO new packages):**

- `react` 19.2.0
- `zustand` ^5.0.0
- `tailwindcss` 4.1.0
- `clsx` (for cn utility)
- `tailwind-merge` (for cn utility)
- `@testing-library/react` 16.3.2

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.4] - Story acceptance criteria and BDD scenarios
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns] - Dashboard component directory structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns] - File and component naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management] - Zustand for webviews, extension host single source of truth
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns] - Skeleton UI (not spinner), error recovery
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - OPEN_DOCUMENT message type
- [Source: src/shared/types/story.ts] - Story interface, StoryTask, calculateStoryProgress()
- [Source: src/shared/types/sprint-status.ts] - StoryStatusValue type
- [Source: src/shared/types/dashboard-state.ts] - DashboardState interface with currentStory: Story | null
- [Source: src/shared/messages.ts] - createOpenDocumentMessage factory, ToExtension/ToWebview types
- [Source: src/webviews/dashboard/store.ts] - useCurrentStory() selector hook
- [Source: src/webviews/shared/hooks/use-vscode-api.ts] - useVSCodeApi() hook for postMessage
- [Source: src/webviews/shared/utils/cn.ts] - cn() class name utility
- [Source: src/webviews/dashboard/components/sprint-status.tsx] - Existing component pattern reference (styling, structure, skeleton)
- [Source: src/webviews/dashboard/components/epic-list.tsx] - Existing component with OPEN_DOCUMENT click handler pattern
- [Source: src/webviews/dashboard/components/epic-list.test.tsx] - Existing test patterns (mock setup, store state, assertions)
- [Source: src/extension/services/state-manager.ts] - How currentStory is determined from parsed stories

### Previous Story Intelligence

**From Story 3.3 (Epic List with Completion Status):**

- EpicList derives data from sprint `development_status` using `isEpicKey()` and `isStoryKey()` type guards
- Two-pass algorithm for data derivation (first collect epics, then count stories)
- Empty state handled for both null sprint and empty development_status entries
- Skeleton uses 3 placeholder rows with animate-pulse
- Epic titles are clickable links sending OPEN_DOCUMENT message
- 14 new tests added (242 total tests, up from 228)
- No issues encountered during implementation
- All validation gates passed: typecheck, lint, test, build

**From Story 3.2 (Sprint Status Display Component):**

- Dashboard owns loading orchestration - components should NOT internally check loading
- Remove dead exports from barrel file (keep `index.ts` clean)
- Components handle empty/null props gracefully
- Test ALL status values to cover all conditional render paths
- Skeleton: separate named export, not a separate file

**From Story 3.1 (Dashboard Zustand Store and Message Handler):**

- `useVSCodeApi` needs `useMemo` wrapper internally (already handled)
- Avoid dead code in components
- Validate message types at runtime
- Store state can be set directly in tests via `useDashboardStore.setState()`

**Git Intelligence:**

- Recent commits follow `feat: X-Y-story-title` format
- Package manager: `pnpm` (NOT npm)
- All previous stories pass: typecheck, lint, test, build
- 242 tests across all stories using Vitest
- Last 3 commits are Epic 3 stories 3.1, 3.2, 3.3 - clean sequential implementation

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prettier formatting issues on initial implementation (multi-line arrow functions in onClick and test assertions). Fixed by inlining expressions.

### Completion Notes List

- Created ActiveStoryCard component displaying story title with epic context, task progress bar with count, subtask count, and styled status badge
- Created ActiveStoryCardSkeleton with animate-pulse pattern matching existing skeletons (SprintStatusSkeleton, EpicListSkeleton)
- Story title is a clickable button sending OPEN_DOCUMENT message via useVSCodeApi/createOpenDocumentMessage pattern (matching EpicList)
- Empty state renders "No active story" message when currentStory is null
- In-progress stories get left border highlight (same pattern as EpicList active epics)
- Status badge uses getStatusLabel() for human-readable display of all StoryStatusValue variants
- Progress calculated via existing calculateStoryProgress() helper from @shared/types/story
- Wired into Dashboard layout: SprintStatus > EpicList > **ActiveStoryCard** > PlanningArtifactLinks
- ActiveStoryCardSkeleton added to Dashboard loading branch
- 16 new tests (260 total, up from 242): covers rendering, all status values, empty state, click handler, 0% progress, 100% progress, skeleton
- All validation gates passed: typecheck, lint, test (260 passing), build

### File List

- `src/webviews/dashboard/components/active-story-card.tsx` (new) - ActiveStoryCard and ActiveStoryCardSkeleton components
- `src/webviews/dashboard/components/active-story-card.test.tsx` (new) - 17 unit tests
- `src/webviews/dashboard/components/index.ts` (modified) - Added ActiveStoryCard and ActiveStoryCardSkeleton exports
- `src/webviews/dashboard/index.tsx` (modified) - Wired ActiveStoryCard and ActiveStoryCardSkeleton into Dashboard layout
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (modified) - Story status updated from backlog to review

### Change Log

- 2026-02-11: Implemented Story 3.4 - ActiveStoryCard component with task progress display, skeleton loading state, document navigation via OPEN_DOCUMENT, and 16 unit tests. All validation gates passed.
- 2026-02-11: Code review fixes - Added section heading to empty state for consistency, fixed aria-label mismatch on progress bar, added heading placeholder to skeleton, removed duplicate test, added border styling tests and empty state heading test (17 tests total). All validation gates passed.
