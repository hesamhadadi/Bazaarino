'use client';

import { useEffect } from 'react';
import { buildBrandPalette, DEFAULT_BRAND_PRIMARY, normalizeBrandPrimary } from '@/lib/brand-color';

const STORAGE_KEY = 'bazaarino.brandPrimary';

function applyBrand(primary: string) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const palette = buildBrandPalette(primary);
  root.style.setProperty('--brand-primary', palette.primary);
  root.style.setProperty('--brand-dark', palette.dark);
  root.style.setProperty('--brand-50-rgb', palette[50]);
  root.style.setProperty('--brand-100-rgb', palette[100]);
  root.style.setProperty('--brand-200-rgb', palette[200]);
  root.style.setProperty('--brand-300-rgb', palette[300]);
  root.style.setProperty('--brand-400-rgb', palette[400]);
  root.style.setProperty('--brand-500-rgb', palette[500]);
  root.style.setProperty('--brand-600-rgb', palette[600]);
  root.style.setProperty('--brand-700-rgb', palette[700]);
  root.style.setProperty('--brand-800-rgb', palette[800]);
  root.style.setProperty('--brand-900-rgb', palette[900]);
}

export default function BrandColorProvider() {
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    const cachedColor = normalizeBrandPrimary(cached || DEFAULT_BRAND_PRIMARY);
    applyBrand(cachedColor);

    fetch('/api/settings', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        const serverColor = normalizeBrandPrimary(data?.settings?.brandPrimary || DEFAULT_BRAND_PRIMARY);
        applyBrand(serverColor);
        localStorage.setItem(STORAGE_KEY, serverColor);
      })
      .catch(() => {
        // keep cached/default color
      });
  }, []);

  return null;
}
