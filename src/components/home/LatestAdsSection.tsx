'use client';

import { useEffect, useState } from 'react';
import AdCard from '@/components/ads/AdCard';

type LatestAdsSectionProps = {
  initialAds: any[];
};

export default function LatestAdsSection({ initialAds }: LatestAdsSectionProps) {
  const [ads, setAds] = useState<any[]>(initialAds || []);
  const [loading, setLoading] = useState(!initialAds || initialAds.length === 0);
  const [error, setError] = useState<string | null>(null);

  const load = async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ads?limit=12');
      if (!res.ok) throw new Error('request_failed');
      const data = await res.json();
      setAds(data.ads || []);
    } catch {
      setError('خطا در دریافت آگهی‌ها');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load(!!initialAds && initialAds.length > 0);
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm text-gray-500 mb-4">در حال بارگذاری آگهی‌ها...</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch auto-rows-fr">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-100 overflow-hidden bg-gray-50 animate-pulse">
              <div className="aspect-[4/3] bg-gray-200"></div>
              <div className="p-3 space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm text-gray-500 mb-3">{error}</p>
        <button onClick={load} className="text-sm text-brand-600">تلاش دوباره</button>
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm text-gray-500 mb-2">فعلاً آگهی‌ای ثبت نشده است.</p>
        <button onClick={load} className="text-sm text-brand-600">تلاش دوباره</button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch auto-rows-fr">
      {ads.map((ad: any) => (
        <AdCard key={ad._id} ad={ad} />
      ))}
    </div>
  );
}
