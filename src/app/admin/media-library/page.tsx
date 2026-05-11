'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  HardDrive,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Search,
  Server,
  XCircle,
} from 'lucide-react';
import { toFaDigits } from '@/lib/locale';

type Health = {
  status: 'ok' | 'warning' | 'critical';
  generatedAt: string;
  disk: Resource & { path: string };
  memory: Resource;
  process: {
    uptimeSeconds: number;
    rss: number;
    heapUsed: number;
    heapTotal: number;
    nodeVersion: string;
    pid: number;
  };
  system: {
    cpuCount: number;
    cpuModel: string;
    loadPct: number;
    loadAverage: number[];
    uptimeSeconds: number;
    platform: string;
    arch: string;
    hostname: string;
    status: 'ok' | 'warning' | 'critical';
  };
};

type Resource = {
  total: number;
  free: number;
  used: number;
  usedPct: number;
  status: 'ok' | 'warning' | 'critical' | 'unknown';
};

type MediaItem = {
  id: string;
  url: string;
  title: string;
  source: string;
  field: string;
  ownerHref?: string;
  updatedAt?: string;
  status: 'ok' | 'broken' | 'unchecked';
  contentType?: string;
  contentLength?: number;
  error?: string;
  refs: Array<{
    source: string;
    field: string;
    ownerTitle: string;
    ownerHref?: string;
  }>;
};

type MediaResponse = {
  generatedAt: string;
  checked: boolean;
  summary: {
    total: number;
    ok: number;
    broken: number;
    unchecked: number;
    duplicateRefs: number;
    knownBytes: number;
    sources: Record<string, number>;
  };
  items: MediaItem[];
};

const SOURCE_LABELS: Record<string, string> = {
  ad: 'آگهی',
  article: 'مقاله',
  banner: 'بنر',
  'city-visual': 'ویژوال شهر',
  'housing-city': 'رزرو خانه',
  'landing-page': 'لندینگ',
  profile: 'پروفایل',
};

const STATUS_LABELS = {
  ok: 'سالم',
  broken: 'خراب',
  unchecked: 'بررسی نشده',
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

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${toFaDigits(String(days))} روز و ${toFaDigits(String(hours))} ساعت`;
  return `${toFaDigits(String(hours))} ساعت`;
}

export default function AdminMediaLibraryPage() {
  const [health, setHealth] = useState<Health | null>(null);
  const [media, setMedia] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [query, setQuery] = useState('');
  const [source, setSource] = useState('all');
  const [status, setStatus] = useState('all');

  const load = async (check = false) => {
    if (check) setChecking(true);
    else setLoading(true);
    try {
      const [healthRes, mediaRes] = await Promise.all([
        fetch('/api/admin/system/health', { cache: 'no-store' }),
        fetch(`/api/admin/media-library?limit=220${check ? '&check=1' : ''}`, { cache: 'no-store' }),
      ]);
      if (healthRes.ok) setHealth((await healthRes.json()).health);
      if (mediaRes.ok) setMedia(await mediaRes.json());
    } finally {
      setLoading(false);
      setChecking(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const sources = useMemo(() => Object.keys(media?.summary.sources || {}).sort(), [media]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (media?.items || []).filter((item) => {
      const matchesSource = source === 'all' || item.source === source;
      const matchesStatus = status === 'all' || item.status === status;
      const matchesQuery =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.url.toLowerCase().includes(q) ||
        item.refs.some((r) => r.ownerTitle.toLowerCase().includes(q));
      return matchesSource && matchesStatus && matchesQuery;
    });
  }, [media, query, source, status]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin ml-2" />
        در حال خواندن رسانه‌ها و منابع سرور...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500 mt-1">
            عکس‌های سایت، وضعیت لینک‌ها، فضای خالی دیسک و منابع سرور.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw size={13} />
            تازه‌سازی
          </button>
          <button
            type="button"
            onClick={() => load(true)}
            disabled={checking}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {checking ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            بررسی لینک‌ها
          </button>
        </div>
      </div>

      {health && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <ResourceCard
            title="فضای دیسک"
            icon={HardDrive}
            value={`${formatBytes(health.disk.free)} خالی`}
            hint={`از ${formatBytes(health.disk.total)} روی ${health.disk.path}`}
            usedPct={health.disk.usedPct}
            status={health.disk.status}
          />
          <ResourceCard
            title="رم سرور"
            icon={Server}
            value={`${formatBytes(health.memory.free)} آزاد`}
            hint={`${formatBytes(health.memory.used)} مصرف شده`}
            usedPct={health.memory.usedPct}
            status={health.memory.status}
          />
          <ResourceCard
            title="لود CPU"
            icon={Activity}
            value={`${toFaDigits(String(health.system.loadPct))}%`}
            hint={`${toFaDigits(String(health.system.cpuCount))} هسته / ${health.system.platform}-${health.system.arch}`}
            usedPct={Math.min(100, Math.max(0, health.system.loadPct))}
            status={health.system.status}
          />
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-lg bg-gray-900 text-white flex items-center justify-center">
                <Server size={17} />
              </div>
              <StatusBadge status={health.status} />
            </div>
            <p className="text-xs text-gray-500 mt-4">Node Process</p>
            <p className="text-lg font-black text-gray-900 mt-1">{formatBytes(health.process.rss)} RSS</p>
            <p className="text-xs text-gray-500 mt-1">
              Heap: {formatBytes(health.process.heapUsed)} / {formatBytes(health.process.heapTotal)}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Uptime: {formatDuration(health.process.uptimeSeconds)}
            </p>
          </div>
        </section>
      )}

      {media && (
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MiniStat label="کل عکس‌ها" value={media.summary.total} />
          <MiniStat label="سالم" value={media.summary.ok} tone="emerald" />
          <MiniStat label="خراب" value={media.summary.broken} tone="red" />
          <MiniStat label="بررسی نشده" value={media.summary.unchecked} tone="amber" />
          <MiniStat label="حجم شناخته‌شده" value={formatBytes(media.summary.knownBytes)} />
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-3 lg:items-center">
          <div className="relative flex-1">
            <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جست‌وجوی عنوان، URL یا مالک تصویر..."
              className="w-full rounded-lg border border-gray-200 bg-gray-50 pr-9 pl-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
          </div>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">همه منابع</option>
            {sources.map((s) => (
              <option key={s} value={s}>{SOURCE_LABELS[s] || s}</option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="ok">سالم</option>
            <option value="broken">خراب</option>
            <option value="unchecked">بررسی نشده</option>
          </select>
        </div>

        <div className="divide-y divide-gray-100">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">موردی پیدا نشد.</div>
          ) : (
            filtered.map((item) => <MediaRow key={item.id} item={item} />)
          )}
        </div>
      </section>
    </div>
  );
}

function ResourceCard({
  title,
  icon: Icon,
  value,
  hint,
  usedPct,
  status,
}: {
  title: string;
  icon: any;
  value: string;
  hint: string;
  usedPct: number;
  status: Resource['status'];
}) {
  const bar = status === 'critical' ? 'bg-red-500' : status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center">
          <Icon size={17} />
        </div>
        <StatusBadge status={status} />
      </div>
      <p className="text-xs text-gray-500 mt-4">{title}</p>
      <p className="text-lg font-black text-gray-900 mt-1">{value}</p>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden mt-3">
        <div className={`h-full ${bar}`} style={{ width: `${Math.min(100, Math.max(0, usedPct))}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-2 truncate">{hint}</p>
    </div>
  );
}

function MiniStat({ label, value, tone = 'gray' }: { label: string; value: number | string; tone?: 'gray' | 'emerald' | 'red' | 'amber' }) {
  const toneClass = {
    gray: 'text-gray-900 bg-white',
    emerald: 'text-emerald-700 bg-emerald-50',
    red: 'text-red-700 bg-red-50',
    amber: 'text-amber-700 bg-amber-50',
  }[tone];
  return (
    <div className={`rounded-xl border border-gray-200 p-4 ${toneClass}`}>
      <p className="text-xs opacity-70">{label}</p>
      <p className="text-xl font-black mt-1">{typeof value === 'number' ? toFaDigits(String(value)) : value}</p>
    </div>
  );
}

function MediaRow({ item }: { item: MediaItem }) {
  return (
    <div className="p-3 md:p-4 flex gap-3">
      <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.url} alt={item.title} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={item.status} />
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                <ImageIcon size={11} />
                {SOURCE_LABELS[item.source] || item.source}
              </span>
              {item.refs.length > 1 && (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {toFaDigits(String(item.refs.length))} استفاده
                </span>
              )}
            </div>
            <h3 className="font-bold text-gray-900 mt-2 truncate">{item.title}</h3>
            <p className="text-xs text-gray-500 mt-1 truncate text-left" style={{ direction: 'ltr' }}>{item.url}</p>
            {item.error && <p className="text-xs text-red-600 mt-1">{item.error}</p>}
            <p className="text-xs text-gray-400 mt-1">
              {item.field} {item.contentLength ? ` / ${formatBytes(item.contentLength)}` : ''}
              {item.contentType ? ` / ${item.contentType}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {item.ownerHref && (
              <Link
                href={item.ownerHref}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
              >
                مالک
              </Link>
            )}
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: MediaItem['status'] | Resource['status'] | Health['status'] }) {
  if (status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        <CheckCircle2 size={11} />
        سالم
      </span>
    );
  }
  if (status === 'warning' || status === 'unchecked') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
        <AlertTriangle size={11} />
        {status === 'unchecked' ? STATUS_LABELS.unchecked : 'هشدار'}
      </span>
    );
  }
  if (status === 'critical' || status === 'broken') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
        {status === 'broken' ? <XCircle size={11} /> : <AlertTriangle size={11} />}
        {status === 'broken' ? STATUS_LABELS.broken : 'بحرانی'}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
      نامشخص
    </span>
  );
}
