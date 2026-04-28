import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import LandingPage from '@/models/LandingPage';
import Ad from '@/models/Ad';
import { toFaDigits } from '@/lib/locale';
import { getCityVisual } from '@/lib/city-images';
import CityCardImage from './CityCardImage';

export const dynamic = 'force-dynamic';

interface CityCard {
  slug: string;
  title: string;
  shortName: string;
  englishName: string;
  views: number;
  adCount: number;
  city: string;
  /** ogImage from the page itself takes priority over the shared map. */
  ogImage?: string;
}

/** Pull "تورین" and "Torino" out of titles like "ایرانیان تورین | …" or "بازارینوی تورین". */
function parseShortName(title: string, fallback?: string): { fa: string; en: string } {
  const head = title.split('|')[0]?.trim() || title;
  // Try to extract Latin name in parentheses or after the Persian name
  const enMatch = head.match(/([A-Za-zÀ-ÿ]{3,})/);
  const en = enMatch ? enMatch[1] : '';
  // Pick last persian token as short name (e.g. "بازارینوی تورین" -> "تورین")
  const tokens = head.replace(/[A-Za-zÀ-ÿ()]/g, '').split(/\s+/).filter(Boolean);
  const fa = tokens[tokens.length - 1] || fallback || head;
  return { fa, en };
}

async function fetchCityCards(): Promise<CityCard[]> {
  try {
    await connectDB();
    const pages = await LandingPage.find({
      status: 'published',
      pageType: 'city',
    })
      .select('slug title metaDescription views targetCity ogImage')
      .sort({ views: -1, updatedAt: -1 })
      .limit(12)
      .lean();

    if (pages.length === 0) return [];

    // One aggregation to count approved ads per city — cheaper than N queries.
    const cities = pages.map((p) => p.targetCity).filter(Boolean) as string[];
    const counts = cities.length
      ? await Ad.aggregate([
          { $match: { status: 'approved', city: { $in: cities } } },
          { $group: { _id: '$city', n: { $sum: 1 } } },
        ])
      : [];
    const countMap = new Map<string, number>(
      counts.map((c: { _id: string; n: number }) => [c._id, c.n]),
    );

    return pages.map((p) => {
      const { fa, en } = parseShortName(p.title, p.targetCity);
      return {
        slug: p.slug,
        title: p.title,
        shortName: fa,
        englishName: en,
        views: p.views || 0,
        adCount: countMap.get(p.targetCity || '') || 0,
        city: p.targetCity || '',
        ogImage: p.ogImage,
      };
    });
  } catch (err) {
    console.error('[home/city-cards] failed', err);
    return [];
  }
}

export default async function CityLandingCards() {
  const cards = await fetchCityCards();
  if (cards.length === 0) return null;

  return (
    <section className="relative border-b border-gray-100 overflow-hidden">
      {/* Soft decorative blob — pure CSS, no extra request */}
      <div
        aria-hidden
        className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-gradient-to-br from-orange-200/40 via-rose-200/30 to-transparent blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-32 -right-20 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-200/40 via-pink-200/20 to-transparent blur-3xl pointer-events-none"
      />

      <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-600 mb-1.5">
              <Sparkles size={12} className="animate-pulse" />
              صفحات شهری
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">
              ایرانیان در شهرهای اروپا
            </h2>
            <p className="text-sm text-gray-500 mt-1.5 max-w-xl">
              راهنمای کامل زندگی، آگهی، و جامعه ایرانیان در هر شهر — یک جا، یک کلیک.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-3">
          {cards.map((c) => {
            const theme = getCityVisual(c.city);
            const img = c.ogImage || theme.image;
            return (
              <Link
                key={c.slug}
                href={`/p/${c.slug}`}
                className="group relative overflow-hidden rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 aspect-square"
              >
                {/* Gradient base — also fallback when the photo 404s. */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
                />
                {/* Photo with onError fallback (renders nothing on failure). */}
                {img && <CityCardImage src={img} alt={c.shortName} />}
                {/* Texture pattern */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0%, transparent 35%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.4) 0%, transparent 40%)',
                  }}
                />
                {/* Bottom darkening so text stays readable */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

                {/* Floating emoji badge */}
                <div className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-base group-hover:scale-110 group-hover:rotate-6 transition">
                  {theme.emoji}
                </div>

                {/* Content (compact) */}
                <div className="absolute bottom-0 right-0 left-0 p-3">
                  {c.englishName && (
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/70 font-bold mb-0.5">
                      {c.englishName}
                    </p>
                  )}
                  <h3 className="text-lg md:text-xl font-black text-white leading-tight drop-shadow-md">
                    {c.shortName}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5">
                    {c.adCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-1.5 py-0.5">
                        <span className={`w-1 h-1 rounded-full ${theme.accent}`} />
                        {toFaDigits(String(c.adCount))}
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-0.5 text-[10px] font-bold text-white/90 group-hover:text-white">
                      <ArrowLeft size={10} className="group-hover:-translate-x-1 transition" />
                    </span>
                  </div>
                </div>

                {/* Hover ring */}
                <div className="absolute inset-0 rounded-2xl ring-0 group-hover:ring-2 ring-white/40 transition" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
