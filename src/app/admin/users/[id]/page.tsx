'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Image from 'next/image';
import { ShieldCheck, UserCheck, UserX, Star, KeyRound, Award, X, Sparkles } from 'lucide-react';

interface BadgeMeta {
  _id: string;
  slug: string;
  label: string;
  description?: string;
  color?: string;
  gradient?: string;
  tier?: string;
  sortOrder?: number;
}

export default function AdminUserPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const userId = String(params?.id || '');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [ads, setAds] = useState<any[]>([]);
  const [resetLink, setResetLink] = useState('');
  const [allBadges, setAllBadges] = useState<BadgeMeta[]>([]);
  const [badgeBusy, setBadgeBusy] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (status === 'authenticated' && session?.user?.role !== 'admin') router.push('/');
  }, [status, session, router]);

  const fetchUser = async () => {
    const res = await fetch(`/api/admin/users/${userId}`);
    const data = await res.json();
    if (res.ok) {
      setUser(data.user);
      setAds(data.ads || []);
    }
  };

  const fetchBadgeCatalog = async () => {
    const res = await fetch('/api/admin/badges');
    if (res.ok) {
      const data = await res.json();
      setAllBadges(data.badges || []);
    }
  };

  useEffect(() => {
    fetchBadgeCatalog();
  }, []);

  const assignBadge = async (slug: string) => {
    setBadgeBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) throw new Error();
      toast.success('بج اضافه شد');
      fetchUser();
    } catch {
      toast.error('خطا در اضافه کردن بج');
    } finally {
      setBadgeBusy(false);
    }
  };

  const removeBadge = async (slug: string) => {
    setBadgeBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/badges?slug=${encodeURIComponent(slug)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      toast.success('بج حذف شد');
      fetchUser();
    } catch {
      toast.error('خطا در حذف بج');
    } finally {
      setBadgeBusy(false);
    }
  };

  const setAllBadgesForUser = async (slugs: string[]) => {
    setBadgeBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/badges`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slugs }),
      });
      if (!res.ok) throw new Error();
      toast.success('بج‌ها به‌روزرسانی شدند');
      fetchUser();
    } catch {
      toast.error('خطا در به‌روزرسانی بج‌ها');
    } finally {
      setBadgeBusy(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchUser().finally(() => setLoading(false));
    }
  }, [userId]);

  const updateUser = async (payload: any, message = 'بروزرسانی شد') => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...payload }),
    });
    if (res.ok) {
      toast.success(message);
      fetchUser();
    } else {
      toast.error('بروزرسانی ناموفق بود');
    }
  };

  const generateResetLink = async () => {
    const res = await fetch('/api/admin/users/reset-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const data = await res.json();
    if (res.ok && data.resetUrl) {
      setResetLink(data.resetUrl);
      toast.success('لینک ریست ساخته شد');
    } else {
      toast.error(data.message || 'خطا در ساخت لینک');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-800">مدیریت کاربر</h1>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin" className="text-sm text-gray-500">بازگشت به پنل</Link>
            <Link href={`/u/${user._id}`} target="_blank" className="text-sm text-brand-600">صفحه عمومی کاربر</Link>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 grid md:grid-cols-[1.2fr_1fr] gap-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden">
              <Image src={user.avatar || '/default-avatar.svg'} alt="avatar" width={64} height={64} className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user.name || '-'}</p>
              <p className="text-xs text-gray-500">ثبت‌نام: {new Date(user.createdAt).toLocaleDateString('fa-IR')}</p>
              {user.phone && <p className="text-xs text-gray-500 mt-1">شماره: {user.phone}</p>}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-indigo-50 text-indigo-700">
              <ShieldCheck size={13} />
              <select
                value={user.role}
                onChange={(e) => updateUser({ role: e.target.value }, 'نقش بروزرسانی شد')}
                className="bg-transparent text-xs outline-none"
              >
                <option value="user">کاربر</option>
                <option value="editor">نویسنده</option>
                <option value="admin">ادمین</option>
              </select>
            </div>
            <button
              onClick={() => updateUser({ isActive: !user.isActive }, user.isActive ? 'کاربر غیرفعال شد' : 'کاربر فعال شد')}
              className={`px-3 py-2 rounded-xl text-xs font-medium ${user.isActive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}
            >
              {user.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
              {user.isActive ? 'غیرفعال' : 'فعال'}
            </button>
            <button
              onClick={() => updateUser({ identityStatus: user.identityStatus === 'verified' ? 'pending' : 'verified' })}
              className={`px-3 py-2 rounded-xl text-xs font-medium ${user.identityStatus === 'verified' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-600'}`}
            >
              احراز هویت
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">لینک ریست پسورد</h3>
            <button onClick={generateResetLink} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-900 text-white text-xs">
              <KeyRound size={12} />
              ساخت لینک
            </button>
          </div>
          {resetLink ? (
            <div className="text-xs bg-gray-50 border border-gray-100 rounded-xl p-3 break-all">
              {resetLink}
            </div>
          ) : (
            <p className="text-xs text-gray-500">برای ساخت لینک روی دکمه بالا بزن.</p>
          )}
        </div>

        {/* Badge management */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <h3 className="font-semibold text-gray-800 inline-flex items-center gap-2">
              <Award size={16} className="text-orange-500" />
              بج‌های کاربر
              <span className="text-xs text-gray-400 font-normal">
                ({(user.badges || []).length} از {allBadges.length})
              </span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAllBadgesForUser(allBadges.map((b) => b.slug))}
                disabled={badgeBusy || allBadges.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold disabled:opacity-50 transition"
                title="اعطای تمام بج‌های کاتالوگ"
              >
                <Sparkles size={12} />
                همه بج‌ها
              </button>
              {(user.badges || []).length > 0 && (
                <button
                  onClick={() => setAllBadgesForUser([])}
                  disabled={badgeBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold disabled:opacity-50 transition"
                >
                  <X size={12} />
                  حذف همه
                </button>
              )}
              <button
                onClick={() => setPickerOpen((v) => !v)}
                disabled={badgeBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold disabled:opacity-50 transition"
              >
                <Award size={12} />
                افزودن بج
              </button>
            </div>
          </div>

          {/* Current user badges */}
          {(user.badges || []).length === 0 ? (
            <p className="text-xs text-gray-400">کاربر هنوز بجی ندارد.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(user.badges as string[]).map((slug) => {
                const meta = allBadges.find((b) => b.slug === slug);
                return (
                  <div
                    key={slug}
                    className="group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white shadow-sm"
                    style={{ background: meta?.gradient || meta?.color || '#6b7280' }}
                  >
                    <Award size={11} />
                    <span>{meta?.label || slug}</span>
                    <button
                      onClick={() => removeBadge(slug)}
                      disabled={badgeBusy}
                      className="opacity-70 group-hover:opacity-100 hover:bg-black/20 rounded-full p-0.5 transition"
                      title="حذف"
                    >
                      <X size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Picker */}
          {pickerOpen && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">بجی از کاتالوگ انتخاب کنید:</p>
              {allBadges.length === 0 ? (
                <p className="text-xs text-gray-400">
                  کاتالوگ خالی است.{' '}
                  <Link href="/admin/badges" className="text-orange-600 underline">
                    افزودن بج
                  </Link>
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {allBadges
                    .filter((b) => !(user.badges || []).includes(b.slug))
                    .map((b) => (
                      <button
                        key={b.slug}
                        onClick={() => assignBadge(b.slug)}
                        disabled={badgeBusy}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-gray-200 hover:border-gray-400 transition disabled:opacity-50"
                        style={{ color: b.color || '#374151' }}
                        title={b.description}
                      >
                        <Award size={11} />
                        {b.label}
                      </button>
                    ))}
                  {allBadges.every((b) => (user.badges || []).includes(b.slug)) && (
                    <p className="text-xs text-gray-400">کاربر تمام بج‌های کاتالوگ را دارد.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">آگهی‌های کاربر</h3>
          <div className="space-y-2">
            {ads.length === 0 && <p className="text-xs text-gray-400">آگهی‌ای ثبت نشده است.</p>}
            {ads.map((ad) => (
              <div key={ad._id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{ad.title}</p>
                  <p className="text-xs text-gray-500">{ad.city} • {new Date(ad.createdAt).toLocaleDateString('fa-IR')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{ad.status}</span>
                  {ad.isFeatured && <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600 flex items-center gap-1"><Star size={12} /> ویژه</span>}
                  <Link href={`/ads/${ad._id}`} target="_blank" className="text-xs text-brand-600">مشاهده</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
