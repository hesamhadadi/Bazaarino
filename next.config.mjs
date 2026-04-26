import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  // Required by @sentry/nextjs on Next 14 to register instrumentation.ts
  experimental: {
    instrumentationHook: true,
  },
};

// Sentry build wrapping is a no-op when SENTRY_AUTH_TOKEN / org / project
// envs aren't set, so this is safe to keep on for everyone. When provided,
// it uploads source maps for clean stacktraces.
const sentryWebpackPluginOptions = {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Hide the source-map files from the public folder after upload
  hideSourceMaps: true,
  // Don't fail the build if Sentry is misconfigured
  errorHandler: (err) => {
    // eslint-disable-next-line no-console
    console.warn('[sentry] build plugin warning:', err?.message || err);
  },
  // Skip Sentry's anonymous build telemetry
  telemetry: false,
};

const enableSentry = Boolean(
  process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
);

export default enableSentry
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
