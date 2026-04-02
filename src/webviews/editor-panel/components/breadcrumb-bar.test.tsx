import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BreadcrumbBar } from './breadcrumb-bar';
import { useEditorPanelStore, createInitialEditorPanelState } from '../store';

describe('BreadcrumbBar', () => {
  beforeEach(() => {
    useEditorPanelStore.setState(createInitialEditorPanelState());
  });

  it('renders the breadcrumb bar', () => {
    render(<BreadcrumbBar />);
    expect(screen.getByTestId('breadcrumb-bar')).toBeInTheDocument();
  });

  it('shows Dashboard as the default breadcrumb', () => {
    render(<BreadcrumbBar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('shows Dashboard as active (non-clickable) when at root', () => {
    render(<BreadcrumbBar />);
    expect(screen.getByTestId('breadcrumb-active')).toHaveTextContent('Dashboard');
  });

  it('disables back button when no history', () => {
    render(<BreadcrumbBar />);
    const backBtn = screen.getByTestId('breadcrumb-back');
    expect(backBtn).toBeDisabled();
  });

  it('enables back button when history exists', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<BreadcrumbBar />);
    const backBtn = screen.getByTestId('breadcrumb-back');
    expect(backBtn).not.toBeDisabled();
  });

  it('shows multiple breadcrumb segments after navigation', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<BreadcrumbBar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Epics')).toBeInTheDocument();
  });

  it('renders separator between breadcrumb segments', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<BreadcrumbBar />);
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('makes non-last breadcrumb clickable', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<BreadcrumbBar />);
    const dashboardCrumb = screen.getByTestId('breadcrumb-0');
    expect(dashboardCrumb.tagName).toBe('BUTTON');
  });

  it('makes last breadcrumb non-clickable (active)', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<BreadcrumbBar />);
    const activeCrumb = screen.getByTestId('breadcrumb-active');
    expect(activeCrumb.tagName).toBe('SPAN');
    expect(activeCrumb).toHaveTextContent('Epics');
  });

  it('clicking a breadcrumb navigates to that level', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<BreadcrumbBar />);

    fireEvent.click(screen.getByTestId('breadcrumb-0'));

    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({ view: 'dashboard' });
  });

  it('clicking back button returns to previous view', () => {
    useEditorPanelStore.getState().navigateTo({ view: 'epics' });
    render(<BreadcrumbBar />);

    fireEvent.click(screen.getByTestId('breadcrumb-back'));

    const state = useEditorPanelStore.getState();
    expect(state.currentRoute).toEqual({ view: 'dashboard' });
  });

  it('has accessible navigation landmark', () => {
    render(<BreadcrumbBar />);
    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
  });

  it('has accessible back button label', () => {
    render(<BreadcrumbBar />);
    expect(screen.getByLabelText('Go back')).toBeInTheDocument();
  });
});
