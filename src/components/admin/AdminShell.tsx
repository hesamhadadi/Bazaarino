'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutGrid,
  ShieldAlert,
  Files,
  AlertTriangle,
  Users,
  Image as ImageIcon,
  Newspaper,
  MessageSquare,
  Settings,
  ChevronLeft,
  Menu,
  Search,
  ExternalLink,
  LogOut,
  Sparkles,
  Building2,
  Award,
  Layers,
} from 'lucide-react';
import CommandPalette from './CommandPalette';

type NavItem = {
  href: string;
  label: string;
  icon: any;
  match?: (pathname: string, search: string) => boolean;
  badge?: number | null;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd+K (or Ctrl+K) opens palette
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const tabParam = searchParams?.get('tab') || '';
  const isLegacyTab = (tab: string): boolean =>
    Boolean(pathname?.startsWith('/admin/legacy')) && tabParam === tab;

  const groups: NavGroup[] = [
    {
      label: '',
      items: [
        {
          href: '/admin',
          label: 'نمای کلی',
          icon: LayoutGrid,
          match: (p) => p === '/admin',
        },
      ],
    },
    {
      label: 'مدیریت محتوا',
      items: [
        {
          href: '/admin/legacy?tab=pending',
          label: 'آگهی‌های در صف',
          icon: ShieldAlert,
          match: () => isLegacyTab('pending'),
        },
        {
          href: '/admin/legacy?tab=all',
          label: 'همه آگهی‌ها',
          icon: Files,
          match: () => isLegacyTab('all'),
        },
        {
          href: '/admin/legacy?tab=reports',
          label: 'گزارش‌ها',
          icon: AlertTriangle,
          match: () => isLegacyTab('reports'),
        },
      ],
    },
    {
      label: 'کاربران و رسانه',
      items: [
        {
          href: '/admin/legacy?tab=users',
          label: 'کاربران',
          icon: Users,
          match: () => isLegacyTab('users'),
        },
        {
          href: '/admin/banners',
          label: 'بنرهای تبلیغاتی',
          icon: ImageIcon,
          match: (p) => p.startsWith('/admin/banners') || isLegacyTab('banners'),
        },
        {
          href: '/admin/articles',
          label: 'مقالات',
          icon: Newspaper,
          match: (p) => p.startsWith('/admin/articles'),
        },
        {
          href: '/admin/comments',
          label: 'نظرات',
          icon: MessageSquare,
          match: (p) => p.startsWith('/admin/comments'),
        },
        {
          href: '/admin/badges',
          label: 'بج‌ها',
          icon: Award,
          match: (p) => p.startsWith('/admin/badges'),
        },
        {
          href: '/admin/pages',
          label: 'صفحات لندینگ',
          icon: Layers,
          match: (p) => p.startsWith('/admin/pages'),
        },
      ],
    },
    {
      label: 'سیستم',
      items: [
        {
          href: '/admin/legacy?tab=settings',
          label: 'تنظیمات',
          icon: Settings,
          match: () => isLegacyTab('settings'),
        },
      ],
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.match) return item.match(pathname || '', searchParams?.toString() || '');
    return pathname === item.href;
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/40"
          onClick={closeMobile}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-white border-l border-gray-200 transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
        } h-screen flex flex-col`}
      >
        {/* Brand */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
            <Building2 size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 leading-tight">بازارینو</p>
            <p className="text-[10px] text-gray-500 leading-tight">پنل مدیریت</p>
          </div>
        </div>

        {/* Cmd+K trigger */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="mx-3 mt-3 inline-flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 px-3 py-2 text-xs text-gray-500 transition"
        >
          <span className="inline-flex items-center gap-2">
            <Search size={13} />
            جست‌وجو و دستورات...
          </span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-white px-1.5 py-0.5 text-[10px] text-gray-500 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.label && (
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-2 mb-1.5">
                  {group.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={closeMobile}
                        className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition ${
                          active
                            ? 'bg-gray-900 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon size={15} className={active ? 'text-orange-300' : 'text-gray-400'} />
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge != null && item.badge > 0 && (
                          <span className="text-[10px] bg-orange-500 text-white rounded-full px-1.5 py-0.5">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-100 space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-gray-500 hover:bg-gray-100 transition"
          >
            <ExternalLink size={13} />
            مشاهده سایت
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs text-red-600 hover:bg-red-50 transition"
          >
            <LogOut size={13} />
            خروج
          </button>
          {session?.user?.name && (
            <div className="px-2.5 pt-2 mt-1 border-t border-gray-100 flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-bold text-gray-600">
                {session.user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-gray-800 truncate">
                  {session.user.name}
                </p>
                <p className="text-[10px] text-gray-500 truncate">ادمین</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="lg:mr-64 min-h-screen flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-gray-200">
          <div className="flex items-center gap-3 px-4 lg:px-6 h-14">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden -mr-2 p-2 text-gray-600 hover:text-gray-900"
              aria-label="منو"
            >
              <Menu size={20} />
            </button>
            <Breadcrumb pathname={pathname || ''} tab={tabParam} />
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 px-2.5 py-1.5 text-[11px] text-gray-500 transition"
              >
                <Search size={12} /> جست‌وجو
                <kbd className="rounded border border-gray-200 bg-white px-1 text-[9px] font-mono">⌘K</kbd>
              </button>
              <Link
                href="/ads/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 text-xs font-semibold transition"
              >
                <Sparkles size={12} />
                ثبت آگهی جدید
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-6 py-6">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}

function Breadcrumb({ pathname, tab }: { pathname: string; tab: string }) {
  const tabLabels: Record<string, string> = {
    pending: 'آگهی‌های در صف',
    all: 'همه آگهی‌ها',
    users: 'کاربران',
    banners: 'بنر و تصاویر',
    reports: 'گزارش‌ها',
    settings: 'تنظیمات',
  };

  let pageName = 'نمای کلی';
  if (pathname.startsWith('/admin/legacy')) {
    pageName = tabLabels[tab] || 'مدیریت';
  } else if (pathname === '/admin/users' || pathname.startsWith('/admin/users/')) {
    pageName = 'کاربران';
  } else if (pathname.startsWith('/admin/badges')) {
    pageName = 'بج‌ها';
  }

  return (
    <nav aria-label="breadcrumb" className="flex items-center gap-1 text-xs text-gray-500 truncate">
      <Link href="/admin" className="hover:text-gray-900">
        پنل
      </Link>
      <ChevronLeft size={11} />
      <span className="text-gray-900 font-semibold truncate">{pageName}</span>
    </nav>
  );
}
