import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from './store';
import { Dashboard } from './index';

const mockPostMessage = vi.fn();
vi.mock('../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

vi.mock('./hooks', () => ({
  useMessageHandler: vi.fn(),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({ loading: false, errors: [] });
  });

  test('renders RefreshButton in loaded state', () => {
    useDashboardStore.setState({ loading: false });
    render(<Dashboard />);
    expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  test('renders RefreshButton in loading state', () => {
    useDashboardStore.setState({ loading: true });
    render(<Dashboard />);
    expect(screen.getByTestId('dashboard-loading')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });
});
