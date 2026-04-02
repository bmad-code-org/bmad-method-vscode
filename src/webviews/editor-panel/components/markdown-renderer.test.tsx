import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarkdownRenderer } from './markdown-renderer';

describe('MarkdownRenderer', () => {
  it('renders with data-testid', () => {
    render(<MarkdownRenderer content="Hello" />);
    expect(screen.getByTestId('markdown-renderer')).toBeInTheDocument();
  });

  it('renders headings', () => {
    const md = `# Title\n\n## Subtitle\n\n### Section`;
    render(<MarkdownRenderer content={md} showToc={false} />);
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Subtitle')).toBeInTheDocument();
    expect(screen.getByText('Section')).toBeInTheDocument();
  });

  it('renders heading with id for TOC linking', () => {
    render(<MarkdownRenderer content={'## My Heading'} showToc={false} />);
    const heading = screen.getByText('My Heading');
    expect(heading.id).toBe('my-heading');
  });

  it('renders lists', () => {
    const md = `- Item 1\n- Item 2\n- Item 3`;
    render(<MarkdownRenderer content={md} showToc={false} />);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('renders tables', () => {
    const md = `| Name | Value |\n| --- | --- |\n| foo | bar |`;
    render(<MarkdownRenderer content={md} showToc={false} />);
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('foo')).toBeInTheDocument();
    expect(screen.getByText('bar')).toBeInTheDocument();
  });

  it('renders code blocks with copy button', () => {
    const md = '```js\nconsole.log("hello");\n```';
    render(<MarkdownRenderer content={md} showToc={false} />);
    expect(screen.getByTestId('copy-code-button')).toBeInTheDocument();
  });

  it('renders GFM task lists', () => {
    const md = `- [x] Done\n- [ ] Not done`;
    render(<MarkdownRenderer content={md} showToc={false} />);
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();
  });

  it('renders blockquotes', () => {
    render(<MarkdownRenderer content={`> This is a quote`} showToc={false} />);
    expect(screen.getByText('This is a quote')).toBeInTheDocument();
  });

  it('renders bold and italic text', () => {
    render(<MarkdownRenderer content={`**bold** and *italic*`} showToc={false} />);
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('italic')).toBeInTheDocument();
  });

  it('renders inline code', () => {
    render(<MarkdownRenderer content={'Use `myFunc()` here'} showToc={false} />);
    expect(screen.getByText('myFunc()')).toBeInTheDocument();
  });

  describe('Table of Contents', () => {
    it('renders TOC when showToc is true and headings exist', () => {
      const md = `## Heading One\n\n## Heading Two`;
      render(<MarkdownRenderer content={md} showToc={true} />);
      expect(screen.getByTestId('table-of-contents')).toBeInTheDocument();
      expect(screen.getByText('Table of Contents')).toBeInTheDocument();
    });

    it('does not render TOC when showToc is false', () => {
      render(<MarkdownRenderer content={`## Heading One`} showToc={false} />);
      expect(screen.queryByTestId('table-of-contents')).not.toBeInTheDocument();
    });

    it('does not render TOC when no headings', () => {
      render(<MarkdownRenderer content="No headings here" showToc={true} />);
      expect(screen.queryByTestId('table-of-contents')).not.toBeInTheDocument();
    });

    it('TOC is collapsible', () => {
      const md = `## Heading One\n\n## Heading Two`;
      render(<MarkdownRenderer content={md} />);
      const tocButton = screen.getByText('Table of Contents');

      // Initially expanded — headings should be visible in TOC and in content
      expect(screen.getAllByText('Heading One')).toHaveLength(2);

      // Collapse
      fireEvent.click(tocButton);
      // After collapsing, the TOC list is hidden
      const tocEntries = screen.getByTestId('table-of-contents').querySelectorAll('ul li');
      expect(tocEntries).toHaveLength(0);
    });

    it('generates correct entries from markdown headings', () => {
      const md = `# Title\n\n## Section A\n\n### Sub A1\n\n## Section B`;
      render(<MarkdownRenderer content={md} />);

      const toc = screen.getByTestId('table-of-contents');
      const tocButtons = toc.querySelectorAll('ul button');
      expect(tocButtons).toHaveLength(4);
    });
  });
});
