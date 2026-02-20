import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardView } from './dashboard-view';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';

vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: vi.fn() }),
}));

describe('DashboardView', () => {
  beforeEach(() => {
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      loading: false,
    });
  });

  it('renders the editor dashboard', () => {
    render(<DashboardView />);
    expect(screen.getByTestId('editor-dashboard')).toBeInTheDocument();
  });

  it('renders loading state with skeletons', () => {
    useEditorPanelStore.setState({ loading: true });
    render(<DashboardView />);
    expect(screen.getByTestId('editor-dashboard-loading')).toBeInTheDocument();
    expect(screen.getByTestId('sprint-status-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('active-story-card-skeleton')).toBeInTheDocument();
  });

  it('renders the tab bar', () => {
    render(<DashboardView />);
    expect(screen.getByTestId('dashboard-tab-bar')).toBeInTheDocument();
  });

  it('renders all view tabs', () => {
    render(<DashboardView />);
    expect(screen.getByTestId('tab-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('tab-epics')).toBeInTheDocument();
    expect(screen.getByTestId('tab-stories')).toBeInTheDocument();
    expect(screen.getByTestId('tab-kanban')).toBeInTheDocument();
    expect(screen.getByTestId('tab-docs')).toBeInTheDocument();
  });

  it('clicking a non-active tab navigates to that view', () => {
    render(<DashboardView />);
    fireEvent.click(screen.getByTestId('tab-epics'));

    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({ view: 'epics' });
  });

  it('clicking the active tab does not navigate', () => {
    render(<DashboardView />);
    const historyBefore = useEditorPanelStore.getState().navigationHistory.length;

    fireEvent.click(screen.getByTestId('tab-dashboard'));

    const historyAfter = useEditorPanelStore.getState().navigationHistory.length;
    expect(historyAfter).toBe(historyBefore);
  });

  it('renders dashboard components when data is available', () => {
    useEditorPanelStore.setState({
      loading: false,
      sprint: {
        generated: '2026-01-01',
        project: 'test',
        project_key: 'test',
        tracking_system: 'file-system',
        story_location: 'stories',
        development_status: { 'epic-1': 'in-progress' },
      },
    });

    render(<DashboardView />);
    expect(screen.getByTestId('sprint-status')).toBeInTheDocument();
  });

  it('renders empty states when no data is available', () => {
    render(<DashboardView />);
    expect(screen.getByTestId('sprint-status-empty')).toBeInTheDocument();
    expect(screen.getByTestId('active-story-card-empty')).toBeInTheDocument();
  });

  it('renders planning artifact links', () => {
    render(<DashboardView />);
    expect(screen.getByTestId('planning-artifact-links')).toBeInTheDocument();
  });

  it('renders about section', () => {
    render(<DashboardView />);
    expect(screen.getByTestId('about-section')).toBeInTheDocument();
  });

  it('uses responsive grid layout (single column by default, two columns at md breakpoint)', () => {
    render(<DashboardView />);
    const dashboard = screen.getByTestId('editor-dashboard');
    const gridContainers = dashboard.querySelectorAll('.grid.md\\:grid-cols-2');
    expect(gridContainers.length).toBeGreaterThan(0);
  });

  it('loading state also uses responsive grid layout', () => {
    useEditorPanelStore.setState({ loading: true });
    render(<DashboardView />);
    const dashboard = screen.getByTestId('editor-dashboard-loading');
    const gridContainers = dashboard.querySelectorAll('.grid.md\\:grid-cols-2');
    expect(gridContainers.length).toBeGreaterThan(0);
  });
});
