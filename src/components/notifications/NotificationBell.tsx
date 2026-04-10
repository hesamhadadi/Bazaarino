'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toFaDigits } from '@/lib/locale';

export default function NotificationBell() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!session) {
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications?limit=1', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok || cancelled) return;
        setUnreadCount(Number(data?.unreadCount || 0));
      } catch {
        if (!cancelled) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnreadCount();
    const interval = window.setInterval(fetchUnreadCount, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [session]);

  if (!session) return null;

  return (
    <Link
      href="/notifications"
      className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
      aria-label="اعلان‌ها"
    >
      <Bell size={18} />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-brand-500 text-white text-[10px] flex items-center justify-center">
          {toFaDigits(unreadCount > 99 ? '99+' : unreadCount)}
        </span>
      )}
    </Link>
  );
}
