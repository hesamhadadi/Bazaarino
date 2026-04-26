import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/app-url';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Article from '@/models/Article';
import { CATEGORIES, CITIES, COUNTRIES } from '@/lib/constants';

export const revalidate = 3600;

const MAX_ADS = 5000;
const MAX_ARTICLES = 2000;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getAppUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
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

  const countryCityRoutes: MetadataRoute.Sitemap = [];
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

  let adRoutes: MetadataRoute.Sitemap = [];
  let articleRoutes: MetadataRoute.Sitemap = [];
  let tagRoutes: MetadataRoute.Sitemap = [];
  let authorRoutes: MetadataRoute.Sitemap = [];

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

    adRoutes = ads.map((ad: any) => ({
      url: `${base}/ads/${ad._id}`,
      lastModified: ad.updatedAt || ad.createdAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

    articleRoutes = articles.map((a: any) => ({
      url: `${base}/news/${encodeURIComponent(a.slug)}`,
      lastModified: a.updatedAt || a.createdAt || now,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    tagRoutes = (tagAgg as any[]).map((t) => ({
      url: `${base}/news/tag/${encodeURIComponent(t._id)}`,
      lastModified: t.lastModified || now,
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    }));

    authorRoutes = (authorAgg as any[])
      .filter((a) => a._id)
      .map((a) => ({
        url: `${base}/news/author/${a._id}`,
        lastModified: a.lastModified || now,
        changeFrequency: 'weekly' as const,
        priority: 0.4,
      }));
  } catch (e) {
    console.error('[sitemap] DB error', e);
  }

  return [
    ...staticRoutes,
    ...countryCityRoutes,
    ...adRoutes,
    ...articleRoutes,
    ...tagRoutes,
    ...authorRoutes,
  ];
}
