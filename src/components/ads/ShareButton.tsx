'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  title: string;
  text?: string;
  url?: string;
  className?: string;
};

export default function ShareButton({ title, text, url, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const payload = { title, text: text || title, url: shareUrl };
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share(payload);
        return;
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('لینک کپی شد');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('کپی کردن لینک ناموفق بود');
    }
  }

  return (
    <button
      onClick={handleShare}
      type="button"
      aria-label="اشتراک‌گذاری"
      className={`w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-gray-500 hover:text-brand-600 hover:border-brand-300 transition ${className}`}
    >
      {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
    </button>
  );
}
