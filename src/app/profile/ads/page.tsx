'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Eye, Clock, CheckCircle, XCircle, AlertCircle, ClipboardList, Package, ArrowUp } from 'lucide-react';

const STATUS_MAP = {
  pending: { label: 'در انتظار تأیید', icon: Clock, className: 'status-pending' },
  approved: { label: 'تأیید شده', icon: CheckCircle, className: 'status-approved' },
  rejected: { label: 'رد شده', icon: XCircle, className: 'status-rejected' },
  expired: { label: 'منقضی', icon: AlertCircle, className: 'status-expired' },
  sold: { label: 'فروخته شد', icon: CheckCircle, className: 'status-sold' },
};

export default function MyAdsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (session) fetchMyAds();
  }, [session]);

  const fetchMyAds = async () => {
    try {
      const res = await fetch('/api/users/my-ads');
      const data = await res.json();
      setAds(data.ads || []);
    } catch {
      toast.error('خطا در دریافت آگهی‌ها');
    } finally {
      setLoading(false);
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    try {
      const res = await fetch(`/api/ads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAds(prev => prev.filter(a => a._id !== id));
        toast.success('آگهی حذف شد');
      }
    } catch {
      toast.error('خطایی رخ داد');
    }
  };

  const bumpAd = async (id: string) => {
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bump: true }),
      });
      if (res.ok) {
        toast.success('آگهی نردبان شد');
        fetchMyAds();
      } else {
        toast.error('نردبان آگهی انجام نشد');
      }
    } catch {
      toast.error('خطایی رخ داد');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-800">آگهی‌های من</h1>
          <Link
            href="/ads/new"
            className="flex items-center gap-2 bg-brand-500 text-white px-3 py-2 rounded-xl text-sm font-medium"
          >
            <Plus size={15} /> آگهی جدید
          </Link>
        </div>

        {ads.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <ClipboardList size={26} />
            </div>
            <p className="text-gray-500 mb-4">هنوز آگهی‌ای ثبت نکرده‌اید</p>
            <Link href="/ads/new" className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
              ثبت اولین آگهی
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {ads.map((ad: any) => {
              const statusInfo = STATUS_MAP[ad.status as keyof typeof STATUS_MAP];
              const StatusIcon = statusInfo?.icon;

              return (
                <div key={ad._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="flex gap-3 p-3">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {ad.images?.[0] ? (
                        <Image src={ad.images[0]} alt={ad.title} width={80} height={80} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={24} /></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link href={`/ads/${ad._id}`} className="font-semibold text-gray-800 text-sm line-clamp-2 hover:text-brand-600">
                        {ad.title}
                      </Link>
                      <p className="text-brand-600 font-bold text-sm mt-1">
                        {ad.priceType === 'free' ? 'رایگان' : ad.priceType === 'negotiable' ? 'توافقی' : ad.price ? `€${ad.price}` : 'توافقی'}
                      </p>

                      <div className="flex items-center gap-2 mt-2">
                        <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${statusInfo?.className}`}>
                          {StatusIcon && <StatusIcon size={10} />}
                          {statusInfo?.label}
                        </span>
                        {/* View counts are admin-only across the site —
                            even owners don't see their own ad views to keep
                            stats reporting centralized in /admin. */}
                        {ad.isUrgent && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">فوری</span>
                        )}
                        {ad.isFeatured && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold">ویژه</span>
                        )}
                        {(ad.bumpCount || 0) > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">نردبان‌شده</span>
                        )}
                      </div>

                      {ad.rejectionReason && (
                        <p className="text-xs text-red-500 mt-1">دلیل رد: {ad.rejectionReason}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex border-t border-gray-50">
                    <Link
                      href={`/ads/${ad._id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <Edit size={14} /> ویرایش
                    </Link>
                    <button
                      onClick={() => bumpAd(ad._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 transition-colors border-r border-gray-50"
                    >
                      <ArrowUp size={14} /> نردبان
                    </button>
                    <button
                      onClick={() => deleteAd(ad._id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-r border-gray-50"
                    >
                      <Trash2 size={14} /> حذف
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
