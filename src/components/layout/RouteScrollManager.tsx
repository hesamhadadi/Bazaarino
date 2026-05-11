'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export default function RouteScrollManager() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams?.toString() || '';

  useEffect(() => {
    const html = document.documentElement;
    const previousScrollBehavior = html.style.scrollBehavior;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.body.classList.add('route-settling');
    html.style.scrollBehavior = prefersReducedMotion ? 'auto' : 'smooth';

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    });

    const cleanupTimer = window.setTimeout(() => {
      document.body.classList.remove('route-settling');
      html.style.scrollBehavior = previousScrollBehavior;
    }, prefersReducedMotion ? 0 : 520);

    return () => {
      window.clearTimeout(cleanupTimer);
      document.body.classList.remove('route-settling');
      html.style.scrollBehavior = previousScrollBehavior;
    };
  }, [pathname, query]);

  return null;
}
