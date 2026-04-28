import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Badge from '@/models/Badge';
import { DEFAULT_BADGES } from '@/lib/badges';

export const dynamic = 'force-dynamic';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

/**
 * Admin badge CRUD.
 *
 *   GET                           → list all badges
 *   POST                          → create a new badge
 *   POST ?seedDefaults=1          → upsert the built-in `DEFAULT_BADGES`
 *                                   so a fresh admin gets a starter pack
 */
export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  await connectDB();
  const badges = await Badge.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
  return NextResponse.json({ badges });
}

export async function POST(request: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  await connectDB();
  const url = new URL(request.url);

  // One-shot seeding mode for the curated default catalog. Idempotent —
  // running it twice is safe; existing slugs are upserted in place.
  if (url.searchParams.get('seedDefaults') === '1') {
    const ops = DEFAULT_BADGES.map((b) =>
      Badge.updateOne(
        { slug: b.slug },
        {
          $set: {
            label: b.label,
            description: b.description,
            icon: b.icon,
            color: b.color,
            gradient: b.gradient,
            tier: b.tier,
            sortOrder: b.sortOrder,
            isPublic: true,
          },
        },
        { upsert: true },
      ),
    );
    await Promise.all(ops);
    const badges = await Badge.find().sort({ sortOrder: 1 }).lean();
    return NextResponse.json({ ok: true, count: badges.length, badges });
  }

  const body = await request.json().catch(() => ({}));
  if (!body?.slug || !body?.label) {
    return NextResponse.json({ message: 'slug و label الزامی هستند' }, { status: 400 });
  }

  try {
    const created = await Badge.create({
      slug: String(body.slug).trim().toLowerCase(),
      label: body.label,
      description: body.description,
      icon: body.icon || 'Award',
      color: body.color,
      gradient: body.gradient,
      tier: body.tier || 'standard',
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : 100,
      isPublic: body.isPublic !== false,
    });
    return NextResponse.json({ badge: created }, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'خطا در ایجاد بج';
    return NextResponse.json({ message }, { status: 400 });
  }
}
