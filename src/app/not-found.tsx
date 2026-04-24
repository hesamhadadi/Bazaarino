import Link from 'next/link';
import { Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-7xl font-bold text-brand-500 mb-2">۴۰۴</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">صفحه یافت نشد</h1>
        <p className="text-sm text-gray-500 mb-6 leading-7">
          متأسفیم — آدرسی که وارد کردید در بازارینو وجود ندارد یا حذف شده است.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 text-white text-sm font-semibold hover:bg-brand-600"
          >
            <Home size={16} /> خانه
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
          >
            <Search size={16} /> جست‌وجو
          </Link>
        </div>
      </div>
    </div>
  );
}
