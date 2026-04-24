'use client';

import { useState } from 'react';
import { BookmarkPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

type Props = {
  query: string;
  suggestedName?: string;
};

export default function SaveSearchButton({ query, suggestedName }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!session) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/saved-searches', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: suggestedName || 'جست‌وجوی من',
          query,
          alertEnabled: false,
        }),
      });
      if (res.status === 409) {
        toast('این جست‌وجو قبلاً ذخیره شده');
        setSaved(true);
      } else if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message || 'خطا در ذخیره‌سازی');
      } else {
        toast.success('جست‌وجو ذخیره شد');
        setSaved(true);
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSave}
      disabled={loading || saved}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-xl border border-brand-300 bg-brand-50 text-brand-700 hover:bg-brand-100 disabled:opacity-60"
      type="button"
    >
      {saved ? <Check size={14} /> : <BookmarkPlus size={14} />}
      {saved ? 'ذخیره شد' : 'ذخیره این جست‌وجو'}
    </button>
  );
}
