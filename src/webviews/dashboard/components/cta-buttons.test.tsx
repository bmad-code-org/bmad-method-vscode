import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../store';
import { CTAButtons, CTAButtonsSkeleton } from './cta-buttons';
import type { AvailableWorkflow } from '@shared/types';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

const primaryWorkflow: AvailableWorkflow = {
  id: 'dev-story',
  name: 'Dev Story',
  command: '/bmad-bmm-dev-story',
  description: 'Implement the next story',
  isPrimary: true,
};

const secondaryWorkflow: AvailableWorkflow = {
  id: 'create-story',
  name: 'Create Story',
  command: '/bmad-bmm-create-story',
  description: 'Create a new story',
  isPrimary: false,
};

describe('CTAButtons', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({ workflows: [], loading: false });
  });

  test('renders nothing when workflows is empty array', () => {
    useDashboardStore.setState({ workflows: [] });
    const { container } = render(<CTAButtons />);
    expect(container.innerHTML).toBe('');
  });

  test('renders button for each workflow in the array', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow, secondaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByTestId('cta-execute-dev-story')).toBeInTheDocument();
    expect(screen.getByTestId('cta-execute-create-story')).toBeInTheDocument();
  });

  test('renders section with Actions heading', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByTestId('cta-buttons')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  test('primary workflow button has primary styling', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    render(<CTAButtons />);
    const button = screen.getByTestId('cta-execute-dev-story');
    expect(button.className).toContain('bg-[var(--vscode-button-background)]');
    expect(button.className).toContain('text-[var(--vscode-button-foreground)]');
  });

  test('secondary workflow buttons have secondary styling', () => {
    useDashboardStore.setState({ workflows: [secondaryWorkflow] });
    render(<CTAButtons />);
    const button = screen.getByTestId('cta-execute-create-story');
    expect(button.className).toContain('bg-[var(--vscode-button-secondaryBackground)]');
    expect(button.className).toContain('text-[var(--vscode-button-secondaryForeground)]');
  });

  test('clicking main button calls postMessage with EXECUTE_WORKFLOW and correct command', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    render(<CTAButtons />);
    fireEvent.click(screen.getByTestId('cta-execute-dev-story'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-dev-story' },
    });
  });

  test('clicking copy button calls postMessage with COPY_COMMAND and correct command', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    render(<CTAButtons />);
    fireEvent.click(screen.getByTestId('cta-copy-dev-story'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'COPY_COMMAND',
      payload: { command: '/bmad-bmm-dev-story' },
    });
  });

  test('buttons re-render when workflows state changes', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    const { rerender } = render(<CTAButtons />);
    expect(screen.getByTestId('cta-execute-dev-story')).toBeInTheDocument();
    expect(screen.queryByTestId('cta-execute-create-story')).not.toBeInTheDocument();

    useDashboardStore.setState({ workflows: [primaryWorkflow, secondaryWorkflow] });
    rerender(<CTAButtons />);
    expect(screen.getByTestId('cta-execute-dev-story')).toBeInTheDocument();
    expect(screen.getByTestId('cta-execute-create-story')).toBeInTheDocument();
  });

  test('displays workflow name on button', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByTestId('cta-execute-dev-story')).toHaveTextContent('Dev Story');
  });

  test('copy button has accessible aria-label', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByLabelText('Copy Dev Story command')).toBeInTheDocument();
  });
});

describe('CTAButtonsSkeleton', () => {
  test('renders with expected structure', () => {
    render(<CTAButtonsSkeleton />);
    expect(screen.getByTestId('cta-buttons-skeleton')).toBeInTheDocument();
  });

  test('has animate-pulse class for loading animation', () => {
    render(<CTAButtonsSkeleton />);
    const skeleton = screen.getByTestId('cta-buttons-skeleton');
    expect(skeleton.className).toContain('animate-pulse');
  });
});
