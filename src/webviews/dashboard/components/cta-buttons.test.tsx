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
  kind: 'primary' as const,
};

const mandatoryWorkflow: AvailableWorkflow = {
  id: 'validate-prd',
  name: 'Validate PRD',
  command: '/bmad-bmm-validate-prd',
  description: 'Validate the PRD',
  kind: 'mandatory' as const,
};

const secondaryWorkflow: AvailableWorkflow = {
  id: 'create-story',
  name: 'Create Story',
  command: '/bmad-bmm-create-story',
  description: 'Create a new story',
  kind: 'optional' as const,
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

  test('renders only secondary workflow buttons (primary is filtered out)', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow, secondaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.queryByTestId('cta-execute-dev-story')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cta-copy-dev-story')).not.toBeInTheDocument();
    expect(screen.getByTestId('cta-execute-create-story')).toBeInTheDocument();
    expect(screen.getByTestId('cta-copy-create-story')).toBeInTheDocument();
  });

  test('renders section with Other Actions heading', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow, secondaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByTestId('cta-buttons')).toBeInTheDocument();
    expect(screen.getByText('Other Actions')).toBeInTheDocument();
  });

  test('returns null when only primary workflow exists (no secondary)', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    const { container } = render(<CTAButtons />);
    expect(container.innerHTML).toBe('');
  });

  test('secondary workflow buttons have secondary styling', () => {
    useDashboardStore.setState({ workflows: [secondaryWorkflow] });
    render(<CTAButtons />);
    const button = screen.getByTestId('cta-execute-create-story');
    expect(button.className).toContain('bg-[var(--vscode-button-secondaryBackground)]');
    expect(button.className).toContain('text-[var(--vscode-button-secondaryForeground)]');
  });

  test('clicking execute button calls postMessage with EXECUTE_WORKFLOW and correct command', () => {
    useDashboardStore.setState({ workflows: [secondaryWorkflow] });
    render(<CTAButtons />);
    fireEvent.click(screen.getByTestId('cta-execute-create-story'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-create-story' },
    });
  });

  test('clicking copy button calls postMessage with COPY_COMMAND and correct command', () => {
    useDashboardStore.setState({ workflows: [secondaryWorkflow] });
    render(<CTAButtons />);
    fireEvent.click(screen.getByTestId('cta-copy-create-story'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'COPY_COMMAND',
      payload: { command: '/bmad-bmm-create-story' },
    });
  });

  test('buttons re-render when workflows state changes', () => {
    useDashboardStore.setState({ workflows: [secondaryWorkflow] });
    const { rerender } = render(<CTAButtons />);
    expect(screen.getByTestId('cta-execute-create-story')).toBeInTheDocument();

    useDashboardStore.setState({ workflows: [] });
    rerender(<CTAButtons />);
    expect(screen.queryByTestId('cta-execute-create-story')).not.toBeInTheDocument();
  });

  test('displays workflow name on button', () => {
    useDashboardStore.setState({ workflows: [secondaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByTestId('cta-execute-create-story')).toHaveTextContent('Create Story');
  });

  test('copy button has accessible aria-label', () => {
    useDashboardStore.setState({ workflows: [secondaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByLabelText('Copy Create Story command')).toBeInTheDocument();
  });

  test('copy button title shows full command', () => {
    useDashboardStore.setState({ workflows: [secondaryWorkflow] });
    render(<CTAButtons />);
    const copyButton = screen.getByTestId('cta-copy-create-story');
    expect(copyButton).toHaveAttribute('title', 'Copy: /bmad-bmm-create-story');
  });

  test('renders mandatory section with Required Actions heading', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow, mandatoryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByTestId('cta-mandatory')).toBeInTheDocument();
    expect(screen.getByText('Required Actions')).toBeInTheDocument();
  });

  test('mandatory workflow buttons have primary styling', () => {
    useDashboardStore.setState({ workflows: [mandatoryWorkflow] });
    render(<CTAButtons />);
    const button = screen.getByTestId('cta-execute-validate-prd');
    expect(button.className).toContain('bg-[var(--vscode-button-background)]');
    expect(button.className).toContain('text-[var(--vscode-button-foreground)]');
  });

  test('renders both mandatory and optional sections when both kinds exist', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow, mandatoryWorkflow, secondaryWorkflow] });
    render(<CTAButtons />);
    expect(screen.getByTestId('cta-mandatory')).toBeInTheDocument();
    expect(screen.getByTestId('cta-buttons')).toBeInTheDocument();
    expect(screen.getByText('Required Actions')).toBeInTheDocument();
    expect(screen.getByText('Other Actions')).toBeInTheDocument();
  });

  test('clicking mandatory execute button sends EXECUTE_WORKFLOW', () => {
    useDashboardStore.setState({ workflows: [mandatoryWorkflow] });
    render(<CTAButtons />);
    fireEvent.click(screen.getByTestId('cta-execute-validate-prd'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'EXECUTE_WORKFLOW',
      payload: { command: '/bmad-bmm-validate-prd' },
    });
  });

  test('renders nothing when only primary workflow exists (no mandatory or optional)', () => {
    useDashboardStore.setState({ workflows: [primaryWorkflow] });
    const { container } = render(<CTAButtons />);
    expect(container.innerHTML).toBe('');
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
