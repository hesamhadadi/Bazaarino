import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LandingPage from '@/models/LandingPage';

export const dynamic = 'force-dynamic';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return null;
  }
  return session;
}

function notFoundOrInvalid(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ message: 'invalid id' }, { status: 400 });
  }
  return null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  const { id } = await params;
  const bad = notFoundOrInvalid(id);
  if (bad) return bad;
  await connectDB();
  const page = await LandingPage.findById(id).lean();
  if (!page) {
    return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
  }
  return NextResponse.json({ page });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  const { id } = await params;
  const bad = notFoundOrInvalid(id);
  if (bad) return bad;

  await connectDB();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'invalid json' }, { status: 400 });
  }

  const userId = (session.user as { id?: string }).id;

  // Whitelist updatable fields so an admin can't accidentally mutate
  // timestamps or createdBy.
  const update: Record<string, unknown> = {
    updatedBy: userId,
  };
  const fields = [
    'pageType',
    'status',
    'title',
    'metaDescription',
    'metaKeywords',
    'ogImage',
    'ogImageAlt',
    'canonicalUrl',
    'noindex',
    'targetCity',
    'targetCategory',
    'targetSubcategory',
    'sections',
    'faq',
  ];
  for (const f of fields) {
    if (f in body) update[f] = body[f];
  }

  // First-time publish stamps publishedAt so we can sort by it later.
  if (body.status === 'published') {
    const existing = await LandingPage.findById(id).select('publishedAt').lean();
    if (existing && !(existing as { publishedAt?: Date }).publishedAt) {
      update.publishedAt = new Date();
    }
  }

  const page = await LandingPage.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!page) {
    return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
  }
  return NextResponse.json({ page });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  const { id } = await params;
  const bad = notFoundOrInvalid(id);
  if (bad) return bad;
  await connectDB();
  const page = await LandingPage.findByIdAndDelete(id);
  if (!page) {
    return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
