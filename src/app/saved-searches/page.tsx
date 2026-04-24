'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import { Bell, BellOff, Trash2, Search, Bookmark } from 'lucide-react';
import toast from 'react-hot-toast';

type Item = {
  _id: string;
  name: string;
  query: string;
  alertEnabled: boolean;
  createdAt: string;
};

export default function SavedSearchesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/auth/login?callbackUrl=/saved-searches');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    (async () => {
      try {
        const res = await fetch('/api/saved-searches');
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  async function toggleAlert(id: string, current: boolean) {
    const res = await fetch(`/api/saved-searches/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ alertEnabled: !current }),
    });
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i._id === id ? { ...i, alertEnabled: !current } : i)));
      toast.success(!current ? 'آلارم فعال شد' : 'آلارم غیرفعال شد');
    } else {
      toast.error('خطا');
    }
  }

  async function remove(id: string) {
    if (!confirm('حذف این جست‌وجو؟')) return;
    const res = await fetch(`/api/saved-searches/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((prev) => prev.filter((i) => i._id !== id));
      toast.success('حذف شد');
    } else toast.error('خطا در حذف');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 inline-flex items-center gap-2">
          <Bookmark size={20} /> جست‌وجوهای ذخیره شده
        </h1>

        {loading ? (
          <p className="text-sm text-gray-500">در حال بارگذاری...</p>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-600 mb-3">هنوز جست‌وجویی ذخیره نکرده‌اید.</p>
            <Link href="/search" className="text-brand-600 font-semibold text-sm">رفتن به جست‌وجو</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 truncate">{it.name}</p>
                  <p className="text-xs text-gray-500 truncate">{it.query || '—'}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Link
                    href={`/search?${it.query}`}
                    className="p-2 text-gray-500 hover:text-brand-600"
                    title="اجرای جست‌وجو"
                  >
                    <Search size={16} />
                  </Link>
                  <button
                    onClick={() => toggleAlert(it._id, it.alertEnabled)}
                    className={`p-2 ${it.alertEnabled ? 'text-brand-600' : 'text-gray-400 hover:text-gray-700'}`}
                    title={it.alertEnabled ? 'آلارم فعال' : 'آلارم خاموش'}
                  >
                    {it.alertEnabled ? <Bell size={16} /> : <BellOff size={16} />}
                  </button>
                  <button onClick={() => remove(it._id)} className="p-2 text-gray-400 hover:text-red-600" title="حذف">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
