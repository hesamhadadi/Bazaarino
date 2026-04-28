'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import {
  ArrowRight,
  ImagePlus,
  Megaphone,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Calendar,
  Link as LinkIcon,
  Sparkles,
  Upload,
  AlertCircle,
  Image as ImageIcon,
  Smartphone,
  Monitor,
  Layers,
  ExternalLink,
} from 'lucide-react';
import { CATEGORIES } from '@/lib/constants';

type BannerSize = 'hero' | 'wide' | 'square';
type Placement = 'home' | 'category';

interface BannerItem {
  _id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  imageUrlMobile?: string;
  linkUrl?: string;
  placement: Placement;
  size: BannerSize;
  priority: number;
  categoryId?: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  impressions?: number;
  clicks?: number;
  createdAt?: string;
}

/**
 * The slot catalogue is rendered in the admin UI as a visual size guide so
 * marketers know exactly what dimensions to upload for each placement. The
 * `aspect` value is also used to drive the live-preview tile so the result
 * looks identical to the home page.
 */
const SIZE_SLOTS: {
  value: BannerSize;
  label: string;
  pixels: string;
  ratio: string;
  aspect: string;
  description: string;
  Icon: typeof Megaphone;
  gradient: string;
}[] = [
  {
    value: 'hero',
    label: 'بنر اصلی (Hero)',
    pixels: '1600 × 500 px',
    ratio: '۳.۲ : ۱',
    aspect: 'aspect-[16/5]',
    description:
      'بنر بزرگ بالای صفحه اصلی، درست زیر باکس جستجو. پربازدیدترین جایگاه — مناسب کمپین‌های مهم.',
    Icon: Monitor,
    gradient: 'from-orange-500 to-rose-500',
  },
  {
    value: 'wide',
    label: 'استریپ پهن',
    pixels: '1200 × 200 px',
    ratio: '۶ : ۱',
    aspect: 'aspect-[6/1]',
    description:
      'بنر باریک و کشیده، مناسب نمایش بین بخش‌ها. ارتفاع کمی دارد و کم‌حجم اما بسیار visible.',
    Icon: Layers,
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    value: 'square',
    label: 'مربع',
    pixels: '800 × 800 px',
    ratio: '۱ : ۱',
    aspect: 'aspect-square',
    description:
      'برای جایگاه‌های کناری یا گرید کارتی. در صفحه اصلی فقط در صورت نیاز به‌کار می‌رود.',
    Icon: ImageIcon,
    gradient: 'from-emerald-500 to-teal-500',
  },
];

const PLACEMENTS: { value: Placement; label: string; hint: string }[] = [
  {
    value: 'home',
    label: 'صفحه اصلی',
    hint: 'بنر در صفحه اصلی بازارینو نمایش داده می‌شود',
  },
  {
    value: 'category',
    label: 'صفحه دسته‌بندی',
    hint: 'فقط هنگام جستجوی این دسته‌بندی نمایش داده می‌شود',
  },
];

const DURATION_PRESETS: { label: string; days: number }[] = [
  { label: '۱ روز', days: 1 },
  { label: '۷ روز', days: 7 },
  { label: '۳۰ روز', days: 30 },
  { label: '۹۰ روز', days: 90 },
];

/** Build an ISO date that's `days` from now, kept short (no millis) for sane URLs. */
function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('fa-IR');
  } catch {
    return d;
  }
}

function isLive(b: BannerItem) {
  const now = Date.now();
  return (
    b.isActive &&
    new Date(b.startsAt).getTime() <= now &&
    new Date(b.endsAt).getTime() >= now
  );
}

export default function AdminBannersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterPlacement, setFilterPlacement] = useState<'all' | Placement>('all');
  const [filterSize, setFilterSize] = useState<'all' | BannerSize>('all');

  // Form state — kept top-level so the live preview can reflect changes.
  const [form, setForm] = useState({
    title: '',
    description: '',
    linkUrl: '',
    imageUrl: '',
    imageUrlMobile: '',
    placement: 'home' as Placement,
    size: 'hero' as BannerSize,
    categoryId: '',
    priority: 0,
    durationDays: 30,
    customDays: 7,
  });
  const [uploading, setUploading] = useState<'main' | 'mobile' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && (session?.user as { role?: string })?.role !== 'admin')
      router.push('/');
  }, [status, session, router]);

  const fetchBanners = async () => {
    try {
      const res = await fetch('/api/admin/banners');
      const data = await res.json();
      setBanners(data.banners || []);
    } catch {
      toast.error('خطا در بارگذاری بنرها');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') fetchBanners();
  }, [status]);

  const activeSlot = useMemo(
    () => SIZE_SLOTS.find((s) => s.value === form.size) || SIZE_SLOTS[0],
    [form.size],
  );

  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      if (filterPlacement !== 'all' && b.placement !== filterPlacement) return false;
      if (filterSize !== 'all' && b.size !== filterSize) return false;
      return true;
    });
  }, [banners, filterPlacement, filterSize]);

  const liveCount = banners.filter(isLive).length;

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'main' | 'mobile',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(target);
    const fd = new FormData();
    fd.append('images', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) {
        setForm((p) => ({
          ...p,
          [target === 'main' ? 'imageUrl' : 'imageUrlMobile']: data.urls[0],
        }));
        toast.success('تصویر آپلود شد');
      } else {
        toast.error(data.message || 'خطا در آپلود');
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setUploading(null);
    }
  };

  const submit = async () => {
    if (!form.imageUrl) {
      toast.error('تصویر بنر الزامی است');
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (form.placement === 'category' && !form.categoryId) {
      toast.error('برای بنر دسته‌بندی، انتخاب دسته الزامی است');
      return;
    }
    setSubmitting(true);
    try {
      const days =
        form.durationDays === -1 ? Math.max(1, form.customDays) : form.durationDays;
      const payload = {
        title: form.title || undefined,
        description: form.description || undefined,
        imageUrl: form.imageUrl,
        imageUrlMobile: form.imageUrlMobile || undefined,
        linkUrl: form.linkUrl || undefined,
        placement: form.placement,
        size: form.size,
        priority: form.priority,
        categoryId: form.placement === 'category' ? form.categoryId : undefined,
        startsAt: new Date().toISOString(),
        endsAt: plusDays(days),
        isActive: true,
      };
      const res = await fetch('/api/admin/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'خطا در ثبت');
      toast.success('بنر ثبت شد');
      setForm({
        title: '',
        description: '',
        linkUrl: '',
        imageUrl: '',
        imageUrlMobile: '',
        placement: 'home',
        size: 'hero',
        categoryId: '',
        priority: 0,
        durationDays: 30,
        customDays: 7,
      });
      fetchBanners();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'ثبت بنر ناموفق بود');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (b: BannerItem) => {
    await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: b._id, isActive: !b.isActive }),
    });
    fetchBanners();
  };

  const remove = async (b: BannerItem) => {
    if (!confirm(`بنر «${b.title || 'بدون عنوان'}» حذف شود؟`)) return;
    await fetch(`/api/admin/banners?id=${b._id}`, { method: 'DELETE' });
    toast.success('بنر حذف شد');
    fetchBanners();
  };

  return (
    <div className="max-w-6xl mx-auto pb-24">
      {/* Breadcrumb */}
      <Link
        href="/admin"
        className="text-xs text-gray-500 hover:text-orange-600 inline-flex items-center gap-1 mb-3"
      >
        پنل ادمین
        <ArrowRight size={12} />
      </Link>

      {/* Header card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 via-gray-800 to-zinc-900 text-white p-6 md:p-8 mb-6 shadow-xl">
        <div
          aria-hidden
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-orange-500/25 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-rose-500/20 blur-3xl"
        />
        <div className="relative flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-300 mb-2">
              <Sparkles size={12} className="animate-pulse" />
              مدیریت تبلیغات
            </p>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight inline-flex items-center gap-2">
              <Megaphone size={28} />
              بنرهای تبلیغاتی
            </h1>
            <p className="mt-2 text-sm md:text-base text-white/75 max-w-2xl leading-7">
              بنرهای صفحه اصلی و دسته‌بندی‌ها را در سایزهای استاندارد مدیریت کن. هر سایز
              ابعاد توصیه‌شده مشخص دارد تا تصاویر روی همه دستگاه‌ها شارپ بمانند.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="کل" value={banners.length} />
            <Stat label="در حال پخش" value={liveCount} accent />
            <Stat
              label="غیرفعال"
              value={banners.filter((b) => !b.isActive).length}
            />
          </div>
        </div>
      </div>

      {/* Size guide */}
      <section className="mb-6">
        <h2 className="text-sm font-black text-gray-700 mb-3 inline-flex items-center gap-2">
          <ImageIcon size={14} className="text-orange-500" />
          راهنمای سایز بنرها
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SIZE_SLOTS.map((s) => {
            const selected = form.size === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setForm((p) => ({ ...p, size: s.value }))}
                className={`text-right relative overflow-hidden rounded-2xl border-2 transition p-4 group ${
                  selected
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-100 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.gradient} text-white flex items-center justify-center shadow-md`}
                  >
                    <s.Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-gray-900 text-sm">{s.label}</h3>
                    <p className="text-[10px] text-gray-500 font-mono mt-0.5">
                      {s.pixels} · {s.ratio}
                    </p>
                  </div>
                  {selected && (
                    <span className="ml-auto w-6 h-6 rounded-full bg-gray-900 text-white text-[10px] flex items-center justify-center">
                      ✓
                    </span>
                  )}
                </div>
                {/* Mock preview tile — same aspect as the slot uses on the home page */}
                <div
                  className={`${s.aspect} w-full rounded-lg bg-gradient-to-br ${s.gradient} ring-1 ring-black/5 flex items-center justify-center text-[10px] text-white/80 font-bold tracking-widest`}
                >
                  {s.pixels}
                </div>
                <p className="text-[11px] text-gray-500 leading-5 mt-2">
                  {s.description}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Form */}
      <div
        ref={formRef}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 md:p-7 mb-6"
      >
        <h2 className="text-base md:text-lg font-black text-gray-900 mb-1 inline-flex items-center gap-2">
          <Plus size={18} className="text-orange-500" />
          ساخت بنر جدید
        </h2>
        <p className="text-xs text-gray-500 mb-5">
          سایز بالای صفحه را انتخاب کرده‌ای: <strong>{activeSlot.label}</strong>{' '}
          ({activeSlot.pixels})
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Form fields — first 3 cols */}
          <div className="lg:col-span-3 space-y-4">
            {/* Image uploads */}
            <div>
              <Label
                hint={`تصویر اصلی (${activeSlot.pixels} توصیه می‌شود — JPG/PNG/WebP)`}
              >
                تصویر بنر *
              </Label>
              <ImageDrop
                url={form.imageUrl}
                uploading={uploading === 'main'}
                onChange={(e) => handleUpload(e, 'main')}
                onClear={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                aspect={activeSlot.aspect}
              />
            </div>

            <div>
              <Label hint="فقط برای موبایل (اختیاری) — اگر طراحی متفاوتی برای موبایل داری">
                <span className="inline-flex items-center gap-1.5">
                  <Smartphone size={12} />
                  تصویر موبایل (اختیاری)
                </span>
              </Label>
              <ImageDrop
                url={form.imageUrlMobile}
                uploading={uploading === 'mobile'}
                onChange={(e) => handleUpload(e, 'mobile')}
                onClear={() =>
                  setForm((p) => ({ ...p, imageUrlMobile: '' }))
                }
                aspect="aspect-[4/3]"
                compact
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>عنوان بنر</Label>
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="مثلاً: تخفیف ۲۰٪ ثبت آگهی"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                />
              </div>
              <div>
                <Label hint="HTTP/HTTPS برای لینک خارجی، یا /path برای داخلی">
                  لینک مقصد
                </Label>
                <div className="flex items-stretch border border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-900 focus-within:ring-1 focus-within:ring-gray-900">
                  <span className="bg-gray-50 px-3 flex items-center text-gray-400">
                    <LinkIcon size={14} />
                  </span>
                  <input
                    value={form.linkUrl}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, linkUrl: e.target.value }))
                    }
                    placeholder="https://… یا /promo"
                    className="flex-1 px-2 py-2.5 text-sm outline-none"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label hint="حداکثر ۲ خط روی بنر نشان داده می‌شود">
                توضیحات کوتاه
              </Label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                rows={2}
                placeholder="یک جمله جذاب که روی تصویر بنر نمایش داده می‌شود"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none resize-none"
              />
            </div>

            {/* Placement */}
            <div>
              <Label>محل نمایش</Label>
              <div className="grid grid-cols-2 gap-2">
                {PLACEMENTS.map((pm) => {
                  const active = form.placement === pm.value;
                  return (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({ ...p, placement: pm.value }))
                      }
                      className={`text-right p-3 rounded-xl border-2 transition ${
                        active
                          ? 'border-gray-900 bg-gray-50'
                          : 'border-gray-100 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-sm font-black text-gray-900">
                        {pm.label}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        {pm.hint}
                      </div>
                    </button>
                  );
                })}
              </div>
              {form.placement === 'category' && (
                <select
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, categoryId: e.target.value }))
                  }
                  className="mt-2 w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                >
                  <option value="">— انتخاب دسته‌بندی —</option>
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Schedule */}
            <div>
              <Label hint="بنر بعد از این مدت به‌صورت خودکار غیرفعال می‌شود">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar size={12} />
                  مدت زمان نمایش
                </span>
              </Label>
              <div className="flex items-center gap-2 flex-wrap">
                {DURATION_PRESETS.map((d) => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, durationDays: d.days }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      form.durationDays === d.days
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() =>
                    setForm((p) => ({ ...p, durationDays: -1 }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                    form.durationDays === -1
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  سفارشی
                </button>
                {form.durationDays === -1 && (
                  <input
                    type="number"
                    min={1}
                    value={form.customDays}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        customDays: Math.max(1, Number(e.target.value)),
                      }))
                    }
                    className="w-20 px-2 py-1.5 text-xs border border-gray-200 rounded-lg text-center"
                  />
                )}
                <span className="text-[10px] text-gray-400">
                  پایان: {formatDate(plusDays(
                    form.durationDays === -1 ? form.customDays : form.durationDays,
                  ))}
                </span>
              </div>
            </div>

            <div>
              <Label hint="هرچه عدد بزرگ‌تر، اول‌تر نمایش داده می‌شود (در صورت رقابت چند بنر روی یک جایگاه)">
                اولویت
              </Label>
              <input
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm((p) => ({ ...p, priority: Number(e.target.value) }))
                }
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          {/* Live preview — last 2 cols, sticky on desktop */}
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2 inline-flex items-center gap-1">
                <Eye size={11} />
                پیش‌نمایش زنده
              </p>
              <div
                className={`relative overflow-hidden rounded-2xl ring-1 ring-gray-200 shadow-sm ${activeSlot.aspect} bg-gradient-to-br from-gray-100 to-gray-200`}
              >
                {form.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={form.imageUrl}
                    alt="preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <ImagePlus size={28} />
                    <p className="text-[11px] mt-1">تصویر را آپلود کن</p>
                  </div>
                )}
                <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white/90 uppercase tracking-wider">
                  تبلیغ
                </span>
                {(form.title || form.description) && (
                  <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white">
                    {form.title && (
                      <h4 className="text-sm md:text-base font-black drop-shadow-md line-clamp-1">
                        {form.title}
                      </h4>
                    )}
                    {form.description && (
                      <p className="text-[10px] md:text-xs text-white/90 mt-0.5 line-clamp-2">
                        {form.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-gray-400 mt-2 text-center">
                نمایش با همان نسبت ابعاد {activeSlot.ratio} روی صفحه اصلی
              </p>

              <button
                onClick={submit}
                disabled={submitting || !form.imageUrl}
                className="mt-4 w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gray-900 text-white font-bold shadow-md hover:bg-gray-800 transition disabled:opacity-50"
              >
                <Plus size={16} />
                {submitting ? 'در حال ثبت...' : 'ثبت بنر'}
              </button>
              {!form.imageUrl && (
                <p className="text-[10px] text-amber-600 mt-2 inline-flex items-center gap-1">
                  <AlertCircle size={11} />
                  تصویر بنر برای ثبت الزامی است
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Existing banners list */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-black text-gray-900 inline-flex items-center gap-2">
            <Layers size={16} className="text-orange-500" />
            بنرهای موجود ({filteredBanners.length})
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={filterPlacement}
              onChange={(e) =>
                setFilterPlacement(e.target.value as 'all' | Placement)
              }
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="all">همه جایگاه‌ها</option>
              <option value="home">صفحه اصلی</option>
              <option value="category">دسته‌بندی</option>
            </select>
            <select
              value={filterSize}
              onChange={(e) =>
                setFilterSize(e.target.value as 'all' | BannerSize)
              }
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white"
            >
              <option value="all">همه سایزها</option>
              {SIZE_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-400">
            در حال بارگذاری...
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-12 text-center">
            <Megaphone size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">هیچ بنری مطابق فیلتر یافت نشد.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {filteredBanners.map((b) => {
              const slot = SIZE_SLOTS.find((s) => s.value === b.size);
              const live = isLive(b);
              return (
                <li
                  key={b._id}
                  className="px-4 md:px-5 py-4 flex items-center gap-4 hover:bg-gray-50/40 transition flex-wrap"
                >
                  {/* Thumbnail */}
                  <div
                    className={`flex-shrink-0 w-32 ${slot?.aspect || 'aspect-[16/5]'} rounded-xl overflow-hidden bg-gray-100 ring-1 ring-gray-200`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.imageUrl}
                      alt={b.title || 'banner'}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-sm font-black text-gray-900 truncate">
                        {b.title || 'بدون عنوان'}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          live
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : b.isActive
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-gray-50 text-gray-500 border-gray-200'
                        }`}
                      >
                        {live ? '● در حال پخش' : b.isActive ? '○ زمانش نرسیده/تمام شده' : '× غیرفعال'}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                        {slot?.label || b.size}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {b.placement === 'home'
                          ? 'صفحه اصلی'
                          : `دسته: ${
                              CATEGORIES.find((c) => c.id === b.categoryId)?.label ||
                              b.categoryId
                            }`}
                      </span>
                    </div>
                    {b.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mb-1">
                        {b.description}
                      </p>
                    )}
                    <div className="text-[11px] text-gray-500 flex items-center gap-3 flex-wrap">
                      <span>
                        {formatDate(b.startsAt)} → {formatDate(b.endsAt)}
                      </span>
                      {b.linkUrl && (
                        <a
                          href={b.linkUrl}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <ExternalLink size={11} />
                          لینک
                        </a>
                      )}
                      {typeof b.priority === 'number' && b.priority !== 0 && (
                        <span>اولویت: {b.priority}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(b)}
                      title={b.isActive ? 'غیرفعال کن' : 'فعال کن'}
                      className={`p-2 rounded-lg transition ${
                        b.isActive
                          ? 'text-emerald-600 hover:bg-emerald-50'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {b.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button
                      onClick={() => remove(b)}
                      title="حذف"
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3 py-2 backdrop-blur-md border min-w-[80px] text-center ${
        accent
          ? 'bg-emerald-500/20 border-emerald-400/40'
          : 'bg-white/10 border-white/20'
      }`}
    >
      <p className="text-[9px] uppercase tracking-wider text-white/60 font-bold">
        {label}
      </p>
      <p
        className={`text-xl font-black ${
          accent ? 'text-emerald-200' : 'text-white'
        }`}
      >
        {value.toLocaleString('fa-IR')}
      </p>
    </div>
  );
}

function Label({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <span className="text-xs font-bold text-gray-700 block">{children}</span>
      {hint && <span className="text-[10px] text-gray-400 block mt-0.5">{hint}</span>}
    </div>
  );
}

function ImageDrop({
  url,
  uploading,
  onChange,
  onClear,
  aspect,
  compact,
}: {
  url?: string;
  uploading: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  aspect: string;
  compact?: boolean;
}) {
  return (
    <label
      className={`relative block ${aspect} ${
        compact ? 'max-w-[200px]' : ''
      } rounded-2xl border-2 border-dashed border-gray-200 hover:border-orange-400 hover:bg-orange-50/30 transition cursor-pointer overflow-hidden bg-gray-50`}
    >
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="upload" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onClear();
            }}
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/60 backdrop-blur text-white flex items-center justify-center hover:bg-red-600 transition"
          >
            <Trash2 size={12} />
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          {uploading ? (
            <>
              <Upload size={20} className="animate-pulse" />
              <p className="text-[11px] mt-1.5 font-bold">در حال آپلود...</p>
            </>
          ) : (
            <>
              <ImagePlus size={20} />
              <p className="text-[11px] mt-1.5 font-bold">برای آپلود کلیک کن</p>
              <p className="text-[10px] mt-0.5">JPG / PNG / WebP</p>
            </>
          )}
        </div>
      )}
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
        disabled={uploading}
      />
    </label>
  );
}
