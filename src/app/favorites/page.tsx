'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { Heart, HeartCrack, Package, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (session) fetchFavorites();
  }, [session]);

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/favorites');
      const data = await res.json();
      setAds(data.ads || []);
    } catch {
      toast.error('خطا در دریافت علاقه‌مندی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (adId: string) => {
    const res = await fetch(`/api/favorites?adId=${adId}`, { method: 'DELETE' });
    if (res.ok) {
      setAds((prev) => prev.filter((ad) => ad._id !== adId));
      toast.success('از علاقه‌مندی حذف شد');
    } else {
      toast.error('حذف نشد');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" /></div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="flex items-center gap-2 mb-5">
          <Heart size={18} className="text-rose-500" />
          <h1 className="text-xl font-bold text-gray-800">علاقه‌مندی‌ها</h1>
        </div>

        {ads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <HeartCrack size={26} />
            </div>
            <p className="text-gray-500">هنوز آگهی‌ای به علاقه‌مندی اضافه نکرده‌ای</p>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad: any) => (
              <div key={ad._id} className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-3">
                <Link href={`/ads/${ad._id}`} className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 block flex-shrink-0">
                  {ad.images?.[0] ? (
                    <Image src={ad.images[0]} alt={ad.title} width={80} height={80} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={22} /></div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/ads/${ad._id}`} className="font-semibold text-sm text-gray-800 line-clamp-2">{ad.title}</Link>
                  <p className="text-xs text-gray-500 mt-1">{ad.city}</p>
                  <p className="text-sm text-brand-600 font-bold mt-1">{ad.price ? `€${Number(ad.price).toLocaleString()}` : 'توافقی'}</p>
                </div>
                <button
                  onClick={() => removeFavorite(ad._id)}
                  className="self-start p-2 rounded-lg bg-rose-50 text-rose-600"
                  title="حذف از علاقه‌مندی"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
