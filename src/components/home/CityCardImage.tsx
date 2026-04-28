'use client';

import { useState } from 'react';

/**
 * Tiny client component that swallows broken-image errors so a 404 from
 * the upstream CDN (Unsplash photo IDs occasionally rotate) never leaves
 * a broken-image icon on the home grid — the gradient underneath simply
 * shows through.
 */
export default function CityCardImage({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const [ok, setOk] = useState(true);
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      onError={() => setOk(false)}
      className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-110 group-hover:opacity-70 transition-all duration-700"
    />
  );
}
