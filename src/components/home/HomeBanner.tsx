import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';
import type { BannerSize } from '@/models/Banner';

export const dynamic = 'force-dynamic';

/**
 * Renders the highest-priority active home banner for the requested slot.
 * - `hero`   : 3.2:1 large billboard above the fold (1600×500 recommended)
 * - `wide`   : 6:1 narrow strip between sections (1200×200 recommended)
 * - `square` : 1:1 small card (rare on home, but supported for symmetry)
 *
 * Returns `null` (renders nothing) when no active banner matches — so the
 * homepage layout collapses cleanly.
 */
async function pickBanner(slot: BannerSize) {
  try {
    await connectDB();
    const now = new Date();
    const banner = await Banner.findOne({
      isActive: true,
      placement: 'home',
      size: slot,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    return banner ? JSON.parse(JSON.stringify(banner)) : null;
  } catch {
    return null;
  }
}

const SLOT_ASPECT: Record<BannerSize, string> = {
  // Tailwind-friendly aspect ratios that match the recommended pixel sizes.
  hero: 'aspect-[16/5] md:aspect-[16/5]',
  wide: 'aspect-[6/1]',
  square: 'aspect-square',
};

export default async function HomeBanner({ slot = 'hero' }: { slot?: BannerSize }) {
  const banner = await pickBanner(slot);
  if (!banner) return null;

  // External links should open in a new tab; internal stay in-app.
  const isExternal = !!banner.linkUrl && /^https?:\/\//i.test(banner.linkUrl);
  const wrapperClass = `group relative block overflow-hidden rounded-3xl shadow-sm ring-1 ring-gray-100 ${SLOT_ASPECT[slot]} bg-gradient-to-br from-gray-100 to-gray-200`;

  const inner = (
    <>
      {/* Mobile-specific creative when provided, otherwise the main image. */}
          {banner.imageUrlMobile && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={banner.imageUrlMobile}
              alt={banner.title || 'banner'}
              loading="eager"
              decoding="async"
              className="md:hidden absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
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
            } absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500`}
          />
          {/* Tiny "تبلیغ" pill so users know this is paid placement (transparency). */}
          <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/40 backdrop-blur text-white/90 uppercase tracking-wider">
            تبلیغ
          </span>
          {(banner.title || banner.description) && (
            <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-white">
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

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        {banner.linkUrl ? (
          <Link
            href={banner.linkUrl}
            {...(isExternal
              ? { target: '_blank', rel: 'sponsored noopener nofollow' }
              : {})}
            className={wrapperClass}
          >
            {inner}
          </Link>
        ) : (
          <div className={wrapperClass}>{inner}</div>
        )}
      </div>
    </section>
  );
}
