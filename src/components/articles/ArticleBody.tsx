import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';

type Props = { content: string };

/**
 * Renders article body. Supports Markdown (headings, lists, tables, links,
 * bold/italic, blockquotes, code) so articles get proper H2/H3 structure
 * for SEO. Falls back gracefully on plain-text articles (no MD syntax)
 * because react-markdown still produces paragraphs from plain newlines.
 */
export default function ArticleBody({ content }: Props) {
  return (
    <div className="prose prose-base max-w-none text-gray-800 leading-9 prose-headings:font-black prose-headings:text-gray-900 prose-h2:mt-10 prose-h2:mb-3 prose-h2:text-2xl prose-h3:mt-7 prose-h3:mb-2 prose-h3:text-lg prose-p:my-4 prose-li:my-1 prose-a:text-orange-600 hover:prose-a:text-orange-700 prose-a:font-semibold prose-strong:text-gray-900 prose-blockquote:border-r-4 prose-blockquote:border-orange-400 prose-blockquote:bg-orange-50/40 prose-blockquote:rounded-l-lg prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:not-italic prose-blockquote:text-gray-700 prose-img:rounded-2xl prose-img:my-6 prose-table:text-sm prose-th:bg-gray-50 prose-th:font-bold">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Use Next.js Link for internal links (no full reload).
          a: ({ href, children, ...props }) => {
            if (!href) return <a {...props}>{children}</a>;
            const isInternal = href.startsWith('/') || href.startsWith('#');
            if (isInternal) {
              return (
                <Link href={href} {...(props as any)}>
                  {children}
                </Link>
              );
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}
