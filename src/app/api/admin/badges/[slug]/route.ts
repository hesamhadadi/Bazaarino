import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Badge from '@/models/Badge';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

interface Ctx {
  params: { slug: string };
}

export async function PATCH(request: NextRequest, { params }: Ctx) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  await connectDB();
  const body = await request.json().catch(() => ({}));
  const allowed: Record<string, unknown> = {};
  for (const key of [
    'label',
    'description',
    'icon',
    'color',
    'gradient',
    'tier',
    'sortOrder',
    'isPublic',
  ]) {
    if (key in body) allowed[key] = body[key];
  }
  const updated = await Badge.findOneAndUpdate(
    { slug: params.slug },
    { $set: allowed },
    { new: true },
  );
  if (!updated) {
    return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
  }
  return NextResponse.json({ badge: updated });
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  await connectDB();
  const slug = params.slug;
  // Pull the slug from every user that currently has it before removing
  // the badge definition itself, so we don't leave orphaned slugs in
  // user.badges that no longer resolve to anything.
  await User.updateMany({ badges: slug }, { $pull: { badges: slug } });
  const res = await Badge.deleteOne({ slug });
  return NextResponse.json({ ok: res.deletedCount === 1 });
}
