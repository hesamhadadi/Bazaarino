'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { CITIES } from '@/lib/constants';
import toast from 'react-hot-toast';
import { ImagePlus, Trash2 } from 'lucide-react';

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
            <select
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="">انتخاب شهر</option>
              {CITIES.map((city) => <option key={city.value} value={city.value}>{city.label}</option>)}
            </select>
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
