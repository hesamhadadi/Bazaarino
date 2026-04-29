'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Save,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { CITIES } from '@/lib/constants';
import { CITY_VISUALS, DEFAULT_VISUAL } from '@/lib/city-images';

/* ------------------------------------------------------------------ */
/*  Local types                                                        */
/* ------------------------------------------------------------------ */

interface CityVisualOverride {
  _id?: string;
  slug: string;
  image?: string;
  gradient?: string;
  accent?: string;
  emoji?: string;
  enabled: boolean;
  priority: number;
  imageVerifiedAt?: string;
}

type CheckState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'ok'; contentType?: string; contentLength?: number }
  | { status: 'error'; error: string };

/* ------------------------------------------------------------------ */
/*  Curated palette suggestions — copy/paste-friendly tailwind classes */
/* ------------------------------------------------------------------ */

const GRADIENT_PRESETS = [
  { label: 'نارنجی-گرم', value: 'from-orange-500 via-amber-500 to-rose-500' },
  { label: 'گلبهی-قرمز', value: 'from-rose-600 via-red-600 to-amber-600' },
  { label: 'آبی-فیروزه', value: 'from-sky-600 via-cyan-600 to-blue-800' },
  { label: 'سبز-آبی', value: 'from-emerald-600 via-teal-600 to-sky-700' },
  { label: 'بنفش-مشکی', value: 'from-slate-800 via-slate-700 to-zinc-900' },
  { label: 'صورتی-قرمز', value: 'from-pink-500 via-rose-500 to-red-600' },
  { label: 'بنفش-فوشیا', value: 'from-indigo-600 via-purple-600 to-fuchsia-700' },
  { label: 'زرد-نارنجی', value: 'from-yellow-500 via-orange-500 to-red-600' },
  { label: 'زرد-طلایی', value: 'from-amber-500 via-yellow-600 to-orange-700' },
];

const ACCENT_PRESETS = [
  'bg-orange-200',
  'bg-rose-300',
  'bg-amber-300',
  'bg-sky-200',
  'bg-emerald-200',
  'bg-pink-200',
  'bg-violet-200',
  'bg-yellow-200',
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function AdminCityVisualsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [overrides, setOverrides] = useState<Record<string, CityVisualOverride>>({});
  const [drafts, setDrafts] = useState<Record<string, CityVisualOverride>>({});
  const [savingSlug, setSavingSlug] = useState<string | null>(null);
  const [checks, setChecks] = useState<Record<string, CheckState>>({});
  const [filter, setFilter] = useState('');

  /* ---------------------------- Auth gate ---------------------------- */
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/');
    }
  }, [status, session, router]);

  /* ---------------------------- Load --------------------------------- */
  useEffect(() => {
    if (!session || session.user.role !== 'admin') return;
    fetch('/api/admin/city-visuals')
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, CityVisualOverride> = {};
        for (const v of d.visuals || []) map[v.slug] = v;
        setOverrides(map);
        setDrafts(map);
      })
      .catch(() => toast.error('خطا در دریافت داده‌ها'))
      .finally(() => setLoading(false));
  }, [session]);

  /**
   * The list shown to the admin is the union of:
   *  1. Every city in CITIES (so they can configure new ones)
   *  2. Every saved override (in case a slug isn't in CITIES yet)
   * We sort: enabled first → by priority desc → alphabetic.
   */
  const rows = useMemo(() => {
    const slugs = new Set<string>();
    CITIES.forEach((c) => c.value !== 'other' && slugs.add(c.value));
    Object.keys(overrides).forEach((s) => slugs.add(s));

    const list = Array.from(slugs).map((slug) => {
      const cityMeta = CITIES.find((c) => c.value === slug);
      const draft = drafts[slug];
      const o = overrides[slug];
      const staticVis = CITY_VISUALS[slug] || DEFAULT_VISUAL;
      return {
        slug,
        label: cityMeta?.label || slug,
        country: cityMeta?.country || '—',
        draft: draft || ({ slug, enabled: true, priority: 0 } as CityVisualOverride),
        saved: o,
        staticVis,
      };
    });

    const q = filter.trim().toLowerCase();
    return list
      .filter((r) =>
        q ? r.slug.includes(q) || r.label.toLowerCase().includes(q) : true,
      )
      .sort((a, b) => {
        if (a.draft.enabled !== b.draft.enabled) return a.draft.enabled ? -1 : 1;
        if (a.draft.priority !== b.draft.priority)
          return b.draft.priority - a.draft.priority;
        return a.label.localeCompare(b.label, 'fa');
      });
  }, [overrides, drafts, filter]);

  /* ---------------------------- Mutations ---------------------------- */

  const updateDraft = (slug: string, patch: Partial<CityVisualOverride>) => {
    setDrafts((prev) => {
      const existing: CityVisualOverride = prev[slug] ?? {
        slug,
        enabled: true,
        priority: 0,
      };
      return { ...prev, [slug]: { ...existing, ...patch, slug } };
    });
  };

  const checkImage = async (slug: string, url: string) => {
    if (!url) return;
    setChecks((c) => ({ ...c, [slug]: { status: 'checking' } }));
    try {
      const res = await fetch('/api/admin/check-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (data.ok) {
        setChecks((c) => ({
          ...c,
          [slug]: {
            status: 'ok',
            contentType: data.contentType,
            contentLength: data.contentLength,
          },
        }));
        toast.success('عکس قابل بارگذاری است');
      } else {
        setChecks((c) => ({
          ...c,
          [slug]: { status: 'error', error: data.error || 'پاسخ نامعتبر' },
        }));
        toast.error(data.error || 'لینک عکس قابل دسترسی نیست');
      }
    } catch (err) {
      setChecks((c) => ({
        ...c,
        [slug]: {
          status: 'error',
          error: err instanceof Error ? err.message : 'خطا',
        },
      }));
    }
  };

  const save = async (slug: string) => {
    const draft = drafts[slug];
    if (!draft) return;
    setSavingSlug(slug);
    try {
      // If the admin entered an image URL but never validated it, do a
      // best-effort check on save so we don't persist obvious 404s.
      if (draft.image && checks[slug]?.status !== 'ok') {
        await checkImage(slug, draft.image);
      }
      const res = await fetch('/api/admin/city-visuals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...draft,
          imageVerifiedAt:
            checks[slug]?.status === 'ok' ? new Date().toISOString() : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'خطا');
      setOverrides((prev) => ({ ...prev, [slug]: data.visual }));
      toast.success('ذخیره شد');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در ذخیره');
    } finally {
      setSavingSlug(null);
    }
  };

  const reset = async (slug: string) => {
    if (!confirm('بازگرداندن به مقادیر پیش‌فرض؟ تمام تنظیمات این شهر حذف می‌شود.')) return;
    try {
      await fetch(`/api/admin/city-visuals?slug=${slug}`, { method: 'DELETE' });
      setOverrides((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[slug];
        return next;
      });
      toast.success('پیش‌فرض شد');
    } catch {
      toast.error('خطا در حذف');
    }
  };

  /* ---------------------------- Render -------------------------------- */

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 flex-wrap mb-6">
          <div>
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 mb-2"
            >
              <ArrowRight size={14} />
              بازگشت به پنل
            </Link>
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 inline-flex items-center gap-2">
              <Sparkles className="text-orange-500" size={22} />
              ویژوال شهرها
            </h1>
            <p className="text-sm text-gray-500 mt-1 max-w-xl leading-7">
              تصویر، ایموجی، گرادیان و اولویت هر شهر برای کارت‌های صفحه‌ی اصلی و هیرو
              صفحه‌ی شهر را تنظیم کن. لینک عکس قبل از ذخیره چک می‌شود.
            </p>
          </div>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="جست‌وجوی شهر…"
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>

        {/* Hint card */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 mb-5 text-[13px] leading-7 text-amber-900">
          <p className="font-bold mb-1">💡 نکته</p>
          <ul className="list-disc pr-5 space-y-1 text-amber-800">
            <li>
              مقادیر خالی، از <strong>پیش‌فرض داخلی</strong> استفاده می‌کنند — لازم نیست
              همه فیلدها را پر کنی.
            </li>
            <li>
              برای حذف کارت یک شهر از صفحه اصلی، تیک <strong>«نمایش روی صفحه‌ی اصلی»</strong>{' '}
              را بردار.
            </li>
            <li>
              برای اضافه‌کردن کارت جدید، اول صفحه شهر را در{' '}
              <Link href="/admin/pages" className="underline font-bold">
                /admin/pages
              </Link>{' '}
              منتشر کن.
            </li>
          </ul>
        </div>

        {/* List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rows.map(({ slug, label, country, draft, saved, staticVis }) => {
            const effective = {
              image: draft.image || staticVis.image,
              gradient: draft.gradient || staticVis.gradient,
              accent: draft.accent || staticVis.accent,
              emoji: draft.emoji || staticVis.emoji,
            };
            const dirty =
              !saved ||
              saved.image !== draft.image ||
              saved.gradient !== draft.gradient ||
              saved.accent !== draft.accent ||
              saved.emoji !== draft.emoji ||
              saved.enabled !== draft.enabled ||
              saved.priority !== draft.priority;

            const ck = checks[slug];

            return (
              <div
                key={slug}
                className={`bg-white rounded-2xl border ${
                  dirty ? 'border-orange-300 ring-2 ring-orange-100' : 'border-gray-200'
                } overflow-hidden transition`}
              >
                {/* Live preview tile */}
                <div className="relative aspect-[5/2] overflow-hidden">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${effective.gradient}`}
                  />
                  {effective.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={effective.image}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
                      onError={(e) => ((e.currentTarget.style.display = 'none'))}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-base">
                    {effective.emoji || '✨'}
                  </div>
                  <div className="absolute bottom-2 right-3 left-3 flex items-end justify-between text-white">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.18em] opacity-80 font-bold">
                        {country}
                      </p>
                      <h3 className="font-black text-lg drop-shadow">{label}</h3>
                    </div>
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${effective.accent}`}
                    />
                  </div>
                  {!draft.enabled && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="px-3 py-1.5 rounded-full bg-white/90 text-gray-900 text-xs font-bold inline-flex items-center gap-1.5">
                        <EyeOff size={12} />
                        پنهان از صفحه‌ی اصلی
                      </span>
                    </div>
                  )}
                </div>

                {/* Form */}
                <div className="p-4 space-y-3">
                  {/* slug & priority row */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <code className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono">
                      {slug}
                    </code>
                    <label className="inline-flex items-center gap-2 text-gray-700">
                      <span>اولویت:</span>
                      <input
                        type="number"
                        value={draft.priority ?? 0}
                        onChange={(e) =>
                          updateDraft(slug, { priority: Number(e.target.value) || 0 })
                        }
                        className="w-16 px-2 py-1 rounded-md border border-gray-200 text-center"
                      />
                    </label>
                    <label className="inline-flex items-center gap-1.5 text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft.enabled !== false}
                        onChange={(e) =>
                          updateDraft(slug, { enabled: e.target.checked })
                        }
                        className="accent-orange-500"
                      />
                      نمایش روی صفحه‌ی اصلی
                    </label>
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      لینک عکس
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        dir="ltr"
                        value={draft.image || ''}
                        onChange={(e) => {
                          updateDraft(slug, { image: e.target.value });
                          // Reset the validation light when the URL changes.
                          setChecks((c) => ({ ...c, [slug]: { status: 'idle' } }));
                        }}
                        placeholder={staticVis.image || 'https://…'}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                      <button
                        type="button"
                        onClick={() => checkImage(slug, draft.image || '')}
                        disabled={!draft.image || ck?.status === 'checking'}
                        className="px-3 py-2 rounded-lg bg-gray-900 text-white text-xs font-bold hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {ck?.status === 'checking' ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : ck?.status === 'ok' ? (
                          <CheckCircle2 size={12} className="text-emerald-300" />
                        ) : ck?.status === 'error' ? (
                          <XCircle size={12} className="text-rose-300" />
                        ) : (
                          <ImageIcon size={12} />
                        )}
                        تست
                      </button>
                      {draft.image && (
                        <a
                          href={draft.image}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-2 rounded-lg bg-gray-100 text-gray-700 text-xs hover:bg-gray-200 inline-flex items-center"
                          title="باز کردن در تب جدید"
                        >
                          <ExternalLink size={12} />
                        </a>
                      )}
                    </div>
                    {ck?.status === 'ok' && (
                      <p className="text-[11px] text-emerald-700 mt-1 inline-flex items-center gap-1">
                        <CheckCircle2 size={11} />
                        معتبر — {ck.contentType}
                        {ck.contentLength
                          ? ` · ${(ck.contentLength / 1024).toFixed(0)}KB`
                          : ''}
                      </p>
                    )}
                    {ck?.status === 'error' && (
                      <p className="text-[11px] text-rose-700 mt-1 inline-flex items-center gap-1">
                        <XCircle size={11} />
                        {ck.error}
                      </p>
                    )}
                  </div>

                  {/* Emoji + accent */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        ایموجی
                      </label>
                      <input
                        value={draft.emoji || ''}
                        onChange={(e) => updateDraft(slug, { emoji: e.target.value })}
                        placeholder={staticVis.emoji}
                        maxLength={4}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-base text-center focus:outline-none focus:ring-2 focus:ring-orange-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1">
                        رنگ نقطه (Tailwind)
                      </label>
                      <select
                        value={draft.accent || ''}
                        onChange={(e) => updateDraft(slug, { accent: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-300"
                      >
                        <option value="">پیش‌فرض ({staticVis.accent})</option>
                        {ACCENT_PRESETS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Gradient */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1">
                      گرادیان
                    </label>
                    <select
                      value={draft.gradient || ''}
                      onChange={(e) => updateDraft(slug, { gradient: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      <option value="">پیش‌فرض ({staticVis.gradient})</option>
                      {GRADIENT_PRESETS.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label} — {g.value}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => save(slug)}
                      disabled={!dirty || savingSlug === slug}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-bold"
                    >
                      {savingSlug === slug ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Save size={14} />
                      )}
                      ذخیره
                    </button>
                    {saved && (
                      <button
                        type="button"
                        onClick={() => reset(slug)}
                        className="px-3 py-2 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-bold inline-flex items-center gap-1.5"
                      >
                        <Trash2 size={14} />
                        بازگردانی
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {rows.length === 0 && (
          <div className="text-center py-16 text-gray-500 text-sm">
            شهری با این جست‌وجو پیدا نشد.
          </div>
        )}
      </div>
    </div>
  );
}
