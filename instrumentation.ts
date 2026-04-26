/**
 * Next.js instrumentation hook. Loads the Sentry config that matches the
 * runtime currently booting (server vs edge). Required for @sentry/nextjs
 * v8+ in App Router projects.
 *
 * Enable in next.config.mjs via experimental.instrumentationHook (auto in
 * Next 15; required toggle in 14). Wrapping with withSentryConfig also
 * forwards the captureRequestError handler used below for nested RSC
 * errors.
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
