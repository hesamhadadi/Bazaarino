import connectDB from '@/lib/mongodb';
import Banner from '@/models/Banner';
import type { BannerSize } from '@/models/Banner';
import HomeBannerCarousel, {
  type BannerCarouselItem,
} from './HomeBannerCarousel';

export const dynamic = 'force-dynamic';

/**
 * Fetches every active home banner for the requested slot, ordered by
 * priority (desc) — newer high-priority banners surface first but older
 * ones still get airtime via the rotating carousel. Falls back to an
 * empty array if Mongo is unreachable; the component renders nothing
 * in that case so the layout collapses cleanly.
 */
async function fetchBanners(slot: BannerSize): Promise<BannerCarouselItem[]> {
  try {
    await connectDB();
    const now = new Date();
    const docs = await Banner.find({
      isActive: true,
      placement: 'home',
      size: slot,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .sort({ priority: -1, createdAt: -1 })
      .limit(8) // hard cap so the carousel can't become unwieldy
      .lean();
    return JSON.parse(JSON.stringify(docs));
  } catch {
    return [];
  }
}

const SLOT_ASPECT: Record<BannerSize, string> = {
  // Tailwind-friendly aspect ratios that match the recommended pixel sizes.
  hero: 'aspect-[16/5] md:aspect-[16/5]',
  wide: 'aspect-[6/1]',
  square: 'aspect-square',
};

export default async function HomeBanner({
  slot = 'hero',
}: {
  slot?: BannerSize;
}) {
  const banners = await fetchBanners(slot);
  if (banners.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 md:py-6">
        <HomeBannerCarousel
          banners={banners}
          aspectClass={SLOT_ASPECT[slot]}
        />
      </div>
    </section>
  );
}
