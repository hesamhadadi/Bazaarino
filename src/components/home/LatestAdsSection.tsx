'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import AdCard from '@/components/ads/AdCard';

type LatestAdsSectionProps = {
  initialAds: HomeAd[];
};

const PAGE_LIMIT = 12;

type HomeAd = {
  _id: string;
  [key: string]: unknown;
};

export default function LatestAdsSection({ initialAds }: LatestAdsSectionProps) {
  const [ads, setAds] = useState<HomeAd[]>(initialAds || []);
  const [loading, setLoading] = useState(!initialAds || initialAds.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState((initialAds || []).length === PAGE_LIMIT);
  const [nextPage, setNextPage] = useState((initialAds || []).length > 0 ? 2 : 1);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);
  const initializedRef = useRef(false);

  const load = useCallback(async (page: number, append: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ads?page=${page}&limit=${PAGE_LIMIT}`);
      if (!res.ok) throw new Error('request_failed');
      const data = await res.json();
      const incomingAds = data.ads || [];
      const totalPagesRaw = data?.pagination?.totalPages;
      const totalPages = Number(totalPagesRaw);
      const hasTotalPages = Number.isFinite(totalPages) && totalPages > 0;

      setAds((prev) => {
        if (!append) return incomingAds;
        const seen = new Set(prev.map((ad) => String(ad._id)));
        const uniqueIncoming = incomingAds.filter((ad: HomeAd) => !seen.has(String(ad._id)));
        return [...prev, ...uniqueIncoming];
      });

      setHasMore(hasTotalPages ? page < totalPages : false);
      setNextPage(page + 1);
    } catch {
      setError('خطا در دریافت آگهی‌ها');
    } finally {
      if (append) setLoadingMore(false);
      else setLoading(false);
      fetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    if (!initialAds || initialAds.length === 0) {
      load(1, false);
      return;
    }
    setHasMore(initialAds.length === PAGE_LIMIT);
    setNextPage(2);
  }, [initialAds, load]);

  useEffect(() => {
    if (!loadMoreRef.current || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        load(nextPage, true);
      },
      { rootMargin: '300px 0px' }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, load, loading, loadingMore, nextPage]);

  const retry = () => {
    if (ads.length > 0) load(nextPage, true);
    else load(1, false);
  };

  const showInitialLoading = loading && ads.length === 0;

  if (showInitialLoading) {
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

  if (error && ads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm text-gray-500 mb-3">{error}</p>
        <button onClick={retry} className="text-sm text-brand-600">تلاش دوباره</button>
      </div>
    );
  }

  if (!ads || ads.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <p className="text-sm text-gray-500 mb-2">فعلاً آگهی‌ای ثبت نشده است.</p>
        <button onClick={retry} className="text-sm text-brand-600">تلاش دوباره</button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch auto-rows-fr">
        {ads.map((ad) => (
          <AdCard key={ad._id} ad={ad} />
        ))}
      </div>

      {error && ads.length > 0 && (
        <div className="mt-3 text-center">
          <p className="text-sm text-gray-500 mb-2">{error}</p>
          <button onClick={retry} className="text-sm text-brand-600">تلاش دوباره</button>
        </div>
      )}

      {hasMore && (
        <div ref={loadMoreRef} className="py-4 text-center">
          {loadingMore && <p className="text-sm text-gray-500">در حال بارگذاری آگهی‌های بیشتر...</p>}
        </div>
      )}
    </>
  );
}
