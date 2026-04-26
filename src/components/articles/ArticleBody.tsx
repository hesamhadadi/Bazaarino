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
    <div
      className="
        prose prose-lg max-w-none text-gray-800
        leading-[2.15rem]
        font-vazir
        [&>*:first-child]:mt-0
        prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight
        prose-h2:relative prose-h2:text-[1.6rem] md:prose-h2:text-[1.85rem]
        prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-3
        prose-h2:border-b prose-h2:border-orange-100
        prose-h2:before:content-[''] prose-h2:before:absolute prose-h2:before:right-0 prose-h2:before:-top-1
        prose-h2:before:w-12 prose-h2:before:h-1.5 prose-h2:before:rounded-full
        prose-h2:before:bg-gradient-to-l prose-h2:before:from-orange-500 prose-h2:before:to-amber-400
        prose-h2:pt-4
        prose-h3:text-[1.2rem] md:prose-h3:text-[1.3rem]
        prose-h3:mt-9 prose-h3:mb-3 prose-h3:text-gray-900
        prose-h3:relative prose-h3:pr-4
        prose-h3:before:content-[''] prose-h3:before:absolute prose-h3:before:right-0 prose-h3:before:top-1.5
        prose-h3:before:bottom-1.5 prose-h3:before:w-1 prose-h3:before:rounded-full
        prose-h3:before:bg-orange-400
        prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2 prose-h4:text-gray-900
        prose-p:my-5 prose-p:text-[17px] prose-p:leading-[2.1rem] prose-p:text-gray-700
        prose-strong:text-gray-900 prose-strong:font-bold
        prose-em:text-orange-700 prose-em:not-italic prose-em:font-semibold
        prose-a:text-orange-600 hover:prose-a:text-orange-700 prose-a:font-semibold prose-a:underline prose-a:decoration-orange-200 prose-a:decoration-2 prose-a:underline-offset-4 hover:prose-a:decoration-orange-400
        prose-ul:my-5 prose-ul:pr-2 prose-ol:my-5 prose-ol:pr-2
        prose-li:my-2 prose-li:text-gray-700 prose-li:marker:text-orange-500
        prose-li:[&>strong]:text-gray-900
        prose-blockquote:relative prose-blockquote:not-italic
        prose-blockquote:my-7 prose-blockquote:py-4 prose-blockquote:px-5
        prose-blockquote:border-r-[4px] prose-blockquote:border-orange-400
        prose-blockquote:bg-gradient-to-l prose-blockquote:from-orange-50 prose-blockquote:to-amber-50/40
        prose-blockquote:rounded-l-2xl prose-blockquote:rounded-tr-md
        prose-blockquote:text-gray-800 prose-blockquote:font-medium
        prose-blockquote:shadow-sm
        prose-blockquote:[&>p]:my-0
        prose-img:rounded-2xl prose-img:my-8 prose-img:shadow-md prose-img:ring-1 prose-img:ring-gray-100
        prose-figure:my-8 prose-figcaption:text-center prose-figcaption:text-xs prose-figcaption:text-gray-500 prose-figcaption:mt-2
        prose-table:text-sm prose-table:my-7 prose-table:rounded-xl prose-table:overflow-hidden prose-table:ring-1 prose-table:ring-gray-200
        prose-thead:bg-gradient-to-l prose-thead:from-orange-50 prose-thead:to-amber-50
        prose-th:font-bold prose-th:text-gray-900 prose-th:py-3 prose-th:px-4 prose-th:text-right
        prose-td:py-3 prose-td:px-4 prose-td:border-t prose-td:border-gray-100
        prose-tr:hover:bg-gray-50/60
        prose-code:text-orange-700 prose-code:bg-orange-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:text-[0.95em] prose-code:font-bold prose-code:before:content-[''] prose-code:after:content-['']
        prose-pre:bg-gray-900 prose-pre:rounded-2xl prose-pre:p-5 prose-pre:my-6 prose-pre:text-sm prose-pre:leading-7 prose-pre:shadow-md
        prose-hr:my-10 prose-hr:border-gray-200
      "
    >
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
