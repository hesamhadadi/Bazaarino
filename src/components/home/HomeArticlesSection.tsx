import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  Eye,
  Flame,
  Sparkles,
} from 'lucide-react';
import { toFaDigits } from '@/lib/locale';

type Article = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  tags?: string[];
  isHot?: boolean;
  views?: number;
  createdAt: string | Date;
  publishedAt?: string | Date;
};

type Props = { articles: Article[] };

const estimateReadMinutes = (text?: string) =>
  Math.max(1, Math.ceil(((text || '').trim().split(/\s+/).filter(Boolean).length || 1) / 220));

/**
 * Deterministic accent color based on the first tag, so the magazine grid
 * gets a splash of variety without the editor needing to set anything.
 * Keeps the palette in family with the brand orange.
 */
const ACCENTS = [
  { ring: 'ring-orange-200', tagBg: 'bg-orange-50', tagText: 'text-orange-700', tagBorder: 'border-orange-200', dot: 'bg-orange-500' },
  { ring: 'ring-rose-200', tagBg: 'bg-rose-50', tagText: 'text-rose-700', tagBorder: 'border-rose-200', dot: 'bg-rose-500' },
  { ring: 'ring-amber-200', tagBg: 'bg-amber-50', tagText: 'text-amber-700', tagBorder: 'border-amber-200', dot: 'bg-amber-500' },
  { ring: 'ring-emerald-200', tagBg: 'bg-emerald-50', tagText: 'text-emerald-700', tagBorder: 'border-emerald-200', dot: 'bg-emerald-500' },
  { ring: 'ring-sky-200', tagBg: 'bg-sky-50', tagText: 'text-sky-700', tagBorder: 'border-sky-200', dot: 'bg-sky-500' },
  { ring: 'ring-violet-200', tagBg: 'bg-violet-50', tagText: 'text-violet-700', tagBorder: 'border-violet-200', dot: 'bg-violet-500' },
];

const accentFor = (seed?: string) => {
  if (!seed) return ACCENTS[0];
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
};

export default function HomeArticlesSection({ articles }: Props) {
  if (!articles || articles.length === 0) return null;

  const featured = articles[0];
  const rest = articles.slice(1, 5);

  return (
    <section className="relative overflow-hidden">
      {/* decorative backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 via-white to-white pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-orange-200/30 via-amber-200/30 to-rose-200/30 blur-3xl rounded-full pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-12 md:py-16">
        {/* HEADER */}
        <div className="flex items-end justify-between mb-8 gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[11px] font-bold uppercase tracking-wider mb-3 shadow-md shadow-orange-500/20">
              <Sparkles size={12} />
              مجله بازارینو
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight">
              راهنمای{' '}
              <span className="bg-gradient-to-l from-orange-600 to-amber-500 bg-clip-text text-transparent">
                ایرانیان اروپا
              </span>
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-2 max-w-xl">
              مقاله‌های تخصصی درباره مهاجرت، اجاره خانه، بانک، شغل و زندگی روزمره
            </p>
          </div>
          <Link
            href="/news"
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border-2 border-orange-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-xs font-bold text-orange-700 px-4 py-2.5 transition shadow-sm"
          >
            همه مقاله‌ها
            <ArrowLeft size={14} />
          </Link>
        </div>

        {/* GRID */}
        <div className="grid lg:grid-cols-2 gap-5">
          <FeaturedCard article={featured} />
          <div className="grid gap-3.5">
            {rest.map((a) => (
              <SideCard key={a._id} article={a} />
            ))}
          </div>
        </div>

        {/* MOBILE "see all" */}
        <div className="mt-6 flex sm:hidden">
          <Link
            href="/news"
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-orange-200 bg-white hover:bg-orange-50 text-sm font-bold text-orange-700 py-3 transition"
          >
            همه مقاله‌ها
            <ArrowLeft size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────── */

function FeaturedCard({ article }: { article: Article }) {
  const accent = accentFor(article.tags?.[0]);
  return (
    <Link
      href={`/news/${encodeURIComponent(article.slug)}`}
      className="group relative overflow-hidden rounded-3xl bg-white shadow-sm hover:shadow-2xl ring-1 ring-gray-200 hover:ring-orange-300 transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-orange-300">
            <BookOpen size={64} />
          </div>
        )}
        {/* gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
        {/* hot badge */}
        {article.isHot && (
          <span className="absolute top-4 right-4 inline-flex items-center gap-1 bg-gradient-to-l from-red-500 to-rose-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">
            <Flame size={11} className="animate-pulse" /> داغ
          </span>
        )}
        {/* tag badge floating */}
        {article.tags && article.tags[0] && (
          <span
            className={`absolute top-4 left-4 inline-flex items-center gap-1 ${accent.tagBg} ${accent.tagText} ${accent.tagBorder} border text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md bg-white/90 shadow-sm`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${accent.dot}`} />
            {article.tags[0]}
          </span>
        )}
        {/* title overlaid on image bottom */}
        <div className="absolute inset-x-0 bottom-0 p-5 pt-10">
          <h3 className="text-lg md:text-xl font-black text-white leading-7 line-clamp-2 drop-shadow-md">
            {article.title}
          </h3>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col bg-white">
        <p className="text-sm text-gray-600 leading-7 line-clamp-2 mb-4">
          {article.excerpt}
        </p>
        <div className="mt-auto flex items-center justify-between gap-3 text-[11px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <Calendar size={11} />
              {toFaDigits(
                new Date(article.publishedAt || article.createdAt).toLocaleDateString('fa-IR'),
              )}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={11} />
              {toFaDigits(String(estimateReadMinutes(article.excerpt)))} دقیقه
            </span>
            {typeof article.views === 'number' && article.views > 0 && (
              <span className="inline-flex items-center gap-1">
                <Eye size={11} />
                {toFaDigits(String(article.views))}
              </span>
            )}
          </div>
          <span className="inline-flex items-center gap-0.5 text-orange-600 font-bold group-hover:gap-1.5 transition-all">
            ادامه
            <ArrowLeft size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}

function SideCard({ article }: { article: Article }) {
  const accent = accentFor(article.tags?.[0]);
  return (
    <Link
      href={`/news/${encodeURIComponent(article.slug)}`}
      className={`group flex gap-3 rounded-2xl bg-white shadow-sm hover:shadow-lg ring-1 ring-gray-200 hover:ring-2 hover:${accent.ring} transition-all duration-300 p-3 hover:-translate-y-0.5`}
    >
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-orange-300">
            <BookOpen size={28} />
          </div>
        )}
        {article.isHot && (
          <span className="absolute top-1.5 right-1.5 bg-gradient-to-l from-red-500 to-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
            🔥
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 py-1 flex flex-col">
        {article.tags && article.tags[0] && (
          <span
            className={`inline-flex self-start items-center gap-1 ${accent.tagBg} ${accent.tagText} ${accent.tagBorder} border text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5`}
          >
            <span className={`w-1 h-1 rounded-full ${accent.dot}`} />
            {article.tags[0]}
          </span>
        )}
        <h3 className="text-sm font-black text-gray-900 group-hover:text-orange-600 transition leading-6 line-clamp-2 mb-1">
          {article.title}
        </h3>
        <p className="text-[11px] text-gray-500 leading-5 line-clamp-2 mb-1.5">
          {article.excerpt}
        </p>
        <div className="mt-auto flex items-center gap-2 text-[10px] text-gray-400">
          <span className="inline-flex items-center gap-0.5">
            <Calendar size={9} />
            {toFaDigits(
              new Date(article.publishedAt || article.createdAt).toLocaleDateString('fa-IR'),
            )}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Clock size={9} />
            {toFaDigits(String(estimateReadMinutes(article.excerpt)))} دقیقه
          </span>
        </div>
      </div>
    </Link>
  );
}
