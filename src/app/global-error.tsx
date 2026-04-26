'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

/**
 * Top-level error boundary. Triggered when an error escapes the root
 * layout (and even error.tsx). Must render its own <html>/<body>.
 *
 * We forward to Sentry here because at this level Next can't run our
 * normal error.tsx wrapper.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fa" dir="rtl">
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#f9fafb',
          padding: '1.5rem',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>خطایی رخ داد</h1>
          <p style={{ color: '#6b7280', lineHeight: 1.8, marginBottom: 20 }}>
            یک خطای غیرمنتظره پیش آمد. لطفاً صفحه را تازه کنید.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 18px',
              borderRadius: 12,
              background: '#f97316',
              color: 'white',
              fontWeight: 700,
              border: 0,
              cursor: 'pointer',
            }}
          >
            تلاش مجدد
          </button>
        </div>
      </body>
    </html>
  );
}
