'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface BannerCarouselItem {
  _id: string;
  title?: string;
  description?: string;
  imageUrl: string;
  imageUrlMobile?: string;
  linkUrl?: string;
  priority: number;
}

interface Props {
  banners: BannerCarouselItem[];
  /** Tailwind aspect-ratio classes for the slot (hero/wide/square). */
  aspectClass: string;
  /** Auto-rotation interval in ms. 0 disables auto-play. */
  intervalMs?: number;
}

/**
 * Banner carousel for the homepage. Rotates through every active banner
 * (sorted by priority desc on the server) so a newly-added banner doesn't
 * replace older ones — they all get airtime, weighted by display order.
 *
 * UX:
 *  - single banner → renders statically, no controls
 *  - multiple → auto-advances every `intervalMs`, pauses on hover, exposes
 *    arrow buttons (desktop), tappable dots and swipe gestures (mobile)
 *
 * The carousel internals run in LTR direction for predictable translate
 * math; slide content inherits the page's RTL flow so text, gradients
 * and overlays still read right-to-left.
 */
export default function HomeBannerCarousel({
  banners,
  aspectClass,
  intervalMs = 6500,
}: Props) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = banners.length;
  const touchStartX = useRef<number | null>(null);

  // Auto-advance loop. Resetting on `idx` change gives manual interactions
  // the full interval before the next auto-rotation kicks in.
  useEffect(() => {
    if (total <= 1 || paused || intervalMs <= 0) return;
    const t = setTimeout(() => setIdx((i) => (i + 1) % total), intervalMs);
    return () => clearTimeout(t);
  }, [idx, paused, intervalMs, total]);

  if (total === 0) return null;

  const go = (n: number) => setIdx(((n % total) + total) % total);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      // RTL feel: swiping right (positive dx) goes "back" to previous.
      go(dx > 0 ? idx - 1 : idx + 1);
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={`relative overflow-hidden rounded-3xl shadow-sm ring-1 ring-gray-100 ${aspectClass} bg-gradient-to-br from-gray-100 to-gray-200`}
      >
        {/* LTR track: each slide is 100% wide, track translates by -idx*100%. */}
        <div
          dir="ltr"
          className="absolute inset-0 flex transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${idx * 100}%)` }}
        >
          {banners.map((b) => (
            <div key={b._id} className="relative flex-shrink-0 w-full h-full">
              <Slide banner={b} />
            </div>
          ))}
        </div>

        {/* "تبلیغ" pill stays anchored, not part of the moving track. */}
        <span className="absolute top-2 left-2 z-10 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white/90 uppercase tracking-wider">
          تبلیغ
        </span>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(idx - 1)}
              aria-label="بنر قبلی"
              className="hidden md:flex absolute top-1/2 right-3 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow items-center justify-center transition z-10"
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              onClick={() => go(idx + 1)}
              aria-label="بنر بعدی"
              className="hidden md:flex absolute top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-gray-800 shadow items-center justify-center transition z-10"
            >
              <ChevronLeft size={18} />
            </button>
          </>
        )}
      </div>

      {/* Dot pagination beneath the banner so it never overlaps content. */}
      {total > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => go(i)}
              aria-label={`بنر ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === idx
                  ? 'w-6 bg-orange-500'
                  : 'w-1.5 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function Slide({ banner }: { banner: BannerCarouselItem }) {
  const isExternal = !!banner.linkUrl && /^https?:\/\//i.test(banner.linkUrl);

  const inner = (
    <>
      {banner.imageUrlMobile && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner.imageUrlMobile}
          alt={banner.title || 'banner'}
          loading="eager"
          decoding="async"
          className="md:hidden absolute inset-0 w-full h-full object-cover"
        />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.imageUrl}
        alt={banner.title || 'banner'}
        loading="eager"
        decoding="async"
        className={`${
          banner.imageUrlMobile ? 'hidden md:block' : ''
        } absolute inset-0 w-full h-full object-cover`}
      />
      {(banner.title || banner.description) && (
        <div
          dir="rtl"
          className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white"
        >
          {banner.title && (
            <h3 className="text-lg md:text-2xl font-black drop-shadow-md">
              {banner.title}
            </h3>
          )}
          {banner.description && (
            <p className="text-xs md:text-sm text-white/90 mt-1 line-clamp-2 max-w-2xl">
              {banner.description}
            </p>
          )}
        </div>
      )}
    </>
  );

  if (banner.linkUrl) {
    return (
      <Link
        href={banner.linkUrl}
        {...(isExternal
          ? { target: '_blank', rel: 'sponsored noopener nofollow' }
          : {})}
        className="absolute inset-0 block"
      >
        {inner}
      </Link>
    );
  }
  return <div className="absolute inset-0">{inner}</div>;
}
