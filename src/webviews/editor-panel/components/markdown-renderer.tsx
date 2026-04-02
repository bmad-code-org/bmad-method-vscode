import React, { useState, useCallback, type ReactNode, type HTMLAttributes } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';
import '../styles/hljs-vscode.css';

// ============================================================================
// Heading slug utility
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

// ============================================================================
// Table of Contents
// ============================================================================

interface TocEntry {
  level: number;
  text: string;
  id: string;
}

function extractHeadings(markdown: string): TocEntry[] {
  const entries: TocEntry[] = [];
  const lines = markdown.split('\n');
  let inCodeBlock = false;

  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      continue;
    }
    if (inCodeBlock) continue;

    const match = line.match(/^(#{1,4})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].replace(/[*_`~]/g, '').trim();
      entries.push({ level, text, id: slugify(text) });
    }
  }

  return entries;
}

function TableOfContents({ markdown }: { markdown: string }) {
  const [expanded, setExpanded] = useState(true);
  const headings = extractHeadings(markdown);

  if (headings.length === 0) return null;

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      className="mb-4 rounded border"
      style={{
        borderColor: 'var(--vscode-panel-border)',
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
      }}
      data-testid="table-of-contents"
    >
      <button
        className="flex w-full items-center gap-1 px-3 py-2 text-left text-sm font-semibold"
        style={{ color: 'var(--vscode-foreground)' }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        Table of Contents
      </button>
      {expanded && (
        <ul className="px-3 pb-2">
          {headings.map((h, i) => (
            <li key={`${h.id}-${i}`} style={{ paddingLeft: `${(h.level - 1) * 12}px` }}>
              <button
                className="block w-full py-0.5 text-left text-sm hover:underline"
                style={{ color: 'var(--vscode-textLink-foreground)' }}
                onClick={() => handleClick(h.id)}
              >
                {h.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================================
// Copy Button for Code Blocks
// ============================================================================

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in webview
    }
  }, [text]);

  return (
    <button
      className="absolute top-2 right-2 rounded p-1 opacity-0 transition-opacity group-hover:opacity-100"
      style={{
        background: 'var(--vscode-button-background)',
        color: 'var(--vscode-button-foreground)',
      }}
      onClick={() => void handleCopy()}
      title="Copy code"
      data-testid="copy-code-button"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function CustomPre({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  // Extract text content from children for the copy button
  const extractText = (node: ReactNode): string => {
    if (typeof node === 'string') return node;
    if (typeof node === 'number') return String(node);
    if (!node) return '';
    if (Array.isArray(node)) return node.map(extractText).join('');
    if (typeof node === 'object' && 'props' in node) {
      const props = (node as { props: { children?: ReactNode } }).props;
      return extractText(props.children);
    }
    return '';
  };

  const text = extractText(children);

  return (
    <pre
      {...props}
      className="group relative overflow-x-auto rounded p-4"
      style={{
        background: 'var(--vscode-textCodeBlock-background)',
      }}
    >
      {children}
      <CopyButton text={text} />
    </pre>
  );
}

// ============================================================================
// Custom heading component with id for TOC linking
// ============================================================================

const HEADING_SIZES: Record<number, string> = {
  1: 'text-2xl font-bold',
  2: 'text-xl font-semibold',
  3: 'text-lg font-semibold',
  4: 'text-base font-semibold',
};

function HeadingBase({
  level,
  children,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { level: number }) {
  const text =
    typeof children === 'string'
      ? children
      : Array.isArray(children)
        ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
        : '';
  const id = slugify(text);
  const borderClass = level === 1 ? ' border-b pb-2' : '';
  const style = {
    color: 'var(--vscode-foreground)',
    borderColor: level === 1 ? 'var(--vscode-panel-border)' : undefined,
  };
  const className = `mt-4 mb-2 ${HEADING_SIZES[level] ?? ''}${borderClass}`;

  if (level === 1)
    return (
      <h1 {...props} id={id} className={className} style={style}>
        {children}
      </h1>
    );
  if (level === 2)
    return (
      <h2 {...props} id={id} className={className} style={style}>
        {children}
      </h2>
    );
  if (level === 3)
    return (
      <h3 {...props} id={id} className={className} style={style}>
        {children}
      </h3>
    );
  return (
    <h4 {...props} id={id} className={className} style={style}>
      {children}
    </h4>
  );
}

function createHeading(level: number) {
  function HeadingComponent(props: HTMLAttributes<HTMLHeadingElement>) {
    return <HeadingBase {...props} level={level} />;
  }
  HeadingComponent.displayName = `Heading${level}`;
  return HeadingComponent;
}

// ============================================================================
// Hoisted component overrides (stable references, not recreated per render)
// ============================================================================

const Heading1 = createHeading(1);
const Heading2 = createHeading(2);
const Heading3 = createHeading(3);
const Heading4 = createHeading(4);

function CustomAnchor({
  children,
  href,
  ...props
}: HTMLAttributes<HTMLAnchorElement> & { href?: string }) {
  return (
    <a
      {...props}
      href={href}
      style={{ color: 'var(--vscode-textLink-foreground)' }}
      className="hover:underline"
    >
      {children}
    </a>
  );
}

function CustomTable({ children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      {...props}
      className="my-2 w-full border-collapse"
      style={{ borderColor: 'var(--vscode-panel-border)' }}
    >
      {children}
    </table>
  );
}

function CustomTh({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      {...props}
      className="border px-3 py-1.5 text-left text-sm font-semibold"
      style={{
        borderColor: 'var(--vscode-panel-border)',
        background: 'var(--vscode-editor-inactiveSelectionBackground)',
      }}
    >
      {children}
    </th>
  );
}

function CustomTd({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      {...props}
      className="border px-3 py-1.5 text-sm"
      style={{ borderColor: 'var(--vscode-panel-border)' }}
    >
      {children}
    </td>
  );
}

function CustomBlockquote({ children, ...props }: HTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      {...props}
      className="my-2 rounded-r px-4 py-2"
      style={{
        borderLeft: '3px solid var(--vscode-textBlockQuote-border)',
        background: 'var(--vscode-textBlockQuote-background)',
      }}
    >
      {children}
    </blockquote>
  );
}

function CustomUl({ children, ...props }: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul {...props} className="my-1 ml-4 list-disc space-y-0.5">
      {children}
    </ul>
  );
}

function CustomOl({ children, ...props }: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol {...props} className="my-1 ml-4 list-decimal space-y-0.5">
      {children}
    </ol>
  );
}

function CustomCode({ children, className, ...props }: HTMLAttributes<HTMLElement>) {
  if (!className) {
    return (
      <code
        {...props}
        className="rounded px-1 py-0.5 text-sm"
        style={{
          background: 'var(--vscode-textCodeBlock-background)',
          fontFamily: 'var(--vscode-editor-font-family)',
        }}
      >
        {children}
      </code>
    );
  }
  return (
    <code
      {...props}
      className={className}
      style={{
        fontFamily: 'var(--vscode-editor-font-family)',
        fontSize: 'var(--vscode-editor-font-size)',
      }}
    >
      {children}
    </code>
  );
}

function CustomInput({ type, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  if (type === 'checkbox') {
    return (
      <input
        {...props}
        type="checkbox"
        disabled
        className="mr-1.5"
        style={{ accentColor: 'var(--vscode-focusBorder)' }}
      />
    );
  }
  return <input type={type} {...props} />;
}

function CustomParagraph({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p {...props} className="my-1.5 leading-relaxed">
      {children}
    </p>
  );
}

function CustomHr(props: HTMLAttributes<HTMLHRElement>) {
  return <hr {...props} className="my-4" style={{ borderColor: 'var(--vscode-panel-border)' }} />;
}

const MARKDOWN_COMPONENTS = {
  h1: Heading1,
  h2: Heading2,
  h3: Heading3,
  h4: Heading4,
  pre: CustomPre,
  a: CustomAnchor,
  table: CustomTable,
  th: CustomTh,
  td: CustomTd,
  blockquote: CustomBlockquote,
  ul: CustomUl,
  ol: CustomOl,
  code: CustomCode,
  input: CustomInput,
  p: CustomParagraph,
  hr: CustomHr,
};

const REMARK_PLUGINS = [remarkGfm];
const REHYPE_PLUGINS = [rehypeHighlight];

// ============================================================================
// MarkdownRenderer Component
// ============================================================================

interface MarkdownRendererProps {
  content: string;
  showToc?: boolean;
}

export function MarkdownRenderer({ content, showToc = true }: MarkdownRendererProps) {
  return (
    <div data-testid="markdown-renderer" className="markdown-content">
      {showToc && <TableOfContents markdown={content} />}
      <Markdown
        remarkPlugins={REMARK_PLUGINS}
        rehypePlugins={REHYPE_PLUGINS}
        components={MARKDOWN_COMPONENTS}
      >
        {content}
      </Markdown>
    </div>
  );
}
