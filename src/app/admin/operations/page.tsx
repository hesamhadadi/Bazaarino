'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Files,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  Server,
  ShieldAlert,
} from 'lucide-react';
import { toFaDigits } from '@/lib/locale';

type Stats = {
  pendingAds: number;
  openReports: number;
  pendingIdentityUsers: number;
  activeBanners: number;
  adsToday: number;
  newUsersLast7Days: number;
};

type Health = {
  status: 'ok' | 'warning' | 'critical';
  disk: { free: number; total: number; usedPct: number; status: 'ok' | 'warning' | 'critical' | 'unknown' };
  memory: { free: number; total: number; usedPct: number; status: 'ok' | 'warning' | 'critical' | 'unknown' };
  system: { loadPct: number; status: 'ok' | 'warning' | 'critical' };
};

type MediaSummary = {
  total: number;
  ok: number;
  broken: number;
  unchecked: number;
};

function formatBytes(value?: number) {
  if (!value) return '—';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  return `${toFaDigits(size >= 10 || unit === 0 ? String(Math.round(size)) : size.toFixed(1))} ${units[unit]}`;
}

export default function AdminOperationsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [health, setHealth] = useState<Health | null>(null);
  const [media, setMedia] = useState<MediaSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, healthRes, mediaRes] = await Promise.all([
          fetch('/api/admin/stats', { cache: 'no-store' }),
          fetch('/api/admin/system/health', { cache: 'no-store' }),
          fetch('/api/admin/media-library?limit=120', { cache: 'no-store' }),
        ]);
        if (statsRes.ok) setStats((await statsRes.json()).stats);
        if (healthRes.ok) setHealth((await healthRes.json()).health);
        if (mediaRes.ok) setMedia((await mediaRes.json()).summary);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const actions = useMemo(() => {
    if (!stats && !health && !media) return [];
    return [
      {
        title: 'آگهی‌های در صف بررسی',
        value: stats?.pendingAds || 0,
        hint: 'اولویت مستقیم برای پاک نگه داشتن بازار',
        href: '/admin/legacy?tab=pending',
        icon: ShieldAlert,
        severity: (stats?.pendingAds || 0) > 25 ? 'critical' : (stats?.pendingAds || 0) > 0 ? 'warning' : 'ok',
      },
      {
        title: 'گزارش‌های باز کاربران',
        value: stats?.openReports || 0,
        hint: 'موردهای پرریسک یا شکایت کاربران',
        href: '/admin/legacy?tab=reports',
        icon: AlertTriangle,
        severity: (stats?.openReports || 0) > 0 ? 'critical' : 'ok',
      },
      {
        title: 'احراز هویت در انتظار',
        value: stats?.pendingIdentityUsers || 0,
        hint: 'کاربرانی که باید مدارک‌شان بررسی شود',
        href: '/admin/legacy?tab=users',
        icon: BadgeCheck,
        severity: (stats?.pendingIdentityUsers || 0) > 0 ? 'warning' : 'ok',
      },
      {
        title: 'لینک عکس‌های بررسی‌نشده',
        value: media?.unchecked || 0,
        hint: 'از Media Library می‌توانی سلامت لینک‌ها را چک کنی',
        href: '/admin/media-library',
        icon: ImageIcon,
        severity: (media?.broken || 0) > 0 ? 'critical' : (media?.unchecked || 0) > 0 ? 'warning' : 'ok',
      },
      {
        title: 'فضای دیسک سرور',
        value: health ? Math.round(100 - health.disk.usedPct) : 0,
        suffix: '% آزاد',
        hint: health ? `${formatBytes(health.disk.free)} از ${formatBytes(health.disk.total)} آزاد است` : '',
        href: '/admin/media-library',
        icon: HardDrive,
        severity: health?.disk.status || 'ok',
      },
      {
        title: 'رم و فشار سرور',
        value: health ? Math.round(100 - health.memory.usedPct) : 0,
        suffix: '% آزاد',
        hint: health ? `لود CPU: ${toFaDigits(String(health.system.loadPct))}%` : '',
        href: '/admin/media-library',
        icon: Server,
        severity: health?.status || 'ok',
      },
    ];
  }, [stats, health, media]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin ml-2" />
        در حال ساخت مرکز عملیات...
      </div>
    );
  }

  const urgentCount = actions.filter((a) => a.severity === 'critical' || a.severity === 'warning').length;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">مرکز عملیات</h1>
          <p className="text-sm text-gray-500 mt-1">
            همه چیزهایی که ممکن است سایت را کند، خراب یا بی‌کیفیت کند، یک‌جا.
          </p>
        </div>
        <StatusPill severity={urgentCount > 0 ? 'warning' : 'ok'}>
          {urgentCount > 0 ? `${toFaDigits(String(urgentCount))} مورد نیازمند توجه` : 'همه چیز آرام است'}
        </StatusPill>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <QuickStat label="آگهی امروز" value={stats?.adsToday || 0} icon={Files} />
        <QuickStat label="کاربر جدید ۷ روز" value={stats?.newUsersLast7Days || 0} icon={Clock} />
        <QuickStat label="بنر فعال" value={stats?.activeBanners || 0} icon={ImageIcon} />
        <QuickStat label="کل عکس‌های رصدشده" value={media?.total || 0} icon={ImageIcon} />
      </section>

      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {actions.map((action) => (
          <ActionCard key={action.title} {...action} />
        ))}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-gray-900">پیشنهاد اجرای روزانه</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-3 text-sm">
          <ChecklistItem title="اول صف بررسی را صفر کن" text="هرچه pending کمتر بماند، سایت زنده‌تر دیده می‌شود." />
          <ChecklistItem title="Media Library را چک کن" text="هفته‌ای یک بار لینک‌های عکس را بررسی کن تا کارت‌های خالی نمانند." />
          <ChecklistItem title="منابع سرور را نگاه کن" text="اگر دیسک یا رم به هشدار رسید، قبل از کرش اقدام کن." />
        </div>
      </section>
    </div>
  );
}

function QuickStat({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <Icon size={15} className="text-gray-400" />
      <p className="text-xs text-gray-500 mt-3">{label}</p>
      <p className="text-xl font-black text-gray-900 mt-1">{toFaDigits(String(value))}</p>
    </div>
  );
}

function ActionCard({
  title,
  value,
  suffix = '',
  hint,
  href,
  icon: Icon,
  severity,
}: {
  title: string;
  value: number;
  suffix?: string;
  hint: string;
  href: string;
  icon: any;
  severity: string;
}) {
  const critical = severity === 'critical';
  const warning = severity === 'warning';
  return (
    <Link
      href={href}
      className={`rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        critical ? 'border-red-200' : warning ? 'border-amber-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
          critical ? 'bg-red-50 text-red-700' : warning ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          <Icon size={18} />
        </div>
        <StatusPill severity={severity} />
      </div>
      <p className="text-sm font-bold text-gray-900 mt-4">{title}</p>
      <p className="text-3xl font-black text-gray-900 mt-2">
        {toFaDigits(String(value))}
        {suffix && <span className="text-sm font-bold text-gray-500 mr-1">{suffix}</span>}
      </p>
      <p className="text-xs text-gray-500 mt-2 leading-6">{hint}</p>
    </Link>
  );
}

function StatusPill({ severity, children }: { severity: string; children?: React.ReactNode }) {
  const content = children || (severity === 'critical' ? 'بحرانی' : severity === 'warning' ? 'نیازمند توجه' : 'اوکی');
  const cls =
    severity === 'critical'
      ? 'bg-red-50 text-red-700'
      : severity === 'warning'
        ? 'bg-amber-50 text-amber-700'
        : 'bg-emerald-50 text-emerald-700';
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${cls}`}>
      {severity === 'ok' ? <CheckCircle2 size={11} /> : <AlertTriangle size={11} />}
      {content}
    </span>
  );
}

function ChecklistItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p className="font-bold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 leading-6 mt-1">{text}</p>
    </div>
  );
}
