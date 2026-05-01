import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import { getAppUrl } from '@/lib/app-url';

export const revalidate = 600;

// Google News sitemap. Officially only articles from the last 48 hours are
// eligible for News rich-results, but if the site has had no fresh posts
// in that window the sitemap would otherwise be an empty <urlset>, which
// Google Search Console flags as "Missing url tag" / sitemap error.
//
// To keep the file always valid we fall back to the most recent published
// articles regardless of age. Older items will simply not be picked up by
// News; the rest of regular Search continues to work, and most importantly
// the sitemap stops failing validation.
//
// Reference:
//   https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
export async function GET() {
  const base = getAppUrl();
  const since = new Date(Date.now() - 48 * 60 * 60 * 1000);

  let articles: any[] = [];
  try {
    await connectDB();
    articles = await Article.find({
      status: 'published',
      createdAt: { $gte: since },
    })
      .select('title slug createdAt tags')
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    // Fallback: if no fresh articles were published in the 48h window,
    // emit the latest 20 published articles instead of returning an
    // empty sitemap (which Search Console rejects).
    if (articles.length === 0) {
      articles = await Article.find({ status: 'published' })
        .select('title slug createdAt tags')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
    }
  } catch (err) {
    console.error('[news-sitemap] failed', err);
  }

  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const urls = articles
    .map((a) => {
      const loc = `${base}/news/${encodeURIComponent(a.slug)}`;
      const pub = new Date(a.createdAt).toISOString();
      const keywords = Array.isArray(a.tags) ? a.tags.join(', ') : '';
      return `  <url>
    <loc>${escape(loc)}</loc>
    <news:news>
      <news:publication>
        <news:name>بازارینو</news:name>
        <news:language>fa</news:language>
      </news:publication>
      <news:publication_date>${pub}</news:publication_date>
      <news:title>${escape(a.title)}</news:title>
      ${keywords ? `<news:keywords>${escape(keywords)}</news:keywords>` : ''}
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600',
    },
  });
}
