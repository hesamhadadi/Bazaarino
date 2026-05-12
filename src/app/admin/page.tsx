'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  TrendingDown,
  Files,
  Clock,
  AlertTriangle,
  Users,
  BadgeCheck,
  Megaphone,
  Eye,
  Heart,
  ArrowLeft,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { toFaDigits } from '@/lib/locale';

type Stats = {
  totalAds: number;
  pendingAds: number;
  approvedAds: number;
  rejectedAds: number;
  expiredAds: number;
  soldAds: number;
  totalUsers: number;
  newUsersLast7Days: number;
  adsToday: number;
  featuredAds: number;
  openReports: number;
  activeBanners: number;
  pendingIdentityUsers: number;
  totalFavorites: number;
  totalViews: number;
  totalSiteViews?: number;
  totalTrackedDailyViews?: number;
  untrackedHistoricalViews?: number;
  firstDailyViewDateKey?: string | null;
  todayViews?: number;
  todayViewsByType?: { _id: string; count: number }[];
  dailyViewsTrend?: {
    _id: string;
    count: number;
    ad: number;
    article: number;
    landingPage: number;
  }[];
  adsTrend?: { _id: string; count: number }[];
  usersTrend?: { _id: string; count: number }[];
  topCities?: { _id: string; count: number }[];
  topCategories?: { _id: string; count: number }[];
  topViewedAds?: any[];
  topReportedAds?: any[];
  newestUsers?: any[];
  adsLast7Days?: number;
};

type StatsBundle = {
  stats: Stats;
  recentAds?: any[];
};

export default function AdminOverview() {
  const [data, setData] = useState<StatsBundle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonHeader />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-white border border-gray-200 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  if (!stats) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800 text-sm">
        امکان دریافت آمار وجود ندارد.
      </div>
    );
  }

  // Compute WoW deltas from the daily trend if available
  const adsLast7 = sumLastN(stats.adsTrend, 7);
  const adsPrev7 = sumPrevN(stats.adsTrend, 7);
  const adsDelta = pctDelta(adsLast7, adsPrev7);
  const usersLast7 = sumLastN(stats.usersTrend, 7);
  const usersPrev7 = sumPrevN(stats.usersTrend, 7);
  const usersDelta = pctDelta(usersLast7, usersPrev7);

  const kpis = [
    {
      label: 'آگهی در صف بررسی',
      value: stats.pendingAds,
      icon: ShieldAlert,
      tone: 'amber' as const,
      href: '/admin/legacy?tab=pending',
      urgent: stats.pendingAds > 0,
    },
    {
      label: 'گزارش باز',
      value: stats.openReports,
      icon: AlertTriangle,
      tone: 'red' as const,
      href: '/admin/legacy?tab=reports',
      urgent: stats.openReports > 0,
    },
    {
      label: 'احراز هویت در انتظار',
      value: stats.pendingIdentityUsers,
      icon: BadgeCheck,
      tone: 'emerald' as const,
      href: '/admin/legacy?tab=users',
      urgent: stats.pendingIdentityUsers > 0,
    },
    {
      label: 'بنر فعال',
      value: stats.activeBanners,
      icon: Megaphone,
      tone: 'sky' as const,
      href: '/admin/legacy?tab=banners',
    },
  ];

  const trendCards = [
    {
      label: 'آگهی‌های ۷ روز اخیر',
      value: adsLast7,
      delta: adsDelta,
      sparkline: lastN(stats.adsTrend, 14),
      icon: Files,
    },
    {
      label: 'کاربران ۷ روز اخیر',
      value: usersLast7,
      delta: usersDelta,
      sparkline: lastN(stats.usersTrend, 14),
      icon: Users,
    },
    {
      label: 'بازدید کل',
      value: stats.totalSiteViews || stats.totalViews,
      icon: Eye,
    },
    {
      label: 'فیورایت کل',
      value: stats.totalFavorites,
      icon: Heart,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">نمای کلی</h1>
          <p className="text-sm text-gray-500 mt-1">
            خلاصه عملکرد بازارینو در یک نگاه.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/legacy?tab=pending"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 transition"
          >
            <Clock size={12} /> صف بررسی
          </Link>
          <Link
            href="/admin/legacy?tab=all"
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 text-xs font-semibold transition"
          >
            <Files size={12} /> همه آگهی‌ها
          </Link>
        </div>
      </div>

      {/* Action KPIs (urgent items) */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          نیاز به اقدام
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((kpi) => (
            <KpiCard key={kpi.label} {...kpi} />
          ))}
        </div>
      </section>

      {/* Trend cards */}
      <section>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          عملکرد
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {trendCards.map((c) => (
            <TrendCard key={c.label} {...c} />
          ))}
        </div>
      </section>

      <DailyViewsCard
        todayViews={stats.todayViews || 0}
        totalTracked={stats.totalTrackedDailyViews || 0}
        untrackedHistorical={stats.untrackedHistoricalViews || 0}
        firstDateKey={stats.firstDailyViewDateKey || null}
        byType={stats.todayViewsByType || []}
        trend={stats.dailyViewsTrend || []}
      />

      {/* Top lists */}
      <section className="grid lg:grid-cols-3 gap-4">
        <ListCard
          title="پربازدیدترین آگهی‌ها"
          items={(stats.topViewedAds || []).slice(0, 5).map((a: any) => ({
            id: a._id,
            primary: a.title,
            secondary: `${toFaDigits(String(a.views || 0))} بازدید`,
            href: `/ads/${a._id}`,
          }))}
        />
        <ListCard
          title="آگهی‌های گزارش‌شده"
          tone="red"
          items={(stats.topReportedAds || []).slice(0, 5).map((a: any) => ({
            id: a._id,
            primary: a.title,
            secondary: `${toFaDigits(String(a.reportsCount || a.reports || 0))} گزارش`,
            href: `/ads/${a._id}`,
          }))}
        />
        <ListCard
          title="جدیدترین کاربران"
          items={(stats.newestUsers || []).slice(0, 5).map((u: any) => ({
            id: u._id,
            primary: u.name || 'بدون نام',
            secondary: u.email || u.phone || '',
            href: `/admin/users/${u._id}`,
          }))}
        />
      </section>

      {/* Top cities + categories */}
      <section className="grid md:grid-cols-2 gap-4">
        <BarCard
          title="شهرهای پربازار"
          items={(stats.topCities || []).slice(0, 6).map((c: any) => ({
            label: c._id || '—',
            value: c.count,
          }))}
        />
        <BarCard
          title="دسته‌های پراستفاده"
          items={(stats.topCategories || []).slice(0, 6).map((c: any) => ({
            label: c._id || '—',
            value: c.count,
          }))}
        />
      </section>
    </div>
  );
}

/* ─── Components ──────────────────────────────────────────── */

function DailyViewsCard({
  todayViews,
  totalTracked,
  untrackedHistorical,
  firstDateKey,
  byType,
  trend,
}: {
  todayViews: number;
  totalTracked: number;
  untrackedHistorical: number;
  firstDateKey: string | null;
  byType: { _id: string; count: number }[];
  trend: { _id: string; count: number; ad: number; article: number; landingPage: number }[];
}) {
  const last14 = trend.slice(-14);
  const max = Math.max(...last14.map((d) => d.count), 1);
  const typeCounts = {
    ad: byType.find((row) => row._id === 'ad')?.count || 0,
    article: byType.find((row) => row._id === 'article')?.count || 0,
    landingPage: byType.find((row) => row._id === 'landingPage')?.count || 0,
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <p className="text-sm font-bold text-gray-900">بازدید روزانه سایت</p>
          <p className="text-xs text-gray-500 mt-1">
            {firstDateKey
              ? `ثبت روزانه از ${formatDateKey(firstDateKey)} شروع شده است؛ داده‌های قبل از آن فقط به‌صورت بازدید کل موجودند.`
              : 'هنوز هیچ بازدید روزانه‌ای ثبت نشده است؛ بازدیدهای قدیمی فقط به‌صورت بازدید کل موجودند.'}
          </p>
        </div>
        <div className="text-left">
          <p className="text-[11px] text-gray-500">امروز</p>
          <p className="text-2xl font-black text-gray-900 tabular-nums">
            {toFaDigits(String(todayViews))}
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_220px] gap-4 items-end">
        <div className="flex items-end gap-1 h-32 border-b border-gray-100">
          {last14.length === 0 ? (
            <div className="w-full text-center text-xs text-gray-400 pb-8">
              هنوز آمار روزانه‌ای ثبت نشده است.
            </div>
          ) : (
            last14.map((day) => (
              <div key={day._id} className="flex-1 min-w-0 flex flex-col items-center gap-1">
                <div
                  className={`w-full max-w-8 rounded-t-md ${
                    day.count > 0
                      ? 'bg-gradient-to-t from-orange-500 to-amber-400'
                      : 'bg-gray-200'
                  }`}
                  style={{ height: `${day.count > 0 ? Math.max(6, (day.count / max) * 104) : 2}px` }}
                  title={`${day._id}: ${day.count}`}
                />
                <span className="text-[10px] text-gray-400 tabular-nums truncate">
                  {toFaDigits(day._id.slice(5).replace('-', '/'))}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
          <MiniStat label="آگهی" value={typeCounts.ad} />
          <MiniStat label="مقاله" value={typeCounts.article} />
          <MiniStat label="صفحه‌ها" value={typeCounts.landingPage} />
        </div>
      </div>

      <div className="mt-4 grid md:grid-cols-2 gap-2">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
          <p className="text-[11px] text-emerald-700">بازدیدهای ثبت‌شده با تاریخ روزانه</p>
          <p className="text-base font-black text-emerald-900 tabular-nums">
            {toFaDigits(String(totalTracked))}
          </p>
        </div>
        {untrackedHistorical > 0 && (
          <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2">
            <p className="text-[11px] text-amber-700">بازدیدهای قدیمی بدون تفکیک روز</p>
            <p className="text-base font-black text-amber-900 tabular-nums">
              {toFaDigits(String(untrackedHistorical))}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function formatDateKey(dateKey: string) {
  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return toFaDigits(dateKey);
  return toFaDigits(date.toLocaleDateString('fa-IR'));
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-base font-black text-gray-900 tabular-nums">
        {toFaDigits(String(value))}
      </p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  href,
  urgent,
}: {
  label: string;
  value: number;
  icon: any;
  tone: 'amber' | 'red' | 'emerald' | 'sky';
  href: string;
  urgent?: boolean;
}) {
  const tones: Record<string, string> = {
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    red: 'bg-red-50 text-red-700 border-red-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    sky: 'bg-sky-50 text-sky-700 border-sky-100',
  };
  return (
    <Link
      href={href}
      className={`group relative rounded-xl border bg-white hover:shadow-md transition p-4 flex flex-col gap-2 ${
        urgent ? 'border-gray-300' : 'border-gray-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${tones[tone]}`}>
          <Icon size={16} />
        </div>
        <ArrowLeft
          size={14}
          className="text-gray-300 group-hover:text-gray-700 transition"
        />
      </div>
      <div>
        <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">
          {toFaDigits(String(value))}
        </p>
        <p className="mt-1.5 text-xs text-gray-500 leading-tight">{label}</p>
      </div>
    </Link>
  );
}

function TrendCard({
  label,
  value,
  delta,
  sparkline,
  icon: Icon,
}: {
  label: string;
  value: number;
  delta?: number;
  sparkline?: { _id: string; count: number }[];
  icon: any;
}) {
  const deltaColor =
    delta == null ? 'text-gray-400' : delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-red-600' : 'text-gray-400';
  const DeltaIcon = delta != null && delta < 0 ? TrendingDown : TrendingUp;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between mb-1.5">
        <Icon size={14} className="text-gray-400" />
        {delta != null && (
          <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${deltaColor}`}>
            <DeltaIcon size={10} />
            {toFaDigits(Math.abs(Math.round(delta)).toString())}٪
          </span>
        )}
      </div>
      <p className="text-2xl font-black text-gray-900 leading-none tabular-nums">
        {toFaDigits(String(value))}
      </p>
      <p className="mt-1 text-xs text-gray-500 leading-tight">{label}</p>
      {sparkline && sparkline.length > 1 && <Sparkline data={sparkline.map((d) => d.count)} />}
    </div>
  );
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const w = 100;
  const h = 24;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data
    .map((v, i) => `${i * step},${h - (v / max) * h}`)
    .join(' ');
  return (
    <svg className="mt-2 w-full" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" height={28}>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-orange-500"
      />
    </svg>
  );
}

function ListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: { id: string; primary: string; secondary: string; href: string }[];
  tone?: 'red';
}) {
  const titleColor = tone === 'red' ? 'text-red-700' : 'text-gray-900';
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className={`text-sm font-bold mb-3 ${titleColor}`}>{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">داده‌ای یافت نشد</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, idx) => (
            <li key={item.id || idx}>
              <Link
                href={item.href}
                className="group flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition"
              >
                <span className="text-[10px] tabular-nums w-4 text-gray-400">
                  {toFaDigits(String(idx + 1))}.
                </span>
                <span className="flex-1 truncate text-xs text-gray-700 group-hover:text-gray-900">
                  {item.primary}
                </span>
                <span className="text-[10px] text-gray-400 tabular-nums shrink-0">
                  {item.secondary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BarCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-900 mb-3">{title}</p>
      {items.length === 0 ? (
        <p className="text-xs text-gray-400 text-center py-6">داده‌ای یافت نشد</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => {
            const pct = (item.value / max) * 100;
            return (
              <li key={item.label} className="flex items-center gap-3">
                <span className="w-20 text-xs text-gray-700 truncate">{item.label}</span>
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-[11px] tabular-nums text-gray-500 w-8 text-right">
                  {toFaDigits(String(item.value))}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function SkeletonHeader() {
  return (
    <div className="space-y-2">
      <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
    </div>
  );
}

/* ─── Helpers ─────────────────────────────────────────────── */

function lastN(trend: { _id: string; count: number }[] | undefined, n: number) {
  if (!trend) return [];
  return trend.slice(-n);
}
function sumLastN(trend: { _id: string; count: number }[] | undefined, n: number) {
  if (!trend) return 0;
  return trend.slice(-n).reduce((s, x) => s + (x.count || 0), 0);
}
function sumPrevN(trend: { _id: string; count: number }[] | undefined, n: number) {
  if (!trend || trend.length < n * 2) return 0;
  return trend.slice(-n * 2, -n).reduce((s, x) => s + (x.count || 0), 0);
}
function pctDelta(curr: number, prev: number): number | undefined {
  if (!prev) return curr > 0 ? 100 : undefined;
  return ((curr - prev) / prev) * 100;
}
