import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EditorPanelPlaceholder } from './placeholder';

describe('EditorPanelPlaceholder', () => {
  it('renders without crashing', () => {
    render(<EditorPanelPlaceholder />);
    expect(screen.getByTestId('editor-panel-placeholder')).toBeInTheDocument();
  });

  it('displays the panel title', () => {
    render(<EditorPanelPlaceholder />);
    expect(screen.getByText('BMAD Project')).toBeInTheDocument();
  });

  it('displays coming soon message', () => {
    render(<EditorPanelPlaceholder />);
    expect(screen.getByText('Editor panel views coming soon.')).toBeInTheDocument();
  });

  it('has accessible heading structure', () => {
    render(<EditorPanelPlaceholder />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('BMAD Project');
  });
});
