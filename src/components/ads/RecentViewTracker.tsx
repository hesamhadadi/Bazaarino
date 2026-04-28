'use client';

import { useEffect } from 'react';
import { pushRecentView } from '@/lib/recent-views';

interface Props {
  ad: {
    id: string;
    title: string;
    price?: number;
    priceType?: string;
    city?: string;
    category?: string;
    image?: string;
  };
}

/**
 * Side-effect-only client component. Mounted on the ad detail page so that
 * opening an ad records it in localStorage history, which the home page's
 * RecentlyViewedStrip then reads. Renders nothing.
 */
export default function RecentViewTracker({ ad }: Props) {
  useEffect(() => {
    if (!ad.id) return;
    pushRecentView(ad);
  }, [ad.id]);

  return null;
}
