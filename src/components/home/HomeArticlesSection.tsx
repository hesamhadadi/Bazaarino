import Link from 'next/link';
import { ArrowLeft, BookOpen, Calendar, Clock, Eye, Flame } from 'lucide-react';
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

export default function HomeArticlesSection({ articles }: Props) {
  if (!articles || articles.length === 0) return null;

  const featured = articles[0];
  const rest = articles.slice(1, 5); // up to 4 more

  return (
    <section>
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-5 gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-1">
              <BookOpen size={12} /> مجله بازارینو
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900">
              راهنمای ایرانیان اروپا
            </h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              مقاله‌های تخصصی درباره مهاجرت، اجاره، بانک، شغل و زندگی
            </p>
          </div>
          <Link
            href="/news"
            className="inline-flex items-center gap-1 rounded-xl border border-gray-200 hover:border-orange-200 hover:bg-orange-50 text-xs font-semibold text-gray-700 hover:text-orange-700 px-3 py-2 transition"
          >
            همه مقاله‌ها
            <ArrowLeft size={13} />
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {/* Featured (large) */}
          <FeaturedCard article={featured} />

          {/* Side list */}
          <div className="grid gap-3">
            {rest.map((a) => (
              <SideCard key={a._id} article={a} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/news/${encodeURIComponent(article.slug)}`}
      className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg transition flex flex-col"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-orange-100 to-amber-100">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-orange-300">
            <BookOpen size={56} />
          </div>
        )}
        {article.isHot && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
            <Flame size={10} /> داغ
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>
      <div className="p-5 flex-1 flex flex-col">
        {article.tags && article.tags[0] && (
          <span className="inline-flex self-start text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 mb-2">
            #{article.tags[0]}
          </span>
        )}
        <h3 className="text-lg md:text-xl font-black text-gray-900 group-hover:text-orange-600 transition leading-7 mb-2">
          {article.title}
        </h3>
        <p className="text-sm text-gray-600 leading-7 line-clamp-2 mb-4">{article.excerpt}</p>
        <div className="mt-auto flex items-center gap-3 text-[11px] text-gray-500">
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
          {typeof article.views === 'number' && (
            <span className="inline-flex items-center gap-1">
              <Eye size={11} />
              {toFaDigits(String(article.views))}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function SideCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/news/${encodeURIComponent(article.slug)}`}
      className="group flex gap-3 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-orange-100 transition p-2.5"
    >
      <div className="relative w-28 h-28 sm:w-32 sm:h-32 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-50 to-amber-50">
        {article.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.coverImage}
            alt={article.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-orange-300">
            <BookOpen size={26} />
          </div>
        )}
        {article.isHot && (
          <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            🔥
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 py-1 flex flex-col">
        {article.tags && article.tags[0] && (
          <span className="text-[10px] font-bold text-orange-600 mb-1 truncate">
            #{article.tags[0]}
          </span>
        )}
        <h3 className="text-sm font-bold text-gray-900 group-hover:text-orange-600 transition leading-6 line-clamp-2 mb-1">
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
