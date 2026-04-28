import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import LandingPage from '@/models/LandingPage';
import { buildCityTemplate } from '@/lib/landing-templates';
import { getCityLabel } from '@/lib/constants';

export const dynamic = 'force-dynamic';

/**
 * The Italian cities with meaningful active Iranian communities on
 * Bazaarino. We pre-seed published landing pages for each so Google has
 * fresh, content-rich URLs to index right away — way more impactful
 * than asking the admin to click through the template modal nine times.
 *
 * Order matters for the home grid (sorted by views, then updatedAt) — the
 * "tier-1" SEO targets come first.
 */
const SEED_CITIES = [
  'turin',
  'milan',
  'rome',
  'bologna',
  'florence',
  'venice',
  'naples',
  'verona',
  'padua',
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  // `force=1` tells the seeder to overwrite content on existing slugs so
  // the admin can pick up template improvements (richer copy, new
  // sections, etc.) without manually deleting each page first.
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  await connectDB();
  const userId = (session.user as { id?: string }).id;

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];

  for (const city of SEED_CITIES) {
    const slug = city;
    const existing = await LandingPage.findOne({ slug });
    const data = buildCityTemplate({
      cityValue: city,
      cityLabel: getCityLabel(city) || city,
    });

    if (existing) {
      if (!force) {
        skipped.push(slug);
        continue;
      }
      existing.title = data.title;
      existing.metaDescription = data.metaDescription;
      existing.metaKeywords = data.metaKeywords;
      existing.targetCity = data.targetCity;
      existing.sections = data.sections;
      existing.faq = data.faq;
      existing.pageType = data.pageType;
      existing.status = 'published';
      if (!existing.publishedAt) existing.publishedAt = new Date();
      existing.updatedBy = userId as never;
      await existing.save();
      updated.push(slug);
      continue;
    }

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
    updated,
    skipped,
    total: SEED_CITIES.length,
  });
}
