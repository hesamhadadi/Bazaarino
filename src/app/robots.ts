import type { MetadataRoute } from 'next';
import { getAppUrl } from '@/lib/app-url';

export default function robots(): MetadataRoute.Robots {
  const base = getAppUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/profile/',
          '/favorites/',
          '/messages/',
          '/notifications/',
          '/saved-searches/',
          '/auth/',
          '/ads/new',
          '/news/new',
        ],
      },
    ],
    sitemap: [`${base}/sitemap.xml`, `${base}/image-sitemap.xml`],
    host: base,
  };
}
