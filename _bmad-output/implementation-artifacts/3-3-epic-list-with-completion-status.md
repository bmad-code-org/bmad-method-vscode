# Story 3.3: Epic List with Completion Status

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want to view a list of all epics with their completion status,
So that I can see project progress across all epics.

## Acceptance Criteria

1. **Epic List Display**
   - **Given** the dashboard receives epic data via sprint status
   - **When** the EpicList component renders
   - **Then** it displays all epics with their titles (FR2)
   - **And** it shows completion status for each epic (e.g., "3/5 stories complete")
   - **And** the current/active epic is visually highlighted

2. **Empty State**
   - **Given** no epic data is available (sprint is null or has no epic entries)
   - **When** the component renders
   - **Then** it displays a helpful message indicating no epics found

3. **Epic Document Navigation**
   - **Given** an epic is displayed in the list
   - **When** the user clicks on the epic title
   - **Then** the epic document opens in the document viewer (sends OPEN_DOCUMENT message)

## Tasks / Subtasks

- [x] Task 1: Create EpicList component (AC: #1, #2)
  - [x] 1.1: Create `src/webviews/dashboard/components/epic-list.tsx`
  - [x] 1.2: Use `useSprint()` selector from store to derive epic data from `development_status`
  - [x] 1.3: Group stories by epic number from sprint status keys using `isEpicKey()`, `isStoryKey()` helpers
  - [x] 1.4: For each epic, compute story completion counts (done/total) from `development_status` entries
  - [x] 1.5: Display each epic with: epic number, title (from epic key or epics data), status badge, and "X/Y stories" progress
  - [x] 1.6: Show compact progress indicator per epic (inline text or small bar)
  - [x] 1.7: Visually highlight the active/in-progress epic using a left border or background accent
  - [x] 1.8: Handle empty state when sprint is null or has no epic entries - show "No epics found" message
  - [x] 1.9: Use VS Code theme CSS variables for all colors

- [x] Task 2: Create EpicListSkeleton component (AC: loading state)
  - [x] 2.1: Create skeleton loading UI within epic-list.tsx (not a separate file)
  - [x] 2.2: Use `animate-pulse` with `bg-[var(--vscode-editor-inactiveSelectionBackground)]` to match existing skeleton pattern
  - [x] 2.3: Skeleton shape should approximate 3-5 epic row items

- [x] Task 3: Add epic title click handler for document navigation (AC: #3)
  - [x] 3.1: Use `useVSCodeApi()` hook to send `OPEN_DOCUMENT` messages when epic title is clicked
  - [x] 3.2: Use `createOpenDocumentMessage(path)` factory from `@shared/messages`
  - [x] 3.3: The path for epics document is `_bmad-output/planning-artifacts/epics.md`
  - [x] 3.4: Style epic titles as clickable links using `text-[var(--vscode-textLink-foreground)]` with hover:underline

- [x] Task 4: Wire EpicList into Dashboard (AC: #1, #2)
  - [x] 4.1: Update `src/webviews/dashboard/components/index.ts` to export EpicList and EpicListSkeleton
  - [x] 4.2: Update `src/webviews/dashboard/index.tsx` to render EpicList component after SprintStatus
  - [x] 4.3: Add EpicListSkeleton to the loading branch of Dashboard

- [x] Task 5: Write Unit Tests (AC: #1, #2, #3)
  - [x] 5.1: Create `src/webviews/dashboard/components/epic-list.test.tsx`
  - [x] 5.2: Test renders all epics from sprint status development_status
  - [x] 5.3: Test renders correct story completion counts per epic (e.g., "3/5 stories")
  - [x] 5.4: Test visually highlights the in-progress epic
  - [x] 5.5: Test renders empty state message when sprint is null
  - [x] 5.6: Test renders empty state when sprint has no epic entries
  - [x] 5.7: Test clicking epic title sends OPEN_DOCUMENT message with correct path
  - [x] 5.8: Test renders skeleton UI via EpicListSkeleton
  - [x] 5.9: Test handles epics with all stories done (shows "done" or checkmark)
  - [x] 5.10: Test handles epics in backlog state (no stories started)

- [x] Task 6: Build and Lint Validation (AC: #1, #2, #3)
  - [x] 6.1: Run `pnpm typecheck` and verify no type errors
  - [x] 6.2: Run `pnpm lint` and verify no linting errors
  - [x] 6.3: Run `pnpm test` and verify all tests pass (existing + new)
  - [x] 6.4: Run `pnpm build` and verify no compilation errors

## Dev Notes

### Critical Architecture Compliance

**MANDATORY: Follow these patterns from Architecture Document and previous story learnings**

1. **File Naming**: ALL files use kebab-case
   - CORRECT: `epic-list.tsx`, `epic-list.test.tsx`
   - WRONG: `EpicList.tsx`, `epicList.tsx`

2. **Component Naming**: PascalCase for components, camelCase for functions/hooks

   ```typescript
   export function EpicList(): React.ReactElement { ... }
   export function EpicListSkeleton(): React.ReactElement { ... }
   ```

3. **Package Manager**: Use `pnpm` (NOT npm)
   - `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck`

4. **Imports**: Use path aliases as established in the project
   - `@shared/messages` for message protocol types/factories
   - `@shared/types` for type interfaces
   - `@shared/types/sprint-status` for type guards (isEpicKey, isStoryKey, etc.)
   - Relative imports for local files (e.g., `../store`)

5. **Styling**: VS Code theme CSS variables via Tailwind arbitrary values
   - `text-[var(--vscode-foreground)]` for primary text
   - `text-[var(--vscode-descriptionForeground)]` for secondary text
   - `bg-[var(--vscode-editor-inactiveSelectionBackground)]` for skeleton loading
   - `text-[var(--vscode-textLink-foreground)]` for clickable links
   - `text-[var(--vscode-testing-iconPassed)]` for success/done status
   - `border-[var(--vscode-focusBorder)]` for active epic highlight border
   - `bg-[var(--vscode-list-activeSelectionBackground)]` for active epic background (use with opacity)

6. **Zustand Store Usage**: Use existing selector hooks from `store.ts`

   ```typescript
   import { useSprint } from '../store';
   // DO NOT create new store - use existing selectors
   ```

7. **Message Protocol**: Use existing factories from `@shared/messages`

   ```typescript
   import { createOpenDocumentMessage } from '@shared/messages';
   import { useVSCodeApi } from '../../shared/hooks';
   // Send message: vscodeApi.postMessage(createOpenDocumentMessage(path));
   ```

8. **Testing**: Use Vitest + @testing-library/react
   - Co-locate tests: `epic-list.test.tsx` next to `epic-list.tsx`
   - Use `render` from `@testing-library/react`
   - Use `screen` queries for assertions
   - Mock Zustand store by setting state directly via `useDashboardStore.setState()`
   - Mock `useVSCodeApi` for message-sending tests

### Technical Specifications

**CRITICAL: Epic Data Derivation Strategy**

The current epic parser (`epic-parser.ts`) only extracts the **first** `## Epic N:` heading from `epics.md`, so the `epics` array in DashboardState typically contains only one entry. **DO NOT rely solely on `useEpics()` for the epic list.**

Instead, derive epic data primarily from `sprint.development_status`:

```typescript
// Primary data source: sprint status development_status
// Keys follow patterns:
//   epic-N → epic status (backlog, in-progress, done)
//   N-N-name → story status (backlog, ready-for-dev, in-progress, review, done)

import { isEpicKey, isStoryKey } from '@shared/types/sprint-status';
import type { DevelopmentStatusValue, EpicStatusValue } from '@shared/types/sprint-status';

interface EpicSummary {
  number: number;
  key: string; // "epic-1", "epic-2", etc.
  status: EpicStatusValue;
  totalStories: number;
  doneStories: number;
}

function deriveEpicSummaries(
  developmentStatus: Record<string, DevelopmentStatusValue>
): EpicSummary[] {
  const epicMap = new Map<number, EpicSummary>();

  // First pass: find all epic entries
  for (const [key, status] of Object.entries(developmentStatus)) {
    if (isEpicKey(key)) {
      const epicNum = parseInt(key.replace('epic-', ''), 10);
      epicMap.set(epicNum, {
        number: epicNum,
        key,
        status: status as EpicStatusValue,
        totalStories: 0,
        doneStories: 0,
      });
    }
  }

  // Second pass: count stories per epic
  for (const [key, status] of Object.entries(developmentStatus)) {
    if (isStoryKey(key)) {
      const epicNum = parseInt(key.split('-')[0], 10);
      const epic = epicMap.get(epicNum);
      if (epic) {
        epic.totalStories++;
        if (status === 'done') {
          epic.doneStories++;
        }
      }
    }
  }

  // Sort by epic number and return
  return Array.from(epicMap.values()).sort((a, b) => a.number - b.number);
}
```

**Epic Title Resolution:**

The sprint status does NOT contain epic titles - only keys like `epic-1`. To display human-readable titles, optionally use the `useEpics()` store selector to look up titles from parsed epics data. If no epics data is available, display the epic key formatted as "Epic N".

```typescript
// Try to get title from parsed epics data, fallback to "Epic N"
const epicsData = useEpics(); // May be empty or contain only first epic

function getEpicTitle(epicNum: number): string {
  // Search epics data for matching stories with this epic number
  // The parsed Epic contains stories array with story entries
  for (const epic of epicsData) {
    if (epic.number === epicNum) {
      return epic.title;
    }
  }
  return `Epic ${epicNum}`;
}
```

**IMPORTANT NOTE about epic titles from epics.md**: The epics.md file has sections like `## Epic 3: Dashboard State Visibility`. The epic parser currently only parses the first epic found. However, the EpicStoryEntry objects in the parsed Epic's `stories` array have story keys that indicate which epic they belong to (e.g., "3-1-dashboard-zustand..."). The `useEpics()` data is **not reliable** for mapping all epic titles. For now, use "Epic N" as fallback and render the epic number prominently.

**SprintStatus Data Shape (from `src/shared/types/sprint-status.ts`):**

```typescript
interface SprintStatus {
  generated: string;
  project: string;
  project_key: string;
  tracking_system: 'file-system';
  story_location: string;
  development_status: Record<string, DevelopmentStatusValue>;
}
```

**Key Helper Functions (from `src/shared/types/sprint-status.ts`):**

```typescript
isEpicKey(key: string): boolean     // Pattern: epic-N
isStoryKey(key: string): boolean    // Pattern: N-N-name
isRetrospectiveKey(key: string): boolean  // Pattern: epic-N-retrospective
isEpicStatus(status: string): status is EpicStatusValue
isStoryStatus(status: string): status is StoryStatusValue
```

**Active Epic Determination:**

An epic is "active" (highlighted) if its status is `'in-progress'` in the sprint status. There may be multiple in-progress epics. Highlight ALL epics with `in-progress` status.

**Existing Component Pattern Reference (SprintStatus from `sprint-status.tsx`):**

```typescript
import React from 'react';
import { useSprint } from '../store';
import { isStoryKey } from '@shared/types/sprint-status';
import type { DevelopmentStatusValue } from '@shared/types/sprint-status';

// Component uses useSprint() directly, computes derived data inline
// Returns early with empty state div if sprint is null
// Uses data-testid attributes for testing
```

**Existing Skeleton Pattern (from `sprint-status.tsx`):**

```tsx
export function SprintStatusSkeleton(): React.ReactElement {
  return (
    <div data-testid="sprint-status-skeleton" className="flex animate-pulse flex-col gap-3">
      <div className="h-5 w-1/2 rounded bg-[var(--vscode-editor-inactiveSelectionBackground)]" />
      ...
    </div>
  );
}
```

**VS Code API Hook Pattern (from `src/webviews/shared/hooks/use-vscode-api.ts`):**

```typescript
import { useVSCodeApi } from '../../shared/hooks';
const vscodeApi = useVSCodeApi();
vscodeApi.postMessage(createOpenDocumentMessage('_bmad-output/planning-artifacts/epics.md'));
```

**cn() Utility (from `src/webviews/shared/utils/cn.ts`):**

```typescript
import { cn } from '../../shared/utils/cn';
// Combines Tailwind classes intelligently - use for conditional styling
<div className={cn('flex gap-2', isActive && 'border-l-2 border-[var(--vscode-focusBorder)]')} />
```

### Project Structure Notes

**Files to Create:**

- `src/webviews/dashboard/components/epic-list.tsx` - Epic list display component + skeleton
- `src/webviews/dashboard/components/epic-list.test.tsx` - Epic list tests

**Files to Modify:**

- `src/webviews/dashboard/components/index.ts` - Add EpicList and EpicListSkeleton exports
- `src/webviews/dashboard/index.tsx` - Wire EpicList + EpicListSkeleton into Dashboard layout

**Files to NOT Modify (read-only references):**

- `src/webviews/dashboard/store.ts` - Use existing `useSprint()`, `useEpics()` selectors
- `src/shared/types/sprint-status.ts` - Use existing types and helper functions (isEpicKey, isStoryKey)
- `src/shared/types/epic.ts` - Use existing Epic interface for title lookup
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

### Testing Strategy

**EpicList Component Tests:**

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { useDashboardStore } from '../store';
import { EpicList, EpicListSkeleton } from './epic-list';

const mockSprintStatus = {
  generated: '2026-01-27',
  project: 'bmad-extension',
  project_key: 'bmad-extension',
  tracking_system: 'file-system' as const,
  story_location: '_bmad-output/implementation-artifacts',
  development_status: {
    'epic-1': 'done',
    '1-1-project-initialization-from-starter-template': 'done',
    '1-2-test-framework-configuration': 'done',
    '1-3-bmad-project-detection': 'done',
    '1-4-sidebar-panel-registration': 'done',
    'epic-1-retrospective': 'optional',
    'epic-2': 'in-progress',
    '2-1-shared-types-and-message-protocol': 'done',
    '2-2-sprint-status-parser': 'done',
    '2-3-epic-file-parser': 'backlog',
    'epic-2-retrospective': 'optional',
    'epic-3': 'backlog',
    '3-1-dashboard-zustand-store-and-message-handler': 'backlog',
    'epic-3-retrospective': 'optional',
  },
};

// Mock useVSCodeApi
const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

beforeEach(() => {
  mockPostMessage.mockClear();
  useDashboardStore.setState({
    sprint: mockSprintStatus,
    epics: [],
    currentStory: null,
    errors: [],
    loading: false,
  });
});

test('renders all epics from sprint status', () => {
  render(<EpicList />);
  expect(screen.getByText(/Epic 1/)).toBeInTheDocument();
  expect(screen.getByText(/Epic 2/)).toBeInTheDocument();
  expect(screen.getByText(/Epic 3/)).toBeInTheDocument();
});

test('renders correct story completion counts', () => {
  render(<EpicList />);
  // Epic 1: 4/4 done, Epic 2: 2/3 done, Epic 3: 0/1 done
  expect(screen.getByText('4/4')).toBeInTheDocument();
  expect(screen.getByText('2/3')).toBeInTheDocument();
});

test('highlights in-progress epic', () => {
  render(<EpicList />);
  const epic2 = screen.getByTestId('epic-item-2');
  expect(epic2.className).toContain('border');
});

test('renders empty state when sprint is null', () => {
  useDashboardStore.setState({ sprint: null });
  render(<EpicList />);
  expect(screen.getByText(/no epics/i)).toBeInTheDocument();
});

test('sends OPEN_DOCUMENT message on epic title click', () => {
  render(<EpicList />);
  fireEvent.click(screen.getByText(/Epic 1/));
  expect(mockPostMessage).toHaveBeenCalledWith(
    expect.objectContaining({ type: 'OPEN_DOCUMENT' })
  );
});

test('renders skeleton UI', () => {
  render(<EpicListSkeleton />);
  expect(screen.getByTestId('epic-list-skeleton')).toBeInTheDocument();
});
```

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Structure-Patterns] - Dashboard component directory structure
- [Source: _bmad-output/planning-artifacts/architecture.md#Naming-Patterns] - File and component naming conventions
- [Source: _bmad-output/planning-artifacts/architecture.md#State-Management] - Zustand for webviews, extension host single source of truth
- [Source: _bmad-output/planning-artifacts/architecture.md#Process-Patterns] - Skeleton UI (not spinner), error recovery
- [Source: _bmad-output/planning-artifacts/architecture.md#Message-Protocol] - OPEN_DOCUMENT message type
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.3] - Epic List with Completion Status acceptance criteria
- [Source: src/shared/types/sprint-status.ts] - SprintStatus interface, isEpicKey/isStoryKey helpers, EpicStatusValue type
- [Source: src/shared/types/epic.ts] - Epic interface, EpicStoryEntry interface
- [Source: src/shared/types/dashboard-state.ts] - DashboardState interface
- [Source: src/shared/messages.ts] - createOpenDocumentMessage factory, ToExtension/ToWebview types
- [Source: src/webviews/dashboard/store.ts] - useSprint(), useEpics(), useLoading() selector hooks
- [Source: src/webviews/shared/hooks/use-vscode-api.ts] - useVSCodeApi() hook for postMessage
- [Source: src/webviews/shared/utils/cn.ts] - cn() class name utility
- [Source: src/webviews/dashboard/components/sprint-status.tsx] - Existing component pattern reference (styling, structure, skeleton)
- [Source: src/webviews/dashboard/components/planning-artifact-links.tsx] - Existing clickable link pattern with OPEN_DOCUMENT messaging
- [Source: src/extension/services/state-manager.ts] - How epics and sprint data are parsed and aggregated
- [Source: src/extension/parsers/epic-parser.ts] - Epic parser limitations (only parses first epic header)

### Previous Story Intelligence

**From Story 3.2 (Sprint Status Display Component):**

- SprintStatus component uses `useSprint()` directly to get sprint data, computes derived data inline
- `computeStatusCounts()` helper function iterates `development_status` entries and filters by `isStoryKey()`
- Empty state: returns early with `data-testid="sprint-status-empty"` div
- Skeleton: separate export `SprintStatusSkeleton` with `data-testid="sprint-status-skeleton"`
- Dashboard owns loading orchestration (renders skeleton vs real component)
- 228 tests passing after story 3.2

**From Story 3.2 Code Review Learnings:**

- H1 fix: Dashboard owns loading check, components should NOT internally check loading (dead code)
- M2 fix: Remove dead exports from barrel file (clean up `index.ts`)
- M3 fix: Components should handle empty/null props gracefully - don't hardcode defaults without empty state
- M4 fix: Test all status values (including `review`) to cover all conditional render paths
- All validation gates must pass: typecheck, lint, test, build

**From Story 3.1 (Dashboard Zustand Store and Message Handler):**

- Zustand store has selectors: `useSprint()`, `useEpics()`, `useCurrentStory()`, `useErrors()`, `useLoading()`
- Tests use `useDashboardStore.setState()` to set store state before rendering
- Tests mock `useVSCodeApi` via `vi.mock('../../shared/hooks', ...)`
- Build commands: `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`

**Git Intelligence:**

- Recent commits follow `feat: X-Y-story-title` format
- Package manager: `pnpm` (NOT npm)
- All previous stories pass: typecheck, lint, test, build
- 228+ tests across all stories using Vitest

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Created EpicList component that derives epic summaries from sprint status `development_status` using `isEpicKey()` and `isStoryKey()` type guards
- Epic data derivation: two-pass algorithm over development_status entries - first pass identifies epics, second pass counts stories per epic
- Epic title resolution uses `useEpics()` store data with fallback to "Epic N" format
- Active epic highlighting via left border + background accent for `in-progress` status epics
- Compact progress bar per epic showing done/total story counts
- Empty state handled for both null sprint and empty development_status
- EpicListSkeleton with 3 placeholder rows using animate-pulse pattern
- Epic titles are clickable links that send OPEN_DOCUMENT message to open epics.md
- Dashboard wired with EpicList after SprintStatus, EpicListSkeleton in loading branch
- 14 new tests covering all acceptance criteria (242 total tests passing, up from 228)
- All validation gates pass: typecheck, lint, test, build

### Change Log

- 2026-02-09: Implemented story 3-3 - EpicList component with completion status, skeleton, click navigation, and 14 unit tests

### File List

- `src/webviews/dashboard/components/epic-list.tsx` (new) - EpicList and EpicListSkeleton components
- `src/webviews/dashboard/components/epic-list.test.tsx` (new) - 14 unit tests for EpicList and EpicListSkeleton
- `src/webviews/dashboard/components/index.ts` (modified) - Added EpicList and EpicListSkeleton exports
- `src/webviews/dashboard/index.tsx` (modified) - Wired EpicList and EpicListSkeleton into Dashboard
