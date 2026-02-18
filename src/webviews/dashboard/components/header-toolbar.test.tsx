import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { useDashboardStore } from '../store';
import { HeaderToolbar, HeaderToolbarSkeleton } from './header-toolbar';
import type { AvailableWorkflow } from '@shared/types';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const workflow1: AvailableWorkflow = {
  id: 'dev-story',
  name: 'Dev Story',
  command: '/bmad-bmm-dev-story',
  description: 'Implement the next story',
  kind: 'primary' as const,
};

const workflow2: AvailableWorkflow = {
  id: 'create-story',
  name: 'Create Story',
  command: '/bmad-bmm-create-story',
  description: 'Create a new story',
  kind: 'optional' as const,
};

describe('HeaderToolbar', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({ workflows: [], loading: false });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 3.1 Test help icon renders with HelpCircle icon
  test('renders help icon button', () => {
    render(<HeaderToolbar />);
    const helpButton = screen.getByTestId('help-icon');
    expect(helpButton).toBeInTheDocument();
    expect(helpButton.querySelector('svg')).toBeInTheDocument();
  });

  // 3.2 Test help icon click sends COPY_COMMAND with 'bmad help'
  test('help icon click sends COPY_COMMAND with bmad help', () => {
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('help-icon'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'COPY_COMMAND',
      payload: { command: 'bmad help' },
    });
  });

  // 3.3 Test overflow menu button renders
  test('renders overflow menu button', () => {
    render(<HeaderToolbar />);
    expect(screen.getByTestId('overflow-menu-button')).toBeInTheDocument();
  });

  // 3.4 Test clicking overflow button opens dropdown
  test('clicking overflow button opens dropdown', () => {
    render(<HeaderToolbar />);
    expect(screen.queryByTestId('overflow-menu-dropdown')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    expect(screen.getByTestId('overflow-menu-dropdown')).toBeInTheDocument();
  });

  // 3.5 Test clicking overflow button again closes dropdown
  test('clicking overflow button again closes dropdown', () => {
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    expect(screen.getByTestId('overflow-menu-dropdown')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    expect(screen.queryByTestId('overflow-menu-dropdown')).not.toBeInTheDocument();
  });

  // 3.6 Test "Refresh" appears as first menu item
  test('Refresh appears as first menu item', () => {
    useDashboardStore.setState({ workflows: [workflow1, workflow2] });
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    const dropdown = screen.getByTestId('overflow-menu-dropdown');
    const buttons = dropdown.querySelectorAll('button');
    expect(buttons[0]).toHaveTextContent('Refresh');
  });

  // 3.7 Test clicking "Refresh" sends REFRESH message and closes menu
  test('clicking Refresh sends REFRESH message and closes menu', () => {
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    fireEvent.click(screen.getByTestId('overflow-menu-refresh'));
    expect(mockPostMessage).toHaveBeenCalledWith({ type: 'REFRESH' });
    expect(screen.queryByTestId('overflow-menu-dropdown')).not.toBeInTheDocument();
  });

  // 3.8 Test all workflows from store appear in menu
  test('all workflows from store appear in menu', () => {
    useDashboardStore.setState({ workflows: [workflow1, workflow2] });
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    expect(screen.getByTestId('overflow-menu-workflow-dev-story')).toBeInTheDocument();
    expect(screen.getByTestId('overflow-menu-workflow-create-story')).toBeInTheDocument();
  });

  // 3.9 Test clicking a workflow sends EXECUTE_WORKFLOW message and closes menu
  test('clicking a workflow sends EXECUTE_WORKFLOW message and closes menu', () => {
    useDashboardStore.setState({ workflows: [workflow1] });
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    fireEvent.click(screen.getByTestId('overflow-menu-workflow-dev-story'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });
    expect(screen.queryByTestId('overflow-menu-dropdown')).not.toBeInTheDocument();
  });

  // 3.10 Test clicking outside menu closes it
  test('clicking outside menu closes it', () => {
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    expect(screen.getByTestId('overflow-menu-dropdown')).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByTestId('overflow-menu-dropdown')).not.toBeInTheDocument();
  });

  // 3.11 Test pressing Escape closes menu
  test('pressing Escape closes menu', () => {
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    expect(screen.getByTestId('overflow-menu-dropdown')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('overflow-menu-dropdown')).not.toBeInTheDocument();
  });

  // 3.12 Test aria-expanded reflects menu state
  test('aria-expanded reflects menu state', () => {
    render(<HeaderToolbar />);
    const button = screen.getByTestId('overflow-menu-button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  // 3.13 Test all data-testid attributes present
  test('all data-testid attributes are present', () => {
    useDashboardStore.setState({ workflows: [workflow1] });
    render(<HeaderToolbar />);
    expect(screen.getByTestId('help-icon')).toBeInTheDocument();
    expect(screen.getByTestId('overflow-menu-button')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    expect(screen.getByTestId('overflow-menu-dropdown')).toBeInTheDocument();
    expect(screen.getByTestId('overflow-menu-refresh')).toBeInTheDocument();
    expect(screen.getByTestId('overflow-menu-workflow-dev-story')).toBeInTheDocument();
  });

  // 3.15 Test menu renders empty (no workflow items) when no workflows available (still shows Refresh)
  test('menu shows Refresh even when no workflows available', () => {
    useDashboardStore.setState({ workflows: [] });
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    expect(screen.getByTestId('overflow-menu-refresh')).toBeInTheDocument();
    const dropdown = screen.getByTestId('overflow-menu-dropdown');
    const buttons = dropdown.querySelectorAll('button');
    expect(buttons).toHaveLength(1); // Only Refresh
  });

  // L2 fix: ARIA menu roles
  test('dropdown has role=menu and items have role=menuitem', () => {
    useDashboardStore.setState({ workflows: [workflow1] });
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    const dropdown = screen.getByTestId('overflow-menu-dropdown');
    expect(dropdown).toHaveAttribute('role', 'menu');
    const menuItems = dropdown.querySelectorAll('[role="menuitem"]');
    expect(menuItems).toHaveLength(2); // Refresh + 1 workflow
  });

  // L1 fix: workflow menu items have icons
  test('workflow menu items have Play icon', () => {
    useDashboardStore.setState({ workflows: [workflow1] });
    render(<HeaderToolbar />);
    fireEvent.click(screen.getByTestId('overflow-menu-button'));
    const workflowButton = screen.getByTestId('overflow-menu-workflow-dev-story');
    expect(workflowButton.querySelector('svg')).toBeInTheDocument();
  });
});

// 3.14 Test skeleton renders placeholder elements
describe('HeaderToolbarSkeleton', () => {
  test('renders skeleton with placeholder elements', () => {
    render(<HeaderToolbarSkeleton />);
    const skeleton = screen.getByTestId('header-toolbar-skeleton');
    expect(skeleton).toBeInTheDocument();
    const placeholders = skeleton.querySelectorAll('div > div');
    expect(placeholders).toHaveLength(2);
  });
});
