/**
 * localStorage-backed log of ads the user has recently viewed.
 *
 * We deliberately stay client-only here:
 *   - no server round-trip on every ad open
 *   - no PII leaks for non-logged-in browsing
 *   - easy to clear from devtools / privacy settings
 *
 * The stored shape is intentionally a thin denormalised snapshot so we can
 * render the "recently viewed" strip without having to re-fetch each ad —
 * if the underlying ad changes (price drops, gets removed) the link will
 * still work and any stale info is acceptable for a lightweight strip.
 */

export const RECENT_VIEWS_KEY = 'bazaarino:recent-views';
export const RECENT_VIEWS_MAX = 12;

export interface RecentViewEntry {
  id: string;
  title: string;
  price?: number;
  priceType?: string;
  city?: string;
  category?: string;
  image?: string;
  viewedAt: number;
}

function safeParse(raw: string | null): RecentViewEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is RecentViewEntry =>
        e && typeof e === 'object' && typeof e.id === 'string' && typeof e.title === 'string',
    );
  } catch {
    return [];
  }
}

/** Read the entire history (most-recent first). Returns [] on SSR. */
export function getRecentViews(): RecentViewEntry[] {
  if (typeof window === 'undefined') return [];
  return safeParse(window.localStorage.getItem(RECENT_VIEWS_KEY));
}

/**
 * Push an ad to the front of the history. De-duplicates by id (so revisiting
 * an ad just bumps it to the top instead of creating a second entry) and
 * caps the list at RECENT_VIEWS_MAX so localStorage doesn't grow unbounded.
 */
export function pushRecentView(entry: Omit<RecentViewEntry, 'viewedAt'>): void {
  if (typeof window === 'undefined') return;
  if (!entry.id) return;
  const list = getRecentViews().filter((e) => e.id !== entry.id);
  list.unshift({ ...entry, viewedAt: Date.now() });
  const capped = list.slice(0, RECENT_VIEWS_MAX);
  try {
    window.localStorage.setItem(RECENT_VIEWS_KEY, JSON.stringify(capped));
    // Notify same-tab listeners (storage event only fires cross-tab).
    window.dispatchEvent(new CustomEvent('bazaarino:recent-views-changed'));
  } catch {
    // Quota exceeded or storage disabled — silently drop, this is best-effort.
  }
}

export function clearRecentViews(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(RECENT_VIEWS_KEY);
    window.dispatchEvent(new CustomEvent('bazaarino:recent-views-changed'));
  } catch {
    /* noop */
  }
}
