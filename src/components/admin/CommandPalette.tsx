'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  ShieldAlert,
  Files,
  AlertTriangle,
  Users,
  Image as ImageIcon,
  Settings,
  LayoutGrid,
  Newspaper,
  ExternalLink,
  Plus,
  Hash,
  User as UserIcon,
} from 'lucide-react';

type Action = {
  id: string;
  label: string;
  hint?: string;
  icon: any;
  keywords?: string[];
  href?: string;
  onSelect?: () => void;
};

type SearchResult =
  | { kind: 'ad'; id: string; title: string; status: string }
  | { kind: 'user'; id: string; name: string; email?: string };

const STATIC_ACTIONS: Action[] = [
  { id: 'overview', label: 'نمای کلی', hint: 'KPIها و آمار', icon: LayoutGrid, href: '/admin', keywords: ['dashboard', 'home'] },
  { id: 'pending', label: 'آگهی‌های در صف بررسی', icon: ShieldAlert, href: '/admin/legacy?tab=pending', keywords: ['moderate', 'pending'] },
  { id: 'all', label: 'همه آگهی‌ها', icon: Files, href: '/admin/legacy?tab=all', keywords: ['ads'] },
  { id: 'reports', label: 'گزارش‌ها', icon: AlertTriangle, href: '/admin/legacy?tab=reports', keywords: ['reports'] },
  { id: 'users', label: 'کاربران', icon: Users, href: '/admin/legacy?tab=users' },
  { id: 'banners', label: 'بنر و تصاویر شهری', icon: ImageIcon, href: '/admin/legacy?tab=banners' },
  { id: 'settings', label: 'تنظیمات', icon: Settings, href: '/admin/legacy?tab=settings' },
  { id: 'new-article', label: 'انتشار مقاله جدید', icon: Newspaper, href: '/news/new' },
  { id: 'new-ad', label: 'ثبت آگهی جدید', icon: Plus, href: '/ads/new' },
  { id: 'view-site', label: 'مشاهده سایت', icon: ExternalLink, href: '/' },
];

export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  // Debounced search for ads + users
  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoadingResults(true);
        const [adsRes, usersRes] = await Promise.allSettled([
          fetch(`/api/admin/ads?q=${encodeURIComponent(query)}&limit=5&status=all`, { signal: ctrl.signal }),
          fetch(`/api/admin/users?q=${encodeURIComponent(query)}&limit=5`, { signal: ctrl.signal }),
        ]);
        const items: SearchResult[] = [];
        if (adsRes.status === 'fulfilled' && adsRes.value.ok) {
          const data = await adsRes.value.json();
          (data.ads || []).slice(0, 5).forEach((a: any) =>
            items.push({ kind: 'ad', id: a._id, title: a.title, status: a.status }),
          );
        }
        if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
          const data = await usersRes.value.json();
          (data.users || []).slice(0, 5).forEach((u: any) =>
            items.push({ kind: 'user', id: u._id, name: u.name || u.email || 'بدون نام', email: u.email }),
          );
        }
        setResults(items);
      } catch {
        /* aborted or net error */
      } finally {
        setLoadingResults(false);
      }
    }, 250);
    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [query, open]);

  // Reset on close & focus on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setHighlighted(0);
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filteredActions = STATIC_ACTIONS.filter((a) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      a.label.toLowerCase().includes(q) ||
      (a.keywords || []).some((k) => k.toLowerCase().includes(q))
    );
  });

  const totalItems = filteredActions.length + results.length;

  const select = useCallback(
    (idx: number) => {
      if (idx < filteredActions.length) {
        const a = filteredActions[idx];
        if (a.onSelect) a.onSelect();
        if (a.href) router.push(a.href);
      } else {
        const r = results[idx - filteredActions.length];
        if (!r) return;
        if (r.kind === 'ad') router.push(`/ads/${r.id}`);
        else router.push(`/admin/users/${r.id}`);
      }
      onClose();
    },
    [filteredActions, results, router, onClose],
  );

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlighted((h) => Math.min(h + 1, totalItems - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlighted((h) => Math.max(h - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        select(highlighted);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, highlighted, totalItems, select, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} aria-hidden />

      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
          <Search size={16} className="text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlighted(0);
            }}
            placeholder="جست‌وجو در آگهی‌ها، کاربرها یا اجرای دستور..."
            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
          />
          <kbd className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] text-gray-500 font-mono">esc</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filteredActions.length === 0 && results.length === 0 && !loadingResults && (
            <div className="px-4 py-8 text-center text-xs text-gray-400">
              هیچ نتیجه‌ای یافت نشد.
            </div>
          )}

          {filteredActions.length > 0 && (
            <div>
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                دستورات
              </p>
              {filteredActions.map((a, idx) => {
                const Icon = a.icon;
                const active = highlighted === idx;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onMouseEnter={() => setHighlighted(idx)}
                    onClick={() => select(idx)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-right transition ${
                      active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-orange-300' : 'text-gray-400'} />
                    <span className="flex-1 truncate">{a.label}</span>
                    {a.hint && (
                      <span className={`text-[10px] ${active ? 'text-gray-300' : 'text-gray-400'}`}>{a.hint}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {(results.length > 0 || loadingResults) && (
            <div className="mt-1 border-t border-gray-100 pt-1">
              <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {loadingResults ? 'در حال جست‌وجو...' : 'نتایج'}
              </p>
              {results.map((r, idx) => {
                const trueIdx = filteredActions.length + idx;
                const active = highlighted === trueIdx;
                const Icon = r.kind === 'ad' ? Hash : UserIcon;
                return (
                  <button
                    key={`${r.kind}-${r.id}`}
                    type="button"
                    onMouseEnter={() => setHighlighted(trueIdx)}
                    onClick={() => select(trueIdx)}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-right transition ${
                      active ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon size={14} className={active ? 'text-orange-300' : 'text-gray-400'} />
                    <span className="flex-1 truncate">
                      {r.kind === 'ad' ? r.title : r.name}
                    </span>
                    <span className={`text-[10px] ${active ? 'text-gray-300' : 'text-gray-400'}`}>
                      {r.kind === 'ad' ? `آگهی · ${r.status}` : 'کاربر'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100 bg-gray-50 text-[10px] text-gray-500">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 font-mono">↑↓</kbd> ناوبری
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="rounded border border-gray-200 bg-white px-1 font-mono">↵</kbd> انتخاب
            </span>
          </div>
          <span>⌘K</span>
        </div>
      </div>
    </div>
  );
}
