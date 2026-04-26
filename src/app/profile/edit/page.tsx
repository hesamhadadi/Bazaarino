'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { CITIES } from '@/lib/constants';
import toast from 'react-hot-toast';
import type { LucideIcon } from 'lucide-react';
import { ImagePlus, Trash2, Instagram, Twitter, Linkedin, Github, Youtube, Globe, Facebook } from 'lucide-react';

export default function EditProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    city: '',
    avatar: '',
    telegram: '',
    bio: '',
    banner: '',
    socialLinks: {
      instagram: '',
      twitter: '',
      linkedin: '',
      github: '',
      youtube: '',
      website: '',
      facebook: '',
    },
    fiscalCode: '',
    passportImage: '',
    selfieImage: '',
    businessName: '',
    businessCategory: '',
    businessDescription: '',
    businessSubscriptionActive: false,
    chatEmailNotificationsEnabled: true,
  });

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;
    fetch('/api/users/profile')
      .then((res) => res.json())
      .then((data) => {
        const user = data.user || {};
        setForm({
          name: user.name || '',
          phone: user.phone || '',
          city: user.city || '',
          avatar: user.avatar || '',
          telegram: user.telegram || '',
          bio: user.bio || '',
          banner: user.banner || '',
          socialLinks: {
            instagram: user.socialLinks?.instagram || '',
            twitter: user.socialLinks?.twitter || '',
            linkedin: user.socialLinks?.linkedin || '',
            github: user.socialLinks?.github || '',
            youtube: user.socialLinks?.youtube || '',
            website: user.socialLinks?.website || '',
            facebook: user.socialLinks?.facebook || '',
          },
          fiscalCode: user.fiscalCode || '',
            passportImage: user.passportImage || '',
            selfieImage: user.selfieImage || '',
            businessName: user.businessName || '',
            businessCategory: user.businessCategory || '',
            businessDescription: user.businessDescription || '',
            businessSubscriptionActive: user.businessSubscriptionActive === true,
            chatEmailNotificationsEnabled: user.chatEmailNotificationsEnabled !== false,
          });
      })
      .catch(() => undefined);
  }, [session]);

  const uploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('images', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) {
        setForm((prev) => ({ ...prev, avatar: data.urls[0] }));
        toast.success('عکس پروفایل آپلود شد');
      } else {
        toast.error('آپلود تصویر ناموفق بود');
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('images', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) {
        setForm((prev) => ({ ...prev, banner: data.urls[0] }));
        toast.success('بنر آپلود شد');
      } else {
        toast.error('آپلود بنر ناموفق بود');
      }
    } finally {
      setUploading(false);
    }
  };

  const uploadIdentityImage = async (e: React.ChangeEvent<HTMLInputElement>, key: 'passportImage' | 'selfieImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('images', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.urls?.[0]) {
        setForm((prev) => ({ ...prev, [key]: data.urls[0] }));
        toast.success('مدرک آپلود شد');
      } else {
        toast.error('آپلود مدرک ناموفق بود');
      }
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSubmitting(true);
    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setSubmitting(false);
    if (res.ok) {
      toast.success('پروفایل ذخیره شد');
      await update({ name: form.name, image: form.avatar || null });
      router.push('/profile');
    } else {
      toast.error('ذخیره پروفایل ناموفق بود');
    }
  };

  if (status === 'loading') return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" /></div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h1 className="text-lg font-bold text-gray-800 mb-4">ویرایش پروفایل</h1>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100">
              <Image src={form.avatar || '/default-avatar.svg'} alt="avatar" width={80} height={80} className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer text-sm">
                <ImagePlus size={14} />
                {uploading ? 'در حال آپلود...' : 'تغییر عکس'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
              </label>
              <button
                onClick={() => setForm((prev) => ({ ...prev, avatar: '' }))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm"
              >
                <Trash2 size={14} />
                حذف عکس
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm text-gray-600 mb-2">بنر صفحه شخصی</label>
            <div className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 h-28 flex items-center justify-center">
              {form.banner ? (
                <Image src={form.banner} alt="banner" width={600} height={200} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400">بنر اضافه نشده</span>
              )}
            </div>
            <div className="flex gap-2 mt-2">
              <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 cursor-pointer text-sm">
                <ImagePlus size={14} />
                {uploading ? 'در حال آپلود...' : 'آپلود بنر'}
                <input type="file" accept="image/*" className="hidden" onChange={uploadBanner} disabled={uploading} />
              </label>
              <button
                onClick={() => setForm((prev) => ({ ...prev, banner: '' }))}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-sm"
              >
                <Trash2 size={14} />
                حذف بنر
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="نام"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="شماره تماس"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <input
              value={form.telegram}
              onChange={(e) => setForm((prev) => ({ ...prev, telegram: e.target.value }))}
              placeholder="آیدی تلگرام (بدون @)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            />
            <textarea
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="درباره خودت بنویس (تا ۱۰۰۰ کاراکتر) — اگه نویسنده‌ای، این تو صفحه مقالاتت نشون داده می‌شه."
              maxLength={1000}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-28 resize-y"
            />
            <div className="text-[11px] text-gray-400 -mt-2 text-left">
              {form.bio.length} / 1000
            </div>
            <select
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">انتخاب شهر</option>
              {CITIES.map((city) => <option key={city.value} value={city.value}>{city.label}</option>)}
            </select>
          </div>

          {/* Social links */}
          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">شبکه‌های اجتماعی</h3>
            <p className="text-xs text-gray-500 mb-3">لینک کامل یا آیدی بدون @ — تو صفحه پروفایل و صفحه مقالاتت نشون داده می‌شن.</p>
            <div className="space-y-2.5 mb-1">
              <SocialField
                Icon={Instagram}
                color="text-pink-500"
                placeholder="آیدی اینستاگرام یا لینک کامل"
                value={form.socialLinks.instagram}
                onChange={(v) => setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: v } }))}
              />
              <SocialField
                Icon={Twitter}
                color="text-sky-500"
                placeholder="آیدی توییتر / X یا لینک کامل"
                value={form.socialLinks.twitter}
                onChange={(v) => setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, twitter: v } }))}
              />
              <SocialField
                Icon={Linkedin}
                color="text-blue-700"
                placeholder="لینک لینکدین (mehr-i / company / ...)"
                value={form.socialLinks.linkedin}
                onChange={(v) => setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: v } }))}
              />
              <SocialField
                Icon={Github}
                color="text-gray-800"
                placeholder="آیدی گیت‌هاب"
                value={form.socialLinks.github}
                onChange={(v) => setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, github: v } }))}
              />
              <SocialField
                Icon={Youtube}
                color="text-red-600"
                placeholder="لینک کانال یوتیوب"
                value={form.socialLinks.youtube}
                onChange={(v) => setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: v } }))}
              />
              <SocialField
                Icon={Facebook}
                color="text-blue-600"
                placeholder="لینک فیسبوک"
                value={form.socialLinks.facebook}
                onChange={(v) => setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: v } }))}
              />
              <SocialField
                Icon={Globe}
                color="text-emerald-600"
                placeholder="وب‌سایت شخصی (https://...)"
                value={form.socialLinks.website}
                onChange={(v) => setForm((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, website: v } }))}
              />
            </div>
          </div>

          <div className="mt-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">پروفایل بیزینس</h3>
            <p className="text-xs text-gray-500 mb-3">اگر بیزینس (مثل سوپرمارکت، صرافی یا وکیل مهاجرت) دارید، اطلاعات فروشگاه را ثبت کنید.</p>
            <div className="space-y-3 mb-4">
              <input
                value={form.businessName}
                onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                placeholder="نام بیزینس"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <input
                value={form.businessCategory}
                onChange={(e) => setForm((prev) => ({ ...prev, businessCategory: e.target.value }))}
                placeholder="دسته (مثلاً سوپرمارکت ایرانی)"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <textarea
                value={form.businessDescription}
                onChange={(e) => setForm((prev) => ({ ...prev, businessDescription: e.target.value }))}
                placeholder="توضیح کوتاه درباره خدمات بیزینس"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-20 resize-none"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.businessSubscriptionActive}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessSubscriptionActive: e.target.checked }))}
                  className="accent-brand-500"
                />
                اشتراک بیزینس من فعال است
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.chatEmailNotificationsEnabled}
                  onChange={(e) => setForm((prev) => ({ ...prev, chatEmailNotificationsEnabled: e.target.checked }))}
                  className="accent-brand-500"
                />
                اعلان ایمیلی پیام‌های خوانده‌نشده فعال باشد
              </label>
            </div>

            <h3 className="text-sm font-semibold text-gray-700 mb-2">احراز هویت</h3>
            <p className="text-xs text-gray-500 mb-3">هر مورد را جداگانه تکمیل کن تا برای بررسی ارسال شود.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 mb-1">کدچه فیسکاله</label>
                <input
                  value={form.fiscalCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, fiscalCode: e.target.value }))}
                  placeholder="Codice Fiscale"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-gray-100 p-2">
                  <p className="text-xs text-gray-600 mb-2">عکس پاسپورت</p>
                  <div className="w-full h-24 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                    {form.passportImage ? (
                      <Image src={form.passportImage} alt="passport" width={240} height={120} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">آپلود نشده</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <label className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 cursor-pointer text-xs">
                      <ImagePlus size={12} />
                      آپلود
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadIdentityImage(e, 'passportImage')} disabled={uploading} />
                    </label>
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, passportImage: '' }))}
                      className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs"
                    >
                      <Trash2 size={12} />
                      حذف
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-100 p-2">
                  <p className="text-xs text-gray-600 mb-2">عکس کاربر (سلفی)</p>
                  <div className="w-full h-24 rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                    {form.selfieImage ? (
                      <Image src={form.selfieImage} alt="selfie" width={240} height={120} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400">آپلود نشده</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <label className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-gray-200 cursor-pointer text-xs">
                      <ImagePlus size={12} />
                      آپلود
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => uploadIdentityImage(e, 'selfieImage')} disabled={uploading} />
                    </label>
                    <button
                      onClick={() => setForm((prev) => ({ ...prev, selfieImage: '' }))}
                      className="inline-flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs"
                    >
                      <Trash2 size={12} />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button onClick={save} disabled={submitting} className="w-full mt-4 bg-brand-500 text-white py-2.5 rounded-xl text-sm font-semibold">
            {submitting ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

/* Inline reusable social input row, kept colocated to avoid creating yet another
   tiny file just for one-shot UI. */
function SocialField({
  Icon,
  color,
  placeholder,
  value,
  onChange,
}: {
  Icon: LucideIcon;
  color: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="relative">
      <Icon size={15} className={`absolute right-3 top-1/2 -translate-y-1/2 ${color}`} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-sm focus:border-brand-300 focus:outline-none"
      />
    </div>
  );
}
