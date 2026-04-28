import Link from 'next/link';
import Image from 'next/image';
import {
  Sparkles,
  ArrowLeft,
  TrendingUp,
  Users,
  Newspaper,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Article from '@/models/Article';
import User from '@/models/User';
import AdCard from '@/components/ads/AdCard';
import { getCityLabel } from '@/lib/constants';
import type { LandingSection } from '@/models/LandingPage';

/* ----------------------------------------------------------------------- */
/*  Hero                                                                    */
/* ----------------------------------------------------------------------- */

interface HeroData {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  /** When true, render the Italian-flag stripe accent under the title. */
  showFlag?: boolean;
}

export function HeroSection({ data }: { data: HeroData }) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-white shadow-xl">
      {data.backgroundImage && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.backgroundImage}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-orange-700/40 to-transparent" />
        </>
      )}
      {/* Decorative dot pattern */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative px-6 md:px-12 py-12 md:py-20 max-w-4xl">
        {data.eyebrow && (
          <p className="inline-flex items-center gap-1.5 text-xs md:text-sm font-bold bg-white/20 backdrop-blur px-3 py-1 rounded-full mb-4">
            <Sparkles size={14} />
            {data.eyebrow}
          </p>
        )}
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight drop-shadow-sm">
          {data.title}
        </h1>
        {data.showFlag && (
          <div className="mt-3 flex gap-1 w-24">
            <span className="h-1.5 flex-1 rounded-full bg-emerald-400" />
            <span className="h-1.5 flex-1 rounded-full bg-white" />
            <span className="h-1.5 flex-1 rounded-full bg-red-400" />
          </div>
        )}
        {data.subtitle && (
          <p className="mt-4 text-base md:text-lg leading-relaxed text-white/95 max-w-2xl">
            {data.subtitle}
          </p>
        )}
        {(data.primaryCta || data.secondaryCta) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {data.primaryCta && (
              <Link
                href={data.primaryCta.href}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white text-orange-600 font-bold shadow-lg hover:scale-105 transition"
              >
                {data.primaryCta.label}
                <ArrowLeft size={16} />
              </Link>
            )}
            {data.secondaryCta && (
              <Link
                href={data.secondaryCta.href}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-white/15 backdrop-blur ring-1 ring-white/30 font-bold hover:bg-white/25 transition"
              >
                {data.secondaryCta.label}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Stats                                                                   */
/* ----------------------------------------------------------------------- */

interface StatsData {
  /** Optional title above the stats. */
  title?: string;
  /** When set, replaces auto-counts and shows static numbers. */
  custom?: { label: string; value: string; icon?: 'ads' | 'users' | 'news' }[];
  /** Auto: count published items filtered by targetCity / targetCategory. */
  auto?: boolean;
  targetCity?: string;
  targetCategory?: string;
}

export async function StatsSection({ data }: { data: StatsData }) {
  let items: { label: string; value: string; Icon: typeof TrendingUp }[] = [];

  if (data.auto !== false) {
    await connectDB();
    const adFilter: Record<string, unknown> = { status: 'approved' };
    if (data.targetCity) adFilter.city = data.targetCity;
    if (data.targetCategory) adFilter.category = data.targetCategory;
    const articleFilter: Record<string, unknown> = { status: 'published' };
    if (data.targetCity) {
      articleFilter.tags = { $in: [data.targetCity, getCityLabel(data.targetCity)] };
    }
    const [ads, articles, users] = await Promise.all([
      Ad.countDocuments(adFilter),
      Article.countDocuments(articleFilter),
      data.targetCity
        ? User.countDocuments({ city: data.targetCity })
        : User.countDocuments({}),
    ]);
    items = [
      { label: 'آگهی فعال', value: ads.toLocaleString('fa-IR'), Icon: TrendingUp },
      { label: 'کاربر', value: users.toLocaleString('fa-IR'), Icon: Users },
      { label: 'مقاله', value: articles.toLocaleString('fa-IR'), Icon: Newspaper },
    ];
  }

  if (data.custom && data.custom.length > 0) {
    const iconMap = { ads: TrendingUp, users: Users, news: Newspaper } as const;
    items = data.custom.map((c) => ({
      label: c.label,
      value: c.value,
      Icon: c.icon ? iconMap[c.icon] : TrendingUp,
    }));
  }

  if (items.length === 0) return null;

  return (
    <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
      {data.title && (
        <h2 className="text-base md:text-lg font-bold text-gray-900 mb-4">
          {data.title}
        </h2>
      )}
      <div className="grid grid-cols-3 gap-4">
        {items.map((it) => (
          <div
            key={it.label}
            className="text-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 ring-1 ring-orange-100 p-4 md:p-6 hover:shadow-md transition"
          >
            <it.Icon className="mx-auto text-orange-500 mb-2" size={22} />
            <p className="text-2xl md:text-3xl font-black text-gray-900">{it.value}</p>
            <p className="text-xs md:text-sm text-gray-600 mt-1 font-medium">
              {it.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Ad Grid                                                                 */
/* ----------------------------------------------------------------------- */

interface AdGridData {
  title?: string;
  subtitle?: string;
  city?: string;
  category?: string;
  subcategory?: string;
  /** Linked at the top-right; defaults to a search URL based on filters. */
  viewAllHref?: string;
  limit?: number;
}

export async function AdGridSection({ data }: { data: AdGridData }) {
  const limit = Math.min(Math.max(data.limit || 6, 3), 12);
  await connectDB();
  const filter: Record<string, unknown> = { status: 'approved' };
  if (data.city) filter.city = data.city;
  if (data.category) filter.category = data.category;
  if (data.subcategory) filter.subcategory = data.subcategory;

  const ads = await Ad.find(filter)
    .populate('userId', 'name avatar role')
    .sort({ isFeatured: -1, bumpedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  const safeAds = JSON.parse(JSON.stringify(ads)) as Array<
    React.ComponentProps<typeof AdCard>['ad']
  >;

  const fallbackHref = (() => {
    const params = new URLSearchParams();
    if (data.city) params.set('city', data.city);
    if (data.category) params.set('category', data.category);
    if (data.subcategory) params.set('subcategory', data.subcategory);
    return `/search?${params.toString()}`;
  })();

  return (
    <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-7 shadow-sm">
      <header className="flex items-end justify-between mb-5 flex-wrap gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900 inline-flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-500" />
            {data.title || 'آگهی‌های برتر'}
          </h2>
          {data.subtitle && (
            <p className="text-xs md:text-sm text-gray-500 mt-1">{data.subtitle}</p>
          )}
        </div>
        <Link
          href={data.viewAllHref || fallbackHref}
          className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
        >
          مشاهده همه
          <ArrowLeft size={12} />
        </Link>
      </header>
      {safeAds.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {safeAds.map((ad) => (
            <AdCard key={ad._id} ad={ad} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-orange-200 bg-orange-50/30 p-8 md:p-10 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center mb-3">
            <TrendingUp size={26} className="text-orange-500" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">
            هنوز آگهی‌ای ثبت نشده!
          </h3>
          <p className="text-xs md:text-sm text-gray-600 max-w-md mx-auto leading-7 mb-4">
            اولین کسی باش که در این بخش آگهی می‌گذاره. کاربران خاص آگهی‌های اول‌نفر را بیشتر می‌بینند و اعتمادسازی سریع‌تر می‌شود.
          </p>
          <Link
            href={`/ads/new${data.city ? `?city=${data.city}` : ''}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition"
          >
            ثبت اولین آگهی
            <ArrowLeft size={12} />
          </Link>
        </div>
      )}
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Article Grid                                                            */
/* ----------------------------------------------------------------------- */

interface ArticleGridData {
  title?: string;
  subtitle?: string;
  tags?: string[];
  category?: string;
  limit?: number;
}

export async function ArticleGridSection({ data }: { data: ArticleGridData }) {
  const limit = Math.min(Math.max(data.limit || 4, 2), 8);
  await connectDB();
  const filter: Record<string, unknown> = { status: 'published' };
  if (data.tags && data.tags.length) filter.tags = { $in: data.tags };
  if (data.category) filter.category = data.category;

  const articles = await Article.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('title slug coverImage excerpt createdAt views readTime tags')
    .lean();

  return (
    <section className="bg-white rounded-3xl border border-gray-100 p-5 md:p-7 shadow-sm">
      <header className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-lg md:text-xl font-black text-gray-900 inline-flex items-center gap-2">
            <Newspaper size={18} className="text-rose-500" />
            {data.title || 'مقالات و راهنماها'}
          </h2>
          {data.subtitle && (
            <p className="text-xs md:text-sm text-gray-500 mt-1">{data.subtitle}</p>
          )}
        </div>
        <Link
          href="/news"
          className="text-xs font-bold text-rose-600 hover:text-rose-700 inline-flex items-center gap-1"
        >
          همه مقالات
          <ArrowLeft size={12} />
        </Link>
      </header>
      {articles.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/30 p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-100 flex items-center justify-center mb-3">
            <Newspaper size={26} className="text-rose-500" />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">
            مقاله‌ای در این موضوع پیدا نشد
          </h3>
          <p className="text-xs md:text-sm text-gray-600 max-w-md mx-auto leading-7 mb-4">
            به‌زودی راهنماهای جدید برای این بخش منتشر می‌شود. در همین حال، می‌توانی همه مقالات بازارینو را ببینی.
          </p>
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-md hover:shadow-lg transition"
          >
            مشاهده همه مقالات
            <ArrowLeft size={12} />
          </Link>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {articles.map((a: any) => (
          <Link
            key={String(a._id)}
            href={`/news/${a.slug}`}
            className="group flex gap-3 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md transition p-3"
          >
            {a.coverImage && (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.coverImage}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-orange-600 line-clamp-2 leading-snug">
                {a.title}
              </h3>
              {a.excerpt && (
                <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                  {a.excerpt}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2 text-[10px] text-gray-400">
                {a.readTime ? <span>{a.readTime} دقیقه مطالعه</span> : null}
                {a.views ? <span>· {a.views} بازدید</span> : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
      )}
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Rich Text                                                               */
/* ----------------------------------------------------------------------- */

interface RichTextData {
  title?: string;
  /** Markdown-ish text. We render with `whitespace-pre-line` and treat
   *  paragraphs as plain text — keeps the schema simple and safe. */
  body: string;
  align?: 'right' | 'center';
}

export function RichTextSection({ data }: { data: RichTextData }) {
  const align = data.align === 'center' ? 'text-center' : 'text-right';
  return (
    <section className={`bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm ${align}`}>
      {data.title && (
        <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-4">
          {data.title}
        </h2>
      )}
      <div className="prose prose-sm md:prose-base max-w-3xl mx-auto text-gray-700 leading-8 whitespace-pre-line">
        {data.body}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  FAQ                                                                     */
/* ----------------------------------------------------------------------- */

interface FaqData {
  title?: string;
  items: { q: string; a: string }[];
}

export function FaqSection({ data }: { data: FaqData }) {
  if (!data.items || data.items.length === 0) return null;
  return (
    <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-10 shadow-sm">
      <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-6 text-center">
        {data.title || 'سؤالات پرتکرار'}
      </h2>
      <div className="max-w-3xl mx-auto space-y-3">
        {data.items.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-gray-100 hover:border-orange-200 transition open:bg-orange-50/30 open:border-orange-200"
          >
            <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3 font-bold text-gray-900 text-sm md:text-base">
              <span>{item.q}</span>
              <ChevronDown
                size={18}
                className="text-orange-500 group-open:rotate-180 transition"
              />
            </summary>
            <div className="px-4 pb-4 text-sm text-gray-700 leading-7 whitespace-pre-line">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Feature Grid                                                            */
/* ----------------------------------------------------------------------- */

interface FeatureGridData {
  title?: string;
  subtitle?: string;
  features: { emoji?: string; title: string; description?: string }[];
}

export function FeatureGridSection({ data }: { data: FeatureGridData }) {
  if (!data.features || data.features.length === 0) return null;
  return (
    <section className="bg-gradient-to-br from-gray-50 to-white rounded-3xl border border-gray-100 p-6 md:p-10">
      {data.title && (
        <header className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-xl md:text-3xl font-black text-gray-900">
            {data.title}
          </h2>
          {data.subtitle && (
            <p className="mt-2 text-sm md:text-base text-gray-600">
              {data.subtitle}
            </p>
          )}
        </header>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.features.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white p-5 border border-gray-100 hover:border-orange-200 hover:shadow-md transition"
          >
            <div className="text-3xl md:text-4xl mb-3">{f.emoji || '✨'}</div>
            <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
            {f.description && (
              <p className="text-sm text-gray-600 leading-6">{f.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  CTA Banner                                                              */
/* ----------------------------------------------------------------------- */

interface CtaBannerData {
  title: string;
  subtitle?: string;
  cta: { label: string; href: string };
  variant?: 'orange' | 'purple' | 'emerald';
}

export function CtaBannerSection({ data }: { data: CtaBannerData }) {
  const variants = {
    orange: 'from-orange-500 via-amber-500 to-rose-500',
    purple: 'from-fuchsia-500 via-purple-500 to-indigo-500',
    emerald: 'from-emerald-500 via-teal-500 to-cyan-500',
  } as const;
  const grad = variants[data.variant || 'orange'];

  return (
    <section
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${grad} text-white p-8 md:p-12 text-center shadow-xl`}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <h2 className="relative text-2xl md:text-4xl font-black mb-3 drop-shadow-sm">
        {data.title}
      </h2>
      {data.subtitle && (
        <p className="relative text-sm md:text-lg text-white/95 max-w-2xl mx-auto mb-6">
          {data.subtitle}
        </p>
      )}
      <Link
        href={data.cta.href}
        className="relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-gray-900 font-black shadow-lg hover:scale-105 transition"
      >
        {data.cta.label}
        <ArrowLeft size={18} />
      </Link>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Gallery                                                                 */
/* ----------------------------------------------------------------------- */

interface GalleryData {
  title?: string;
  images: { src: string; alt?: string; caption?: string }[];
}

export function GallerySection({ data }: { data: GalleryData }) {
  if (!data.images || data.images.length === 0) return null;
  return (
    <section className="bg-white rounded-3xl border border-gray-100 p-6 md:p-8 shadow-sm">
      {data.title && (
        <h2 className="text-lg md:text-xl font-black text-gray-900 mb-5 inline-flex items-center gap-2">
          <MapPin size={18} className="text-orange-500" />
          {data.title}
        </h2>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.images.map((img, i) => (
          <figure
            key={i}
            className="relative aspect-[4/3] rounded-2xl overflow-hidden ring-1 ring-gray-100 group"
          >
            <Image
              src={img.src}
              alt={img.alt || ''}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition duration-500"
            />
            {img.caption && (
              <figcaption className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent text-white text-xs p-2">
                {img.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Dispatcher                                                              */
/* ----------------------------------------------------------------------- */

export async function renderSection(section: LandingSection) {
  // The model stores section.data as Mixed, so we trust the admin UI to
  // produce shapes matching each section's contract. The casts go via
  // `unknown` to keep TS happy without sacrificing the per-section types.
  const d = section.data as unknown;
  switch (section.type) {
    case 'hero':
      return <HeroSection data={d as HeroData} />;
    case 'stats':
      return <StatsSection data={d as StatsData} />;
    case 'ad-grid':
      return <AdGridSection data={d as AdGridData} />;
    case 'article-grid':
      return <ArticleGridSection data={d as ArticleGridData} />;
    case 'rich-text':
      return <RichTextSection data={d as RichTextData} />;
    case 'faq':
      return <FaqSection data={d as FaqData} />;
    case 'feature-grid':
      return <FeatureGridSection data={d as FeatureGridData} />;
    case 'cta-banner':
      return <CtaBannerSection data={d as CtaBannerData} />;
    case 'gallery':
      return <GallerySection data={d as GalleryData} />;
    default:
      return null;
  }
}
