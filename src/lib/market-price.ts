import mongoose from 'mongoose';
import Ad from '@/models/Ad';

export interface MarketPriceSnapshot {
  referencePrice: number;
  sampleSize: number;
  aiRegression?: {
    model: 'regression';
    trend: 'up' | 'down' | 'fair';
    trendPercent: number;
    confidence: number;
    chart: number[];
    dataSources: string[];
  };
}

interface MarketPriceInput {
  city: string;
  category: string;
  subcategory?: string;
  excludeAdId?: string;
}

interface ExternalMarketSignal {
  prices: number[];
  sources: string[];
}

function toFinitePositive(value: unknown): number | null {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return numeric;
}

function parseExternalPayload(payload: any): ExternalMarketSignal {
  if (!payload) return { prices: [], sources: [] };

  const pricesFromArray = Array.isArray(payload)
    ? payload.map(toFinitePositive).filter((value): value is number => value !== null)
    : [];

  const pricesFromNamedArray = Array.isArray(payload.prices)
    ? payload.prices.map(toFinitePositive).filter((value: number | null): value is number => value !== null)
    : [];

  const singleReference = toFinitePositive(payload.referencePrice);
  const prices = [...pricesFromArray, ...pricesFromNamedArray, ...(singleReference ? [singleReference] : [])];

  const sourceName = typeof payload.source === 'string' && payload.source.trim()
    ? payload.source.trim()
    : 'External';
  const sources = prices.length > 0 ? [sourceName] : [];

  return { prices, sources };
}

async function getExternalMarketSignal(input: MarketPriceInput): Promise<ExternalMarketSignal> {
  const endpoint = process.env.EXTERNAL_HOUSING_PRICE_FEED_URL;
  const staticPrices = (process.env.EXTERNAL_HOUSING_PRICE_STATIC || '')
    .split(',')
    .map((item) => toFinitePositive(item.trim()))
    .filter((value): value is number => value !== null);

  const staticSource = process.env.EXTERNAL_HOUSING_PRICE_STATIC_SOURCE || 'External Static';

  if (!endpoint) {
    return {
      prices: staticPrices,
      sources: staticPrices.length > 0 ? [staticSource] : [],
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2500);

  try {
    const url = new URL(endpoint);
    url.searchParams.set('city', input.city);
    url.searchParams.set('category', input.category);
    if (input.subcategory) url.searchParams.set('subcategory', input.subcategory);

    const response = await fetch(url.toString(), {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      return {
        prices: staticPrices,
        sources: staticPrices.length > 0 ? [staticSource] : [],
      };
    }
    const payload = await response.json();
    const parsed = parseExternalPayload(payload);

    return {
      prices: [...parsed.prices, ...staticPrices],
      sources: [...parsed.sources, ...(staticPrices.length > 0 ? [staticSource] : [])],
    };
  } catch {
    return {
      prices: staticPrices,
      sources: staticPrices.length > 0 ? [staticSource] : [],
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

function runSimpleRegression(values: number[]) {
  const n = values.length;
  if (n < 3) return null;

  const xs = values.map((_, index) => index);
  const sumX = xs.reduce((acc, value) => acc + value, 0);
  const sumY = values.reduce((acc, value) => acc + value, 0);
  const sumXY = values.reduce((acc, value, index) => acc + (index * value), 0);
  const sumXX = xs.reduce((acc, value) => acc + (value * value), 0);
  const denominator = (n * sumXX) - (sumX * sumX);
  if (denominator === 0) return null;

  const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
  const intercept = (sumY - (slope * sumX)) / n;
  const first = intercept;
  const last = intercept + (slope * (n - 1));
  const trendPercent = first > 0 ? ((last - first) / first) * 100 : 0;
  const trend: 'up' | 'down' | 'fair' = trendPercent > 3 ? 'up' : trendPercent < -3 ? 'down' : 'fair';
  const confidence = Math.min(95, Math.max(50, 45 + (n * 7)));

  return {
    trend,
    trendPercent: Number(trendPercent.toFixed(1)),
    confidence,
    chart: values.slice(-8).map((value) => Math.round(value)),
  };
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

  const [result, trendRows, externalSignal] = await Promise.all([
    Ad.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          avgPrice: { $avg: '$price' },
          sampleSize: { $sum: 1 },
        },
      },
    ]),
    Ad.aggregate([
      { $match: { ...match, createdAt: { $gte: new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)) } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          avgPrice: { $avg: '$price' },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 12 },
    ]),
    getExternalMarketSignal(input),
  ]);

  if (!result[0] || result[0].sampleSize < 3) return null;

  const internalReferencePrice = Math.round(Number(result[0].avgPrice || 0));
  const mergedReferenceInputs = [internalReferencePrice, ...externalSignal.prices];
  const referencePrice = Math.round(
    mergedReferenceInputs.reduce((acc, value) => acc + value, 0) / mergedReferenceInputs.length
  );

  const internalTrendValues = (trendRows || [])
    .map((row: any) => Number(row?.avgPrice || 0))
    .filter((value: number) => Number.isFinite(value) && value > 0);

  const regression = runSimpleRegression(internalTrendValues);
  const dataSources = ['Bazaarino', ...externalSignal.sources];

  return {
    referencePrice,
    sampleSize: Number(result[0].sampleSize || 0),
    aiRegression: regression ? {
      model: 'regression',
      trend: regression.trend,
      trendPercent: regression.trendPercent,
      confidence: regression.confidence,
      chart: regression.chart,
      dataSources,
    } : undefined,
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
