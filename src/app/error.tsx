'use client';

import { useEffect } from 'react';
import { RefreshCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-3">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">خطایی رخ داد</h1>
        <p className="text-sm text-gray-500 mb-6 leading-7">
          متأسفیم، اتفاقی غیرمنتظره افتاد. می‌توانید مجدد تلاش کنید یا به خانه برگردید.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600"
          >
            <RefreshCcw size={16} /> تلاش مجدد
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            <Home size={16} /> خانه
          </Link>
        </div>
      </div>
    </div>
  );
}
