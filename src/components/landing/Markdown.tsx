import React from 'react';

/**
 * Tiny, dependency-free Markdown renderer tuned for the landing-page
 * rich-text sections. Supports the subset our admin authors actually use:
 *
 *   - paragraphs (blank-line separated)
 *   - `### heading` and `## heading` (and `# `)
 *   - `- ` / `* ` unordered lists (consecutive lines collapsed)
 *   - `1. ` / `2. ` ordered lists
 *   - `**bold**`  → <strong>
 *   - `*italic*`  → <em>
 *   - `[text](url)` links (external opens in new tab, safe rel attrs)
 *   - inline `` `code` `` → <code>
 *
 * Anything else is rendered verbatim, preserving line breaks via <br>.
 * We intentionally avoid pulling react-markdown to keep the bundle slim
 * and avoid SSR/RSC quirks — this renderer is fully synchronous & SSR-safe.
 */

type InlineToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'italic'; value: string }
  | { kind: 'code'; value: string }
  | { kind: 'link'; label: string; href: string };

function tokenizeInline(src: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let i = 0;
  // The order of probes matters: bold before italic so `**foo**` doesn't
  // get eaten as italic. Code spans win over everything inside them.
  while (i < src.length) {
    // inline code: `code`
    if (src[i] === '`') {
      const end = src.indexOf('`', i + 1);
      if (end > i) {
        tokens.push({ kind: 'code', value: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // bold: **text**
    if (src[i] === '*' && src[i + 1] === '*') {
      const end = src.indexOf('**', i + 2);
      if (end > i + 2) {
        tokens.push({ kind: 'bold', value: src.slice(i + 2, end) });
        i = end + 2;
        continue;
      }
    }
    // italic: *text* (single asterisk; avoid matching inside words)
    if (src[i] === '*') {
      const end = src.indexOf('*', i + 1);
      if (end > i + 1) {
        tokens.push({ kind: 'italic', value: src.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }
    // link: [label](href)
    if (src[i] === '[') {
      const labelEnd = src.indexOf(']', i + 1);
      if (labelEnd > i && src[labelEnd + 1] === '(') {
        const hrefEnd = src.indexOf(')', labelEnd + 2);
        if (hrefEnd > labelEnd + 1) {
          tokens.push({
            kind: 'link',
            label: src.slice(i + 1, labelEnd),
            href: src.slice(labelEnd + 2, hrefEnd),
          });
          i = hrefEnd + 1;
          continue;
        }
      }
    }
    // plain text — accumulate until the next special char
    let j = i;
    while (
      j < src.length &&
      src[j] !== '*' &&
      src[j] !== '`' &&
      src[j] !== '['
    ) {
      j++;
    }
    if (j === i) j = i + 1; // safety net to prevent infinite loop
    tokens.push({ kind: 'text', value: src.slice(i, j) });
    i = j;
  }
  return tokens;
}

function renderInline(src: string, keyPrefix: string): React.ReactNode[] {
  return tokenizeInline(src).map((t, i) => {
    const k = `${keyPrefix}-${i}`;
    switch (t.kind) {
      case 'bold':
        return <strong key={k}>{renderInline(t.value, k)}</strong>;
      case 'italic':
        return <em key={k}>{renderInline(t.value, k)}</em>;
      case 'code':
        return (
          <code
            key={k}
            className="px-1.5 py-0.5 rounded bg-gray-100 text-[0.9em] font-mono"
          >
            {t.value}
          </code>
        );
      case 'link': {
        const isExternal = /^https?:\/\//i.test(t.href);
        return (
          <a
            key={k}
            href={t.href}
            className="text-orange-600 hover:text-orange-700 underline underline-offset-2"
            {...(isExternal
              ? { target: '_blank', rel: 'noopener noreferrer' }
              : {})}
          >
            {t.label}
          </a>
        );
      }
      default:
        return <React.Fragment key={k}>{t.value}</React.Fragment>;
    }
  });
}

interface Block {
  kind: 'p' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol';
  /** For paragraphs/headings: a single string. For lists: an array of items. */
  content: string | string[];
}

function parseBlocks(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  // Helper to flush a paragraph buffer.
  let paraBuf: string[] = [];
  const flushPara = () => {
    if (paraBuf.length > 0) {
      blocks.push({ kind: 'p', content: paraBuf.join('\n') });
      paraBuf = [];
    }
  };

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (line === '') {
      flushPara();
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      flushPara();
      blocks.push({ kind: 'h3', content: line.slice(4).trim() });
      i++;
      continue;
    }
    if (line.startsWith('## ')) {
      flushPara();
      blocks.push({ kind: 'h2', content: line.slice(3).trim() });
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      flushPara();
      blocks.push({ kind: 'h1', content: line.slice(2).trim() });
      i++;
      continue;
    }

    // Unordered list — consume consecutive `- ` / `* ` items
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ul', content: items });
      continue;
    }

    // Ordered list — `1. `, `2. `, ...
    if (/^\d+\.\s+/.test(line)) {
      flushPara();
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'ol', content: items });
      continue;
    }

    // Default: accumulate into the current paragraph.
    paraBuf.push(line);
    i++;
  }
  flushPara();
  return blocks;
}

export default function Markdown({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  if (!source) return null;
  const blocks = parseBlocks(source);

  return (
    <div className={className}>
      {blocks.map((b, i) => {
        const k = `b-${i}`;
        if (b.kind === 'h1') {
          return (
            <h2
              key={k}
              className="text-2xl md:text-3xl font-black text-gray-900 mt-6 mb-3"
            >
              {renderInline(b.content as string, k)}
            </h2>
          );
        }
        if (b.kind === 'h2') {
          return (
            <h3
              key={k}
              className="text-xl md:text-2xl font-black text-gray-900 mt-5 mb-2.5"
            >
              {renderInline(b.content as string, k)}
            </h3>
          );
        }
        if (b.kind === 'h3') {
          return (
            <h4
              key={k}
              className="text-lg md:text-xl font-bold text-gray-900 mt-4 mb-2"
            >
              {renderInline(b.content as string, k)}
            </h4>
          );
        }
        if (b.kind === 'ul') {
          return (
            <ul
              key={k}
              className="list-disc pr-6 my-3 space-y-1.5 marker:text-orange-500"
            >
              {(b.content as string[]).map((item, j) => (
                <li key={`${k}-${j}`} className="leading-8">
                  {renderInline(item, `${k}-${j}`)}
                </li>
              ))}
            </ul>
          );
        }
        if (b.kind === 'ol') {
          return (
            <ol
              key={k}
              className="list-decimal pr-6 my-3 space-y-1.5 marker:text-orange-500 marker:font-bold"
            >
              {(b.content as string[]).map((item, j) => (
                <li key={`${k}-${j}`} className="leading-8">
                  {renderInline(item, `${k}-${j}`)}
                </li>
              ))}
            </ol>
          );
        }
        // paragraph — preserve internal soft line breaks as <br>
        const para = b.content as string;
        const lines = para.split('\n');
        return (
          <p key={k} className="my-3 leading-8">
            {lines.map((line, j) => (
              <React.Fragment key={`${k}-${j}`}>
                {renderInline(line, `${k}-${j}`)}
                {j < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
