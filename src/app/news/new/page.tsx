'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';

export default function NewArticlePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    coverImage: '',
    tags: '',
    isHot: false,
    status: 'published',
  });

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
      return;
    }
    if (!['admin', 'editor'].includes(session.user.role)) {
      router.push('/');
    }
  }, [status, session, router]);

  if (status === 'loading') return null;
  if (!session || !['admin', 'editor'].includes(session.user.role)) return null;

  const submit = async () => {
    if (!form.title || !form.excerpt || !form.content) {
      toast.error('عنوان، خلاصه و متن الزامی است');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          excerpt: form.excerpt,
          content: form.content,
          coverImage: form.coverImage || undefined,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
          isHot: form.isHot,
          status: form.status,
        }),
      });

      if (res.ok) {
        toast.success('مقاله منتشر شد');
        router.push('/news');
      } else {
        const data = await res.json();
        toast.error(data.message || 'خطا در انتشار مقاله');
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">انتشار مقاله</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="عنوان مقاله"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
            placeholder="خلاصه کوتاه"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-24"
          />
          <textarea
            value={form.content}
            onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
            placeholder="متن کامل مقاله"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-56"
          />
          <input
            value={form.coverImage}
            onChange={(e) => setForm((p) => ({ ...p, coverImage: e.target.value }))}
            placeholder="لینک تصویر کاور (اختیاری)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <input
            value={form.tags}
            onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
            placeholder="برچسب‌ها (با کاما جدا کنید)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <div className="flex items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={form.isHot} onChange={(e) => setForm((p) => ({ ...p, isHot: e.target.checked }))} />
              خبر داغ
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm"
            >
              <option value="published">انتشار</option>
              <option value="draft">پیش‌نویس</option>
            </select>
          </div>
          <button
            onClick={submit}
            disabled={submitting}
            className="w-full bg-brand-500 hover:bg-brand-600 text-white py-3 rounded-xl font-semibold text-sm"
          >
            {submitting ? 'در حال انتشار...' : 'انتشار مقاله'}
          </button>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
