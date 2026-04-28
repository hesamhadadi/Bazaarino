import { NextResponse } from 'next/server';
import { getAppUrl } from '@/lib/app-url';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Article from '@/models/Article';
import LandingPage from '@/models/LandingPage';
import { CATEGORIES, CITIES, COUNTRIES } from '@/lib/constants';

export const revalidate = 3600;

const MAX_ADS = 5000;
const MAX_ARTICLES = 2000;

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
    { url: `${base}/search`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/house-reservation`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/news`, lastModified: now, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
  ];

  const countryCityRoutes: Entry[] = [];
  for (const country of COUNTRIES) {
    countryCityRoutes.push({
      url: `${base}/search?country=${encodeURIComponent(country.value)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }
  for (const city of CITIES) {
    if (city.country === 'other') continue;
    countryCityRoutes.push({
      url: `${base}/search?country=${encodeURIComponent(city.country)}&city=${encodeURIComponent(city.value)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    });
  }
  for (const cat of CATEGORIES) {
    countryCityRoutes.push({
      url: `${base}/search?category=${encodeURIComponent(cat.id)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    });
  }

  let adRoutes: Entry[] = [];
  let articleRoutes: Entry[] = [];
  let tagRoutes: Entry[] = [];
  let authorRoutes: Entry[] = [];
  let landingRoutes: Entry[] = [];

  try {
    await connectDB();
    const [ads, articles, tagAgg, authorAgg] = await Promise.all([
      Ad.find({ status: 'approved' })
        .select('_id updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(MAX_ADS)
        .lean(),
      Article.find({ status: 'published' })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .limit(MAX_ARTICLES)
        .lean(),
      Article.aggregate([
        { $match: { status: 'published' } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', lastModified: { $max: '$updatedAt' } } },
        { $limit: 500 },
      ]),
      Article.aggregate([
        { $match: { status: 'published' } },
        { $group: { _id: '$authorId', lastModified: { $max: '$updatedAt' } } },
        { $limit: 200 },
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

    adRoutes = ads.map((ad: any) => ({
      url: `${base}/ads/${ad._id}`,
      lastModified: ad.updatedAt || ad.createdAt || now,
      changeFrequency: 'weekly',
      priority: 0.7,
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

    authorRoutes = (authorAgg as any[])
      .filter((a) => a._id)
      .map((a) => ({
        url: `${base}/news/author/${a._id}`,
        lastModified: a.lastModified || now,
        changeFrequency: 'weekly',
        priority: 0.4,
      }));
  } catch (e) {
    console.error('[sitemap] DB error', e);
  }

  const all: Entry[] = [
    ...staticRoutes,
    ...landingRoutes,
    ...countryCityRoutes,
    ...adRoutes,
    ...articleRoutes,
    ...tagRoutes,
    ...authorRoutes,
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
