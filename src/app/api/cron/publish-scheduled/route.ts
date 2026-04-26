import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';

// Always run dynamically — never cache.
export const dynamic = 'force-dynamic';

/**
 * Promotes any article whose status === 'scheduled' AND scheduledFor <= now()
 * to status === 'published', stamping publishedAt with the original scheduled time.
 *
 * This route is meant to be called by Vercel Cron (every 15 minutes).
 *
 * Auth: requires `Authorization: Bearer ${CRON_SECRET}` header.
 *   - Vercel Cron automatically attaches this when CRON_SECRET is set in env.
 *   - For manual testing: curl -H "Authorization: Bearer $CRON_SECRET" .../api/cron/publish-scheduled
 */
async function handler(request: NextRequest) {
  const auth = request.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.CRON_SECRET || ''}`;

  // Vercel Cron sets `x-vercel-cron: 1` automatically; allow that as fallback.
  const isVercelCron = request.headers.get('x-vercel-cron') === '1';

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { message: 'CRON_SECRET is not configured' },
      { status: 500 },
    );
  }

  if (!isVercelCron && auth !== expected) {
    return NextResponse.json({ message: 'unauthorized' }, { status: 401 });
  }

  try {
    await connectDB();
    const now = new Date();

    const due = await Article.find({
      status: 'scheduled',
      scheduledFor: { $lte: now },
    })
      .select('_id slug title scheduledFor')
      .lean();

    if (due.length === 0) {
      return NextResponse.json({ ok: true, promoted: 0, items: [] });
    }

    const ids = due.map((a: any) => a._id);
    await Article.updateMany(
      { _id: { $in: ids } },
      [
        {
          $set: {
            status: 'published',
            // Preserve the originally intended publish moment.
            publishedAt: { $ifNull: ['$scheduledFor', now] },
          },
        },
        { $unset: 'scheduledFor' },
      ],
    );

    return NextResponse.json({
      ok: true,
      promoted: due.length,
      items: due.map((a: any) => ({
        slug: a.slug,
        title: a.title,
        scheduledFor: a.scheduledFor,
      })),
    });
  } catch (err) {
    console.error('[cron/publish-scheduled]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export const GET = handler;
export const POST = handler;
