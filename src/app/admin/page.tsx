'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Eye, Users, FileText, Clock, Star, UserCheck, ImagePlus, Trash2, Filter, RotateCcw, ShieldCheck, Activity, AlertTriangle, BadgeCheck, Gauge, Heart, Megaphone, MousePointerClick, PieChart, TrendingUp } from 'lucide-react';
import { CITIES, CATEGORIES, getCityLabel } from '@/lib/constants';
import { applyBrandPaletteToDocument, normalizeBrandPrimary } from '@/lib/brand-color';

type AdminTab = 'pending' | 'all' | 'users' | 'banners' | 'reports' | 'settings';
type AppSettings = { telegramToken: string; telegramChatId: string; telegramSecret: string; siteUrl: string; brandPrimary: string };
type AdFilters = {
  q: string;
  city: string;
  category: string;
  dateFrom: string;
  dateTo: string;
  isFeatured: 'all' | 'true' | 'false';
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'expired' | 'sold';
  userId: string;
};

const DEFAULT_AD_FILTERS: AdFilters = {
  q: '',
  city: '',
  category: '',
  dateFrom: '',
  dateTo: '',
  isFeatured: 'all',
  status: 'all',
  userId: '',
};

const DEFAULT_SETTINGS: AppSettings = {
  telegramToken: '',
  telegramChatId: '',
  telegramSecret: '',
  siteUrl: '',
  brandPrimary: '#f97316',
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [pendingAds, setPendingAds] = useState<any[]>([]);
  const [allAds, setAllAds] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [userFilters, setUserFilters] = useState({ q: '', role: 'all', status: 'all', identity: 'all' });
  const [banners, setBanners] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [housingCityImages, setHousingCityImages] = useState<any[]>([]);
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
    placement: 'home',
    categoryId: '',
    duration: '30d',
    customDays: 3,
  });
  const [cityImageUploading, setCityImageUploading] = useState(false);
  const [cityImageSubmitting, setCityImageSubmitting] = useState(false);
  const [cityImageForm, setCityImageForm] = useState({
    city: 'rome',
    title: '',
    imageUrl: '',
  });
  const [adFilters, setAdFilters] = useState<AdFilters>(DEFAULT_AD_FILTERS);
  const [featureDurations, setFeatureDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/');
  }, [status, session, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      Promise.all([fetchStats(), fetchPendingAds(DEFAULT_AD_FILTERS)]).finally(() => setLoading(false));
    }
  }, [session]);

  const isFeaturedActive = (ad: any) => ad.isFeatured && (!ad.featuredUntil || new Date(ad.featuredUntil) >= new Date());

  const buildAdFilterQuery = (status: string, filters: AdFilters) => {
    const params = new URLSearchParams();
    params.set('status', status);
    params.set('limit', status === 'pending' ? '150' : '250');
    if (filters.q) params.set('q', filters.q);
    if (filters.city) params.set('city', filters.city);
    if (filters.category) params.set('category', filters.category);
    if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.set('dateTo', filters.dateTo);
    if (filters.isFeatured !== 'all') params.set('isFeatured', filters.isFeatured);
    if (filters.userId) params.set('userId', filters.userId);
    return params.toString();
  };

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    setStats(data.stats);
  };

  const fetchPendingAds = async (filters: AdFilters = adFilters) => {
    const res = await fetch(`/api/admin/ads?${buildAdFilterQuery('pending', filters)}`);
    const data = await res.json();
    setPendingAds(data.ads || []);
  };

  const fetchAllAds = async (filters: AdFilters = adFilters) => {
    const query = buildAdFilterQuery(filters.status, filters);
    const res = await fetch(`/api/admin/ads?${query}`);
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

  const fetchReports = async () => {
    const res = await fetch('/api/admin/reports');
    const data = await res.json();
    setReports(data.reports || []);
  };

  const fetchSettings = async () => {
    const res = await fetch('/api/admin/settings');
    const data = await res.json();
    setSettings(data.settings || DEFAULT_SETTINGS);
  };

  const fetchHousingCityImages = async () => {
    const res = await fetch('/api/admin/housing-city-images');
    const data = await res.json();
    setHousingCityImages(data.items || []);
  };

  const changeTab = async (tab: AdminTab) => {
    setActiveTab(tab);
    if (tab === 'all') await fetchAllAds(adFilters);
    if (tab === 'users') await fetchUsers();
    if (tab === 'banners') {
      await fetchBanners();
      await fetchHousingCityImages();
    }
    if (tab === 'reports') await fetchReports();
    if (tab === 'settings') await fetchSettings();
  };

  const applyAdFilters = async () => {
    if (activeTab === 'pending') await fetchPendingAds(adFilters);
    if (activeTab === 'all') await fetchAllAds(adFilters);
  };

  const resetAdFilters = async () => {
    setAdFilters(DEFAULT_AD_FILTERS);
    if (activeTab === 'pending') await fetchPendingAds(DEFAULT_AD_FILTERS);
    if (activeTab === 'all') await fetchAllAds(DEFAULT_AD_FILTERS);
  };

  const updateAdStatus = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/ads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, rejectionReason: reason }),
      });

      if (res.ok) {
        toast.success(status === 'approved' ? 'آگهی تأیید شد' : 'آگهی رد شد');
        setPendingAds((prev) => prev.filter((a) => a._id !== id));
        fetchStats();
      }
    } catch {
      toast.error('خطایی رخ داد');
    }
  };

  const setFeaturedForDays = async (id: string, days: number) => {
    const featuredUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    await fetch(`/api/ads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured: true, featuredUntil }),
    });
    toast.success(`آگهی برای ${days} روز ویژه شد`);
    fetchAllAds();
  };

  const removeFeatured = async (id: string) => {
    await fetch(`/api/ads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFeatured: false }),
    });
    toast.success('آگهی از حالت ویژه خارج شد');
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

  const updateUserIdentityStatus = async (userId: string, status: 'none' | 'pending' | 'verified' | 'rejected') => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, identityStatus: status }),
    });
    if (res.ok) {
      toast.success('وضعیت احراز بروزرسانی شد');
      fetchUsers();
    } else {
      toast.error('خطا در بروزرسانی احراز');
    }
  };

  const updateUserIdentityDocStatus = async (userId: string, field: 'fiscalCodeStatus' | 'passportStatus' | 'selfieStatus', status: 'none' | 'pending' | 'approved' | 'rejected') => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, [field]: status }),
    });
    if (res.ok) {
      toast.success('وضعیت مدرک بروزرسانی شد');
      fetchUsers();
    } else {
      toast.error('خطا در بروزرسانی مدرک');
    }
  };

  const resolveReport = async (reportId: string, status: 'open' | 'resolved') => {
    const res = await fetch('/api/admin/reports', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId, status }),
    });
    if (res.ok) {
      toast.success(status === 'resolved' ? 'گزارش بسته شد' : 'گزارش باز شد');
      fetchReports();
    } else {
      toast.error('خطا در بروزرسانی گزارش');
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telegramToken: settings.telegramToken,
          telegramChatId: settings.telegramChatId,
          siteUrl: settings.siteUrl,
          brandPrimary: settings.brandPrimary,
        }),
      });
      if (res.ok) {
        const safeColor = normalizeBrandPrimary(settings.brandPrimary);
        applyBrandPaletteToDocument(safeColor);
        localStorage.setItem('bazaarino.brandPrimary', safeColor);
        toast.success('تنظیمات ذخیره شد');
        fetchSettings();
      } else {
        toast.error('ذخیره تنظیمات انجام نشد');
      }
    } finally {
      setSettingsSaving(false);
    }
  };

  const setWebhook = async () => {
    setWebhookSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'setWebhook' }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        toast.success('وبهوک تلگرام ثبت شد');
      } else {
        toast.error(data.message || 'ثبت وبهوک ناموفق بود');
      }
    } finally {
      setWebhookSaving(false);
    }
  };

  const updateUserRole = async (userId: string, role: 'user' | 'admin' | 'editor') => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });

    if (res.ok) {
      toast.success('نقش کاربر بروزرسانی شد');
      fetchUsers();
    } else {
      toast.error('تغییر نقش انجام نشد');
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
        placement: bannerForm.placement,
        categoryId: bannerForm.placement === 'category' ? bannerForm.categoryId : undefined,
        startsAt: now,
        endsAt,
      }),
    });

    setBannerSubmitting(false);

    if (res.ok) {
      toast.success('بنر ثبت شد');
      setBannerForm({ title: '', linkUrl: '', imageUrl: '', placement: 'home', categoryId: '', duration: '30d', customDays: 3 });
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

  const handleCityImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCityImageUploading(true);
    const formData = new FormData();
    formData.append('images', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) {
        setCityImageForm((prev) => ({ ...prev, imageUrl: data.urls[0] }));
        toast.success('تصویر شهر آپلود شد');
      } else {
        toast.error(data.message || 'خطا در آپلود تصویر شهر');
      }
    } catch {
      toast.error('خطای شبکه در آپلود تصویر شهر');
    } finally {
      setCityImageUploading(false);
    }
  };

  const saveCityImage = async () => {
    if (!cityImageForm.city || !cityImageForm.imageUrl) {
      toast.error('شهر و تصویر الزامی است');
      return;
    }
    setCityImageSubmitting(true);
    const res = await fetch('/api/admin/housing-city-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cityImageForm),
    });
    setCityImageSubmitting(false);
    if (res.ok) {
      toast.success('عکس شهر ذخیره شد');
      setCityImageForm((prev) => ({ ...prev, title: '', imageUrl: '' }));
      fetchHousingCityImages();
    } else {
      toast.error('ذخیره عکس شهر ناموفق بود');
    }
  };

  const toggleCityImageActive = async (id: string, isActive: boolean) => {
    await fetch('/api/admin/housing-city-images', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !isActive }),
    });
    fetchHousingCityImages();
  };

  const deleteCityImage = async (id: string) => {
    await fetch(`/api/admin/housing-city-images?id=${id}`, { method: 'DELETE' });
    fetchHousingCityImages();
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

  const STATUS_DOT_COLORS: Record<string, string> = {
    approved: '#16a34a',
    pending: '#f59e0b',
    rejected: '#ef4444',
    expired: '#64748b',
    sold: '#2563eb',
  };

  const LISTING_MODE_LABELS: Record<string, string> = {
    offer: 'عرضه',
    request: 'درخواست',
  };

  const formatCompact = (value?: number) => new Intl.NumberFormat('fa-IR', { notation: 'compact' }).format(value || 0);
  const formatNumber = (value?: number) => new Intl.NumberFormat('fa-IR').format(value || 0);
  const getCategoryLabel = (id?: string) => CATEGORIES.find((x) => x.id === id)?.label || id || '-';

  const makeLastDaysSeries = (rawItems: Array<{ _id: string; count: number }> = [], days = 14) => {
    const countByDate = new Map(rawItems.map((item) => [item._id, item.count]));
    return Array.from({ length: days }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        key,
        label: date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' }),
        count: countByDate.get(key) || 0,
      };
    });
  };

  const topCities = useMemo(() => stats?.topCities || [], [stats]);
  const topCategories = useMemo(() => stats?.topCategories || [], [stats]);
  const adsTrendSeries = useMemo(() => makeLastDaysSeries(stats?.adsTrend || []), [stats]);
  const usersTrendSeries = useMemo(() => makeLastDaysSeries(stats?.usersTrend || []), [stats]);
  const maxAdsTrend = useMemo(() => Math.max(1, ...adsTrendSeries.map((item) => item.count)), [adsTrendSeries]);
  const maxUsersTrend = useMemo(() => Math.max(1, ...usersTrendSeries.map((item) => item.count)), [usersTrendSeries]);
  const moderationLoad = useMemo(() => {
    if (!stats?.totalAds) return 0;
    return Math.round(((stats.pendingAds || 0) / Math.max(1, stats.totalAds)) * 100);
  }, [stats]);
  const activeAdFilterCount = useMemo(
    () => Object.entries(adFilters).filter(([key, value]) => key !== 'status' ? Boolean(value) : activeTab === 'all' && value !== 'all').length,
    [adFilters, activeTab]
  );

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-gray-100 to-gray-200" dir="rtl">
      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-gray-900 text-white px-6 py-5 border-b border-gray-700/50 shadow-lg">
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
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3 mb-4">
              {[
                { label: 'کل آگهی‌ها', value: stats.totalAds, hint: `امروز ${formatNumber(stats.adsToday)}`, icon: FileText, color: 'bg-sky-50 text-sky-700' },
                { label: 'در انتظار بررسی', value: stats.pendingAds, hint: `${moderationLoad}% از کل`, icon: Clock, color: 'bg-amber-50 text-amber-700' },
                { label: 'تأیید شده', value: stats.approvedAds, hint: `${formatNumber(stats.soldAds)} فروخته`, icon: CheckCircle, color: 'bg-emerald-50 text-emerald-700' },
                { label: 'رد یا منقضی', value: (stats.rejectedAds || 0) + (stats.expiredAds || 0), hint: `${formatNumber(stats.rejectedAds)} رد شده`, icon: XCircle, color: 'bg-rose-50 text-rose-700' },
                { label: 'کاربران فعال', value: stats.activeUsers, hint: `${formatNumber(stats.newUsersLast7Days)} جدید`, icon: UserCheck, color: 'bg-teal-50 text-teal-700' },
                { label: 'بازدید کل', value: stats.totalViews, hint: `میانگین ${formatNumber(stats.avgViews)}`, icon: Eye, color: 'bg-violet-50 text-violet-700' },
                { label: 'ویژه فعال', value: stats.featuredAds, hint: `${formatNumber(stats.urgentAds)} فوری`, icon: Star, color: 'bg-orange-50 text-orange-700' },
                { label: 'نیازمند اقدام', value: (stats.openReports || 0) + (stats.pendingIdentityUsers || 0), hint: `${formatNumber(stats.openReports)} گزارش باز`, icon: AlertTriangle, color: 'bg-red-50 text-red-700' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-white shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <stat.icon size={18} />
                    </div>
                    <span className="text-2xl font-bold text-gray-900">{formatCompact(stat.value)}</span>
                  </div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="mt-1 text-[11px] text-gray-400">{stat.hint}</p>
                </div>
              ))}
            </div>

            <div className="grid xl:grid-cols-3 gap-4 mb-4">
              <div className="xl:col-span-2 bg-white/90 backdrop-blur-sm rounded-lg border border-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">روند رشد ۱۴ روزه</h3>
                    <p className="text-xs text-gray-400 mt-1">آگهی‌های جدید و ثبت‌نام کاربران</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-500"></span> آگهی</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> کاربر</span>
                  </div>
                </div>
                <div className="flex gap-2 h-52 items-end border-b border-gray-100 pb-2">
                  {adsTrendSeries.map((item, index) => {
                    const userItem = usersTrendSeries[index];
                    return (
                      <div key={item.key} className="h-full flex-1 min-w-0 flex flex-col items-center justify-end gap-1">
                        <div className="w-full h-40 flex items-end justify-center gap-1">
                          <div
                            title={`آگهی: ${item.count}`}
                            className="w-3 rounded-t bg-brand-500 transition-all"
                            style={{ height: `${Math.max(4, (item.count / maxAdsTrend) * 100)}%` }}
                          />
                          <div
                            title={`کاربر: ${userItem?.count || 0}`}
                            className="w-3 rounded-t bg-cyan-500 transition-all"
                            style={{ height: `${Math.max(4, ((userItem?.count || 0) / maxUsersTrend) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-gray-400 -rotate-45 origin-top whitespace-nowrap">{item.label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="grid sm:grid-cols-4 gap-3 mt-4">
                  {[
                    { label: 'آگهی ۷ روز اخیر', value: stats.adsLast7Days, icon: TrendingUp },
                    { label: 'کاربر جدید', value: stats.newUsersLast7Days, icon: Users },
                    { label: 'بازدید میانگین', value: stats.avgViews, icon: MousePointerClick },
                    { label: 'علاقه‌مندی‌ها', value: stats.totalFavorites, icon: Heart },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <item.icon size={14} />
                        {item.label}
                      </div>
                      <p className="text-lg font-bold text-gray-900">{formatNumber(item.value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">وضعیت آگهی‌ها</h3>
                  <PieChart size={18} className="text-gray-400" />
                </div>
                <div className="flex items-center gap-5 justify-center">
                  <svg viewBox="0 0 140 140" className="w-36 h-36">
                    {(() => {
                      const total = stats.totalAds || 1;
                      const slices = (stats.statusBreakdown || []).filter((slice: any) => slice.count > 0);
                      let cumulative = 0;
                      const radius = 52;
                      const circumference = 2 * Math.PI * radius;
                      return slices.map((slice: any) => {
                        const pct = slice.count / total;
                        const offset = cumulative * circumference;
                        cumulative += pct;
                        return (
                          <circle
                            key={slice._id}
                            cx="70"
                            cy="70"
                            r={radius}
                            fill="none"
                            stroke={STATUS_DOT_COLORS[slice._id] || '#94a3b8'}
                            strokeWidth="20"
                            strokeDasharray={`${pct * circumference} ${circumference}`}
                            strokeDashoffset={-offset}
                            style={{ transform: 'rotate(-90deg)', transformOrigin: '70px 70px' }}
                          />
                        );
                      });
                    })()}
                    <text x="70" y="68" textAnchor="middle" className="font-bold fill-gray-900" style={{ fontSize: '20px' }}>{formatCompact(stats.totalAds)}</text>
                    <text x="70" y="86" textAnchor="middle" className="fill-gray-400" style={{ fontSize: '10px' }}>کل آگهی</text>
                  </svg>
                  <div className="space-y-2 min-w-32">
                    {(stats.statusBreakdown || []).map((item: any) => (
                      <div key={item._id} className="flex items-center gap-2 text-xs">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_DOT_COLORS[item._id] || '#94a3b8' }}></span>
                        <span className="text-gray-600">{STATUS_LABELS[item._id] || item._id}</span>
                        <span className="font-semibold text-gray-900 mr-auto">{formatNumber(item.count)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-5">
                  {(stats.listingModeBreakdown || []).map((item: any) => (
                    <div key={item._id} className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-xs text-gray-500">{LISTING_MODE_LABELS[item._id] || item._id}</p>
                      <p className="text-lg font-bold text-gray-900 mt-1">{formatNumber(item.count)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid xl:grid-cols-3 gap-4 mb-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-white shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">شهرهای پرآگهی</h3>
                <div className="space-y-3">
                  {topCities.map((c: any) => {
                    const cityLabel = CITIES.find((x) => x.value === c._id)?.label || c._id;
                    const pct = Math.max(6, Math.round((c.count / Math.max(1, stats.approvedAds)) * 100));
                    return (
                      <div key={c._id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{cityLabel}</span>
                          <span className="text-gray-400">{c.count}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-l from-brand-400 to-brand-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-white shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">دسته‌های پرآگهی</h3>
                <div className="space-y-3">
                  {topCategories.map((c: any) => {
                    const cat = CATEGORIES.find((x) => x.id === c._id);
                    const pct = Math.max(6, Math.round((c.count / Math.max(1, stats.approvedAds)) * 100));
                    return (
                      <div key={c._id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{cat?.label || c._id}</span>
                          <span className="text-gray-400">{c.count}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-l from-indigo-400 to-cyan-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-white shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3">مرکز اقدام سریع</h3>
                <div className="space-y-3">
                  {[
                    { label: 'آگهی در صف بررسی', value: stats.pendingAds, icon: Clock, tab: 'pending' as AdminTab, tone: 'bg-amber-50 text-amber-700' },
                    { label: 'گزارش باز کاربران', value: stats.openReports, icon: AlertTriangle, tab: 'reports' as AdminTab, tone: 'bg-red-50 text-red-700' },
                    { label: 'احراز هویت در انتظار', value: stats.pendingIdentityUsers, icon: BadgeCheck, tab: 'users' as AdminTab, tone: 'bg-emerald-50 text-emerald-700' },
                    { label: 'بنر فعال', value: stats.activeBanners, icon: Megaphone, tab: 'banners' as AdminTab, tone: 'bg-sky-50 text-sky-700' },
                  ].map((item) => (
                    <button
                      key={item.label}
                      onClick={() => changeTab(item.tab)}
                      className="w-full rounded-lg border border-gray-100 bg-gray-50 p-3 flex items-center justify-between text-right hover:bg-white transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm text-gray-700">
                        <span className={`w-9 h-9 rounded-lg flex items-center justify-center ${item.tone}`}>
                          <item.icon size={16} />
                        </span>
                        {item.label}
                      </span>
                      <span className="text-lg font-bold text-gray-900">{formatNumber(item.value)}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">پربازدیدترین آگهی‌ها</h3>
                  <Gauge size={18} className="text-gray-400" />
                </div>
                <div className="space-y-3">
                  {(stats.topViewedAds || []).map((ad: any, index: number) => (
                    <Link key={ad._id} href={`/ads/${ad._id}`} target="_blank" className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-white transition-colors">
                      <span className="w-7 h-7 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">{index + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{ad.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{getCityLabel(ad.city)} · {getCategoryLabel(ad.category)}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-700">{formatNumber(ad.views)} بازدید</span>
                    </Link>
                  ))}
                  {(stats.topViewedAds || []).length === 0 && <p className="text-sm text-gray-400">هنوز بازدیدی ثبت نشده است.</p>}
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-lg border border-white shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">ریسک و کاربران تازه</h3>
                  <Activity size={18} className="text-gray-400" />
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="space-y-3">
                    {(stats.topReportedAds || []).map((ad: any) => (
                      <Link key={ad._id} href={`/ads/${ad._id}`} target="_blank" className="block rounded-lg border border-red-100 bg-red-50/60 p-3 hover:bg-white transition-colors">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{ad.title}</p>
                        <p className="text-xs text-red-600 mt-1">{formatNumber(ad.fraudReportCount)} گزارش تقلب</p>
                      </Link>
                    ))}
                    {(stats.topReportedAds || []).length === 0 && <p className="text-sm text-gray-400">آگهی پرریسک ثبت نشده است.</p>}
                  </div>
                  <div className="space-y-3">
                    {(stats.newestUsers || []).map((user: any) => (
                      <Link key={user._id} href={`/u/${user._id}`} target="_blank" className="block rounded-lg border border-gray-100 bg-gray-50 p-3 hover:bg-white transition-colors">
                        <p className="text-sm font-medium text-gray-800 line-clamp-1">{user.name || user.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{user.email} · {new Date(user.createdAt).toLocaleDateString('fa-IR')}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 mb-5 border-b border-gray-300/70 overflow-x-auto">
          {[
            { id: 'pending', label: 'در انتظار', count: pendingAds.length, icon: Clock },
            { id: 'all', label: 'همه آگهی‌ها', icon: FileText },
            { id: 'users', label: 'کاربران', icon: Users },
            { id: 'banners', label: 'بنر تبلیغاتی', icon: ImagePlus },
            { id: 'reports', label: 'گزارش‌ها', icon: Eye },
            { id: 'settings', label: 'تنظیمات', icon: ShieldCheck },
          ].map((tab: any) => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
               className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                 activeTab === tab.id ? 'border-brand-500 text-brand-700 bg-white/70 rounded-t-xl' : 'border-transparent text-gray-500'
               }`}
            >
              <tab.icon size={14} />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && <span className="mr-2 bg-yellow-400 text-yellow-900 text-xs px-1.5 py-0.5 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>

        {(activeTab === 'pending' || activeTab === 'all') && (
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white shadow-sm p-4 mb-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
              <Filter size={16} />
              فیلتر آگهی‌ها
              {activeAdFilterCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">فعال: {activeAdFilterCount}</span>
              )}
            </div>
            <div className="grid md:grid-cols-4 gap-3">
              <input
                value={adFilters.q}
                onChange={(e) => setAdFilters((prev) => ({ ...prev, q: e.target.value }))}
                placeholder="جستجو عنوان/توضیحات"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={adFilters.userId}
                onChange={(e) => setAdFilters((prev) => ({ ...prev, userId: e.target.value }))}
                placeholder="شناسه کاربر"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <select
                value={adFilters.city}
                onChange={(e) => setAdFilters((prev) => ({ ...prev, city: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="">همه شهرها</option>
                {CITIES.map((city) => <option key={city.value} value={city.value}>{city.label}</option>)}
              </select>
              <select
                value={adFilters.category}
                onChange={(e) => setAdFilters((prev) => ({ ...prev, category: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="">همه دسته‌ها</option>
                {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
              </select>
              <input
                type="date"
                value={adFilters.dateFrom}
                onChange={(e) => setAdFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={adFilters.dateTo}
                onChange={(e) => setAdFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <select
                value={adFilters.isFeatured}
                onChange={(e) => setAdFilters((prev) => ({ ...prev, isFeatured: e.target.value as AdFilters['isFeatured'] }))}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
              >
                <option value="all">ویژه و عادی</option>
                <option value="true">فقط ویژه</option>
                <option value="false">فقط عادی</option>
              </select>
              {activeTab === 'all' && (
                <select
                  value={adFilters.status}
                  onChange={(e) => setAdFilters((prev) => ({ ...prev, status: e.target.value as AdFilters['status'] }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="approved">تأیید شده</option>
                  <option value="pending">در انتظار</option>
                  <option value="rejected">رد شده</option>
                  <option value="expired">منقضی</option>
                  <option value="sold">فروخته شد</option>
                </select>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={applyAdFilters} className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm">اعمال فیلتر</button>
              <button onClick={resetAdFilters} className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-600 px-4 py-2 rounded-xl text-sm">
                <RotateCcw size={14} />
                پاک‌کردن
              </button>
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div>
            {pendingAds.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3 text-emerald-600 inline-flex"><CheckCircle size={32} /></div>
                <p className="text-gray-500">همه آگهی‌ها بررسی شده‌اند!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAds.map((ad: any) => (
                  <div key={ad._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                        {ad.images?.[0] ? <Image src={ad.images[0]} alt={ad.title || 'تصویر آگهی'} width={96} height={96} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-gray-400" aria-label="بدون تصویر"><ImagePlus size={18} /><span className="sr-only">بدون تصویر</span></div>}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-800">{ad.title}</h3>
                          <Link href={`/ads/${ad._id}`} target="_blank" className="text-gray-400 hover:text-gray-600"><Eye size={16} /></Link>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">{ad.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs text-gray-400">
                          <button
                            onClick={() => {
                              const nextFilters = { ...adFilters, userId: ad.userId?._id || '' };
                              setAdFilters(nextFilters);
                              fetchPendingAds(nextFilters);
                            }}
                            className="text-xs text-brand-600"
                          >
                            کاربر: {ad.userId?.name}
                          </button>
                          <span>ایمیل: {ad.userId?.email}</span>
                          <span>شهر: {ad.city}</span>
                          <span>تاریخ: {new Date(ad.createdAt).toLocaleDateString('fa-IR')}</span>
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
                  {ad.images?.[0] ? <Image src={ad.images[0]} alt={ad.title || 'تصویر آگهی'} width={56} height={56} className="object-cover w-full h-full" /> : <div className="w-full h-full flex items-center justify-center text-gray-400" aria-label="بدون تصویر"><ImagePlus size={14} /><span className="sr-only">بدون تصویر</span></div>}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/ads/${ad._id}`} target="_blank" className="font-medium text-gray-800 hover:text-brand-600 text-sm line-clamp-1">{ad.title}</Link>
                  <div className="text-xs text-gray-400 flex items-center gap-2">
                    <Link href={`/u/${ad.userId?._id}`} target="_blank" className="text-brand-600">{ad.userId?.name}</Link>
                    <button
                      onClick={() => {
                        const nextFilters = { ...adFilters, userId: ad.userId?._id || '' };
                        setAdFilters(nextFilters);
                        fetchAllAds(nextFilters);
                      }}
                      className="text-gray-500"
                    >
                      (آگهی‌های این کاربر)
                    </button>
                    <span>• {ad.city}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[ad.status] || ''}`}>{STATUS_LABELS[ad.status]}</span>
                  {isFeaturedActive(ad) ? (
                    <>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-orange-50 text-orange-600">
                        ویژه تا {ad.featuredUntil ? new Date(ad.featuredUntil).toLocaleDateString('fa-IR') : 'نامحدود'}
                      </span>
                      <button onClick={() => removeFeatured(ad._id)} className="p-1.5 rounded-lg bg-red-50 text-red-500 transition-colors">
                        <Star size={14} fill="currentColor" />
                      </button>
                    </>
                  ) : (
                    <>
                      <select
                        value={featureDurations[ad._id] || 7}
                        onChange={(e) => setFeatureDurations((prev) => ({ ...prev, [ad._id]: Number(e.target.value) }))}
                        className="border border-gray-200 rounded-lg px-2 py-1 text-xs"
                      >
                        <option value={1}>۱ روز</option>
                        <option value={7}>۷ روز</option>
                        <option value={30}>۳۰ روز</option>
                      </select>
                      <button
                        onClick={() => setFeaturedForDays(ad._id, featureDurations[ad._id] || 7)}
                        className="inline-flex items-center gap-1 bg-orange-500 text-white px-2 py-1 rounded-lg text-xs"
                      >
                        <Star size={12} />
                        ویژه کن
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="grid md:grid-cols-4 gap-3">
                <input
                  value={userFilters.q}
                  onChange={(e) => setUserFilters((prev) => ({ ...prev, q: e.target.value }))}
                  placeholder="جستجو نام یا ایمیل"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
                <select
                  value={userFilters.role}
                  onChange={(e) => setUserFilters((prev) => ({ ...prev, role: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="all">همه نقش‌ها</option>
                  <option value="user">کاربر</option>
                  <option value="editor">نویسنده</option>
                  <option value="admin">ادمین</option>
                </select>
                <select
                  value={userFilters.status}
                  onChange={(e) => setUserFilters((prev) => ({ ...prev, status: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="active">فعال</option>
                  <option value="inactive">غیرفعال</option>
                </select>
                <select
                  value={userFilters.identity}
                  onChange={(e) => setUserFilters((prev) => ({ ...prev, identity: e.target.value }))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                >
                  <option value="all">احراز هویت: همه</option>
                  <option value="none">بدون درخواست</option>
                  <option value="pending">در انتظار</option>
                  <option value="verified">احراز شده</option>
                  <option value="rejected">رد شده</option>
                </select>
              </div>
            </div>
            {users.filter((u: any) => {
              const q = userFilters.q.trim().toLowerCase();
              if (q && !(`${u.name || ''} ${u.email || ''}`.toLowerCase().includes(q))) return false;
              if (userFilters.role !== 'all' && u.role !== userFilters.role) return false;
              if (userFilters.status !== 'all') {
                if (userFilters.status === 'active' && !u.isActive) return false;
                if (userFilters.status === 'inactive' && u.isActive) return false;
              }
              if (userFilters.identity !== 'all' && (u.identityStatus || 'none') !== userFilters.identity) return false;
              return true;
            }).map((u: any) => (
              <div key={u._id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{u.name || '-'}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                  {u.phone && <p className="text-xs text-gray-500 mt-1">شماره: {u.phone}</p>}
                  <div className="text-xs text-gray-400 mt-1 flex gap-3">
                    <span>آگهی‌ها: {u.adsCount}</span>
                    <span>ثبت‌نام: {new Date(u.createdAt).toLocaleDateString('fa-IR')}</span>
                    <span>{u.role === 'admin' ? 'ادمین' : u.role === 'editor' ? 'نویسنده' : 'کاربر'}</span>
                    <span>احراز: {u.identityStatus || 'none'}</span>
                  </div>
                  <div className="mt-2">
                    <Link href={`/u/${u._id}`} target="_blank" className="text-xs text-brand-600">مشاهده صفحه کاربر</Link>
                    <span className="text-xs text-gray-300 mx-2">|</span>
                    <Link href={`/admin/users/${u._id}`} className="text-xs text-indigo-600">مدیریت کاربر</Link>
                  </div>
                  <div className="mt-3 grid md:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-xl border border-gray-100 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span>کد فیسکاله</span>
                        <span className="text-gray-400">{u.fiscalCodeStatus || 'none'}</span>
                      </div>
                      <p className="text-gray-600 break-all">{u.fiscalCode || 'ثبت نشده'}</p>
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateUserIdentityDocStatus(u._id, 'fiscalCodeStatus', 'approved')} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">تأیید</button>
                        <button onClick={() => updateUserIdentityDocStatus(u._id, 'fiscalCodeStatus', 'rejected')} className="px-2 py-1 rounded-lg bg-red-50 text-red-600">رد</button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span>پاسپورت</span>
                        <span className="text-gray-400">{u.passportStatus || 'none'}</span>
                      </div>
                      {u.passportImage ? (
                        <a href={u.passportImage} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-100">
                          <img src={u.passportImage} alt="passport" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <p className="text-gray-500">ثبت نشده</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateUserIdentityDocStatus(u._id, 'passportStatus', 'approved')} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">تأیید</button>
                        <button onClick={() => updateUserIdentityDocStatus(u._id, 'passportStatus', 'rejected')} className="px-2 py-1 rounded-lg bg-red-50 text-red-600">رد</button>
                      </div>
                    </div>
                    <div className="rounded-xl border border-gray-100 p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span>سلفی</span>
                        <span className="text-gray-400">{u.selfieStatus || 'none'}</span>
                      </div>
                      {u.selfieImage ? (
                        <a href={u.selfieImage} target="_blank" rel="noreferrer" className="block w-16 h-16 rounded-lg overflow-hidden border border-gray-100">
                          <img src={u.selfieImage} alt="selfie" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <p className="text-gray-500">ثبت نشده</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => updateUserIdentityDocStatus(u._id, 'selfieStatus', 'approved')} className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-600">تأیید</button>
                        <button onClick={() => updateUserIdentityDocStatus(u._id, 'selfieStatus', 'rejected')} className="px-2 py-1 rounded-lg bg-red-50 text-red-600">رد</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700">
                    <ShieldCheck size={13} />
                    <select
                      value={u.role}
                      onChange={(e) => updateUserRole(u._id, e.target.value as any)}
                      className="bg-transparent text-xs outline-none"
                    >
                      <option value="user">کاربر</option>
                      <option value="editor">نویسنده</option>
                      <option value="admin">ادمین</option>
                    </select>
                  </div>
                  <button
                    onClick={() => updateUserIdentityStatus(u._id, u.identityStatus === 'verified' ? 'pending' : 'verified')}
                    className={`px-3 py-2 rounded-xl text-xs font-medium ${u.identityStatus === 'verified' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-600'}`}
                  >
                    {u.identityStatus === 'verified' ? 'لغو احراز' : 'احراز کن'}
                  </button>
                  <button
                    onClick={() => toggleUserActive(u._id, u.isActive)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium ${u.isActive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
                  >
                    {u.isActive ? 'غیرفعال کن' : 'فعال کن'}
                  </button>
                </div>
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
                <select value={bannerForm.placement} onChange={(e) => setBannerForm((p) => ({ ...p, placement: e.target.value, categoryId: '' }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  <option value="home">نمایش در صفحه اصلی</option>
                  <option value="category">نمایش در دسته‌بندی خاص</option>
                </select>
                {bannerForm.placement === 'category' && (
                  <select value={bannerForm.categoryId} onChange={(e) => setBannerForm((p) => ({ ...p, categoryId: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                    <option value="">انتخاب دسته‌بندی</option>
                    {CATEGORIES.map((cat) => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                  </select>
                )}
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
                {bannerForm.imageUrl && <span className="text-xs text-emerald-600">تصویر آماده است</span>}
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
                    <p className="text-xs text-gray-500 mt-1">
                      {b.placement === 'category'
                        ? `محل نمایش: دسته ${CATEGORIES.find((c) => c.id === b.categoryId)?.label || b.categoryId}`
                        : 'محل نمایش: صفحه اصلی'}
                    </p>
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

            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">عکس شهرهای مسکن</h3>
              <p className="text-xs text-gray-500 mb-3">این عکس‌ها در هدر جستجوی دسته «مسکن و ملک» برای شهر انتخابی نمایش داده می‌شوند.</p>

              <div className="grid md:grid-cols-3 gap-3">
                <select value={cityImageForm.city} onChange={(e) => setCityImageForm((p) => ({ ...p, city: e.target.value }))} className="border border-gray-200 rounded-xl px-3 py-2 text-sm">
                  {CITIES.map((city) => <option key={city.value} value={city.value}>{city.label}</option>)}
                </select>
                <input value={cityImageForm.title} onChange={(e) => setCityImageForm((p) => ({ ...p, title: e.target.value }))} placeholder="عنوان (اختیاری)" className="border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer text-sm">
                  <ImagePlus size={16} />
                  {cityImageUploading ? 'در حال آپلود...' : 'آپلود عکس شهر'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleCityImageUpload} disabled={cityImageUploading} />
                </label>
              </div>
              <div className="mt-3 flex items-center gap-3">
                {cityImageForm.imageUrl && <span className="text-xs text-emerald-600">تصویر شهر آماده است</span>}
                <button onClick={saveCityImage} disabled={cityImageSubmitting} className="ms-auto bg-brand-500 text-white px-4 py-2 rounded-xl text-sm">
                  ذخیره عکس شهر
                </button>
              </div>

              <div className="space-y-3 mt-4">
                {housingCityImages.map((item: any) => (
                  <div key={item._id} className="bg-gray-50 rounded-xl border border-gray-100 p-3 flex items-center gap-3">
                    <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <Image src={item.imageUrl} alt={item.title || item.city} width={80} height={48} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">{CITIES.find((c) => c.value === item.city)?.label || item.city}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.title || 'بدون عنوان'}</p>
                    </div>
                    <button onClick={() => toggleCityImageActive(item._id, item.isActive)} className={`px-3 py-1.5 rounded-lg text-xs ${item.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.isActive ? 'فعال' : 'غیرفعال'}
                    </button>
                    <button onClick={() => deleteCityImage(item._id)} className="p-2 rounded-lg bg-red-50 text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-3">
            {reports.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">گزارشی ثبت نشده است.</div>
            ) : (
              reports.map((r: any) => (
                <div key={r._id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-semibold text-gray-800">گزارش آگهی: {r.adId?.title || '---'}</div>
                    <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-yellow-50 text-yellow-600'}`}>
                      {r.status === 'resolved' ? 'بسته شده' : 'باز'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">شهر: {getCityLabel(r.adId?.city || '')}</p>
                  <p className="text-sm text-gray-700 mb-3 whitespace-pre-line">{r.message}</p>
                  {r.images?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {r.images.map((img: string) => (
                        <a key={img} href={img} target="_blank" rel="noreferrer" className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="report" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>گزارش‌دهنده: {r.reporterId?.name || 'کاربر ناشناس'}</span>
                    <span>{new Date(r.createdAt).toLocaleDateString('fa-IR')}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => resolveReport(r._id, r.status === 'resolved' ? 'open' : 'resolved')}
                      className="px-3 py-2 rounded-xl text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {r.status === 'resolved' ? 'باز کردن گزارش' : 'بستن گزارش'}
                    </button>
                    {r.adId?._id && (
                      <Link href={`/ads/${r.adId._id}`} className="px-3 py-2 rounded-xl text-xs font-medium bg-brand-500 text-white">
                        مشاهده آگهی
                      </Link>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-100 p-4">
              <h3 className="font-semibold text-gray-800 mb-3">تنظیمات تلگرام</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <input
                  value={settings?.telegramToken || ''}
                  onChange={(e) => setSettings((prev) => ({ ...(prev || DEFAULT_SETTINGS), telegramToken: e.target.value }))}
                  placeholder="توکن ربات تلگرام"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  value={settings?.telegramChatId || ''}
                  onChange={(e) => setSettings((prev) => ({ ...(prev || DEFAULT_SETTINGS), telegramChatId: e.target.value }))}
                  placeholder="Telegram User ID / Chat ID ادمین"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
                <input
                  value={settings?.siteUrl || ''}
                  onChange={(e) => setSettings((prev) => ({ ...(prev || DEFAULT_SETTINGS), siteUrl: e.target.value }))}
                  placeholder="آدرس سایت (مثلاً https://bazaarinowork.vercel.app)"
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm md:col-span-2"
                />
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">رنگ اصلی سایت</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings?.brandPrimary || '#f97316'}
                      onChange={(e) => setSettings((prev) => ({ ...(prev || DEFAULT_SETTINGS), brandPrimary: e.target.value }))}
                      className="h-10 w-14 border border-gray-200 rounded-lg bg-white p-1 cursor-pointer"
                    />
                    <input
                      value={settings?.brandPrimary || '#f97316'}
                      onChange={(e) => setSettings((prev) => ({ ...(prev || DEFAULT_SETTINGS), brandPrimary: e.target.value }))}
                      placeholder="#f97316"
                      className="border border-gray-200 rounded-xl px-3 py-2 text-sm flex-1 ltr text-left"
                    />
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <button onClick={saveSettings} disabled={settingsSaving} className="bg-brand-500 text-white px-4 py-2 rounded-xl text-sm">
                  ذخیره تنظیمات
                </button>
                <button onClick={setWebhook} disabled={webhookSaving} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm">
                  ثبت وبهوک تلگرام
                </button>
                {settings?.telegramSecret && (
                  <span className="text-xs text-gray-400">Secret: {settings.telegramSecret}</span>
                )}
              </div>
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
