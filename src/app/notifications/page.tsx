'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { Bell, CheckCheck, ChevronLeft, FlaskConical } from 'lucide-react';
import toast from 'react-hot-toast';

type NotificationItem = {
  _id: string;
  title: string;
  body: string;
  href?: string;
  isRead: boolean;
  createdAt: string;
};

function formatTime(value: string) {
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    day: 'numeric',
  }).format(new Date(value));
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'خطا در دریافت اعلان‌ها');
        setNotifications(data.notifications || []);
      } catch (error: any) {
        toast.error(error?.message || 'خطا در دریافت اعلان‌ها');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [session]);

  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'به‌روزرسانی اعلان‌ها ناموفق بود');
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, isRead: true }))
      );
    } catch (error: any) {
      toast.error(error?.message || 'به‌روزرسانی اعلان‌ها ناموفق بود');
    } finally {
      setMarkingAll(false);
    }
  };

  const createTestNotification = async () => {
    try {
      setCreatingTest(true);
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'test' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'ساخت اعلان تستی ناموفق بود');
      if (data?.notification) {
        setNotifications((prev) => [data.notification, ...prev]);
      }
      toast.success('اعلان تستی ساخته شد');
    } catch (error: any) {
      toast.error(error?.message || 'ساخت اعلان تستی ناموفق بود');
    } finally {
      setCreatingTest(false);
    }
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      try {
        await fetch(`/api/notifications/${item._id}`, { method: 'PATCH' });
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === item._id ? { ...notification, isRead: true } : notification
          )
        );
      } catch {
        // ignore
      }
    }

    router.push(item.href || '/messages');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" /></div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-brand-500" />
            <h1 className="text-xl font-bold text-gray-800">اعلان‌ها</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={createTestNotification}
              disabled={creatingTest}
              className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-2 rounded-xl bg-brand-500 text-white disabled:opacity-50"
            >
              <FlaskConical size={14} />
              تست نوتیف
            </button>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={markingAll || notifications.every((item) => item.isRead)}
              className="inline-flex items-center gap-2 text-xs md:text-sm px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 disabled:opacity-50"
            >
              <CheckCheck size={14} />
              همه خوانده شد
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">🔔</p>
            <p className="text-gray-500">هنوز اعلانی ندارید</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => openNotification(item)}
                className={`w-full text-right bg-white rounded-2xl border p-4 flex items-start gap-3 ${
                  item.isRead ? 'border-gray-100' : 'border-brand-200 bg-brand-50/40'
                }`}
              >
                <span className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${item.isRead ? 'bg-gray-300' : 'bg-brand-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">{item.title}</p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTime(item.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">{item.body}</p>
                </div>
                <ChevronLeft size={16} className="text-gray-300 flex-shrink-0 mt-1" />
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Link href="/messages" className="text-sm text-brand-600 font-medium">
            رفتن به گفتگوها
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
