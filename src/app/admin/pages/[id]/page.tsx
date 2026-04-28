'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  Save,
  Eye,
  Trash2,
  Plus,
  ArrowDown,
  ArrowUp,
  Globe,
  EyeOff,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { CATEGORIES, CITIES } from '@/lib/constants';

interface Section {
  id: string;
  type: string;
  data: Record<string, unknown>;
}

interface FaqItem {
  q: string;
  a: string;
}

interface PageDoc {
  _id: string;
  slug: string;
  pageType: 'city' | 'category' | 'campaign' | 'general';
  status: 'draft' | 'published' | 'archived';
  title: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  targetCity?: string;
  targetCategory?: string;
  targetSubcategory?: string;
  sections: Section[];
  faq?: FaqItem[];
}

const SECTION_TYPES: { value: string; label: string; emoji: string; default: Record<string, unknown> }[] = [
  {
    value: 'hero',
    label: 'هدر اصلی (Hero)',
    emoji: '🎯',
    default: {
      eyebrow: '',
      title: 'عنوان جذاب',
      subtitle: 'توضیحات کوتاه',
      primaryCta: { label: 'شروع کن', href: '/' },
    },
  },
  {
    value: 'stats',
    label: 'آمار زنده',
    emoji: '📊',
    default: { auto: true, title: 'آمار به یک نگاه' },
  },
  {
    value: 'ad-grid',
    label: 'گرید آگهی‌ها',
    emoji: '🛒',
    default: { title: 'آگهی‌های برتر', limit: 6 },
  },
  {
    value: 'article-grid',
    label: 'گرید مقالات',
    emoji: '📰',
    default: { title: 'راهنماها', limit: 4 },
  },
  {
    value: 'rich-text',
    label: 'متن غنی',
    emoji: '📝',
    default: { title: '', body: 'متن خود را اینجا بنویسید…' },
  },
  {
    value: 'feature-grid',
    label: 'گرید ویژگی‌ها',
    emoji: '✨',
    default: {
      title: 'چرا ما؟',
      features: [
        { emoji: '🚀', title: 'سریع', description: '' },
        { emoji: '🛡️', title: 'امن', description: '' },
        { emoji: '💛', title: 'دوست‌داشتنی', description: '' },
      ],
    },
  },
  {
    value: 'faq',
    label: 'سؤالات متداول',
    emoji: '❓',
    default: {
      title: 'سؤالات پرتکرار',
      items: [{ q: 'سؤال؟', a: 'پاسخ.' }],
    },
  },
  {
    value: 'cta-banner',
    label: 'بنر دعوت به اقدام',
    emoji: '📣',
    default: {
      title: 'الان شروع کن',
      subtitle: 'به ما بپیوند',
      cta: { label: 'ثبت‌نام', href: '/auth/register' },
      variant: 'orange',
    },
  },
  {
    value: 'gallery',
    label: 'گالری',
    emoji: '🖼️',
    default: { title: '', images: [] },
  },
];

export default function AdminLandingPageEditor() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || '');

  const [page, setPage] = useState<PageDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (
      status === 'authenticated' &&
      (session?.user as { role?: string })?.role !== 'admin'
    )
      router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/admin/landing-pages/${id}`);
        if (!res.ok) throw new Error();
        const data = await res.json();
        setPage(data.page);
      } catch {
        toast.error('خطا در بارگذاری');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const save = async (overrides?: Partial<PageDoc>) => {
    if (!page) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/landing-pages/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...page, ...overrides }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'failed');
      setPage(data.page);
      toast.success('ذخیره شد');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'خطا');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = () => {
    if (!page) return;
    save({ status: page.status === 'published' ? 'draft' : 'published' });
  };

  const addSection = (type: string) => {
    if (!page) return;
    const def = SECTION_TYPES.find((s) => s.value === type)?.default || {};
    const id = Math.random().toString(36).slice(2, 10);
    setPage({
      ...page,
      sections: [...page.sections, { id, type, data: { ...def } }],
    });
  };

  const updateSection = (idx: number, data: Record<string, unknown>) => {
    if (!page) return;
    const next = [...page.sections];
    next[idx] = { ...next[idx], data };
    setPage({ ...page, sections: next });
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    if (!page) return;
    const next = [...page.sections];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setPage({ ...page, sections: next });
  };

  const removeSection = (idx: number) => {
    if (!page) return;
    if (!confirm('این بخش حذف شود؟')) return;
    const next = page.sections.filter((_, i) => i !== idx);
    setPage({ ...page, sections: next });
  };

  const updateField = <K extends keyof PageDoc>(field: K, value: PageDoc[K]) => {
    if (!page) return;
    setPage({ ...page, [field]: value });
  };

  if (loading || !page) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-12 text-center text-sm text-gray-400">در حال بارگذاری...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 via-white to-white pb-24">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="min-w-0">
            <Link
              href="/admin/pages"
              className="text-xs text-gray-500 hover:text-orange-600 inline-flex items-center gap-1"
            >
              صفحات لندینگ
              <ArrowRight size={12} />
            </Link>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 mt-1 truncate">
              {page.title}
            </h1>
            <code className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded mt-1 inline-block">
              /p/{page.slug}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/p/${page.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:border-orange-300 hover:text-orange-600 transition"
            >
              <Eye size={14} />
              پیش‌نمایش
            </Link>
            <button
              onClick={togglePublish}
              disabled={saving}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-white text-sm font-bold shadow-md transition disabled:opacity-50 ${
                page.status === 'published'
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {page.status === 'published' ? (
                <>
                  <EyeOff size={14} />
                  لغو انتشار
                </>
              ) : (
                <>
                  <Globe size={14} />
                  انتشار
                </>
              )}
            </button>
            <button
              onClick={() => save()}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition disabled:opacity-50"
            >
              <Save size={14} />
              ذخیره
            </button>
          </div>
        </div>

        {/* SEO panel */}
        <details className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden" open>
          <summary className="cursor-pointer list-none px-5 py-3 flex items-center justify-between hover:bg-gray-50">
            <span className="font-bold text-gray-800 inline-flex items-center gap-2 text-sm">
              <Sparkles size={14} className="text-orange-500" />
              تنظیمات SEO و متادیتا
            </span>
            <span className="text-xs text-gray-400">برای تغییر کلیک کن</span>
          </summary>
          <div className="px-5 pb-5 pt-2 space-y-3 border-t border-gray-100">
            <div className="grid md:grid-cols-2 gap-3">
              <Field
                label="Title (SEO)"
                hint="عنوان صفحه که در گوگل نمایش داده می‌شود — بین ۵۰ تا ۶۰ کاراکتر بهترین است"
              >
                <input
                  value={page.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  maxLength={160}
                  className="form-input"
                />
                <Counter v={page.title.length} max={160} ideal={[50, 60]} />
              </Field>
              <Field label="Slug (URL)" hint="فقط حروف انگلیسی کوچک، عدد و خط تیره">
                <input
                  value={page.slug}
                  disabled
                  className="form-input bg-gray-50 text-gray-500"
                />
              </Field>
            </div>
            <Field
              label="Meta Description"
              hint="توضیحات کوتاه صفحه — بین ۱۲۰ تا ۱۶۰ کاراکتر بهترین است"
            >
              <textarea
                value={page.metaDescription || ''}
                onChange={(e) => updateField('metaDescription', e.target.value)}
                maxLength={320}
                rows={2}
                className="form-input"
              />
              <Counter v={(page.metaDescription || '').length} max={320} ideal={[120, 160]} />
            </Field>
            <Field label="کلمات کلیدی" hint="با کاما جدا کن">
              <input
                value={(page.metaKeywords || []).join(', ')}
                onChange={(e) =>
                  updateField(
                    'metaKeywords',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
                className="form-input"
              />
            </Field>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="نوع صفحه">
                <select
                  value={page.pageType}
                  onChange={(e) => updateField('pageType', e.target.value as PageDoc['pageType'])}
                  className="form-input"
                >
                  <option value="general">عمومی</option>
                  <option value="city">شهری</option>
                  <option value="category">دسته‌بندی</option>
                  <option value="campaign">کمپین</option>
                </select>
              </Field>
              <Field label="شهر هدف">
                <select
                  value={page.targetCity || ''}
                  onChange={(e) => updateField('targetCity', e.target.value || undefined)}
                  className="form-input"
                >
                  <option value="">— هیچ‌کدام —</option>
                  {CITIES.map((c: { value: string; label: string }) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="دسته‌بندی هدف">
                <select
                  value={page.targetCategory || ''}
                  onChange={(e) =>
                    updateField('targetCategory', e.target.value || undefined)
                  }
                  className="form-input"
                >
                  <option value="">— هیچ‌کدام —</option>
                  {CATEGORIES.map((c: { id: string; label: string }) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="OG Image (URL)" hint="در صورت خالی بودن، تصویر داینامیک ساخته می‌شود">
                <input
                  value={page.ogImage || ''}
                  onChange={(e) => updateField('ogImage', e.target.value)}
                  className="form-input"
                />
              </Field>
              <Field label="Canonical URL">
                <input
                  value={page.canonicalUrl || ''}
                  onChange={(e) => updateField('canonicalUrl', e.target.value)}
                  className="form-input"
                />
              </Field>
            </div>
            <label className="inline-flex items-center gap-2 text-xs text-gray-700">
              <input
                type="checkbox"
                checked={!!page.noindex}
                onChange={(e) => updateField('noindex', e.target.checked)}
              />
              <span>این صفحه را در گوگل نمایه نکن (noindex)</span>
            </label>
          </div>
        </details>

        {/* Sections */}
        <div className="bg-white rounded-2xl border border-gray-100 mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-bold text-gray-800 text-sm">
              بخش‌های صفحه ({page.sections.length})
            </h2>
            <div className="relative group">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold transition">
                <Plus size={12} />
                افزودن بخش
              </button>
              <div className="absolute left-0 top-full mt-1 w-60 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition z-10">
                {SECTION_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => addSection(t.value)}
                    className="w-full text-right px-3 py-2 hover:bg-orange-50 text-sm flex items-center gap-2 transition"
                  >
                    <span className="text-lg">{t.emoji}</span>
                    <span className="font-medium text-gray-800">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          {page.sections.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              هنوز بخشی اضافه نکرده‌اید. روی «افزودن بخش» کلیک کنید.
            </div>
          ) : (
            <ul>
              {page.sections.map((section, idx) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  idx={idx}
                  total={page.sections.length}
                  onChange={(data) => updateSection(idx, data)}
                  onMoveUp={() => moveSection(idx, -1)}
                  onMoveDown={() => moveSection(idx, 1)}
                  onRemove={() => removeSection(idx)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* FAQ list (separate from sections — used for both visible UI + JSON-LD) */}
        <FaqEditor
          faq={page.faq || []}
          onChange={(faq) => updateField('faq', faq)}
        />
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-gray-700 mb-1 inline-flex items-center gap-1">
        {label}
        {hint && (
          <span title={hint} className="text-gray-300 cursor-help">
            <HelpCircle size={11} />
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

function Counter({ v, max, ideal }: { v: number; max: number; ideal?: [number, number] }) {
  const inIdeal = ideal && v >= ideal[0] && v <= ideal[1];
  const tone = inIdeal
    ? 'text-emerald-600'
    : v > max
      ? 'text-red-600'
      : 'text-gray-400';
  return (
    <span className={`block text-[10px] mt-0.5 text-left ${tone}`}>
      {v}/{max}
      {ideal && ` (ایده‌آل: ${ideal[0]}-${ideal[1]})`}
    </span>
  );
}

/* ----------------------------------------------------------------------- */

function SectionEditor({
  section,
  idx,
  total,
  onChange,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  section: Section;
  idx: number;
  total: number;
  onChange: (data: Record<string, unknown>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const meta = useMemo(() => SECTION_TYPES.find((s) => s.value === section.type), [section.type]);
  const [open, setOpen] = useState(true);

  return (
    <li className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50/50">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-gray-800 flex-1 text-right"
        >
          <span className="text-lg">{meta?.emoji || '📦'}</span>
          <span>{meta?.label || section.type}</span>
          <span className="text-xs text-gray-400 font-normal">#{idx + 1}</span>
        </button>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={idx === 0}
            title="بالا"
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowUp size={14} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={idx === total - 1}
            title="پایین"
            className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowDown size={14} />
          </button>
          <button
            onClick={onRemove}
            title="حذف"
            className="p-1.5 text-gray-400 hover:text-red-600"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {open && (
        <div className="px-5 py-4">
          <SectionDataEditor section={section} onChange={onChange} />
        </div>
      )}
    </li>
  );
}

function SectionDataEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (data: Record<string, unknown>) => void;
}) {
  const set = (key: string, value: unknown) => {
    onChange({ ...section.data, [key]: value });
  };
  const d = section.data as Record<string, any>;

  switch (section.type) {
    case 'hero':
      return (
        <div className="space-y-2">
          <input
            placeholder="Eyebrow (متن کوچک بالای عنوان)"
            value={d.eyebrow || ''}
            onChange={(e) => set('eyebrow', e.target.value)}
            className="form-input"
          />
          <input
            placeholder="عنوان اصلی *"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input font-bold"
          />
          <textarea
            placeholder="زیرعنوان"
            value={d.subtitle || ''}
            onChange={(e) => set('subtitle', e.target.value)}
            rows={2}
            className="form-input"
          />
          <input
            placeholder="تصویر پس‌زمینه (URL — اختیاری)"
            value={d.backgroundImage || ''}
            onChange={(e) => set('backgroundImage', e.target.value)}
            className="form-input"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="متن دکمه اصلی"
              value={d.primaryCta?.label || ''}
              onChange={(e) =>
                set('primaryCta', { ...(d.primaryCta || {}), label: e.target.value })
              }
              className="form-input"
            />
            <input
              placeholder="لینک دکمه اصلی"
              value={d.primaryCta?.href || ''}
              onChange={(e) =>
                set('primaryCta', { ...(d.primaryCta || {}), href: e.target.value })
              }
              className="form-input"
            />
            <input
              placeholder="متن دکمه دوم"
              value={d.secondaryCta?.label || ''}
              onChange={(e) =>
                set('secondaryCta', { ...(d.secondaryCta || {}), label: e.target.value })
              }
              className="form-input"
            />
            <input
              placeholder="لینک دکمه دوم"
              value={d.secondaryCta?.href || ''}
              onChange={(e) =>
                set('secondaryCta', { ...(d.secondaryCta || {}), href: e.target.value })
              }
              className="form-input"
            />
          </div>
          <label className="inline-flex items-center gap-1.5 text-xs">
            <input
              type="checkbox"
              checked={!!d.showFlag}
              onChange={(e) => set('showFlag', e.target.checked)}
            />
            نمایش پرچم ایتالیا زیر عنوان
          </label>
        </div>
      );

    case 'stats':
      return (
        <div className="space-y-2">
          <input
            placeholder="عنوان (اختیاری)"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input"
          />
          <input
            placeholder="شهر برای محاسبه آمار (اختیاری)"
            value={d.targetCity || ''}
            onChange={(e) => set('targetCity', e.target.value)}
            className="form-input"
          />
          <p className="text-[11px] text-gray-500">آمار به طور خودکار از دیتابیس محاسبه می‌شود.</p>
        </div>
      );

    case 'ad-grid':
      return (
        <div className="space-y-2">
          <input
            placeholder="عنوان"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input"
          />
          <input
            placeholder="زیرعنوان"
            value={d.subtitle || ''}
            onChange={(e) => set('subtitle', e.target.value)}
            className="form-input"
          />
          <div className="grid grid-cols-3 gap-2">
            <select
              value={d.city || ''}
              onChange={(e) => set('city', e.target.value || undefined)}
              className="form-input"
            >
              <option value="">— هر شهر —</option>
              {CITIES.map((c: { value: string; label: string }) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
            <select
              value={d.category || ''}
              onChange={(e) => set('category', e.target.value || undefined)}
              className="form-input"
            >
              <option value="">— هر دسته —</option>
              {CATEGORIES.map((c: { id: string; label: string }) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="تعداد"
              min={3}
              max={12}
              value={d.limit || 6}
              onChange={(e) => set('limit', Number(e.target.value) || 6)}
              className="form-input"
            />
          </div>
        </div>
      );

    case 'article-grid':
      return (
        <div className="space-y-2">
          <input
            placeholder="عنوان"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input"
          />
          <input
            placeholder="تگ‌ها (با کاما جدا کن)"
            value={(d.tags || []).join(', ')}
            onChange={(e) =>
              set(
                'tags',
                e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              )
            }
            className="form-input"
          />
          <input
            type="number"
            min={2}
            max={8}
            placeholder="تعداد"
            value={d.limit || 4}
            onChange={(e) => set('limit', Number(e.target.value) || 4)}
            className="form-input"
          />
        </div>
      );

    case 'rich-text':
      return (
        <div className="space-y-2">
          <input
            placeholder="عنوان (اختیاری)"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input"
          />
          <textarea
            placeholder="متن صفحه (می‌توانی پاراگراف بنویسی)"
            value={d.body || ''}
            onChange={(e) => set('body', e.target.value)}
            rows={6}
            className="form-input"
          />
        </div>
      );

    case 'feature-grid':
      return (
        <div className="space-y-2">
          <input
            placeholder="عنوان"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input"
          />
          <input
            placeholder="زیرعنوان"
            value={d.subtitle || ''}
            onChange={(e) => set('subtitle', e.target.value)}
            className="form-input"
          />
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {(d.features || []).map((f: any, i: number) => (
              <div key={i} className="grid grid-cols-[40px_1fr_auto] gap-2 items-center bg-gray-50 rounded-xl p-2">
                <input
                  value={f.emoji || ''}
                  onChange={(e) => {
                    const next = [...d.features];
                    next[i] = { ...f, emoji: e.target.value };
                    set('features', next);
                  }}
                  placeholder="✨"
                  className="form-input text-center"
                />
                <div className="space-y-1">
                  <input
                    value={f.title || ''}
                    onChange={(e) => {
                      const next = [...d.features];
                      next[i] = { ...f, title: e.target.value };
                      set('features', next);
                    }}
                    placeholder="عنوان ویژگی"
                    className="form-input"
                  />
                  <input
                    value={f.description || ''}
                    onChange={(e) => {
                      const next = [...d.features];
                      next[i] = { ...f, description: e.target.value };
                      set('features', next);
                    }}
                    placeholder="توضیح کوتاه"
                    className="form-input text-xs"
                  />
                </div>
                <button
                  onClick={() => {
                    set('features', d.features.filter((_: any, idx: number) => idx !== i));
                  }}
                  className="p-2 text-gray-400 hover:text-red-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() =>
              set('features', [
                ...(d.features || []),
                { emoji: '✨', title: 'ویژگی جدید', description: '' },
              ])
            }
            className="text-xs text-orange-600 inline-flex items-center gap-1"
          >
            <Plus size={12} />
            افزودن ویژگی
          </button>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-2">
          <input
            placeholder="عنوان (اختیاری)"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input"
          />
          <FaqItemsEditor items={d.items || []} onChange={(items) => set('items', items)} />
        </div>
      );

    case 'cta-banner':
      return (
        <div className="space-y-2">
          <input
            placeholder="عنوان جذاب"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input"
          />
          <input
            placeholder="زیرعنوان"
            value={d.subtitle || ''}
            onChange={(e) => set('subtitle', e.target.value)}
            className="form-input"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              placeholder="متن دکمه"
              value={d.cta?.label || ''}
              onChange={(e) => set('cta', { ...(d.cta || {}), label: e.target.value })}
              className="form-input"
            />
            <input
              placeholder="لینک دکمه"
              value={d.cta?.href || ''}
              onChange={(e) => set('cta', { ...(d.cta || {}), href: e.target.value })}
              className="form-input"
            />
          </div>
          <select
            value={d.variant || 'orange'}
            onChange={(e) => set('variant', e.target.value)}
            className="form-input"
          >
            <option value="orange">نارنجی</option>
            <option value="purple">بنفش</option>
            <option value="emerald">سبز</option>
          </select>
        </div>
      );

    case 'gallery':
      return (
        <div className="space-y-2">
          <input
            placeholder="عنوان"
            value={d.title || ''}
            onChange={(e) => set('title', e.target.value)}
            className="form-input"
          />
          <textarea
            placeholder='URL تصاویر — هر خط یک URL'
            value={(d.images || []).map((i: any) => i.src).join('\n')}
            onChange={(e) =>
              set(
                'images',
                e.target.value
                  .split('\n')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((src) => ({ src })),
              )
            }
            rows={5}
            className="form-input font-mono text-xs"
          />
        </div>
      );

    default:
      return (
        <pre className="text-xs bg-gray-50 rounded p-2 overflow-x-auto">
          {JSON.stringify(section.data, null, 2)}
        </pre>
      );
  }
}

/* ----------------------------------------------------------------------- */

function FaqItemsEditor({
  items,
  onChange,
}: {
  items: FaqItem[];
  onChange: (items: FaqItem[]) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="bg-gray-50 rounded-xl p-2 space-y-1">
          <div className="flex items-start gap-1">
            <input
              value={it.q}
              onChange={(e) => {
                const next = [...items];
                next[i] = { ...it, q: e.target.value };
                onChange(next);
              }}
              placeholder="سؤال"
              className="form-input font-bold flex-1"
            />
            <button
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
              className="p-2 text-gray-400 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <textarea
            value={it.a}
            onChange={(e) => {
              const next = [...items];
              next[i] = { ...it, a: e.target.value };
              onChange(next);
            }}
            placeholder="پاسخ"
            rows={2}
            className="form-input text-xs"
          />
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { q: '', a: '' }])}
        className="text-xs text-orange-600 inline-flex items-center gap-1"
      >
        <Plus size={12} />
        افزودن سؤال
      </button>
    </div>
  );
}

function FaqEditor({
  faq,
  onChange,
}: {
  faq: FaqItem[];
  onChange: (faq: FaqItem[]) => void;
}) {
  return (
    <details className="bg-white rounded-2xl border border-gray-100 overflow-hidden" open>
      <summary className="cursor-pointer list-none px-5 py-3 flex items-center justify-between hover:bg-gray-50">
        <span className="font-bold text-gray-800 text-sm inline-flex items-center gap-2">
          ❓ FAQ صفحه ({faq.length})
          <span className="text-[10px] font-normal text-gray-400">
            برای Rich Snippets گوگل (FAQPage schema)
          </span>
        </span>
      </summary>
      <div className="px-5 pb-5 pt-2 border-t border-gray-100">
        <FaqItemsEditor items={faq} onChange={onChange} />
      </div>
    </details>
  );
}
