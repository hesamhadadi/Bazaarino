import type { IAdProduct } from '@/models/Ad';

/**
 * Normalizes & validates the incoming `products` payload. Drops invalid rows
 * (missing title or price), trims strings, enforces sane caps, and assigns
 * a stable id when one is missing. Returns:
 *   - `products`: the cleaned array (or `undefined` when nothing valid is left)
 *   - `derivedPrice`: the minimum sale price across products, used to keep
 *     the ad's top-level `price` aligned for search/sort/filter pipelines.
 *   - `error`: a user-facing message when the input is malformed.
 */
export function normalizeProducts(input: unknown): {
  products?: IAdProduct[];
  derivedPrice?: number;
  error?: string;
} {
  if (input == null) return {};
  if (!Array.isArray(input)) {
    return { error: 'فهرست محصولات باید آرایه باشد' };
  }
  if (input.length === 0) return {};
  if (input.length > 50) {
    return { error: 'حداکثر ۵۰ محصول در هر آگهی' };
  }

  const cleaned: IAdProduct[] = [];
  for (const raw of input) {
    if (!raw || typeof raw !== 'object') continue;
    const r = raw as Record<string, unknown>;
    const title = typeof r.title === 'string' ? r.title.trim() : '';
    const priceNum = typeof r.price === 'number' ? r.price : Number(r.price);
    if (!title || !Number.isFinite(priceNum) || priceNum < 0) continue;

    const originalRaw =
      r.originalPrice !== undefined && r.originalPrice !== null && r.originalPrice !== ''
        ? Number(r.originalPrice)
        : undefined;
    // Only keep originalPrice when it's strictly higher than the sale price
    // — otherwise the crossed-out display would be misleading.
    const originalPrice =
      Number.isFinite(originalRaw) && (originalRaw as number) > priceNum
        ? (originalRaw as number)
        : undefined;

    const images = Array.isArray(r.images)
      ? (r.images as unknown[])
          .filter((u): u is string => typeof u === 'string' && !!u)
          .slice(0, 6)
      : undefined;

    const specs = Array.isArray(r.specs)
      ? (r.specs as unknown[])
          .map((s) => {
            if (!s || typeof s !== 'object') return null;
            const sr = s as Record<string, unknown>;
            const label = typeof sr.label === 'string' ? sr.label.trim() : '';
            const value = typeof sr.value === 'string' ? sr.value.trim() : '';
            if (!label && !value) return null;
            return { label: label.slice(0, 60), value: value.slice(0, 200) };
          })
          .filter((s): s is { label: string; value: string } => !!s)
          .slice(0, 20)
      : undefined;

    cleaned.push({
      id: typeof r.id === 'string' && r.id ? r.id : `p_${Date.now()}_${cleaned.length}`,
      title: title.slice(0, 120),
      description:
        typeof r.description === 'string' && r.description.trim()
          ? r.description.trim().slice(0, 1000)
          : undefined,
      price: priceNum,
      originalPrice,
      currency: 'EUR',
      images: images && images.length > 0 ? images : undefined,
      specs: specs && specs.length > 0 ? specs : undefined,
      inStock: r.inStock === false ? false : true,
      sku: typeof r.sku === 'string' && r.sku.trim() ? r.sku.trim().slice(0, 60) : undefined,
    });
  }

  if (cleaned.length === 0) return {};

  const derivedPrice = cleaned.reduce(
    (min, p) => (p.price < min ? p.price : min),
    cleaned[0].price,
  );
  return { products: cleaned, derivedPrice };
}
