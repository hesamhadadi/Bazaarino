import Link from 'next/link';
import { ArrowLeft, MapPin, Sparkles } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import LandingPage from '@/models/LandingPage';
import Ad from '@/models/Ad';
import { toFaDigits } from '@/lib/locale';

export const dynamic = 'force-dynamic';

/**
 * Per-city visual identity for the home-page card grid.
 * Anything not listed here falls back to a neutral brand gradient,
 * so adding a new city page never breaks the layout.
 */
const CITY_THEME: Record<
  string,
  { gradient: string; accent: string; emoji: string }
> = {
  rome: { gradient: 'from-rose-600 via-red-600 to-amber-600', accent: 'bg-rose-300', emoji: '🏛️' },
  milan: { gradient: 'from-slate-800 via-slate-700 to-zinc-900', accent: 'bg-amber-300', emoji: '🗼' },
  turin: { gradient: 'from-amber-600 via-orange-600 to-red-700', accent: 'bg-amber-200', emoji: '🏔️' },
  bologna: { gradient: 'from-orange-700 via-red-700 to-rose-800', accent: 'bg-orange-200', emoji: '🎓' },
  florence: { gradient: 'from-amber-500 via-orange-500 to-rose-500', accent: 'bg-amber-200', emoji: '🎨' },
  venice: { gradient: 'from-sky-600 via-cyan-600 to-blue-800', accent: 'bg-sky-200', emoji: '🚤' },
  naples: { gradient: 'from-yellow-500 via-orange-500 to-red-600', accent: 'bg-yellow-200', emoji: '🌋' },
  genoa: { gradient: 'from-emerald-600 via-teal-600 to-sky-700', accent: 'bg-emerald-200', emoji: '⚓' },
  verona: { gradient: 'from-pink-500 via-rose-500 to-red-600', accent: 'bg-pink-200', emoji: '💌' },
  bergamo: { gradient: 'from-indigo-600 via-purple-600 to-fuchsia-700', accent: 'bg-indigo-200', emoji: '🏰' },
  brescia: { gradient: 'from-stone-700 via-stone-800 to-zinc-900', accent: 'bg-stone-300', emoji: '🏟️' },
  padua: { gradient: 'from-violet-600 via-purple-600 to-indigo-700', accent: 'bg-violet-200', emoji: '📚' },
  bari: { gradient: 'from-cyan-500 via-sky-600 to-blue-700', accent: 'bg-cyan-200', emoji: '🏖️' },
  catania: { gradient: 'from-orange-600 via-red-600 to-stone-800', accent: 'bg-orange-200', emoji: '🌋' },
  palermo: { gradient: 'from-amber-500 via-yellow-600 to-orange-700', accent: 'bg-amber-200', emoji: '🍋' },
  berlin: { gradient: 'from-zinc-700 via-neutral-800 to-stone-900', accent: 'bg-yellow-300', emoji: '🐻' },
  munich: { gradient: 'from-blue-600 via-sky-700 to-indigo-800', accent: 'bg-blue-200', emoji: '🍺' },
  london: { gradient: 'from-red-600 via-rose-700 to-slate-900', accent: 'bg-red-200', emoji: '☂️' },
};

const DEFAULT_THEME = {
  gradient: 'from-orange-500 via-amber-500 to-rose-500',
  accent: 'bg-orange-200',
  emoji: '✨',
};

interface CityCard {
  slug: string;
  title: string;
  shortName: string;
  englishName: string;
  description: string;
  views: number;
  adCount: number;
  city: string;
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
      .select('slug title metaDescription views targetCity')
      .sort({ views: -1, updatedAt: -1 })
      .limit(8)
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
        description: (p.metaDescription || '').slice(0, 110),
        views: p.views || 0,
        adCount: countMap.get(p.targetCity || '') || 0,
        city: p.targetCity || '',
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
          <span className="text-[11px] text-gray-400 hidden md:inline-flex items-center gap-1">
            <Sparkles size={11} className="text-orange-400" />
            راهنمای SEO هر شهر
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {cards.map((c, idx) => {
            const theme = CITY_THEME[c.city] || DEFAULT_THEME;
            return (
              <Link
                key={c.slug}
                href={`/p/${c.slug}`}
                className="group relative overflow-hidden rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 aspect-[4/5] md:aspect-[3/4]"
              >
                {/* Gradient base */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${theme.gradient}`}
                />
                {/* Subtle pattern overlay for texture */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.6) 0%, transparent 35%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.4) 0%, transparent 40%)',
                  }}
                />
                {/* Bottom darkening for text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />

                {/* Top-right floating emoji badge */}
                <div className="absolute top-3 right-3 w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/30 flex items-center justify-center text-xl group-hover:scale-110 group-hover:rotate-6 transition">
                  {theme.emoji}
                </div>

                {/* Top-left rank pill (visual hierarchy without forcing order) */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-[10px] font-bold text-white">
                  <MapPin size={10} />
                  {toFaDigits(String(idx + 1).padStart(2, '0'))}
                </div>

                {/* Content */}
                <div className="absolute bottom-0 right-0 left-0 p-4 md:p-5">
                  {c.englishName && (
                    <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] text-white/70 font-bold mb-0.5">
                      {c.englishName}
                    </p>
                  )}
                  <h3 className="text-2xl md:text-3xl font-black text-white leading-tight drop-shadow-md">
                    {c.shortName}
                  </h3>
                  {c.description && (
                    <p className="text-[11px] md:text-xs text-white/85 leading-5 mt-1.5 line-clamp-2">
                      {c.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    {c.adCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] md:text-[11px] font-bold text-white bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-2 py-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${theme.accent}`} />
                        {toFaDigits(String(c.adCount))} آگهی
                      </span>
                    )}
                    <span className="ml-auto inline-flex items-center gap-1 text-[10px] md:text-[11px] font-bold text-white/95 group-hover:text-white">
                      اکتشاف
                      <ArrowLeft size={12} className="group-hover:-translate-x-1 transition" />
                    </span>
                  </div>
                </div>

                {/* Hover ring accent */}
                <div className="absolute inset-0 rounded-3xl ring-0 group-hover:ring-2 ring-white/40 transition" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
