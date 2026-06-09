import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import '@/models/User';
import { getAppUrl } from '@/lib/app-url';

export const revalidate = 1800;
export const dynamic = 'force-dynamic';

const escape = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// RSS 2.0 feed
export async function GET() {
  const base = getAppUrl();
  let articles: any[] = [];
  try {
    await connectDB();
    articles = await Article.find({ status: 'published' })
      .populate('authorId', 'name')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
  } catch (err) {
    console.error('[feed.xml] failed', err);
  }

  const items = articles
    .map((a: any) => {
      const url = `${base}/news/${encodeURIComponent(a.slug)}`;
      const pub = new Date(a.createdAt).toUTCString();
      const author = a.authorId?.name || 'تحریریه بازارینو';
      const enclosure = a.coverImage
        ? `<enclosure url="${escape(a.coverImage.startsWith('http') ? a.coverImage : `${base}${a.coverImage}`)}" type="image/jpeg" />`
        : '';
      const categories = Array.isArray(a.tags)
        ? a.tags.map((t: string) => `<category>${escape(t)}</category>`).join('')
        : '';
      return `    <item>
      <title>${escape(a.title)}</title>
      <link>${escape(url)}</link>
      <guid isPermaLink="true">${escape(url)}</guid>
      <description>${escape(a.excerpt || '')}</description>
      <pubDate>${pub}</pubDate>
      <author>noreply@bazaarino.online (${escape(author)})</author>
      ${categories}
      ${enclosure}
    </item>`;
    })
    .join('\n');

  const lastBuild = articles[0] ? new Date(articles[0].createdAt).toUTCString() : new Date().toUTCString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>بازارینو — اخبار و مقالات</title>
    <link>${escape(base)}/news</link>
    <atom:link href="${escape(base)}/feed.xml" rel="self" type="application/rss+xml" />
    <description>آخرین اخبار، آموزش‌ها و تحلیل بازار برای ایرانیان اروپا.</description>
    <language>fa-IR</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <generator>bazaarino</generator>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=1800, stale-while-revalidate=86400',
    },
  });
}
