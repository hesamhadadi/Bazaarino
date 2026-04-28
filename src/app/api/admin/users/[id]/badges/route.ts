import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Badge from '@/models/Badge';

export const dynamic = 'force-dynamic';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

interface Ctx {
  params: { id: string };
}

/**
 * Award a badge to a user. The badge slug must already exist in the
 * Badge catalog — we don't auto-create on assign so we can't accidentally
 * fragment the catalog with typos.
 *
 *   POST /api/admin/users/:id/badges   { slug: "founder" }
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: 'شناسه کاربر معتبر نیست' }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const slug = String(body?.slug || '').trim().toLowerCase();
  if (!slug) {
    return NextResponse.json({ message: 'slug الزامی است' }, { status: 400 });
  }

  await connectDB();

  const badge = await Badge.findOne({ slug }).lean();
  if (!badge) {
    return NextResponse.json({ message: 'بج با این slug یافت نشد' }, { status: 404 });
  }

  // $addToSet keeps the array unique without us needing to fetch first.
  const updated = await User.findByIdAndUpdate(
    params.id,
    { $addToSet: { badges: slug } },
    { new: true, projection: { badges: 1 } },
  ).lean();

  if (!updated) {
    return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, badges: (updated as { badges?: string[] }).badges || [] });
}

/**
 * Remove a badge from a user.
 *
 *   DELETE /api/admin/users/:id/badges?slug=founder
 */
export async function DELETE(request: NextRequest, { params }: Ctx) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  if (!mongoose.Types.ObjectId.isValid(params.id)) {
    return NextResponse.json({ message: 'شناسه کاربر معتبر نیست' }, { status: 400 });
  }

  const slug = (new URL(request.url)).searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ message: 'slug الزامی است' }, { status: 400 });
  }

  await connectDB();
  const updated = await User.findByIdAndUpdate(
    params.id,
    { $pull: { badges: slug } },
    { new: true, projection: { badges: 1 } },
  ).lean();

  if (!updated) {
    return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, badges: (updated as { badges?: string[] }).badges || [] });
}
