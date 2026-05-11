import Link from 'next/link';
import { Calendar, Eye, Plus, Edit3, ArrowUpRight, Flame, FileText, Clock, ArrowDownUp } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import '@/models/User';
import { toFaDigits } from '@/lib/locale';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ArticleSort = 'smart' | 'newest' | 'oldest' | 'views' | 'title' | 'published' | 'scheduled';

const sortOptions: { value: ArticleSort; label: string }[] = [
  { value: 'smart', label: 'پیش‌فرض' },
  { value: 'newest', label: 'جدیدترین' },
  { value: 'oldest', label: 'قدیمی‌ترین' },
  { value: 'views', label: 'پربازدیدترین' },
  { value: 'title', label: 'عنوان' },
  { value: 'published', label: 'منتشر شده‌ها' },
  { value: 'scheduled', label: 'زمان‌بندی' },
];

function normalizeSort(value?: string): ArticleSort {
  return sortOptions.some((option) => option.value === value) ? (value as ArticleSort) : 'smart';
}

async function getArticles(sort: ArticleSort) {
  try {
    await connectDB();
    const items = await Article.find({})
      .populate('authorId', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    items.sort((a: any, b: any) => {
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'views') return (b.views || 0) - (a.views || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'title') return String(a.title || '').localeCompare(String(b.title || ''), 'fa');
      if (sort === 'published') {
        const statusDelta = Number(b.status === 'published') - Number(a.status === 'published');
        if (statusDelta) return statusDelta;
        return new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime();
      }
      if (sort === 'scheduled') {
        const statusDelta = Number(b.status === 'scheduled') - Number(a.status === 'scheduled');
        if (statusDelta) return statusDelta;
        return new Date(a.scheduledFor || a.createdAt).getTime() - new Date(b.scheduledFor || b.createdAt).getTime();
      }

      // Display order: scheduled (soonest first) → drafts → published (newest first).
      const order = (item: any) =>
        item.status === 'scheduled' ? 0 : item.status === 'draft' ? 1 : 2;
      const oa = order(a);
      const ob = order(b);
      if (oa !== ob) return oa - ob;
      if (a.status === 'scheduled' && b.status === 'scheduled') {
        return new Date(a.scheduledFor || 0).getTime() - new Date(b.scheduledFor || 0).getTime();
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams?: { sort?: string };
}) {
  const sort = normalizeSort(searchParams?.sort);
  const articles = await getArticles(sort);
  const publishedCount = articles.filter((a: any) => a.status === 'published').length;
  const scheduledCount = articles.filter((a: any) => a.status === 'scheduled').length;
  const draftCount = articles.filter((a: any) => a.status === 'draft').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">مقالات</h1>
          <p className="text-sm text-gray-500 mt-1">
            مدیریت مقاله‌های مجله بازارینو — نوشتن، ویرایش و انتشار
          </p>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2.5 text-sm font-bold shadow-md shadow-orange-500/20 transition"
        >
          <Plus size={15} />
          مقاله جدید
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="کل مقالات" value={articles.length} icon={<FileText size={14} />} />
        <KpiCard label="منتشر شده" value={publishedCount} accent="emerald" />
        <KpiCard label="زمان‌بندی شده" value={scheduledCount} accent="orange" icon={<Clock size={14} />} />
        <KpiCard label="پیش‌نویس" value={draftCount} accent="amber" />
      </div>

      {/* List */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {articles.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <FileText size={18} />
            </div>
            <p className="text-base font-semibold text-gray-800 mb-1">هنوز مقاله‌ای نداری</p>
            <p className="text-sm text-gray-500 mb-5">اولین مقاله رو منتشر کن.</p>
            <Link
              href="/admin/articles/new"
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm font-semibold transition"
            >
              <Plus size={14} /> ساختن مقاله
            </Link>
          </div>
        ) : (
          <>
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-gray-100 px-4 py-3 bg-gray-50/70">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600">
              <ArrowDownUp size={13} />
              مرتب‌سازی مقالات
            </div>
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {sortOptions.map((option) => (
                <Link
                  key={option.value}
                  href={`/admin/articles${option.value === 'smart' ? '' : `?sort=${option.value}`}`}
                  className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    sort === option.value
                      ? 'border-orange-200 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {articles.map((a: any) => (
              <div
                key={a._id}
                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition"
              >
                {/* Thumbnail */}
                <div className="shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-orange-100 via-amber-50 to-white border border-gray-100 overflow-hidden">
                  {a.coverImage ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={a.coverImage}
                      alt={a.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-orange-300">
                      <FileText size={20} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-sm font-bold text-gray-900 truncate">
                      {a.title}
                    </h3>
                    {a.isHot && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                        <Flame size={9} /> داغ
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                        a.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : a.status === 'scheduled'
                            ? 'bg-orange-50 text-orange-700 border border-orange-100 inline-flex items-center gap-1'
                            : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}
                    >
                      {a.status === 'published' && 'منتشر شده'}
                      {a.status === 'scheduled' && (
                        <>
                          <Clock size={9} /> زمان‌بندی شده
                        </>
                      )}
                      {a.status === 'draft' && 'پیش‌نویس'}
                    </span>
                    {a.status === 'scheduled' && a.scheduledFor && (
                      <span className="text-[10px] text-orange-600 font-semibold">
                        {toFaDigits(
                          new Date(a.scheduledFor).toLocaleString('fa-IR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          }),
                        )}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{a.excerpt}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                    <span className="inline-flex items-center gap-1">
                      <Calendar size={11} />
                      {toFaDigits(new Date(a.createdAt).toLocaleDateString('fa-IR'))}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye size={11} />
                      {toFaDigits(String(a.views || 0))}
                    </span>
                    {a.authorId?.name && (
                      <span className="truncate">— {a.authorId.name}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/news/${encodeURIComponent(a.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
                    title="مشاهده"
                  >
                    <ArrowUpRight size={14} />
                  </Link>
                  <Link
                    href={`/admin/articles/${encodeURIComponent(a.slug)}/edit`}
                    className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
                    title="ویرایش"
                  >
                    <Edit3 size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon,
  accent = 'gray',
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  accent?: 'gray' | 'emerald' | 'amber' | 'orange';
}) {
  const accentCls =
    accent === 'emerald'
      ? 'text-emerald-600'
      : accent === 'amber'
        ? 'text-amber-600'
        : accent === 'orange'
          ? 'text-orange-600'
          : 'text-gray-900';
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1">
        {icon}
        {label}
      </div>
      <div className={`text-2xl font-black ${accentCls}`}>
        {toFaDigits(String(value))}
      </div>
    </div>
  );
}
