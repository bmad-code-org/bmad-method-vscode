import React from 'react';
import { useEditorPanelStore, useEpics, useSprint } from '../store';
import { useVSCodeApi } from '../../shared/hooks';
import { createShiftOpenHandler } from '../../shared/utils/document-link';
import { cn } from '../../shared/utils/cn';
import { getEpicStatusClasses, getEpicStatusLabel } from '../../shared/utils/status-styles';
import type { Epic } from '@shared/types/epic';
import { isStoryKey } from '@shared/types/sprint-status';

interface EpicCardData {
  epic: Epic;
  totalStories: number;
  doneStories: number;
}

function useEpicCards(): EpicCardData[] {
  const epics = useEpics();
  const sprint = useSprint();

  return React.useMemo(() => {
    return epics.map((epic) => {
      let totalStories = 0;
      let doneStories = 0;

      if (sprint?.development_status) {
        for (const [key, status] of Object.entries(sprint.development_status)) {
          if (!isStoryKey(key)) continue;
          const epicNum = parseInt(key.split('-')[0], 10);
          if (epicNum === epic.number) {
            totalStories++;
            if (status === 'done') doneStories++;
          }
        }
      } else {
        totalStories = epic.stories.length;
      }

      return { epic, totalStories, doneStories };
    });
  }, [epics, sprint]);
}

export function EpicsView(): React.ReactElement {
  const navigateTo = useEditorPanelStore((s) => s.navigateTo);
  const outputRoot = useEditorPanelStore((s) => s.outputRoot) ?? '_bmad-output';
  const vscodeApi = useVSCodeApi();
  const epicCards = useEpicCards();

  if (epicCards.length === 0) {
    return (
      <div data-testid="epics-view-empty" className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <p className="text-sm text-[var(--vscode-descriptionForeground)]">
            No epics found. Create epics using the BMAD workflow to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="epics-view" className="p-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {epicCards.map(({ epic, totalStories, doneStories }) => {
          const progressPercent =
            totalStories > 0 ? Math.round((doneStories / totalStories) * 100) : 0;
          const isActive = epic.status === 'in-progress';
          const isDone = epic.status === 'done';

          return (
            <button
              key={epic.key}
              type="button"
              data-testid={`epic-card-${epic.number}`}
              className={cn(
                'flex cursor-pointer flex-col gap-2 rounded-md border p-4 text-left transition-colors',
                'border-[var(--vscode-panel-border)] bg-[var(--vscode-editor-background)]',
                'hover:bg-[var(--vscode-list-hoverBackground)]',
                isActive &&
                  'border-[var(--vscode-focusBorder)] ring-1 ring-[var(--vscode-focusBorder)]',
                isDone && 'opacity-60'
              )}
              onClick={createShiftOpenHandler(
                vscodeApi,
                `${outputRoot}/planning-artifacts/epics.md`,
                () => navigateTo({ view: 'epics', params: { epicId: String(epic.number) } })
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                    Epic {epic.number}
                  </span>
                  <span className="text-sm font-medium text-[var(--vscode-foreground)]">
                    {epic.title}
                  </span>
                </div>
                <span
                  className={cn('shrink-0 text-xs font-medium', getEpicStatusClasses(epic.status))}
                >
                  {getEpicStatusLabel(epic.status)}
                </span>
              </div>

              <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                {totalStories} {totalStories === 1 ? 'story' : 'stories'}
              </span>

              <div className="flex items-center gap-2">
                <div
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--vscode-editor-inactiveSelectionBackground)]"
                  role="progressbar"
                  aria-valuenow={progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${epic.title}: ${doneStories} of ${totalStories} stories done`}
                >
                  <div
                    className="h-full rounded-full bg-[var(--vscode-testing-iconPassed)] transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--vscode-descriptionForeground)]">
                  {doneStories}/{totalStories}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
