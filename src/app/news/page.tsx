import Link from 'next/link';
import type { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import {
  Calendar,
  Clock,
  Eye,
  Flame,
  Plus,
  Rss,
  Search,
  Tag as TagIcon,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import '@/models/User';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import { toFaDigits } from '@/lib/locale';
import { authOptions } from '@/lib/auth';
import { getAppUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_TITLE = 'مجله بازارینو';
const PAGE_DESC =
  'مجله بازارینو — راهنماها، اخبار و تحلیل برای ایرانیان اروپا: مهاجرت، اجاره، کار، تحصیل و زندگی در ایتالیا، آلمان و انگلستان.';

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESC,
  keywords: [
    'اخبار ایرانیان اروپا',
    'مجله ایرانیان ایتالیا',
    'راهنمای مهاجرت',
    'بازارینو',
  ],
  alternates: {
    canonical: '/news',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESC,
    type: 'website',
    locale: 'fa_IR',
    siteName: 'بازارینو',
    url: '/news',
  },
  twitter: {
    card: 'summary_large_image',
    title: PAGE_TITLE,
    description: PAGE_DESC,
  },
};

const estimateReadMinutes = (text: string) =>
  Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));

async function getArticles(q?: string, tag?: string) {
  try {
    await connectDB();
    const query: any = { status: 'published' };
    if (q?.trim()) {
      query.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { excerpt: { $regex: q.trim(), $options: 'i' } },
        { content: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    if (tag?.trim()) {
      query.tags = tag.trim();
    }
    const items = await Article.find(query)
      .populate('authorId', 'name avatar role')
      .sort({ isHot: -1, createdAt: -1 })
      .limit(40)
      .lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

async function getTopTags() {
  try {
    await connectDB();
    const result = await Article.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 12 },
    ]);
    return result.map((r: any) => ({ tag: r._id, count: r.count }));
  } catch {
    return [];
  }
}

export default async function NewsPage({
  searchParams,
}: {
  searchParams?: { q?: string; tag?: string };
}) {
  const currentQuery = searchParams?.q || '';
  const currentTag = searchParams?.tag || '';
  const [articles, topTags] = await Promise.all([
    getArticles(currentQuery, currentTag),
    getTopTags(),
  ]);
  const session = await getServerSession(authOptions);
  const canPublish = session?.user?.role === 'admin' || session?.user?.role === 'editor';

  const hasSearch = Boolean(currentQuery || currentTag);
  const [hero, ...rest] = articles;
  const featured = hero ? rest.slice(0, 4) : [];
  const more = hero ? rest.slice(4) : [];

  // SEO: ItemList JSON-LD
  const base = getAppUrl();
  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: PAGE_TITLE,
    itemListElement: articles.slice(0, 20).map((a: any, idx: number) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${base}/news/${encodeURIComponent(a.slug)}`,
      name: a.title,
    })),
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: base },
      { '@type': 'ListItem', position: 2, name: 'مجله', item: `${base}/news` },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      <Navbar />

      {/* HERO BANNER */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-orange-50/40 to-white">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-8 md:pt-14 md:pb-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-2">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                مجله بازارینو
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                داستان‌های ایرانیان اروپا
              </h1>
              <p className="mt-3 text-base md:text-lg text-gray-600 leading-7">
                راهنماها، تجربه‌ها و تحلیل بازار برای زندگی در ایتالیا، آلمان و انگلستان.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="/feed.xml"
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-xs font-medium text-gray-600 transition"
                title="فید RSS"
              >
                <Rss size={13} />
                RSS
              </a>
              {canPublish && (
                <Link
                  href="/news/new"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-3 py-2 text-xs font-semibold transition"
                >
                  <Plus size={14} />
                  انتشار مقاله
                </Link>
              )}
            </div>
          </div>

          {/* Search */}
          <form action="/news" method="get" className="mt-6 grid gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="q"
                type="text"
                defaultValue={currentQuery}
                placeholder="جست‌وجو در مقاله‌ها..."
                className="w-full rounded-xl border-0 bg-transparent pr-10 pl-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 px-6 py-3 text-sm font-semibold text-white transition"
            >
              <Search size={16} />
              جست‌وجو
            </button>
          </form>

          {/* Top tags strip */}
          {topTags.length > 0 && (
            <div className="mt-5 flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <TrendingUp size={12} /> برچسب‌های داغ:
              </span>
              {topTags.map((t) => {
                const isActive = t.tag === currentTag;
                return (
                  <Link
                    key={t.tag}
                    href={`/news/tag/${encodeURIComponent(t.tag)}`}
                    className={`text-xs px-3 py-1.5 rounded-full border transition ${
                      isActive
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    #{t.tag}{' '}
                    <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
                      {toFaDigits(String(t.count))}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {hasSearch && (
            <div className="mt-4 text-xs text-gray-500">
              {currentQuery && (
                <span className="ml-3">
                  نتایج برای: <b className="text-gray-700">{currentQuery}</b>
                </span>
              )}
              {currentTag && (
                <span>
                  برچسب: <b className="text-gray-700">#{currentTag}</b>
                </span>
              )}
              <Link
                href="/news"
                className="mr-3 text-orange-600 hover:underline"
              >
                پاک کردن فیلترها
              </Link>
            </div>
          )}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 md:pb-12">
        {articles.length === 0 ? (
          <EmptyState canPublish={canPublish} hasSearch={hasSearch} />
        ) : (
          <>
            {/* Hero article */}
            {hero && !hasSearch && (
              <section className="mb-10">
                <HeroArticle article={hero} />
              </section>
            )}

            {/* Featured row (small cards) */}
            {!hasSearch && featured.length > 0 && (
              <section className="mb-10">
                <div className="flex items-end justify-between mb-4">
                  <h2 className="text-xl md:text-2xl font-black text-gray-900">برجسته‌ها</h2>
                  <span className="text-xs text-gray-500">منتخب تحریریه</span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {featured.map((a: any) => (
                    <ArticleCard key={a._id} article={a} compact />
                  ))}
                </div>
              </section>
            )}

            {/* Main grid */}
            <section>
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-black text-gray-900">
                  {hasSearch ? 'نتایج جست‌وجو' : 'تازه‌ترین‌ها'}
                </h2>
                <span className="text-xs text-gray-500">
                  {toFaDigits(String(hasSearch ? articles.length : more.length))} مقاله
                </span>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(hasSearch ? articles : more).map((a: any) => (
                  <ArticleCard key={a._id} article={a} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
}

/* ─── Components ──────────────────────────────────────────── */

function HeroArticle({ article }: { article: any }) {
  const minutes = estimateReadMinutes(article.content || '');
  return (
    <Link
      href={`/news/${encodeURIComponent(article.slug)}`}
      className="group grid lg:grid-cols-[1.6fr_1fr] gap-6 items-stretch"
    >
      <div className="relative aspect-[16/9] lg:aspect-[5/3] rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {article.isHot && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full bg-red-500 text-white shadow-lg">
            <Flame size={11} /> داغ
          </span>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-2">
          مقاله‌ی روز
        </span>
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight group-hover:text-orange-600 transition">
          {article.title}
        </h2>
        <p className="mt-3 text-sm md:text-base text-gray-600 leading-7 line-clamp-3">
          {article.excerpt}
        </p>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Calendar size={12} />
            {toFaDigits(new Date(article.createdAt).toLocaleDateString('fa-IR'))}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {toFaDigits(String(minutes))} دقیقه
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={12} /> {toFaDigits(String(article.views || 0))} بازدید
          </span>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.authorId?.avatar || '/default-avatar.svg'}
              alt={article.authorId?.name || 'author'}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-800">
              {article.authorId?.name || 'تحریریه بازارینو'}
            </p>
            <p className="text-[10px] text-gray-500">نویسنده</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-gray-900 group-hover:text-orange-600 transition">
            ادامه مطلب <ArrowLeft size={13} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ArticleCard({ article, compact }: { article: any; compact?: boolean }) {
  const minutes = estimateReadMinutes(article.content || '');
  const tags = Array.isArray(article.tags) ? article.tags.slice(0, 2) : [];

  return (
    <Link
      href={`/news/${encodeURIComponent(article.slug)}`}
      className="group flex flex-col rounded-2xl overflow-hidden border border-gray-100 bg-white hover:shadow-lg hover:-translate-y-0.5 transition duration-300"
    >
      <div className={`relative ${compact ? 'aspect-[5/3]' : 'aspect-[16/9]'} bg-gray-100 overflow-hidden`}>
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100 via-amber-50 to-white" />
        )}
        {article.isHot && (
          <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500 text-white shadow">
            <Flame size={10} /> داغ
          </span>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Calendar size={11} />
            {toFaDigits(new Date(article.createdAt).toLocaleDateString('fa-IR'))}
          </span>
          <span className="text-gray-300">·</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={11} /> {toFaDigits(String(minutes))} دقیقه
          </span>
          {(article.views || 0) > 0 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="inline-flex items-center gap-1">
                <Eye size={11} /> {toFaDigits(String(article.views))}
              </span>
            </>
          )}
        </div>

        <h3 className={`font-black text-gray-900 group-hover:text-orange-600 transition leading-tight line-clamp-2 ${compact ? 'text-sm' : 'text-base md:text-lg'}`}>
          {article.title}
        </h3>

        {!compact && (
          <p className="mt-2 text-sm text-gray-600 leading-6 line-clamp-2">
            {article.excerpt}
          </p>
        )}

        {tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.map((tag: string) => (
              <span
                key={tag}
                className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
              >
                <TagIcon size={9} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto pt-3 flex items-center gap-2 text-[11px]">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.authorId?.avatar || '/default-avatar.svg'}
              alt={article.authorId?.name || 'author'}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-gray-700 font-medium truncate">
            {article.authorId?.name || 'تحریریه بازارینو'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ canPublish, hasSearch }: { canPublish: boolean; hasSearch: boolean }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
        <Search size={20} />
      </div>
      <p className="text-base font-semibold text-gray-800 mb-2">
        {hasSearch ? 'نتیجه‌ای یافت نشد' : 'هنوز مقاله‌ای منتشر نشده'}
      </p>
      <p className="text-sm text-gray-500 mb-5">
        {hasSearch
          ? 'با کلمات دیگه امتحان کن یا برچسب‌های بالا رو ببین.'
          : 'به‌زودی اولین مقاله‌ها منتشر می‌شه.'}
      </p>
      {canPublish && (
        <Link
          href="/news/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm font-semibold transition"
        >
          <Plus size={14} /> انتشار اولین مقاله
        </Link>
      )}
    </div>
  );
}
