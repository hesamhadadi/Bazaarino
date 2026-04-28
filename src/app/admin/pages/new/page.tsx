'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Plus,
  Sparkles,
  Globe,
  Tag,
  Megaphone,
  FileText,
  Eye,
} from 'lucide-react';
import { CITIES } from '@/lib/constants';

type PageType = 'general' | 'city' | 'category' | 'campaign';

const PAGE_TYPES: {
  value: PageType;
  label: string;
  description: string;
  Icon: typeof Globe;
  color: string;
}[] = [
  {
    value: 'general',
    label: 'صفحه عمومی',
    description: 'یک صفحه آزاد برای هر هدفی — درباره ما، قوانین، یا یک کمپین خاص',
    Icon: FileText,
    color: 'from-gray-700 to-gray-900',
  },
  {
    value: 'city',
    label: 'صفحه شهری',
    description: 'هاب SEO برای یک شهر — آگهی‌ها، آمار، راهنماها و FAQ',
    Icon: Globe,
    color: 'from-orange-500 to-rose-500',
  },
  {
    value: 'category',
    label: 'صفحه دسته‌بندی',
    description: 'هاب یک دسته (مسکن، خودرو، …) با فیلترهای آماده',
    Icon: Tag,
    color: 'from-emerald-500 to-teal-600',
  },
  {
    value: 'campaign',
    label: 'صفحه کمپین',
    description: 'لندینگ تبلیغاتی برای جذب کاربر یا تخفیف‌های فصلی',
    Icon: Megaphone,
    color: 'from-violet-500 to-fuchsia-600',
  },
];

// Slug-friendly characters: ASCII letters/digits/dash + Persian/Arabic ranges.
// We avoid the `\p{L}` unicode-flag form so the regex compiles on every TS target.
const slugify = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\u0600-\u06FF\u0750-\u077F-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

export default function NewLandingPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [pageType, setPageType] = useState<PageType>('general');
  const [targetCity, setTargetCity] = useState('');
  const [creating, setCreating] = useState(false);

  // While the admin hasn't manually edited the slug, mirror the title.
  const handleTitleChange = (v: string) => {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  };

  const finalSlug = slugify(slug || title);

  const handleCreate = async () => {
    if (!finalSlug) {
      toast.error('یک عنوان یا نشانی URL وارد کن');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/landing-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: finalSlug,
          title: title.trim() || finalSlug,
          pageType,
          targetCity: pageType === 'city' && targetCity ? targetCity : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'خطا در ساخت');
      toast.success('صفحه جدید ساخته شد');
      router.push(`/admin/pages/${data.page._id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا در ساخت صفحه');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-24">
      {/* Breadcrumb */}
      <Link
        href="/admin/pages"
        className="text-xs text-gray-500 hover:text-orange-600 inline-flex items-center gap-1 mb-3"
      >
        صفحات لندینگ
        <ArrowRight size={12} />
      </Link>

      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-zinc-900 text-white p-8 md:p-10 mb-6 shadow-xl">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/30 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-rose-500/20 blur-3xl"
        />
        <div className="relative">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300 mb-2">
            <Sparkles size={12} className="animate-pulse" />
            صفحه جدید
          </p>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">
            ساخت یک صفحه لندینگ جدید
          </h1>
          <p className="mt-2 text-sm md:text-base text-white/75 max-w-2xl leading-7">
            عنوان، نشانی و نوع صفحه را مشخص کن. بعد از ساخت، می‌توانی بخش‌ها (Hero,
            Stats, FAQ, …) را با drag & drop به صفحه اضافه و ویرایش کنی.
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8 space-y-6">
        {/* Step 1: title + slug */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-black text-sm flex items-center justify-center">
              ۱
            </span>
            <h2 className="font-black text-gray-900">عنوان و نشانی</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="block">
              <span className="text-xs font-bold text-gray-700 mb-1.5 block">
                عنوان صفحه
              </span>
              <input
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="مثلاً: ایرانیان تورین"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                autoFocus
              />
              <p className="text-[10px] text-gray-400 mt-1">
                همان عنوانی که در گوگل و در tab مرورگر نمایش داده می‌شود
              </p>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-gray-700 mb-1.5 block">
                نشانی صفحه (slug)
              </span>
              <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
                <span className="bg-gray-50 px-3 flex items-center text-xs text-gray-500 border-l border-gray-200 font-mono">
                  /p/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setSlugTouched(true);
                  }}
                  onBlur={() => setSlug(slugify(slug))}
                  placeholder="torino"
                  className="flex-1 px-3 py-2.5 text-sm outline-none font-mono"
                  dir="ltr"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1 font-mono" dir="ltr">
                URL: /p/{finalSlug || '...'}
              </p>
            </label>
          </div>
        </section>

        {/* Step 2: page type */}
        <section className="border-t border-gray-100 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-black text-sm flex items-center justify-center">
              ۲
            </span>
            <h2 className="font-black text-gray-900">نوع صفحه</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PAGE_TYPES.map((t) => {
              const active = pageType === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setPageType(t.value)}
                  className={`relative text-right p-4 rounded-2xl border-2 transition group ${
                    active
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-100 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.color} text-white flex items-center justify-center shadow-md flex-shrink-0`}
                    >
                      <t.Icon size={18} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-gray-900 text-sm">{t.label}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-5">
                        {t.description}
                      </p>
                    </div>
                  </div>
                  {active && (
                    <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-gray-900 text-white text-[10px] flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 3: city target (only when pageType === 'city') */}
        {pageType === 'city' && (
          <section className="border-t border-gray-100 pt-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 font-black text-sm flex items-center justify-center">
                ۳
              </span>
              <h2 className="font-black text-gray-900">شهر هدف (اختیاری)</h2>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              اگر شهر را انتخاب کنی، بخش‌های آماری و آگهی‌ها به‌صورت خودکار به این شهر
              فیلتر می‌شوند. اگر می‌خواهی صفحه‌ای کامل با محتوای آماده بسازی، از{' '}
              <strong>قالب شهری آماده</strong> در لیست صفحات استفاده کن.
            </p>
            <select
              value={targetCity}
              onChange={(e) => setTargetCity(e.target.value)}
              className="w-full md:w-1/2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            >
              <option value="">— انتخاب کنید —</option>
              {CITIES.filter((c) => c.value !== 'other').map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </section>
        )}

        {/* Actions */}
        <section className="border-t border-gray-100 pt-6 flex items-center gap-3 flex-wrap">
          <button
            onClick={handleCreate}
            disabled={creating || !finalSlug}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gray-900 text-white font-bold shadow-md hover:bg-gray-800 transition disabled:opacity-50"
          >
            <Plus size={16} />
            {creating ? 'در حال ساخت...' : 'بساز و برو به ویرایش'}
          </button>
          <Link
            href="/admin/pages"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition"
          >
            انصراف
          </Link>
          <span className="ml-auto text-[11px] text-gray-400 inline-flex items-center gap-1">
            <Eye size={12} />
            صفحه ابتدا به‌صورت <strong className="text-gray-600">پیش‌نویس</strong> ذخیره می‌شود
          </span>
        </section>
      </div>
    </div>
  );
}
