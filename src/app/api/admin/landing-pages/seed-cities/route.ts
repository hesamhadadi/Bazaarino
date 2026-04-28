import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LandingPage from '@/models/LandingPage';
import { buildCityTemplate } from '@/lib/landing-templates';
import { getCityLabel } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * The five Italian cities with the largest active Iranian community on
 * Bazaarino. We pre-seed published landing pages for each so Google has
 * fresh, content-rich URLs to index right away — way more impactful
 * than asking the admin to click through the template modal five times.
 */
const SEED_CITIES = ['turin', 'milan', 'rome', 'bologna', 'florence'];

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  await connectDB();
  const userId = (session.user as { id?: string }).id;

  const created: string[] = [];
  const skipped: string[] = [];

  for (const city of SEED_CITIES) {
    const slug = city;
    const existing = await LandingPage.findOne({ slug }).lean();
    if (existing) {
      skipped.push(slug);
      continue;
    }
    const data = buildCityTemplate({
      cityValue: city,
      cityLabel: getCityLabel(city) || city,
    });
    await LandingPage.create({
      slug,
      pageType: data.pageType,
      title: data.title,
      metaDescription: data.metaDescription,
      metaKeywords: data.metaKeywords,
      targetCity: data.targetCity,
      sections: data.sections,
      faq: data.faq,
      // Publish straight away so the admin can see the result on /p/<city>
      // immediately without an extra round-trip through the editor.
      status: 'published',
      publishedAt: new Date(),
      createdBy: userId,
      updatedBy: userId,
    });
    created.push(slug);
  }

  return NextResponse.json({
    created,
    skipped,
    total: SEED_CITIES.length,
  });
}
