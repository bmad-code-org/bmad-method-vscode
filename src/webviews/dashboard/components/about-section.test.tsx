import { render, screen } from '@testing-library/react';
import { describe, test, expect, beforeEach } from 'vitest';
import { useDashboardStore } from '../store';
import { AboutSection, AboutSectionSkeleton } from './about-section';
import type { BmadMetadata } from '@shared/types';

const mockMetadata: BmadMetadata = {
  version: '6.0.0-Beta.7',
  lastUpdated: '2026-02-06T10:56:23.659Z',
  modules: [
    { name: 'core', version: '6.0.0-Beta.7', source: 'built-in' },
    { name: 'bmm', version: '6.0.0-Beta.7', source: 'built-in' },
  ],
};

describe('AboutSection', () => {
  beforeEach(() => {
    useDashboardStore.setState({
      bmadMetadata: mockMetadata,
      loading: false,
    });
  });

  test('renders version from store metadata', () => {
    render(<AboutSection />);
    expect(screen.getByText('6.0.0-Beta.7')).toBeInTheDocument();
  });

  test('renders formatted last updated date', () => {
    render(<AboutSection />);
    expect(screen.getByText('Feb 6, 2026')).toBeInTheDocument();
  });

  test('renders module list', () => {
    render(<AboutSection />);
    expect(screen.getByText('core, bmm')).toBeInTheDocument();
  });

  test('handles null metadata (shows "Unknown" fallback)', () => {
    useDashboardStore.setState({ bmadMetadata: null });
    render(<AboutSection />);
    const unknowns = screen.getAllByText('Unknown');
    expect(unknowns.length).toBe(3);
  });

  test('has correct data-testid attribute', () => {
    render(<AboutSection />);
    expect(screen.getByTestId('about-section')).toBeInTheDocument();
  });

  test('has aria-label attribute', () => {
    render(<AboutSection />);
    const section = screen.getByTestId('about-section');
    expect(section.getAttribute('aria-label')).toBe('About BMAD');
  });

  test('renders "About" section header', () => {
    render(<AboutSection />);
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  test('handles metadata with empty modules array', () => {
    useDashboardStore.setState({
      bmadMetadata: { ...mockMetadata, modules: [] },
    });
    render(<AboutSection />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });

  test('handles metadata with empty lastUpdated string', () => {
    useDashboardStore.setState({
      bmadMetadata: { ...mockMetadata, lastUpdated: '' },
    });
    render(<AboutSection />);
    const updatedLabels = screen.getByTestId('about-section').querySelectorAll('div');
    const updatedDiv = Array.from(updatedLabels).find((el) => el.textContent?.includes('Updated:'));
    expect(updatedDiv).toHaveTextContent('Unknown');
  });

  test('handles metadata with invalid date gracefully', () => {
    useDashboardStore.setState({
      bmadMetadata: { ...mockMetadata, lastUpdated: 'not-a-date' },
    });
    render(<AboutSection />);
    // Invalid dates should show "Unknown" fallback
    const updatedLabels = screen.getByTestId('about-section').querySelectorAll('div');
    const updatedDiv = Array.from(updatedLabels).find((el) => el.textContent?.includes('Updated:'));
    expect(updatedDiv).toHaveTextContent('Unknown');
  });
});

describe('AboutSectionSkeleton', () => {
  test('renders skeleton with correct data-testid', () => {
    render(<AboutSectionSkeleton />);
    expect(screen.getByTestId('about-section-skeleton')).toBeInTheDocument();
  });

  test('has animate-pulse class for loading animation', () => {
    render(<AboutSectionSkeleton />);
    const skeleton = screen.getByTestId('about-section-skeleton');
    expect(skeleton.className).toContain('animate-pulse');
  });
});
