'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

const STORAGE_KEY = 'bazaarino_cookie_consent_v1';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    } catch {}
  }, []);

  const accept = (value: 'all' | 'necessary') => {
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 md:p-4 pointer-events-none">
      <div className="pointer-events-auto max-w-4xl mx-auto bg-white border border-gray-200 shadow-lg rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center gap-3">
        <div className="flex-1 text-sm text-gray-700 leading-7">
          این وب‌سایت از کوکی‌ها برای بهبود تجربه شما استفاده می‌کند. با ادامه استفاده، با{' '}
          <Link href="/privacy" className="text-brand-600 font-semibold hover:underline">
            سیاست حفظ حریم خصوصی
          </Link>{' '}
          ما موافقت می‌کنید.
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => accept('necessary')}
            className="px-3 py-2 text-sm rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            فقط ضروری
          </button>
          <button
            onClick={() => accept('all')}
            className="px-4 py-2 text-sm rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold"
          >
            قبول همه
          </button>
          <button
            onClick={() => accept('necessary')}
            className="p-2 text-gray-400 hover:text-gray-700 md:hidden"
            aria-label="بستن"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
