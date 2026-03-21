'use client';

import { useEffect } from 'react';
import { applyBrandPaletteToDocument, DEFAULT_BRAND_PRIMARY, normalizeBrandPrimary } from '@/lib/brand-color';

const STORAGE_KEY = 'bazaarino.brandPrimary';

export default function BrandColorProvider() {
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    const cachedColor = normalizeBrandPrimary(cached || DEFAULT_BRAND_PRIMARY);
    applyBrandPaletteToDocument(cachedColor);

    fetch('/api/settings', { cache: 'no-cache', headers: { 'Cache-Control': 'no-cache' } })
      .then((res) => res.json())
      .then((data) => {
        const serverColor = normalizeBrandPrimary(data?.settings?.brandPrimary || DEFAULT_BRAND_PRIMARY);
        applyBrandPaletteToDocument(serverColor);
        localStorage.setItem(STORAGE_KEY, serverColor);
      })
      .catch(() => {
        // keep cached/default color
      });
  }, []);

  return null;
}
