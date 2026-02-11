import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { useDashboardStore } from '../store';
import { PlanningArtifactLinks } from './planning-artifact-links';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

describe('PlanningArtifactLinks', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({ outputRoot: '_bmad-output' });
  });

  test('renders PRD and Architecture links', () => {
    render(<PlanningArtifactLinks />);
    expect(screen.getByText('PRD')).toBeInTheDocument();
    expect(screen.getByText('Architecture')).toBeInTheDocument();
  });

  test('renders Planning Artifacts heading', () => {
    render(<PlanningArtifactLinks />);
    expect(screen.getByText('Planning Artifacts')).toBeInTheDocument();
  });

  test('sends OPEN_DOCUMENT message when PRD link clicked', () => {
    render(<PlanningArtifactLinks />);
    fireEvent.click(screen.getByText('PRD'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: '_bmad-output/planning-artifacts/prd.md' },
    });
  });

  test('sends OPEN_DOCUMENT message when Architecture link clicked', () => {
    render(<PlanningArtifactLinks />);
    fireEvent.click(screen.getByText('Architecture'));
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'OPEN_DOCUMENT',
      payload: { path: '_bmad-output/planning-artifacts/architecture.md' },
    });
  });

  test('renders links with correct test id container', () => {
    render(<PlanningArtifactLinks />);
    expect(screen.getByTestId('planning-artifact-links')).toBeInTheDocument();
  });

  test('renders nothing when links array is empty', () => {
    const { container } = render(<PlanningArtifactLinks links={[]} />);
    expect(container.innerHTML).toBe('');
  });
});
