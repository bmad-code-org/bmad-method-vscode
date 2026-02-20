import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the Dashboard and EditorPanel components to isolate routing logic
vi.mock('./dashboard', () => ({
  Dashboard: () => <div data-testid="dashboard">Dashboard</div>,
}));

vi.mock('./editor-panel', () => ({
  EditorPanel: () => <div data-testid="editor-panel">EditorPanel</div>,
}));

import { App } from './app';

describe('App - context-based routing', () => {
  let rootEl: HTMLDivElement;

  beforeEach(() => {
    // Create a real #root element so document.getElementById('root') works
    rootEl = document.createElement('div');
    rootEl.id = 'root';
    document.body.appendChild(rootEl);
  });

  afterEach(() => {
    document.body.removeChild(rootEl);
  });

  it('renders Dashboard when no data-view attribute is set', () => {
    // No data-view attribute → default = Dashboard
    render(<App />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('editor-panel')).not.toBeInTheDocument();
  });

  it('renders EditorPanel when data-view="editor-panel"', () => {
    rootEl.dataset.view = 'editor-panel';
    render(<App />);
    expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
    expect(screen.queryByTestId('dashboard')).not.toBeInTheDocument();
  });

  it('renders Dashboard for unknown data-view values', () => {
    rootEl.dataset.view = 'unknown-view';
    render(<App />);
    expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('editor-panel')).not.toBeInTheDocument();
  });
});
