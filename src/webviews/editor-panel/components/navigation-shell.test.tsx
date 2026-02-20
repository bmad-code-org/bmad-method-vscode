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

  it('renders placeholder view for non-dashboard routes', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<NavigationShell />);
    expect(screen.getByTestId('placeholder-view')).toBeInTheDocument();
    expect(screen.getByText('Coming in Story 5.6')).toBeInTheDocument();
  });

  it('renders placeholder view for stories route', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'stories' });
    render(<NavigationShell />);
    expect(screen.getByTestId('placeholder-view')).toBeInTheDocument();
    expect(screen.getByText('Coming in Story 5.7')).toBeInTheDocument();
  });

  it('renders placeholder view for docs route', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'docs' });
    render(<NavigationShell />);
    expect(screen.getByTestId('placeholder-view')).toBeInTheDocument();
    expect(screen.getByText('Coming in Story 5.8')).toBeInTheDocument();
  });

  it('switches back to dashboard view when navigating back', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    useEditorPanelStore.getState().goBack();
    render(<NavigationShell />);
    expect(screen.getByTestId('editor-dashboard')).toBeInTheDocument();
  });
});
