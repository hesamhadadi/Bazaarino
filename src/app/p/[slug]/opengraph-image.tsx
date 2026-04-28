import { ImageResponse } from 'next/og';
import connectDB from '@/lib/mongodb';
import LandingPage from '@/models/LandingPage';

export const runtime = 'nodejs';
export const alt = 'بازارینو';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Dynamic OG image for landing pages. We avoid loading custom Persian
 * fonts at runtime (next/og only supports a single weight per request
 * and pulling Vazirmatn would push us over the edge bundle limit). The
 * default sans stack still renders Arabic glyphs reasonably and the
 * gradient + branding carries the visual weight on social previews.
 */
export default async function OgImage({ params }: { params: { slug: string } }) {
  await connectDB();
  const page = await LandingPage.findOne({
    slug: params.slug,
    status: 'published',
  })
    .select('title metaDescription pageType targetCity')
    .lean();

  const title = (page as { title?: string } | null)?.title || 'بازارینو';
  const subtitle =
    (page as { metaDescription?: string } | null)?.metaDescription ||
    'مارکت‌پلیس فارسی‌زبانان مقیم اروپا';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background:
            'linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #f43f5e 100%)',
          color: 'white',
          padding: 80,
          position: 'relative',
        }}
      >
        {/* Decorative grid */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.25,
          }}
        />

        {/* Brand */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 32,
            fontWeight: 800,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: 'rgba(255,255,255,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 36,
            }}
          >
            🇮🇹
          </div>
          <div>بازارینو</div>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: 'auto',
            gap: 24,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              direction: 'rtl',
            }}
          >
            {title.length > 60 ? title.slice(0, 60) + '…' : title}
          </div>
          <div
            style={{
              fontSize: 28,
              opacity: 0.95,
              lineHeight: 1.4,
              direction: 'rtl',
              maxWidth: 950,
            }}
          >
            {subtitle.length > 120 ? subtitle.slice(0, 120) + '…' : subtitle}
          </div>
        </div>

        {/* URL */}
        <div
          style={{
            marginTop: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 24,
            opacity: 0.9,
            fontWeight: 600,
          }}
        >
          <div
            style={{
              padding: '8px 20px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.4)',
            }}
          >
            bazaarino.online
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
