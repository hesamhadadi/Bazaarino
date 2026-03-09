'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Users, FileText, Clock, Star, BarChart3, UserCheck, UserX, ImagePlus, Trash2 } from 'lucide-react';
import { CITIES, CATEGORIES } from '@/lib/constants';

type AdminTab = 'pending' | 'all' | 'users' | 'banners';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [pendingAds, setPendingAds] = useState<any[]>([]);
  const [allAds, setAllAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('pending');
  const [rejectionModal, setRejectionModal] = useState<{ open: boolean; adId: string }>({ open: false, adId: '' });
  const [rejectionReason, setRejectionReason] = useState('');

  const [bannerUploading, setBannerUploading] = useState(false);
  const [bannerSubmitting, setBannerSubmitting] = useState(false);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    linkUrl: '',
    imageUrl: '',
    duration: '30d',
    customDays: 3,
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      Promise.all([fetchStats(), fetchPendingAds()]).finally(() => setLoading(false));
    }
  }, [session]);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    setStats(data.stats);
  };

  const fetchPendingAds = async () => {
    const res = await fetch('/api/admin/ads?status=pending&limit=100');
    const data = await res.json();
    setPendingAds(data.ads || []);
  };

  const fetchAllAds = async () => {
    const res = await fetch('/api/admin/ads?status=all&limit=200');
    const data = await res.json();
    setAllAds(data.ads || []);
  };

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users');
    const data = await res.json();
    setUsers(data.users || []);
  };

  const fetchBanners = async () => {
    const res = await fetch('/api/admin/banners');
    const data = await res.json();
    setBanners(data.banners || []);
  };

  const changeTab = async (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'all') await fetchAllAds();
    if (tab === 'users') await fetchUsers();
    if (tab === 'banners') await fetchBanners();
  };

  const updateAdStatus = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });

      if (res.ok) {
        toast.success(status === 'approved' ? '✅ آگهی تأیید شد' : '❌ آگهی رد شد');
        setPendingAds((prev) => prev.filter((a) => a._id !== id));
        fetchStats();
      }
    } catch {
      toast.error('خطایی رخ داد');
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    await fetch(`/api/ads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured: !current }),
    });
    toast.success(!current ? 'آگهی ویژه شد' : 'از ویژه خارج شد');
    fetchAllAds();
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isActive: !isActive }),
    });

    if (res.ok) {
      toast.success(!isActive ? 'کاربر فعال شد' : 'کاربر غیرفعال شد');
      fetchUsers();
      fetchStats();
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploading(true);
    const formData = new FormData();
    formData.append('images', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) {
        setBannerForm((prev) => ({ ...prev, imageUrl: data.urls[0] }));
        toast.success('بنر آپلود شد');
      } else {
        toast.error(data.message || 'خطا در آپلود بنر');
      }
    } catch {
      toast.error('خطای شبکه در آپلود بنر');
    } finally {
      setBannerUploading(false);
    }
  };

  const createBanner = async () => {
    if (!bannerForm.imageUrl) {
      toast.error('تصویر بنر را آپلود کنید');
      return;
    }

    setBannerSubmitting(true);
    const now = new Date();
    const days = bannerForm.duration === '1d' ? 1 : bannerForm.duration === '7d' ? 7 : bannerForm.duration === '30d' ? 30 : Number(bannerForm.customDays || 1);
    const endsAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const res = await fetch('/api/admin/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: bannerForm.title,
        linkUrl: bannerForm.linkUrl,
        imageUrl: bannerForm.imageUrl,
        startsAt: now,
        endsAt,
      }),
    });

    setBannerSubmitting(false);

    if (res.ok) {
      toast.success('بنر ثبت شد');
      setBannerForm({ title: '', linkUrl: '', imageUrl: '', duration: '30d', customDays: 3 });
      fetchBanners();
    } else {
      toast.error('ثبت بنر ناموفق بود');
    }
  };

  const toggleBannerActive = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/banners', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    await fetch(`/api/admin/banners?id=${id}`, { method: 'DELETE' });
    fetchBanners();
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: 'در انتظار',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    expired: 'منقضی',
    sold: 'فروخته شد',
  };

  const STATUS_COLORS: Record<string, string> = {
    pending: 'status-pending',
    approved: 'status-approved',
    rejected: 'status-rejected',
    expired: 'status-expired',
    sold: 'status-sold',
  };

  const topCities = useMemo(() => stats?.topCities || [], [stats]);
  const topCategories = useMemo(() => stats?.topCategories || [], [stats]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-gray-900 text-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-0.5">
              <span className="w-2 h-6 bg-green-500 rounded-sm"></span>
              <span className="w-2 h-6 bg-gray-400 rounded-sm"></span>
              <span className="w-2 h-6 bg-red-500 rounded-sm"></span>
            </div>
            <div>
              <span className="font-bold text-lg">بازارینو</span>
              <span className="text-gray-400 text-sm mr-2">پنل مدیریت پیشرفته</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{session?.user?.name}</span>
            <Link href="/" className="text-gray-400 hover:text-white text-sm">← سایت</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
              {[
                { label: 'کل آگهی‌ها', value: stats.totalAds, icon: FileText, color: 'bg-blue-50 text-blue-600' },
                { label: 'در انتظار', value: stats.pendingAds, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
                { label: 'تأیید شده', value: stats.approvedAds, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
                { label: 'رد شده', value: stats.rejectedAds, icon: XCircle, color: 'bg-red-50 text-red-600' },
                { label: 'کاربران فعال', value: stats.activeUsers, icon: UserCheck, color: 'bg-emerald-50 text-emerald-600' },
                { label: 'کاربران غیرفعال', value: stats.inactiveUsers, icon: UserX, color: 'bg-gray-100 text-gray-600' },
                { label: 'آگهی ۷ روز اخیر', value: stats.adsLast7Days, icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
                    <stat.icon size={18} />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">شهرهای پرآگهی</h3>
                <div className="space-y-2">
                  {topCities.map((c: any) => {
                    const cityLabel = CITIES.find((x) => x.value === c._id)?.label || c._id;
                    const pct = Math.max(6, Math.round((c.count / Math.max(1, stats.approvedAds)) * 100));
                    return (
                      <div key={c._id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{cityLabel}</span>
                          <span className="text-gray-400">{c.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <h3 className="font-semibold text-gray-800 mb-3">دسته‌های پرآگهی</h3>
                <div className="space-y-2">
                  {topCategories.map((c: any) => {
                    const cat = CATEGORIES.find((x) => x.id === c._id);
                    const pct = Math.max(6, Math.round((c.count / Math.max(1, stats.approvedAds)) * 100));
                    return (
                      <div key={c._id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{cat?.label || c._id}</span>
                          <span className="text-gray-400">{c.count}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 mb-5 border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'pending', label: 'در انتظار', count: pendingAds.length },
            { id: 'all', label: 'همه آگهی‌ها' },
            { id: 'users', label: 'کاربران' },
            { id: 'banners', label: 'بنر تبلیغاتی' },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && <span className="mr-2 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>

        {activeTab === 'pending' && (
          <div>
            {pendingAds.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-gray-500">همه آگهی‌ها بررسی شده‌اند!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAds.map((ad: any) => (
                  <div key={ad._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {ad.images?.[0] ? <Image src={ad.images[0]} alt="" width={96} height={96} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-800">{ad.title}</h3>
                          <Link href={`/ads/${ad._id}`} target="_blank" className="text-gray-400 hover:text-gray-600"><Eye size={16} /></Link>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ad.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                          <span>👤 {ad.userId?.name}</span>
                          <span>📧 {ad.userId?.email}</span>
                          <span>🏙️ {ad.city}</span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => updateAdStatus(ad._id, 'approved')} className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"><CheckCircle size={14} /> تأیید</button>
                          <button onClick={() => setRejectionModal({ open: true, adId: ad._id })} className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"><XCircle size={14} /> رد کردن</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'all' && (
          <div className="space-y-3">
            {allAds.map((ad: any) => (
              <div key={ad._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {ad.images?.[0] ? <Image src={ad.images[0]} alt="" width={56} height={56} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/ads/${ad._id}`} target="_blank" className="font-medium text-gray-800 hover:text-brand-600 text-sm line-clamp-1">{ad.title}</Link>
                  <p className="text-xs text-gray-400">{ad.userId?.name} • {ad.city}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[ad.status] || ''}`}>{STATUS_LABELS[ad.status]}</span>
                  <button onClick={() => toggleFeatured(ad._id, ad.isFeatured)} className={`p-1.5 rounded-lg transition-colors ${ad.isFeatured ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400 hover:bg-orange-50'}`}>
                    <Star size={14} fill={ad.isFeatured ? 'currentColor' : 'none'} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            {users.map((u: any) => (
              <div key={u._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{u.name || '-'}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  <div className="text-xs text-gray-400 mt-1 flex gap-3">
                    <span>آگهی‌ها: {u.adsCount}</span>
                    <span>ثبت‌نام: {new Date(u.createdAt).toLocaleDateString('fa-IR')}</span>
                    <span>{u.role === 'admin' ? 'ادمین' : 'کاربر'}</span>
                  </div>
                </div>

                <button
                  onClick={() => toggleUserActive(u._id, u.isActive)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium ${u.isActive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
                >
                  {u.isActive ? 'غیرفعال کن' : 'فعال کن'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'banners' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">ایجاد بنر تبلیغاتی زمان‌دار</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <input value={bannerForm.title} onChange={(e) => setBannerForm((p) => ({ ...p, title: e.target.value }))} placeholder="عنوان بنر (اختیاری)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                <input value={bannerForm.linkUrl} onChange={(e) => setBannerForm((p) => ({ ...p, linkUrl: e.target.value }))} placeholder="لینک مقصد (اختیاری)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                <select value={bannerForm.duration} onChange={(e) => setBannerForm((p) => ({ ...p, duration: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <option value="1d">۱ روز</option>
                  <option value="7d">۱ هفته</option>
                  <option value="30d">۱ ماه</option>
                  <option value="custom">سفارشی (روز)</option>
                </select>
                {bannerForm.duration === 'custom' && (
                  <input type="number" min="1" value={bannerForm.customDays} onChange={(e) => setBannerForm((p) => ({ ...p, customDays: Number(e.target.value) }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                )}
              </div>

              <div className="mt-3 flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer text-sm">
                  <ImagePlus size={16} />
                  {bannerUploading ? 'در حال آپلود...' : 'آپلود تصویر بنر'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} disabled={bannerUploading} />
                </label>
                {bannerForm.imageUrl && <span className="text-xs text-emerald-600">تصویر آماده است ✅</span>}
                <button onClick={createBanner} disabled={bannerSubmitting} className="ms-auto bg-brand-500 text-white px-4 py-2 rounded-xl text-sm">ثبت بنر</button>
              </div>
            </div>

            <div className="space-y-3">
              {banners.map((b: any) => (
                <div key={b._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
                  <div className="w-24 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image src={b.imageUrl} alt={b.title || 'banner'} width={96} height={56} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{b.title || 'بدون عنوان'}</p>
                    <p className="text-xs text-gray-500 line-clamp-1">{b.linkUrl || 'بدون لینک'}</p>
                    <p className="text-xs text-gray-400 mt-1">از {new Date(b.startsAt).toLocaleDateString('fa-IR')} تا {new Date(b.endsAt).toLocaleDateString('fa-IR')}</p>
                  </div>
                  <button onClick={() => toggleBannerActive(b._id, b.isActive)} className={`px-3 py-1.5 rounded-lg text-xs ${b.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.isActive ? 'فعال' : 'غیرفعال'}
                  </button>
                  <button onClick={() => deleteBanner(b._id)} className="p-2 rounded-lg bg-red-50 text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 mb-3">دلیل رد کردن آگهی</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="دلیل رد کردن آگهی را بنویسید (اختیاری)"
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  updateAdStatus(rejectionModal.adId, 'rejected', rejectionReason);
                  setRejectionModal({ open: false, adId: '' });
                  setRejectionReason('');
                }}
                className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                رد کردن
              </button>
              <button
                onClick={() => setRejectionModal({ open: false, adId: '' })}
                className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium"
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
