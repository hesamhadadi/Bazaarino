import { NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/app-url';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import LandingPage from '@/models/LandingPage';

export const revalidate = 3600;

const MAX_ARTICLES = 2000;
const MIN_TAG_ARTICLES_FOR_INDEX = 3;

type ChangeFreq =
  | 'always'
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'yearly'
  | 'never';

type Entry = {
  url: string;
  lastModified?: Date | string;
  changeFrequency?: ChangeFreq;
  priority?: number;
};

// Escape characters that are not legal in XML text/attributes.
function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toIso(d: Date | string | undefined): string {
  if (!d) return new Date().toISOString();
  if (d instanceof Date) return d.toISOString();
  try {
    return new Date(d).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function entryToXml(e: Entry): string {
  const url = xmlEscape(e.url);
  const lastmod = toIso(e.lastModified);
  const cf = e.changeFrequency
    ? `\n    <changefreq>${e.changeFrequency}</changefreq>`
    : '';
  const pr =
    typeof e.priority === 'number'
      ? `\n    <priority>${e.priority.toFixed(1)}</priority>`
      : '';
  return `  <url>\n    <loc>${url}</loc>\n    <lastmod>${lastmod}</lastmod>${cf}${pr}\n  </url>`;
}

export async function GET() {
  const base = getAppUrl().replace(/\/$/, '');
  const now = new Date();

  const staticRoutes: Entry[] = [
    { url: `${base}/`, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/house-reservation`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  // Note: individual /ads/<id> pages are intentionally NOT in the sitemap.
  // They emit `robots: noindex, follow` (see src/app/ads/[id]/page.tsx)
  // because each ad is short-lived and thin-content; surfacing thousands
  // of them would burn crawl budget that should go to articles, city
  // landings and editorial content instead. The same applies to /search
  // and filtered search URLs: they are useful to users, but are thin,
  // volatile result sets and should not be submitted for indexing.
  let articleRoutes: Entry[] = [];
  let tagRoutes: Entry[] = [];
  let landingRoutes: Entry[] = [];

  try {
    await connectDB();
    const [articles, tagAgg] = await Promise.all([
      Article.find({ status: 'published' })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(MAX_ARTICLES)
        .lean(),
      Article.aggregate([
        { $match: { status: 'published' } },
        { $unwind: '$tags' },
        {
          $group: {
            _id: '$tags',
            count: { $sum: 1 },
            lastModified: { $max: '$updatedAt' },
          },
        },
        { $match: { count: { $gte: MIN_TAG_ARTICLES_FOR_INDEX } } },
        { $limit: 500 },
      ]),
    ]);

    const landingDocs = await LandingPage.find({ status: 'published' })
      .select('slug updatedAt pageType')
      .sort({ updatedAt: -1 })
      .limit(500)
      .lean();
    landingRoutes = (landingDocs as any[]).map((p) => ({
      url: `${base}/p/${encodeURIComponent(p.slug)}`,
      lastModified: p.updatedAt || now,
      changeFrequency: 'weekly',
      // City landing pages are particularly SEO-valuable, give them a boost.
      priority: p.pageType === 'city' ? 0.9 : 0.7,
    }));

    articleRoutes = articles.map((a: any) => ({
      url: `${base}/news/${encodeURIComponent(a.slug)}`,
      lastModified: a.updatedAt || a.createdAt || now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    tagRoutes = (tagAgg as any[]).map((t) => ({
      url: `${base}/news/tag/${encodeURIComponent(t._id)}`,
      lastModified: t.lastModified || now,
      changeFrequency: 'weekly',
      priority: 0.5,
    }));
  } catch (e) {
    console.error('[sitemap] DB error', e);
  }

  const all: Entry[] = [
    ...staticRoutes,
    ...landingRoutes,
    ...articleRoutes,
    ...tagRoutes,
  ];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all.map(entryToXml).join('\n')}
</urlset>`;

  return new NextResponse(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
