'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Eye,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Globe,
  Layers,
  ExternalLink,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { CITIES } from '@/lib/constants';

interface PageListItem {
  _id: string;
  slug: string;
  pageType: 'city' | 'category' | 'campaign' | 'general';
  status: 'draft' | 'published' | 'archived';
  title: string;
  views?: number;
  publishedAt?: string;
  updatedAt: string;
  targetCity?: string;
}

const pageTypeLabel: Record<string, string> = {
  city: 'شهری',
  category: 'دسته‌بندی',
  campaign: 'کمپین',
  general: 'عمومی',
};
const pageTypeColor: Record<string, string> = {
  city: 'bg-orange-50 text-orange-700 border-orange-200',
  category: 'bg-blue-50 text-blue-700 border-blue-200',
  campaign: 'bg-purple-50 text-purple-700 border-purple-200',
  general: 'bg-gray-50 text-gray-700 border-gray-200',
};
const statusColor: Record<string, string> = {
  draft: 'bg-amber-50 text-amber-700 border-amber-200',
  published: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-gray-100 text-gray-500 border-gray-200',
};
const statusLabel: Record<string, string> = {
  draft: 'پیش‌نویس',
  published: 'منتشر شده',
  archived: 'بایگانی',
};

export default function AdminLandingPagesList() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pages, setPages] = useState<PageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>('turin');
  const [seedingCities, setSeedingCities] = useState(false);
  const [showBlankModal, setShowBlankModal] = useState(false);
  const [blankTitle, setBlankTitle] = useState('');
  const [blankSlug, setBlankSlug] = useState('');
  const [blankType, setBlankType] = useState<'general' | 'campaign' | 'category' | 'city'>('general');
  const [creatingBlank, setCreatingBlank] = useState(false);

  const seedTopCities = async (force = false) => {
    const confirmMsg = force
      ? 'محتوای ۵ صفحه شهری اصلی با قالب جدید جایگزین می‌شود (هر تغییر دستی روی این صفحات از دست می‌رود). ادامه می‌دهی؟'
      : 'صفحات لندینگ شهرهای اصلی (تورین، میلان، رم، بولونیا، فلورانس) ساخته و منتشر می‌شوند. ادامه می‌دهی؟';
    if (!confirm(confirmMsg)) return;
    setSeedingCities(true);
    try {
      const url = `/api/admin/landing-pages/seed-cities${force ? '?force=1' : ''}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'failed');
      const parts: string[] = [];
      if (data.created?.length) parts.push(`${data.created.length} ساخته شد`);
      if (data.updated?.length) parts.push(`${data.updated.length} به‌روزرسانی شد`);
      if (data.skipped?.length) parts.push(`${data.skipped.length} رد شد`);
      toast.success(parts.join(' · ') || 'انجام شد');
      fetchPages();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ساخت');
    } finally {
      setSeedingCities(false);
    }
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (
      status === 'authenticated' &&
      (session?.user as { role?: string })?.role !== 'admin'
    )
      router.push('/');
  }, [status, session, router]);

  const fetchPages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/landing-pages');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPages(data.pages || []);
    } catch {
      toast.error('خطا در بارگذاری صفحات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchPages();
  }, [status]);

  const openBlankModal = () => {
    setBlankTitle('');
    setBlankSlug('');
    setBlankType('general');
    setShowBlankModal(true);
  };

  // Live-slugify the title so the admin sees the URL update as they type.
  // Handles both Latin and Persian — keeps Persian letters but strips spaces
  // to dashes and drops anything that would break a URL.
  const slugify = (s: string) =>
    s
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      // Keep ASCII letters/digits/dash + common Persian/Arabic ranges; drop the rest.
      .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

  const createBlank = async () => {
    const slug = slugify(blankSlug || blankTitle);
    const title = blankTitle.trim() || slug;
    if (!slug) {
      toast.error('یک عنوان یا slug وارد کن');
      return;
    }
    setCreatingBlank(true);
    try {
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, pageType: blankType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'failed');
      toast.success('صفحه جدید ساخته شد');
      setShowBlankModal(false);
      router.push(`/admin/pages/${data.page._id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ساخت');
    } finally {
      setCreatingBlank(false);
    }
  };

  const createFromCityTemplate = async () => {
    if (!selectedCity) return;
    setCreatingTemplate(true);
    try {
      const res = await fetch('/api/admin/landing-pages/from-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: 'city', city: selectedCity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'failed');
      toast.success('صفحه شهری از قالب ساخته شد');
      setShowTemplateModal(false);
      router.push(`/admin/pages/${data.page._id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ساخت');
    } finally {
      setCreatingTemplate(false);
    }
  };

  const deletePage = async (id: string, title: string) => {
    if (!confirm(`صفحه «${title}» حذف شود؟ این عملیات قابل بازگشت نیست.`)) return;
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('حذف شد');
      fetchPages();
    } catch {
      toast.error('خطا در حذف');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link
              href="/admin"
              className="text-xs text-gray-500 hover:text-orange-600 inline-flex items-center gap-1"
            >
              پنل ادمین
              <ArrowRight size={12} />
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-1 inline-flex items-center gap-2">
              <Layers className="text-orange-500" size={26} />
              صفحات لندینگ
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              صفحات SEO سفارشی بساز، با قالب آماده شهری یا از صفر — کاملاً قابل انتشار
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => seedTopCities(false)}
              disabled={seedingCities}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
              title="ساخت و انتشار همزمان ۵ شهر اصلی ایتالیا"
            >
              <Sparkles size={14} />
              {seedingCities ? 'در حال ساخت...' : 'ساخت سریع ۵ شهر اصلی'}
            </button>
            <button
              onClick={() => seedTopCities(true)}
              disabled={seedingCities}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition disabled:opacity-50"
              title="جایگزینی محتوای ۵ صفحه شهری با قالب جدید (overwrite)"
            >
              ↻ به‌روزرسانی قالب
            </button>
            <button
              onClick={() => setShowTemplateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold shadow-md hover:shadow-lg transition"
            >
              <Sparkles size={14} />
              قالب شهری آماده
            </button>
            <button
              onClick={openBlankModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition"
            >
              <Plus size={14} />
              صفحه خالی
            </button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-sm text-gray-400">
            در حال بارگذاری...
          </div>
        ) : pages.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-12 text-center">
            <Globe size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              هنوز صفحه‌ای نساخته‌اید. با یک کلیک قالب آماده شهری بسازید 👆
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
            <ul className="divide-y divide-gray-100">
              {pages.map((p) => (
                <li
                  key={p._id}
                  className="px-4 md:px-6 py-4 hover:bg-orange-50/30 transition"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/admin/pages/${p._id}`}
                      className="flex-1 min-w-0 group"
                    >
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="text-sm md:text-base font-bold text-gray-900 group-hover:text-orange-600 truncate">
                          {p.title}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            pageTypeColor[p.pageType]
                          }`}
                        >
                          {pageTypeLabel[p.pageType]}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            statusColor[p.status]
                          }`}
                        >
                          {statusLabel[p.status]}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700">
                          /p/{p.slug}
                        </code>
                        {typeof p.views === 'number' && p.views > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <Eye size={11} />
                            {p.views.toLocaleString('fa-IR')}
                          </span>
                        )}
                        <span>
                          آخرین ویرایش:{' '}
                          {new Date(p.updatedAt).toLocaleDateString('fa-IR')}
                        </span>
                      </div>
                    </Link>
                    <div className="flex items-center gap-1 self-center">
                      {p.status === 'published' && (
                        <Link
                          href={`/p/${p.slug}`}
                          target="_blank"
                          title="مشاهده زنده"
                          className="p-2 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                        >
                          <ExternalLink size={14} />
                        </Link>
                      )}
                      <Link
                        href={`/admin/pages/${p._id}`}
                        title="ویرایش"
                        className="p-2 rounded-lg text-gray-500 hover:text-orange-600 hover:bg-orange-50 transition"
                      >
                        <Pencil size={14} />
                      </Link>
                      <button
                        onClick={() => deletePage(p._id, p.title)}
                        title="حذف"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTemplateModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-5">
              <h3 className="font-bold text-lg inline-flex items-center gap-2">
                <Sparkles size={20} />
                قالب صفحه شهری
              </h3>
              <p className="text-xs text-white/90 mt-1">
                یک صفحه کامل برای شهر انتخابی شما با Hero, آمار، آگهی‌ها، مقالات،
                FAQ و SEO کامل ساخته می‌شود.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  انتخاب شهر
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none"
                >
                  {CITIES.map((c: { value: string; label: string }) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[11px] text-gray-500 bg-orange-50/50 border border-orange-100 rounded-xl p-3 leading-6">
                ✨ شامل: عنوان SEO، توضیحات، کلمات کلیدی، 8+ بخش (Hero/Stats/Ads/Articles/FAQ/CTA)، JSON-LD کامل
                <br />
                📍 URL: <code className="bg-white px-1.5 py-0.5 rounded">/p/{selectedCity}</code>
                <br />
                💾 ابتدا به صورت پیش‌نویس ذخیره می‌شود
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  disabled={creatingTemplate}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={createFromCityTemplate}
                  disabled={creatingTemplate}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold shadow-md hover:shadow-lg transition disabled:opacity-50"
                >
                  {creatingTemplate ? 'در حال ساخت...' : 'بساز'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blank Page Modal */}
      {showBlankModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !creatingBlank) setShowBlankModal(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white p-5">
              <h3 className="font-bold text-lg inline-flex items-center gap-2">
                <Plus size={20} />
                صفحه جدید از صفر
              </h3>
              <p className="text-xs text-white/80 mt-1">
                عنوان، نشانی URL و نوع صفحه را تعیین کن. در صفحه‌ی ویرایش می‌توانی بخش‌ها را اضافه کنی.
              </p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">عنوان صفحه</label>
                <input
                  type="text"
                  value={blankTitle}
                  onChange={(e) => setBlankTitle(e.target.value)}
                  onBlur={() => {
                    if (!blankSlug && blankTitle) setBlankSlug(slugify(blankTitle));
                  }}
                  placeholder="مثلاً: ایرانیان تورین"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  نشانی (slug)
                </label>
                <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
                  <span className="bg-gray-50 px-3 flex items-center text-xs text-gray-500 border-l border-gray-200 font-mono">
                    /p/
                  </span>
                  <input
                    type="text"
                    value={blankSlug}
                    onChange={(e) => setBlankSlug(e.target.value)}
                    onBlur={() => setBlankSlug(slugify(blankSlug))}
                    placeholder="torino"
                    className="flex-1 px-3 py-2.5 text-sm outline-none font-mono"
                    dir="ltr"
                  />
                </div>
                {blankSlug && (
                  <p className="text-[10px] text-gray-400 mt-1.5 font-mono">
                    URL: /p/{slugify(blankSlug)}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">نوع صفحه</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['general', 'city', 'category', 'campaign'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setBlankType(t)}
                      className={`text-[11px] font-bold px-2 py-2 rounded-lg border transition ${
                        blankType === t
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      {pageTypeLabel[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setShowBlankModal(false)}
                  disabled={creatingBlank}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition disabled:opacity-50"
                >
                  انصراف
                </button>
                <button
                  onClick={createBlank}
                  disabled={creatingBlank || (!blankTitle && !blankSlug)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 text-white font-bold shadow-md hover:bg-gray-800 transition disabled:opacity-50"
                >
                  {creatingBlank ? 'در حال ساخت...' : 'بساز و برو به ویرایش'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
