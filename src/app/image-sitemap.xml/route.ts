import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import { getAppUrl } from '@/lib/app-url';

export const revalidate = 3600;

/**
 * Image sitemap — surfaces editorial cover images so Google Images can
 * index them. We deliberately do *not* list ad images here:
 *
 *  - /ads/<id> pages are `noindex, follow` (see src/app/ads/[id]/page.tsx)
 *    and Google does not index images embedded on noindex pages, so
 *    listing them would only burn crawl budget.
 *  - Articles, on the other hand, are evergreen indexable assets with
 *    a stable cover image — exactly what an image sitemap should target.
 *
 * Reference:
 *   https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
 */
export async function GET() {
  const base = getAppUrl().replace(/\/$/, '');

  let articles: any[] = [];
  try {
    await connectDB();
    articles = await Article.find({
      status: 'published',
      coverImage: { $exists: true, $ne: '' },
    })
      .select('slug title coverImage updatedAt')
      .sort({ updatedAt: -1 })
      .limit(2000)
      .lean();
  } catch {
    articles = [];
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
      const img = a.coverImage as string;
      const imgUrl = img.startsWith('http') ? img : `${base}${img}`;
      return `  <url>
    <loc>${escape(loc)}</loc>
    <image:image>
      <image:loc>${escape(imgUrl)}</image:loc>
      <image:title>${escape(a.title || '')}</image:title>
    </image:image>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
