import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavigationShell } from './navigation-shell';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';

vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: vi.fn() }),
}));

describe('NavigationShell', () => {
  beforeEach(() => {
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      loading: false,
    });
  });

  it('renders the navigation shell container', () => {
    render(<NavigationShell />);
    expect(screen.getByTestId('navigation-shell')).toBeInTheDocument();
  });

  it('renders the breadcrumb bar', () => {
    render(<NavigationShell />);
    expect(screen.getByTestId('breadcrumb-bar')).toBeInTheDocument();
  });

  it('renders the dashboard view by default', () => {
    render(<NavigationShell />);
    expect(screen.getByTestId('editor-dashboard')).toBeInTheDocument();
  });

  it('renders epics view for epics route', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<NavigationShell />);
    expect(screen.getByTestId('epics-view-empty')).toBeInTheDocument();
  });

  it('renders stories view for stories route', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'stories' });
    render(<NavigationShell />);
    expect(screen.getByTestId('stories-view')).toBeInTheDocument();
  });

  it('renders story detail view for stories route with storyKey', () => {
    useEditorPanelStore.setState({
      ...createInitialEditorPanelState(),
      loading: false,
      currentRoute: { view: 'stories', params: { storyKey: '1-1-setup' } },
      storySummaries: [],
    });
    render(<NavigationShell />);
    // StoryDetailView renders — with no summary found, shows error state
    expect(screen.getByTestId('story-detail-error')).toBeInTheDocument();
  });

  it('renders DocsView for docs route', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'docs' });
    render(<NavigationShell />);
    expect(screen.getByTestId('docs-view')).toBeInTheDocument();
  });

  it('switches back to dashboard view when navigating back', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    useEditorPanelStore.getState().goBack();
    render(<NavigationShell />);
    expect(screen.getByTestId('editor-dashboard')).toBeInTheDocument();
  });
});
