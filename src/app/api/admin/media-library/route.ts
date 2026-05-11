import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAppUrl } from '@/lib/app-url';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Article from '@/models/Article';
import Banner from '@/models/Banner';
import CityVisual from '@/models/CityVisual';
import HousingCityImage from '@/models/HousingCityImage';
import LandingPage from '@/models/LandingPage';
import User from '@/models/User';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

type MediaStatus = 'ok' | 'broken' | 'unchecked';

type MediaRef = {
  source: string;
  field: string;
  ownerId?: string;
  ownerTitle: string;
  ownerHref?: string;
  updatedAt?: string;
};

type MediaItem = {
  id: string;
  url: string;
  title: string;
  source: string;
  field: string;
  ownerHref?: string;
  updatedAt?: string;
  refs: MediaRef[];
  status: MediaStatus;
  contentType?: string;
  contentLength?: number;
  error?: string;
};

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === 'admin';
}

function cleanUrl(value: unknown) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('/')) return url;
  return '';
}

function looksLikeImageUrl(value: string) {
  const lower = value.toLowerCase();
  return (
    /\.(avif|gif|jpe?g|png|svg|webp)(\?|#|$)/i.test(lower) ||
    lower.includes('images.unsplash.com') ||
    lower.includes('res.cloudinary.com') ||
    lower.includes('/upload/') ||
    lower.includes('/_next/image')
  );
}

function extractImageUrls(input: unknown, out = new Set<string>()) {
  if (!input) return out;
  if (typeof input === 'string') {
    const direct = cleanUrl(input);
    if (direct && looksLikeImageUrl(direct)) out.add(direct);
    const matches = input.match(/https?:\/\/[^\s"'<>]+/g) || [];
    matches.forEach((url) => {
      if (looksLikeImageUrl(url)) out.add(url);
    });
    return out;
  }
  if (Array.isArray(input)) {
    input.forEach((v) => extractImageUrls(v, out));
    return out;
  }
  if (typeof input === 'object') {
    Object.values(input as Record<string, unknown>).forEach((v) => extractImageUrls(v, out));
  }
  return out;
}

function toIso(value: unknown) {
  if (!value) return undefined;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function makeOwnerHref(source: string, owner: any) {
  const id = String(owner?._id || '');
  if (source === 'ad' && id) return `/ads/${id}`;
  if (source === 'article' && owner?.slug) return `/admin/articles/${encodeURIComponent(owner.slug)}/edit`;
  if (source === 'banner') return '/admin/banners';
  if (source === 'city-visual') return '/admin/city-visuals';
  if (source === 'housing-city') return '/admin/legacy?tab=banners';
  if (source === 'landing-page' && id) return `/admin/pages/${id}`;
  if (source === 'profile' && id) return `/admin/users/${id}`;
  return undefined;
}

function addMedia(
  map: Map<string, MediaItem>,
  urlValue: unknown,
  ref: Omit<MediaRef, 'updatedAt'> & { updatedAt?: unknown },
  verified = false,
) {
  const url = cleanUrl(urlValue);
  if (!url || !looksLikeImageUrl(url)) return;
  const updatedAt = toIso(ref.updatedAt);
  const existing = map.get(url);
  const nextRef: MediaRef = { ...ref, updatedAt };
  if (existing) {
    existing.refs.push(nextRef);
    if (updatedAt && (!existing.updatedAt || updatedAt > existing.updatedAt)) existing.updatedAt = updatedAt;
    return;
  }
  map.set(url, {
    id: Buffer.from(url).toString('base64url').slice(0, 18),
    url,
    title: ref.ownerTitle,
    source: ref.source,
    field: ref.field,
    ownerHref: ref.ownerHref,
    updatedAt,
    refs: [nextRef],
    status: verified ? 'ok' : 'unchecked',
  });
}

function absoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('//')) return `https:${url}`;
  const base = getAppUrl().replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

async function checkUrl(item: MediaItem): Promise<MediaItem> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 5500);
  try {
    let res = await fetch(absoluteUrl(item.url), {
      method: 'HEAD',
      cache: 'no-store',
      signal: ctrl.signal,
    });
    if (res.status === 405 || res.status === 403 || !res.ok) {
      res = await fetch(absoluteUrl(item.url), {
        method: 'GET',
        cache: 'no-store',
        headers: { Range: 'bytes=0-0' },
        signal: ctrl.signal,
      });
    }
    const contentType = res.headers.get('content-type') || undefined;
    const contentLength = Number(res.headers.get('content-length') || 0) || undefined;
    const isImage = !contentType || contentType.startsWith('image/') || contentType.includes('octet-stream');
    return {
      ...item,
      status: res.ok && isImage ? 'ok' : 'broken',
      contentType,
      contentLength,
      error: res.ok && isImage ? undefined : `HTTP ${res.status}${contentType ? ` / ${contentType}` : ''}`,
    };
  } catch (err) {
    return {
      ...item,
      status: 'broken',
      error: err instanceof Error ? err.message : 'Image check failed',
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(request: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403, headers: NO_STORE_HEADERS });
  }

  const { searchParams } = new URL(request.url);
  const shouldCheck = searchParams.get('check') === '1';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 180), 20), 320);
  const map = new Map<string, MediaItem>();

  await connectDB();

  const [banners, cityVisuals, housingImages, landingPages, articles, ads, users] = await Promise.all([
    Banner.find().sort({ updatedAt: -1 }).limit(120).lean(),
    CityVisual.find().sort({ updatedAt: -1 }).limit(160).lean(),
    HousingCityImage.find().sort({ updatedAt: -1 }).limit(80).lean(),
    LandingPage.find().select('title slug status ogImage sections updatedAt').sort({ updatedAt: -1 }).limit(120).lean(),
    Article.find().select('title slug status coverImage updatedAt').sort({ updatedAt: -1 }).limit(120).lean(),
    Ad.find().select('title status city images products updatedAt').sort({ updatedAt: -1 }).limit(140).lean(),
    User.find().select('name email avatar banner updatedAt').sort({ updatedAt: -1 }).limit(100).lean(),
  ]);

  banners.forEach((b: any) => {
    const ownerHref = makeOwnerHref('banner', b);
    addMedia(map, b.imageUrl, {
      source: 'banner',
      field: 'imageUrl',
      ownerId: String(b._id),
      ownerTitle: b.title || 'بنر بدون عنوان',
      ownerHref,
      updatedAt: b.updatedAt,
    });
    addMedia(map, b.imageUrlMobile, {
      source: 'banner',
      field: 'imageUrlMobile',
      ownerId: String(b._id),
      ownerTitle: b.title || 'بنر بدون عنوان',
      ownerHref,
      updatedAt: b.updatedAt,
    });
  });

  cityVisuals.forEach((v: any) => {
    addMedia(map, v.image, {
      source: 'city-visual',
      field: 'image',
      ownerId: String(v._id),
      ownerTitle: `ویژوال شهر ${v.slug}`,
      ownerHref: makeOwnerHref('city-visual', v),
      updatedAt: v.updatedAt,
    }, Boolean(v.imageVerifiedAt));
  });

  housingImages.forEach((h: any) => {
    addMedia(map, h.imageUrl, {
      source: 'housing-city',
      field: 'imageUrl',
      ownerId: String(h._id),
      ownerTitle: h.title || `تصویر رزرو خانه ${h.city}`,
      ownerHref: makeOwnerHref('housing-city', h),
      updatedAt: h.updatedAt,
    });
  });

  landingPages.forEach((p: any) => {
    const ownerHref = makeOwnerHref('landing-page', p);
    addMedia(map, p.ogImage, {
      source: 'landing-page',
      field: 'ogImage',
      ownerId: String(p._id),
      ownerTitle: p.title || p.slug,
      ownerHref,
      updatedAt: p.updatedAt,
    });
    extractImageUrls(p.sections).forEach((url) => addMedia(map, url, {
      source: 'landing-page',
      field: 'sections',
      ownerId: String(p._id),
      ownerTitle: p.title || p.slug,
      ownerHref,
      updatedAt: p.updatedAt,
    }));
  });

  articles.forEach((a: any) => {
    addMedia(map, a.coverImage, {
      source: 'article',
      field: 'coverImage',
      ownerId: String(a._id),
      ownerTitle: a.title || a.slug,
      ownerHref: makeOwnerHref('article', a),
      updatedAt: a.updatedAt,
    });
  });

  ads.forEach((ad: any) => {
    const ownerHref = makeOwnerHref('ad', ad);
    (ad.images || []).forEach((url: string, index: number) => addMedia(map, url, {
      source: 'ad',
      field: `images.${index}`,
      ownerId: String(ad._id),
      ownerTitle: ad.title || 'آگهی بدون عنوان',
      ownerHref,
      updatedAt: ad.updatedAt,
    }));
    (ad.products || []).forEach((product: any, productIndex: number) => {
      (product.images || []).forEach((url: string, imageIndex: number) => addMedia(map, url, {
        source: 'ad',
        field: `products.${productIndex}.images.${imageIndex}`,
        ownerId: String(ad._id),
        ownerTitle: `${ad.title || 'آگهی'} / ${product.title || 'محصول'}`,
        ownerHref,
        updatedAt: ad.updatedAt,
      }));
    });
  });

  users.forEach((u: any) => {
    const ownerHref = makeOwnerHref('profile', u);
    addMedia(map, u.avatar, {
      source: 'profile',
      field: 'avatar',
      ownerId: String(u._id),
      ownerTitle: u.name || u.email || 'کاربر',
      ownerHref,
      updatedAt: u.updatedAt,
    });
    addMedia(map, u.banner, {
      source: 'profile',
      field: 'banner',
      ownerId: String(u._id),
      ownerTitle: u.name || u.email || 'کاربر',
      ownerHref,
      updatedAt: u.updatedAt,
    });
  });

  let items = Array.from(map.values())
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, limit);

  if (shouldCheck) {
    items = await Promise.all(items.map((item) => checkUrl(item)));
  }

  const summary = {
    total: items.length,
    ok: items.filter((i) => i.status === 'ok').length,
    broken: items.filter((i) => i.status === 'broken').length,
    unchecked: items.filter((i) => i.status === 'unchecked').length,
    duplicateRefs: items.reduce((sum, item) => sum + Math.max(0, item.refs.length - 1), 0),
    knownBytes: items.reduce((sum, item) => sum + (item.contentLength || 0), 0),
    sources: items.reduce<Record<string, number>>((acc, item) => {
      acc[item.source] = (acc[item.source] || 0) + 1;
      return acc;
    }, {}),
  };

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      checked: shouldCheck,
      summary,
      items,
    },
    { headers: NO_STORE_HEADERS },
  );
}
