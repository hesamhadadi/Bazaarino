'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Search, Plus, Newspaper, MessageCircle } from 'lucide-react';
import { useChat } from '@/components/providers/ChatProvider';
import { toFaDigits } from '@/lib/locale';

const navItems = [
  { href: '/', icon: Home, label: 'خانه' },
  { href: '/search', icon: Search, label: 'جستجو' },
  { href: '/ads/new', icon: Plus, label: 'افزودن آگهی', special: true },
  { href: '/messages', icon: MessageCircle, label: 'گفتگوها' },
  { href: '/news', icon: Newspaper, label: 'اخبار' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { unreadCount } = useChat();

  if (!pathname || pathname.startsWith('/admin')) return null;

  return (
    <nav className="bottom-nav md:hidden px-3 pt-2">
      <div className="grid grid-cols-5 items-end gap-1 rounded-2xl border border-gray-100 bg-white px-2 pb-2 pt-3 shadow-[0_-10px_30px_rgba(15,23,42,0.08)]">
        {navItems.map(({ href, icon: Icon, label, special }) => {
          const isActive = pathname === href;
          const targetHref = href === '/ads/new' || href === '/messages' ? (session ? href : '/auth/login') : href;

          if (special) {
            return (
              <Link key={href} href={targetHref} className="relative flex min-w-0 flex-col items-center justify-end">
                <div className="absolute -top-8 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-[0_-6px_20px_rgba(15,23,42,0.10)]">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-orange-300/40">
                    <Icon size={22} className="text-white" />
                  </span>
                </div>
                <span className="mt-8 max-w-full truncate text-[11px] font-semibold text-brand-600">{label}</span>
              </Link>
            );
          }

          return (
            <Link key={href} href={targetHref} className="relative flex min-w-0 flex-col items-center justify-end gap-1 rounded-xl px-1 py-1.5">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isActive ? 'bg-brand-50' : 'bg-transparent'}`}>
                <Icon size={21} className={isActive ? 'text-brand-600' : 'text-gray-400'} />
              </span>
              <span className={`max-w-full truncate text-[11px] ${isActive ? 'font-semibold text-brand-600' : 'text-gray-400'}`}>{label}</span>
              {href === '/messages' && unreadCount > 0 && (
                <span className="absolute top-0 left-1/2 min-w-4 h-4 px-1 rounded-full bg-brand-500 text-white text-[9px] flex items-center justify-center">
                  {toFaDigits(unreadCount > 99 ? '99+' : unreadCount)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
