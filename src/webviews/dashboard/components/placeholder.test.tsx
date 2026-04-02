import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Placeholder } from './placeholder';

describe('Placeholder', () => {
  it('renders without crashing', () => {
    render(<Placeholder />);
    expect(screen.getByText('BMAD Dashboard')).toBeInTheDocument();
  });

  it('displays success indicator', () => {
    render(<Placeholder />);
    expect(screen.getByText(/ready/i)).toBeInTheDocument();
  });

  it('displays description of upcoming functionality', () => {
    render(<Placeholder />);
    expect(screen.getByText(/sprint status/i)).toBeInTheDocument();
    expect(screen.getByText(/epic/i)).toBeInTheDocument();
    expect(screen.getByText(/workflow/i)).toBeInTheDocument();
  });

  it('has accessible heading structure', () => {
    render(<Placeholder />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('BMAD Dashboard');
  });
});
