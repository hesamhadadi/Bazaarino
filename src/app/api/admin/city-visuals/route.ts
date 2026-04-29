import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import CityVisual from '@/models/CityVisual';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === 'admin';
}

/**
 * Admin CRUD for city visual overrides used by the homepage city grid
 * and the public landing-page hero. The static map in `lib/city-images.ts`
 * remains the baseline; rows here are *partial* overrides — leaving any
 * field empty keeps the static value (no need to re-enter defaults).
 */

export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  await connectDB();
  const visuals = await CityVisual.find()
    .sort({ priority: -1, slug: 1 })
    .lean();
  return NextResponse.json({ visuals });
}

/**
 * Upsert by slug. Allows the admin to call this repeatedly for the same
 * city without having to know whether a row already exists.
 */
export async function POST(request: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const slug = String(body.slug || '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.json(
        { message: 'شناسه شهر الزامی است' },
        { status: 400 },
      );
    }

    const update: Record<string, unknown> = {
      slug,
      enabled: body.enabled !== false,
      priority: Number.isFinite(Number(body.priority)) ? Number(body.priority) : 0,
    };
    if (typeof body.image === 'string') update.image = body.image.trim() || undefined;
    if (typeof body.gradient === 'string') update.gradient = body.gradient.trim() || undefined;
    if (typeof body.accent === 'string') update.accent = body.accent.trim() || undefined;
    if (typeof body.emoji === 'string') update.emoji = body.emoji.trim() || undefined;
    if (body.imageVerifiedAt) update.imageVerifiedAt = new Date(body.imageVerifiedAt);

    await connectDB();
    const visual = await CityVisual.findOneAndUpdate(
      { slug },
      { $set: update },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    return NextResponse.json({ visual });
  } catch (err) {
    console.error('[admin/city-visuals] POST failed', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    if (!slug) {
      return NextResponse.json({ message: 'slug الزامی است' }, { status: 400 });
    }
    await connectDB();
    await CityVisual.deleteOne({ slug: slug.toLowerCase() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/city-visuals] DELETE failed', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
