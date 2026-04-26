/**
 * Sentry init for the BROWSER bundle. Loaded automatically by
 * @sentry/nextjs when NEXT_PUBLIC_SENTRY_DSN is set.
 *
 * Tracing/replay are sampled aggressively in dev (off) and conservatively
 * in prod to keep the free tier comfortable.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    // 10% of transactions in prod, off in dev
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
    // Capture only failed sessions to keep replay quota safe
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,
    // Trim noisy errors that don't tell us anything actionable
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      // Browser extensions
      /chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],
    integrations: [
      Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
    ],
  });
}
