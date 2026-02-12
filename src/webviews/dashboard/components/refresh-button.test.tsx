import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { useDashboardStore } from '../store';
import { RefreshButton } from './refresh-button';

const mockPostMessage = vi.fn();
vi.mock('../../shared/hooks', () => ({
  useVSCodeApi: () => ({ postMessage: mockPostMessage }),
}));

describe('RefreshButton', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
    useDashboardStore.setState({ loading: false, errors: [] });
  });

  test('renders refresh button with correct data-testid', () => {
    render(<RefreshButton />);
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  test('sends REFRESH message via postMessage when clicked', () => {
    render(<RefreshButton />);
    fireEvent.click(screen.getByTestId('refresh-button'));
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'REFRESH' }));
  });

  test('button is disabled when loading is true', () => {
    useDashboardStore.setState({ loading: true });
    render(<RefreshButton />);
    expect(screen.getByTestId('refresh-button')).toBeDisabled();
  });

  test('button shows "Refreshing..." text when loading', () => {
    useDashboardStore.setState({ loading: true });
    render(<RefreshButton />);
    expect(screen.getByTestId('refresh-button')).toHaveTextContent('Refreshing...');
  });

  test('button is enabled when loading is false', () => {
    useDashboardStore.setState({ loading: false });
    render(<RefreshButton />);
    expect(screen.getByTestId('refresh-button')).toBeEnabled();
  });

  test('button shows "Refresh" text when not loading', () => {
    render(<RefreshButton />);
    expect(screen.getByTestId('refresh-button')).toHaveTextContent('Refresh');
  });

  test('has accessible aria-label', () => {
    render(<RefreshButton />);
    expect(screen.getByLabelText('Refresh dashboard')).toBeInTheDocument();
  });

  test('button is clickable when errors exist in store', () => {
    useDashboardStore.setState({
      loading: false,
      errors: [{ message: 'Parse error', recoverable: true }],
    });
    render(<RefreshButton />);
    const button = screen.getByTestId('refresh-button');
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(mockPostMessage).toHaveBeenCalledWith(expect.objectContaining({ type: 'REFRESH' }));
  });
});
