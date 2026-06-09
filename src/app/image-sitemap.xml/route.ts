import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Article from '@/models/Article';
import { getAppUrl } from '@/lib/app-url';

export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export async function GET() {
  const base = getAppUrl().replace(/\/$/, '');

  let ads: any[] = [];
  let articles: any[] = [];
  try {
    await connectDB();
    [ads, articles] = await Promise.all([
      Ad.find({ status: 'approved', images: { $exists: true, $ne: [] } })
        .select('_id title images updatedAt')
        .sort({ updatedAt: -1 })
        .limit(5000)
        .lean(),
      Article.find({
        status: 'published',
        coverImage: { $exists: true, $ne: '' },
      })
        .select('slug title coverImage updatedAt')
        .sort({ updatedAt: -1 })
        .limit(2000)
        .lean(),
    ]);
  } catch {
    ads = [];
    articles = [];
  }

  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');

  const adUrls = ads
    .map((ad) => {
      const loc = `${base}/ads/${ad._id}`;
      const images = (ad.images as string[])
        .slice(0, 5)
        .map((image) => {
          const imageUrl = image.startsWith('http') ? image : `${base}${image}`;
          return `    <image:image>
      <image:loc>${escape(imageUrl)}</image:loc>
      <image:title>${escape(ad.title || '')}</image:title>
    </image:image>`;
        })
        .join('\n');
      return `  <url>
    <loc>${escape(loc)}</loc>
${images}
  </url>`;
    })
    .join('\n');

  const articleUrls = articles
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

  const urls = [adUrls, articleUrls].filter(Boolean).join('\n');

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
