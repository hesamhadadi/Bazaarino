import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
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

/** List all landing pages (drafts + published). */
export async function GET() {
  if (!(await ensureAdmin())) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }
  await connectDB();
  const pages = await LandingPage.find({})
    .sort({ updatedAt: -1 })
    .select('slug pageType status title views publishedAt updatedAt targetCity')
    .lean();
  return NextResponse.json({ pages });
}

/** Create a new landing page (initially as draft). */
export async function POST(request: NextRequest) {
  const session = await ensureAdmin();
  if (!session) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  await connectDB();
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'invalid json' }, { status: 400 });
  }

  const slug = String(body.slug || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  if (!slug || slug.length < 2) {
    return NextResponse.json(
      { message: 'slug معتبر نیست' },
      { status: 400 },
    );
  }

  const existing = await LandingPage.findOne({ slug }).lean();
  if (existing) {
    return NextResponse.json(
      { message: 'صفحه‌ای با این slug از قبل وجود دارد' },
      { status: 409 },
    );
  }

  const userId = (session.user as { id?: string }).id;

  const page = await LandingPage.create({
    slug,
    pageType: body.pageType || 'general',
    title: body.title || slug,
    metaDescription: body.metaDescription,
    targetCity: body.targetCity,
    targetCategory: body.targetCategory,
    targetSubcategory: body.targetSubcategory,
    sections: Array.isArray(body.sections) ? body.sections : [],
    faq: Array.isArray(body.faq) ? body.faq : [],
    status: 'draft',
    createdBy: userId,
    updatedBy: userId,
  });

  return NextResponse.json({ page }, { status: 201 });
}
