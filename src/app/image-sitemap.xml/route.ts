import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import { getAppUrl } from '@/lib/app-url';

export const revalidate = 3600;

// Image sitemap — helps Google Images index ad photos.
// https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
export async function GET() {
  const base = getAppUrl();

  let ads: any[] = [];
  try {
    await connectDB();
    ads = await Ad.find({ status: 'approved', images: { $exists: true, $ne: [] } })
      .select('_id title images updatedAt')
      .sort({ updatedAt: -1 })
      .limit(2000)
      .lean();
  } catch {
    ads = [];
  }

  const escape = (s: string) => s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  const urls = ads.map((ad) => {
    const loc = `${base}/ads/${ad._id}`;
    const imgs = (ad.images as string[])
      .slice(0, 5)
      .map((img) => {
        const url = img.startsWith('http') ? img : `${base}${img}`;
        return `    <image:image>
      <image:loc>${escape(url)}</image:loc>
      <image:title>${escape(ad.title || '')}</image:title>
    </image:image>`;
      })
      .join('\n');
    return `  <url>
    <loc>${escape(loc)}</loc>
${imgs}
  </url>`;
  }).join('\n');

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
