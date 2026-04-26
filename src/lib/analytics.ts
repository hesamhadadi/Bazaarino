/**
 * Tiny analytics wrapper around GA4's gtag(). Call from anywhere on the
 * client; no-ops cleanly on the server, in dev without NEXT_PUBLIC_GA_ID,
 * or when the script hasn't loaded yet.
 *
 * Example:
 *   trackEvent('contact_seller', { ad_id, channel: 'whatsapp' })
 */

type Params = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

export function trackEvent(name: string, params?: Params) {
  if (typeof window === 'undefined') return;
  const fn = window.gtag;
  if (typeof fn !== 'function') return;
  try {
    fn('event', name, params || {});
  } catch {
    // Swallow analytics errors — they should never break UX.
  }
}

/** Manually fire a page_view (useful for SPA-style transitions if needed). */
export function trackPageView(url: string, title?: string) {
  if (typeof window === 'undefined') return;
  const fn = window.gtag;
  if (typeof fn !== 'function') return;
  try {
    fn('event', 'page_view', { page_location: url, page_title: title });
  } catch {
    // ignore
  }
}
