import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LandingPage from '@/models/LandingPage';
import { buildCityTemplate } from '@/lib/landing-templates';
import { getCityLabel } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * One-click template instantiation. Currently supports `template=city`
 * which produces a polished, SEO-optimized page for any city in our
 * catalog. The endpoint creates a *draft* page so the admin can review
 * and tweak before publishing.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (
    !session ||
    (session.user as { role?: string }).role !== 'admin'
  ) {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  let body: { template?: string; city?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ message: 'invalid json' }, { status: 400 });
  }

  if (body.template !== 'city') {
    return NextResponse.json(
      { message: 'فعلاً فقط قالب «شهر» پشتیبانی می‌شود.' },
      { status: 400 },
    );
  }
  if (!body.city) {
    return NextResponse.json(
      { message: 'انتخاب شهر الزامی است.' },
      { status: 400 },
    );
  }

  const cityLabel = getCityLabel(body.city) || body.city;
  const data = buildCityTemplate({
    cityValue: body.city,
    cityLabel,
  });

  const slug = (body.slug || body.city)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-');

  await connectDB();
  const existing = await LandingPage.findOne({ slug }).lean();
  if (existing) {
    return NextResponse.json(
      { message: `صفحه‌ای با slug «${slug}» از قبل وجود دارد.` },
      { status: 409 },
    );
  }

  const userId = (session.user as { id?: string }).id;
  const page = await LandingPage.create({
    slug,
    pageType: data.pageType,
    title: data.title,
    metaDescription: data.metaDescription,
    metaKeywords: data.metaKeywords,
    targetCity: data.targetCity,
    sections: data.sections,
    faq: data.faq,
    status: 'draft',
    createdBy: userId,
    updatedBy: userId,
  });

  return NextResponse.json({ page }, { status: 201 });
}
