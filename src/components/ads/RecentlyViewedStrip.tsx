'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Clock, MapPin, X } from 'lucide-react';
import { getCityLabel } from '@/lib/constants';
import { formatFaNumber } from '@/lib/locale';
import {
  type RecentViewEntry,
  clearRecentViews,
  getRecentViews,
} from '@/lib/recent-views';

function formatPrice(price?: number, priceType?: string): string {
  if (priceType === 'free') return 'رایگان';
  if (priceType === 'negotiable') return 'توافقی';
  if (priceType === 'exchange') return 'معاوضه';
  if (!price) return 'توافقی';
  return `€${formatFaNumber(price)}`;
}

/**
 * Horizontal strip of the user's recently viewed ads, hydrated from
 * localStorage on mount. Renders nothing (returns null) when there's
 * no history so it doesn't take vertical space for first-time visitors.
 *
 * Listens to the custom `bazaarino:recent-views-changed` event so the
 * strip stays in sync if the user opens another ad in a different tab
 * (covers same-tab too via the explicit dispatchEvent in pushRecentView).
 */
export default function RecentlyViewedStrip() {
  const [items, setItems] = useState<RecentViewEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(getRecentViews());
    setHydrated(true);

    const onChange = () => setItems(getRecentViews());
    window.addEventListener('bazaarino:recent-views-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('bazaarino:recent-views-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  if (!hydrated || items.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl p-4 border border-gray-100">
      <header className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-800 inline-flex items-center gap-2">
          <Clock size={15} className="text-orange-500" />
          آخرین بازدیدهای شما
        </h2>
        <button
          type="button"
          onClick={() => clearRecentViews()}
          className="text-xs text-gray-400 hover:text-red-500 inline-flex items-center gap-1"
          aria-label="پاک کردن آخرین بازدیدها"
        >
          <X size={12} /> پاک کردن
        </button>
      </header>

      <div className="-mx-4 px-4 overflow-x-auto">
        <ul className="flex gap-3 pb-1 min-w-max">
          {items.map((ad) => (
            <li key={ad.id} className="w-44 flex-shrink-0">
              <Link
                href={`/ads/${ad.id}`}
                className="block rounded-xl overflow-hidden border border-gray-100 bg-white hover:border-brand-200 transition"
              >
                <div className="relative aspect-[4/3] bg-gray-50">
                  {ad.image ? (
                    <Image
                      src={ad.image}
                      alt={ad.title}
                      fill
                      sizes="180px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">
                      ⌧
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug min-h-[2.2em]">
                    {ad.title}
                  </p>
                  <p className="text-[11px] text-orange-600 font-bold mt-1">
                    {formatPrice(ad.price, ad.priceType)}
                  </p>
                  {ad.city ? (
                    <p className="text-[11px] text-gray-400 inline-flex items-center gap-1 mt-0.5">
                      <MapPin size={10} />
                      {getCityLabel(ad.city) || ad.city}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
