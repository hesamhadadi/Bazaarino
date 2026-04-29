/**
 * Per-city imagery + visual identity used by:
 *  - the home-page CityLandingCards grid
 *  - the public landing page hero
 *
 * Images are Unsplash CDN URLs (free for commercial use, no key required).
 * Anything missing from the map falls back to gradient-only rendering, so
 * a 404 on an image URL never breaks layout — the gradient sits underneath.
 */

export interface CityVisual {
  /** Photographic background, ~600w jpeg from Unsplash. */
  image?: string;
  /** Tailwind gradient stops, used both alone and as overlay above image. */
  gradient: string;
  /** Tiny accent dot color used for badges/chips. */
  accent: string;
  /** Single emoji icon shown in the corner of cards. */
  emoji: string;
}

export const CITY_VISUALS: Record<string, CityVisual> = {
  rome: {
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-rose-600 via-red-600 to-amber-600',
    accent: 'bg-rose-300',
    emoji: '🏛️',
  },
  milan: {
    image: 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-slate-800 via-slate-700 to-zinc-900',
    accent: 'bg-amber-300',
    emoji: '🗼',
  },
  turin: {
    image: 'https://images.unsplash.com/photo-1612698093158-e07ac200d44e?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-amber-600 via-orange-600 to-red-700',
    accent: 'bg-amber-200',
    emoji: '🏔️',
  },
  bologna: {
    image: 'https://images.unsplash.com/photo-1633354833404-0f59c7a87e96?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-orange-700 via-red-700 to-rose-800',
    accent: 'bg-orange-200',
    emoji: '🎓',
  },
  florence: {
    image: 'https://images.unsplash.com/photo-1543429776-2782fc8e1acd?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
    accent: 'bg-amber-200',
    emoji: '🎨',
  },
  venice: {
    image: 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-sky-600 via-cyan-600 to-blue-800',
    accent: 'bg-sky-200',
    emoji: '🚤',
  },
  naples: {
    image: 'https://images.unsplash.com/photo-1631414769541-d6e93efd3604?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-yellow-500 via-orange-500 to-red-600',
    accent: 'bg-yellow-200',
    emoji: '🌋',
  },
  genoa: {
    image: 'https://images.unsplash.com/photo-1592906211440-c61f0c1d7fa9?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-emerald-600 via-teal-600 to-sky-700',
    accent: 'bg-emerald-200',
    emoji: '⚓',
  },
  verona: {
    image: 'https://images.unsplash.com/photo-1583425423320-d6cae3a8f96e?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-pink-500 via-rose-500 to-red-600',
    accent: 'bg-pink-200',
    emoji: '💌',
  },
  bergamo: {
    image: 'https://images.unsplash.com/photo-1574236170879-a6a1c92dd67d?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-indigo-600 via-purple-600 to-fuchsia-700',
    accent: 'bg-indigo-200',
    emoji: '🏰',
  },
  brescia: {
    gradient: 'from-stone-700 via-stone-800 to-zinc-900',
    accent: 'bg-stone-300',
    emoji: '🏟️',
  },
  padua: {
    image: 'https://images.unsplash.com/photo-1597065684807-04d6a4e64f31?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-violet-600 via-purple-600 to-indigo-700',
    accent: 'bg-violet-200',
    emoji: '📚',
  },
  bari: {
    image: 'https://images.unsplash.com/photo-1608887068263-3b9eaf5b4d4b?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-cyan-500 via-sky-600 to-blue-700',
    accent: 'bg-cyan-200',
    emoji: '🏖️',
  },
  catania: {
    gradient: 'from-orange-600 via-red-600 to-stone-800',
    accent: 'bg-orange-200',
    emoji: '🌋',
  },
  palermo: {
    image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-amber-500 via-yellow-600 to-orange-700',
    accent: 'bg-amber-200',
    emoji: '🍋',
  },
  berlin: {
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-zinc-700 via-neutral-800 to-stone-900',
    accent: 'bg-yellow-300',
    emoji: '🐻',
  },
  munich: {
    image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-blue-600 via-sky-700 to-indigo-800',
    accent: 'bg-blue-200',
    emoji: '🍺',
  },
  london: {
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=900&q=70&auto=format&fit=crop',
    gradient: 'from-red-600 via-rose-700 to-slate-900',
    accent: 'bg-red-200',
    emoji: '☂️',
  },
};

export const DEFAULT_VISUAL: CityVisual = {
  gradient: 'from-orange-500 via-amber-500 to-rose-500',
  accent: 'bg-orange-200',
  emoji: '✨',
};

export function getCityVisual(city?: string): CityVisual {
  if (!city) return DEFAULT_VISUAL;
  return CITY_VISUALS[city] || DEFAULT_VISUAL;
}

/**
 * Async variant that merges DB-managed overrides on top of the static map.
 * Used by server components (CityLandingCards, landing-page Hero). When
 * Mongo is unreachable for any reason we silently fall back to statics —
 * never block UI on visual personalisation.
 *
 * The override doc may be partial: any unset field keeps the static value.
 * `enabled === false` is a hard hide signal — callers that consume a list
 * (the home grid) should filter those out *before* calling this.
 */
export async function getCityVisualAsync(city?: string): Promise<CityVisual> {
  const base = getCityVisual(city);
  if (!city) return base;
  try {
    // Lazy imports keep this file safe to use from client components that
    // never call the async path (the sync one stays purely in-memory).
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: CityVisual } = await import('@/models/CityVisual');
    await connectDB();
    const override = await CityVisual.findOne({ slug: city }).lean();
    if (!override) return base;
    return {
      image: override.image || base.image,
      gradient: override.gradient || base.gradient,
      accent: override.accent || base.accent,
      emoji: override.emoji || base.emoji,
    };
  } catch {
    return base;
  }
}

/**
 * Bulk variant: fetch overrides for many cities in a single query and
 * return a `slug -> merged visual` map. Used by the home grid.
 */
export async function getCityVisualsBulk(
  cities: string[],
): Promise<Record<string, CityVisual>> {
  const out: Record<string, CityVisual> = {};
  for (const c of cities) out[c] = getCityVisual(c);
  if (cities.length === 0) return out;
  try {
    const { default: connectDB } = await import('@/lib/mongodb');
    const { default: CityVisual } = await import('@/models/CityVisual');
    await connectDB();
    const overrides = await CityVisual.find({ slug: { $in: cities } }).lean();
    for (const o of overrides) {
      const base = out[o.slug] || DEFAULT_VISUAL;
      out[o.slug] = {
        image: o.image || base.image,
        gradient: o.gradient || base.gradient,
        accent: o.accent || base.accent,
        emoji: o.emoji || base.emoji,
      };
    }
  } catch {
    /* fall back to static-only map */
  }
  return out;
}
