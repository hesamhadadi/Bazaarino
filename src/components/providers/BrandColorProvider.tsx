'use client';

import { useEffect } from 'react';
import { applyBrandPaletteToDocument, DEFAULT_BRAND_PRIMARY, normalizeBrandPrimary } from '@/lib/brand-color';

const STORAGE_KEY = 'bazaarino.brandPrimary';
const STORAGE_TIME_KEY = 'bazaarino.brandPrimaryUpdatedAt';

export default function BrandColorProvider() {
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    const cachedTime = Number(localStorage.getItem(STORAGE_TIME_KEY) || 0);
    const hasCachedColor = Boolean(cached);
    const cachedColor = normalizeBrandPrimary(cached || DEFAULT_BRAND_PRIMARY);
    applyBrandPaletteToDocument(cachedColor);

    fetch(`/api/settings?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const serverColor = normalizeBrandPrimary(data?.settings?.brandPrimary || DEFAULT_BRAND_PRIMARY);
        const serverTime = data?.settings?.updatedAt ? new Date(data.settings.updatedAt).getTime() : 0;
        const shouldPreserveCachedColor =
          data?.fallback && hasCachedColor && cachedColor !== DEFAULT_BRAND_PRIMARY && serverColor === DEFAULT_BRAND_PRIMARY;
        const shouldPreserveNewerLocalColor =
          hasCachedColor && cachedTime > 0 && serverTime > 0 && cachedTime > serverTime;
        if (shouldPreserveCachedColor || shouldPreserveNewerLocalColor) return;
        applyBrandPaletteToDocument(serverColor);
        localStorage.setItem(STORAGE_KEY, serverColor);
        localStorage.setItem(STORAGE_TIME_KEY, String(serverTime || Date.now()));
      })
      .catch(() => {
        // keep cached/default color
      });
  }, []);

  return null;
}
