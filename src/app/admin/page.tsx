'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Users, FileText, Clock, Star, BarChart3 } from 'lucide-react';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [pendingAds, setPendingAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [allAds, setAllAds] = useState<any[]>([]);
  const [rejectionModal, setRejectionModal] = useState<{ open: boolean; adId: string }>({ open: false, adId: '' });
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchStats();
      fetchPendingAds();
    }
  }, [session]);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    setStats(data.stats);
    setLoading(false);
  };

  const fetchPendingAds = async () => {
    const res = await fetch('/api/admin/ads?status=pending&limit=50');
    const data = await res.json();
    setPendingAds(data.ads || []);
  };

  const fetchAllAds = async () => {
    const res = await fetch('/api/admin/ads?status=all&limit=50');
    const data = await res.json();
    setAllAds(data.ads || []);
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
        setPendingAds(prev => prev.filter(a => a._id !== id));
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
    if (activeTab === 'all') fetchAllAds();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Admin Header */}
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
              <span className="text-gray-400 text-sm mr-2">پنل مدیریت</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-gray-400 text-sm">{session?.user?.name}</span>
            <Link href="/" className="text-gray-400 hover:text-white text-sm">← سایت</Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[
              { label: 'کل آگهی‌ها', value: stats.totalAds, icon: FileText, color: 'bg-blue-50 text-blue-600' },
              { label: 'در انتظار', value: stats.pendingAds, icon: Clock, color: 'bg-yellow-50 text-yellow-600' },
              { label: 'تأیید شده', value: stats.approvedAds, icon: CheckCircle, color: 'bg-green-50 text-green-600' },
              { label: 'رد شده', value: stats.rejectedAds, icon: XCircle, color: 'bg-red-50 text-red-600' },
              { label: 'کاربران', value: stats.totalUsers, icon: Users, color: 'bg-purple-50 text-purple-600' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl p-4 border border-gray-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
                  <stat.icon size={18} />
                </div>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-5 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'pending' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'
            }`}
          >
            آگهی‌های در انتظار
            {pendingAds.length > 0 && (
              <span className="mr-2 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">
                {pendingAds.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setActiveTab('all'); fetchAllAds(); }}
            className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all' ? 'border-brand-500 text-brand-600' : 'border-transparent text-gray-500'
            }`}
          >
            همه آگهی‌ها
          </button>
        </div>

        {/* Ads List */}
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
                        {ad.images?.[0] ? (
                          <Image src={ad.images[0]} alt="" width={96} height={96} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-800">{ad.title}</h3>
                          <Link href={`/ads/${ad._id}`} target="_blank" className="text-gray-400 hover:text-gray-600">
                            <Eye size={16} />
                          </Link>
                        </div>

                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ad.description}</p>

                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                          <span>👤 {ad.userId?.name}</span>
                          <span>📧 {ad.userId?.email}</span>
                          <span>🏙️ {ad.city}</span>
                          <span>🏷️ {ad.category}</span>
                        </div>

                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => updateAdStatus(ad._id, 'approved')}
                            className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          >
                            <CheckCircle size={14} /> تأیید
                          </button>
                          <button
                            onClick={() => setRejectionModal({ open: true, adId: ad._id })}
                            className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                          >
                            <XCircle size={14} /> رد کردن
                          </button>
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
                  {ad.images?.[0] ? (
                    <Image src={ad.images[0]} alt="" width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">📦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/ads/${ad._id}`} target="_blank" className="font-medium text-gray-800 hover:text-brand-600 text-sm line-clamp-1">
                    {ad.title}
                  </Link>
                  <p className="text-xs text-gray-400">{ad.userId?.name} • {ad.city}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[ad.status] || ''}`}>
                    {STATUS_LABELS[ad.status]}
                  </span>
                  <button
                    onClick={() => toggleFeatured(ad._id, ad.isFeatured)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      ad.isFeatured ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400 hover:bg-orange-50'
                    }`}
                    title={ad.isFeatured ? 'از ویژه خارج کن' : 'ویژه کن'}
                  >
                    <Star size={14} fill={ad.isFeatured ? 'currentColor' : 'none'} />
                  </button>
                  {ad.status !== 'approved' && (
                    <button
                      onClick={() => updateAdStatus(ad._id, 'approved')}
                      className="text-green-500 hover:text-green-600"
                    >
                      <CheckCircle size={18} />
                    </button>
                  )}
                  {ad.status !== 'rejected' && (
                    <button
                      onClick={() => setRejectionModal({ open: true, adId: ad._id })}
                      className="text-red-400 hover:text-red-500"
                    >
                      <XCircle size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {rejectionModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <h3 className="font-bold text-gray-800 mb-3">دلیل رد کردن آگهی</h3>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
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
