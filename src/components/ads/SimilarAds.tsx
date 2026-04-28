import Link from 'next/link';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import AdCard from '@/components/ads/AdCard';
import { Sparkles } from 'lucide-react';

interface SimilarAdsProps {
  adId: string;
  category: string;
  subcategory?: string;
  city?: string;
  country?: string;
  price?: number;
  priceType?: string;
  limit?: number;
}

/**
 * Renders up to `limit` (default 6) ads that are conceptually similar to
 * the current one. Ranking is intentionally simple so it stays fast on
 * a single Mongo query and doesn't need a search index:
 *
 *  1. Same category + (same subcategory if present) + same city → highest
 *  2. Same category + same city
 *  3. Same category in the same country
 *
 * Within each tier we prefer ads whose price is within ±30% of the
 * current ad (when both are fixed-price), then most recent first.
 *
 * Server component — runs at the same render pass as the ad detail page
 * so we don't pay an extra client round-trip.
 */
export default async function SimilarAds({
  adId,
  category,
  subcategory,
  city,
  country,
  price,
  priceType,
  limit = 6,
}: SimilarAdsProps) {
  if (!category) return null;

  await connectDB();

  let currentObjectId: mongoose.Types.ObjectId | null = null;
  if (mongoose.Types.ObjectId.isValid(adId)) {
    currentObjectId = new mongoose.Types.ObjectId(adId);
  }

  const baseFilter: Record<string, unknown> = {
    status: 'approved',
    category,
  };
  if (currentObjectId) baseFilter._id = { $ne: currentObjectId };

  const hasComparablePrice =
    typeof price === 'number' && Number.isFinite(price) && priceType === 'fixed';
  const priceWindow = hasComparablePrice
    ? { $gte: Math.round(price * 0.7), $lte: Math.round(price * 1.3) }
    : null;

  // Tier 1: same subcategory + same city, ideally within price window.
  // Tier 2: same category + same city.
  // Tier 3: same category, same country.
  // We over-fetch slightly per tier and dedupe at the end so the final list
  // is `limit` items even when one tier has no hits.
  type AdDoc = Record<string, unknown> & { _id: mongoose.Types.ObjectId };
  const tiers: AdDoc[][] = [];

  async function runTier(filter: Record<string, unknown>) {
    return (await Ad.find(filter)
      .populate('userId', 'name avatar role')
      .sort({ isFeatured: -1, bumpedAt: -1, createdAt: -1 })
      .limit(limit * 2)
      .lean()) as AdDoc[];
  }

  if (subcategory && city) {
    const filter: Record<string, unknown> = { ...baseFilter, subcategory, city };
    if (priceWindow) filter.price = priceWindow;
    tiers.push(await runTier(filter));
  }

  if (city) {
    tiers.push(await runTier({ ...baseFilter, city }));
  }

  if (country) {
    tiers.push(await runTier({ ...baseFilter, country }));
  }

  // Final fallback: any approved ad in the same category.
  tiers.push(await runTier(baseFilter));

  const seen = new Set<string>();
  const merged: AdDoc[] = [];
  for (const tier of tiers) {
    for (const ad of tier) {
      const key = String(ad._id);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(ad);
      if (merged.length >= limit) break;
    }
    if (merged.length >= limit) break;
  }

  if (merged.length === 0) return null;

  // Plain JSON copy so we can pass to the client AdCard without leaking
  // mongoose document instances.
  const ads = JSON.parse(JSON.stringify(merged)) as Array<
    React.ComponentProps<typeof AdCard>['ad']
  >;

  return (
    <section className="bg-white rounded-2xl p-5 border border-gray-100">
      <header className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800 inline-flex items-center gap-2">
          <Sparkles size={16} className="text-orange-500" />
          آگهی‌های مشابه
        </h2>
        {category && city ? (
          <Link
            href={`/search?category=${category}&city=${city}`}
            className="text-xs text-brand-600 hover:underline"
          >
            مشاهده همه
          </Link>
        ) : null}
      </header>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {ads.map((ad) => (
          <AdCard key={ad._id} ad={ad} />
        ))}
      </div>
    </section>
  );
}
