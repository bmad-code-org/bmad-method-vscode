# Story 3.5: Next Action Recommendation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to see the next recommended action based on project state,
So that I immediately know what to do next.

## Acceptance Criteria

1. **Next Action Determination**
   - **Given** the dashboard has project state data
   - **When** the next action is determined
   - **Then** it identifies the appropriate next workflow based on state (FR5)
   - **And** it displays a clear recommendation (e.g., "Continue Story 2.4" or "Start next story")

2. **Context-Sensitive Recommendations**
   - **Given** the project is in various states
   - **When** recommendations are computed
   - **Then** recommendations follow logical BMAD workflow progression
   - **And** recommendations are context-sensitive to current sprint/epic/story state

3. **State-Based Recommendation Rules**
   - **Given** no sprint-status.yaml exists → recommend "Run Sprint Planning"
   - **Given** sprint active, current story status is `in-progress` → recommend "Continue Story X.Y"
   - **Given** sprint active, current story status is `review` → recommend "Run Code Review"
   - **Given** sprint active, current story status is `ready-for-dev` → recommend "Start Dev Story X.Y"
   - **Given** sprint active, no active story, backlog stories exist → recommend "Create Next Story"
   - **Given** all stories in current epic done → recommend "Run Retrospective" or "Create Next Story (next epic)"
   - **Given** all stories in all epics done → recommend "Sprint Complete - Run Retrospective"

## Tasks / Subtasks

- [x] Task 1: Create recommendation logic utility (AC: #1, #2, #3)
  - [x] 1.1: Create `src/webviews/dashboard/utils/get-next-action.ts` with `getNextAction()` function
  - [x] 1.2: Define `NextAction` interface with `type`, `label`, `description`, and optional `storyKey` fields
  - [x] 1.3: Implement state-based recommendation rules per AC #3
  - [x] 1.4: Handle all edge cases: null sprint, empty development_status, all done, mixed states

- [x] Task 2: Create NextActionRecommendation component (AC: #1, #2)
  - [x] 2.1: Create `src/webviews/dashboard/components/next-action-recommendation.tsx`
  - [x] 2.2: Use `useSprint()` and `useCurrentStory()` selectors from store
  - [x] 2.3: Call `getNextAction()` with sprint and currentStory data
  - [x] 2.4: Display recommendation with icon/emoji indicator, label, and description
  - [x] 2.5: Use VS Code theme CSS variables for all colors
  - [x] 2.6: Handle empty state when no sprint data available

- [x] Task 3: Create NextActionRecommendationSkeleton component (loading state)
  - [x] 3.1: Create skeleton loading UI within next-action-recommendation.tsx (not a separate file)
  - [x] 3.2: Use `animate-pulse` with `bg-[var(--vscode-editor-inactiveSelectionBackground)]` to match existing skeleton pattern
  - [x] 3.3: Skeleton shape should approximate a recommendation card with icon and text lines

- [x] Task 4: Wire NextActionRecommendation into Dashboard (AC: #1, #2)
  - [x] 4.1: Update `src/webviews/dashboard/components/index.ts` to export NextActionRecommendation and NextActionRecommendationSkeleton
  - [x] 4.2: Update `src/webviews/dashboard/index.tsx` to render NextActionRecommendation after ActiveStoryCard
  - [x] 4.3: Add NextActionRecommendationSkeleton to the loading branch of Dashboard

- [x] Task 5: Write Unit Tests for getNextAction utility (AC: #3)
  - [x] 5.1: Create `src/webviews/dashboard/utils/get-next-action.test.ts`
  - [x] 5.2: Test null sprint → "Run Sprint Planning"
  - [x] 5.3: Test current story in-progress → "Continue Story X.Y"
  - [x] 5.4: Test current story in review → "Run Code Review"
  - [x] 5.5: Test current story ready-for-dev → "Start Dev Story X.Y"
  - [x] 5.6: Test no active story + backlog stories → "Create Next Story"
  - [x] 5.7: Test all stories done in current epic → "Run Retrospective"
  - [x] 5.8: Test all stories in all epics done → "Sprint Complete"
  - [x] 5.9: Test empty development_status → appropriate recommendation

- [x] Task 6: Write Unit Tests for NextActionRecommendation component (AC: #1, #2)
  - [x] 6.1: Create `src/webviews/dashboard/components/next-action-recommendation.test.tsx`
  - [x] 6.2: Test renders recommendation label and description
  - [x] 6.3: Test renders different recommendations for different states
  - [x] 6.4: Test renders empty/null sprint gracefully
  - [x] 6.5: Test renders skeleton UI via NextActionRecommendationSkeleton
  - [x] 6.6: Test renders with correct data-testid attributes

- [x] Task 7: Build and Lint Validation (AC: #1, #2, #3)
  - [x] 7.1: Run `pnpm typecheck` and verify no type errors
  - [x] 7.2: Run `pnpm lint` and verify no linting errors
  - [x] 7.3: Run `pnpm test` and verify all tests pass (existing + new)
  - [x] 7.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `next-action-recommendation.tsx`, `get-next-action.ts`
   - WRONG: `NextActionRecommendation.tsx`, `getNextAction.ts`

2. **Component Naming**: PascalCase for components, camelCase for functions/hooks
   ```typescript
   export function NextActionRecommendation(): React.ReactElement { ... }
   export function NextActionRecommendationSkeleton(): React.ReactElement { ... }
   export function getNextAction(sprint: SprintStatus | null, currentStory: Story | null): NextAction { ... }
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

4. **Imports**: Use path aliases as established in the project
   - `@shared/types` for type interfaces
   - `@shared/types/sprint-status` for `SprintStatus`, `StoryStatusValue`, `isStoryKey`, `isEpicKey`
   - `@shared/types/story` for `Story` type
   - Relative imports for local files (e.g., `../store`, `../utils/get-next-action`)

5. **Styling**: VS Code theme CSS variables via Tailwind arbitrary values
   - `text-[var(--vscode-foreground)]` for primary text
   - `text-[var(--vscode-descriptionForeground)]` for secondary/description text
   - `bg-[var(--vscode-editor-inactiveSelectionBackground)]` for skeleton loading
   - `text-[var(--vscode-textLink-foreground)]` for emphasized/action text
   - `text-[var(--vscode-testing-iconPassed)]` for success states
   - `border-[var(--vscode-focusBorder)]` for highlighted borders

6. **Zustand Store Usage**: Use existing selector hooks from `store.ts`
   ```typescript
   import { useSprint, useCurrentStory } from '../store';
   // DO NOT create new store - use existing selectors
   ```

7. **Testing**: Use Vitest + @testing-library/react
   - Co-locate component tests: `next-action-recommendation.test.tsx` next to component
   - Utility tests: `get-next-action.test.ts` next to utility
   - Mock Zustand store by setting state directly via `useDashboardStore.setState()`
   - Use `render` from `@testing-library/react`
   - Use `screen` queries for assertions

### Technical Specifications

**NextAction Interface:**

```typescript
interface NextAction {
  type: 'sprint-planning' | 'create-story' | 'dev-story' | 'code-review' | 'retrospective' | 'sprint-complete';
  label: string;        // Short action label, e.g., "Continue Story 3.4"
  description: string;  // Brief context, e.g., "Story is in progress - keep working on implementation"
  storyKey?: string;    // Optional story reference when relevant
}
```

**Recommendation Logic (Priority Order):**

```typescript
function getNextAction(sprint: SprintStatus | null, currentStory: Story | null): NextAction {
  // 1. No sprint data → recommend sprint planning
  if (!sprint) return { type: 'sprint-planning', label: 'Run Sprint Planning', description: '...' };

  // 2. Active story in-progress → continue working
  if (currentStory?.status === 'in-progress') return { type: 'dev-story', label: `Continue Story ${epicNum}.${storyNum}`, ... };

  // 3. Story in review → run code review
  if (currentStory?.status === 'review') return { type: 'code-review', label: 'Run Code Review', ... };

  // 4. Story ready-for-dev → start dev
  if (currentStory?.status === 'ready-for-dev') return { type: 'dev-story', label: `Start Dev Story ${epicNum}.${storyNum}`, ... };

  // 5. No active story - check for backlog stories
  // Use sprint.development_status to find backlog stories via isStoryKey()
  // If backlog exists → create-story
  // If all done → retrospective or sprint-complete
}
```

**Key Data Access:**

The `SprintStatus.development_status` is `Record<string, DevelopmentStatusValue>` where:
- Epic keys match `isEpicKey()`: `epic-1`, `epic-2`, etc.
- Story keys match `isStoryKey()`: `1-1-project-init`, `3-5-next-action`, etc.
- Story statuses: `'backlog' | 'ready-for-dev' | 'in-progress' | 'review' | 'done'`

Use existing type guards from `@shared/types/sprint-status`:
```typescript
import { isStoryKey, isEpicKey } from '@shared/types/sprint-status';
```

**Component Structure Pattern (follow existing dashboard component patterns):**

```typescript
export function NextActionRecommendation(): React.ReactElement {
  const sprint = useSprint();
  const currentStory = useCurrentStory();

  const action = getNextAction(sprint, currentStory);

  return (
    <section data-testid="next-action-recommendation" className="...">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--vscode-descriptionForeground)] mb-2">
        Next Action
      </h2>
      <div className="...">
        {/* Action label and description */}
      </div>
    </section>
  );
}
```

**Dashboard Integration (from `index.tsx`):**

The Dashboard renders components in vertical stack order:
SprintStatus > EpicList > ActiveStoryCard > **NextActionRecommendation** > PlanningArtifactLinks

The loading branch renders skeletons in the same order. Follow the exact same import and wiring pattern as ActiveStoryCard.

**cn() Utility for Conditional Classes:**

```typescript
import { cn } from '../../shared/utils/cn';
```

### Project Structure Notes

**Files to Create:**
- `src/webviews/dashboard/utils/get-next-action.ts` - NextAction interface and getNextAction() logic
- `src/webviews/dashboard/utils/get-next-action.test.ts` - Unit tests for recommendation logic
- `src/webviews/dashboard/components/next-action-recommendation.tsx` - Component and skeleton
- `src/webviews/dashboard/components/next-action-recommendation.test.tsx` - Component tests

**Files to Modify:**
- `src/webviews/dashboard/components/index.ts` - Add NextActionRecommendation and NextActionRecommendationSkeleton exports
- `src/webviews/dashboard/index.tsx` - Wire NextActionRecommendation + skeleton into Dashboard layout

**Files to NOT Modify (read-only references):**
- `src/webviews/dashboard/store.ts` - Use existing `useSprint()` and `useCurrentStory()` selectors
- `src/shared/types/sprint-status.ts` - Use existing `SprintStatus`, `isStoryKey()`, `isEpicKey()` type guards
- `src/shared/types/story.ts` - Use existing `Story` interface
- `src/shared/messages.ts` - No new messages needed for this story
- `src/webviews/shared/hooks/use-vscode-api.ts` - Not needed (no messages sent from this component)
- `src/webviews/shared/utils/cn.ts` - Use existing `cn()` utility

**Dependencies (all already installed - NO new packages):**
- `react` 19.2.0
- `zustand` ^5.0.0
- `tailwindcss` 4.1.0
- `clsx` (for cn utility)
- `tailwind-merge` (for cn utility)
- `@testing-library/react` 16.3.2
- `vitest` ^4.0.18

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.5] - Story acceptance criteria and BDD scenarios
- [Source: _bmad-output/planning-artifacts/epics.md#Story-4.1] - Workflow state mapping table (project state → available workflows)
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns] - Dashboard component directory structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns] - File and component naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management] - Zustand for webviews, extension host single source of truth
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns] - Skeleton UI (not spinner), error recovery
- [Source: src/shared/types/sprint-status.ts] - SprintStatus interface, status value types, type guards
- [Source: src/shared/types/story.ts] - Story interface
- [Source: src/shared/types/dashboard-state.ts] - DashboardState interface
- [Source: src/webviews/dashboard/store.ts] - useSprint(), useCurrentStory() selector hooks
- [Source: src/webviews/shared/utils/cn.ts] - cn() class name utility
- [Source: src/webviews/dashboard/components/sprint-status.tsx] - Existing component pattern reference (styling, structure, skeleton, computeStatusCounts helper)
- [Source: src/webviews/dashboard/components/active-story-card.tsx] - Existing component with story data display pattern
- [Source: src/webviews/dashboard/components/epic-list.tsx] - Existing component with deriveEpicSummaries pattern and isStoryKey/isEpicKey usage
- [Source: src/webviews/dashboard/components/active-story-card.test.tsx] - Existing test patterns (mock setup, store state, assertions)

### Previous Story Intelligence

**From Story 3.4 (Active Story Card with Task Progress):**
- ActiveStoryCard displays story title with epic context, task progress bar, subtask count, status badge
- Skeleton uses animate-pulse pattern matching SprintStatusSkeleton and EpicListSkeleton
- 17 tests added (260 total tests, up from 242)
- Story title is clickable button sending OPEN_DOCUMENT message via useVSCodeApi/createOpenDocumentMessage
- In-progress stories get left border highlight
- No issues during implementation
- All validation gates passed: typecheck, lint, test (260 passing), build
- Prettier formatting issues on multi-line arrow functions fixed by inlining expressions

**From Story 3.3 (Epic List with Completion Status):**
- EpicList derives data from sprint `development_status` using `isEpicKey()` and `isStoryKey()` type guards
- Two-pass algorithm for data derivation (first collect epics, then count stories)
- THIS PATTERN IS DIRECTLY RELEVANT - NextActionRecommendation needs to iterate development_status similarly
- Empty state handled for both null sprint and empty development_status entries
- Skeleton uses 3 placeholder rows with animate-pulse

**From Story 3.2 (Sprint Status Display Component):**
- Dashboard owns loading orchestration - components should NOT internally check loading
- Remove dead exports from barrel file (keep `index.ts` clean)
- Components handle empty/null props gracefully
- Test ALL status values to cover all conditional render paths

**From Story 3.1 (Dashboard Zustand Store and Message Handler):**
- Store state can be set directly in tests via `useDashboardStore.setState()`
- Avoid dead code in components

**Git Intelligence:**
- Recent commits follow `feat: X-Y-story-title` format
- Package manager: `pnpm` (NOT npm)
- All previous stories pass: typecheck, lint, test, build
- 260 tests across all stories using Vitest
- Last 4 commits are Epic 3 stories 3.1-3.4 - clean sequential implementation

**Workflow State Mapping (from Epics Story 4.1 - relevant context for recommendation logic):**

| Project State | Recommended Workflow |
|---------------|---------------------|
| No sprint-status.yaml exists | `/sprint-planning` |
| Sprint active, no stories started | `/create-story` |
| Story status: ready-for-dev | `/dev-story` |
| Story status: in-progress | `/dev-story` (continue) |
| Story status: review | `/code-review` |
| All stories in epic complete | `/retrospective`, `/create-story` (next epic) |

This mapping from Epic 4 Story 4.1 directly informs the recommendation logic for this story.

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prettier formatting auto-fixed on get-next-action.ts (multi-line params → single line) and next-action-recommendation.tsx (class ordering)

### Completion Notes List

- Implemented `getNextAction()` utility with priority-ordered recommendation logic covering all 6 action types: sprint-planning, create-story, dev-story, code-review, retrospective, sprint-complete
- Created `NextActionRecommendation` component using existing `useSprint()` and `useCurrentStory()` store selectors, displaying emoji icon, action label, and description
- Created `NextActionRecommendationSkeleton` with animate-pulse pattern matching existing dashboard skeletons
- Wired both components into Dashboard layout (content + loading branches) after ActiveStoryCard, before PlanningArtifactLinks
- 14 unit tests for getNextAction utility covering all state-based rules and edge cases
- 11 unit tests for NextActionRecommendation component covering rendering, state variations, skeleton, retrospective, and data-testid attributes
- All validation gates passed: typecheck clean, lint clean, 295 tests passing (up from 260), build successful

### Change Log

- 2026-02-12: Story 3.5 implemented - Next Action Recommendation component and utility (21 new tests, 291 total)
- 2026-02-12: Code review fixes - Added per-epic retrospective logic (AC #3 rule 6), replaced unsafe type cast with isStoryStatus() guard, added fallback branch test, added retrospective component test (4 new tests, 295 total)

### File List

**New Files:**
- `src/webviews/dashboard/utils/get-next-action.ts` - NextAction interface and getNextAction() recommendation logic
- `src/webviews/dashboard/utils/get-next-action.test.ts` - 14 unit tests for recommendation logic
- `src/webviews/dashboard/components/next-action-recommendation.tsx` - NextActionRecommendation and NextActionRecommendationSkeleton components
- `src/webviews/dashboard/components/next-action-recommendation.test.tsx` - 11 unit tests for component rendering

**Modified Files:**
- `src/webviews/dashboard/components/index.ts` - Added NextActionRecommendation and NextActionRecommendationSkeleton exports
- `src/webviews/dashboard/index.tsx` - Wired NextActionRecommendation + skeleton into Dashboard layout
- `_bmad-output/implementation-artifacts/sprint-status.yaml` - Updated story 3-5 status to review
