import mongoose from 'mongoose';
import Ad from '@/models/Ad';

export interface MarketPriceSnapshot {
  referencePrice: number;
  sampleSize: number;
}

interface MarketPriceInput {
  city: string;
  category: string;
  subcategory?: string;
  excludeAdId?: string;
}

export async function getMarketPriceSnapshot(input: MarketPriceInput): Promise<MarketPriceSnapshot | null> {
  const { city, category, subcategory, excludeAdId } = input;
  if (!city || !category) return null;

  const match: Record<string, any> = {
    status: 'approved',
    city,
    category,
    priceType: 'fixed',
    price: { $gt: 0 },
  };

  if (subcategory) match.subcategory = subcategory;
  if (excludeAdId && mongoose.Types.ObjectId.isValid(excludeAdId)) {
    match._id = { $ne: new mongoose.Types.ObjectId(excludeAdId) };
  }

  const result = await Ad.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        avgPrice: { $avg: '$price' },
        sampleSize: { $sum: 1 },
      },
    },
  ]);

  if (!result[0] || result[0].sampleSize < 3) return null;

  return {
    referencePrice: Math.round(Number(result[0].avgPrice || 0)),
    sampleSize: Number(result[0].sampleSize || 0),
  };
}

export type MarketPriceLevel = 'below' | 'fair' | 'above';

export function classifyMarketPrice(price?: number, referencePrice?: number): MarketPriceLevel | null {
  if (!price || !referencePrice || referencePrice <= 0) return null;
  const ratio = price / referencePrice;
  if (ratio < 0.9) return 'below';
  if (ratio > 1.1) return 'above';
  return 'fair';
}

type AdWithMarketInputs = {
  _id?: any;
  city?: string;
  category?: string;
  subcategory?: string;
  priceType?: string;
  price?: number;
};

export async function attachMarketPriceToAds<T extends AdWithMarketInputs>(ads: T[]) {
  const marketTargets = (ads || [])
    .filter((ad) => ad.category === 'real-estate' && ad.priceType === 'fixed' && ad.price && Number(ad.price) > 0 && ad.city)
    .map((ad) => ({ city: String(ad.city), category: String(ad.category), subcategory: ad.subcategory ? String(ad.subcategory) : '' }));

  const uniqueKeys = Array.from(new Set(marketTargets.map((t) => `${t.city}__${t.category}__${t.subcategory}`)));
  const marketByKey = new Map<string, MarketPriceSnapshot>();
  await Promise.all(
    uniqueKeys.map(async (key) => {
      const [city, category, subcategory] = key.split('__');
      const snapshot = await getMarketPriceSnapshot({ city, category, subcategory: subcategory || undefined });
      if (snapshot) marketByKey.set(key, snapshot);
    })
  );

  return (ads || []).map((ad) => {
    const key = `${ad.city || ''}__${ad.category || ''}__${ad.subcategory || ''}`;
    return {
      ...ad,
      marketPrice: marketByKey.get(key) || null,
    };
  });
}
