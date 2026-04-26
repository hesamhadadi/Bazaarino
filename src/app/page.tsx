import Link from 'next/link';
import { Search, ArrowLeft, Home as HomeIcon, Calendar, Plus, TrendingUp } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import AdCard from '@/components/ads/AdCard';
import LatestAdsSection from '@/components/home/LatestAdsSection';
import CategoryIcon from '@/components/ui/CategoryIcon';
import CityIcon from '@/components/ui/CityIcon';
import { CATEGORIES, CITIES, COUNTRIES } from '@/lib/constants';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import { attachMarketPriceToAds } from '@/lib/market-price';
import { toFaDigits } from '@/lib/locale';
import { getAppUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';

async function getLatestAds() {
  try {
    await connectDB();
    const now = new Date();
    const [ads, total] = await Promise.all([
      Ad.find({ status: 'approved' })
        .populate('userId', 'name avatar role')
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
      Ad.countDocuments({ status: 'approved' }),
    ]);
    const normalized = ads.map((ad: any) => ({
      ...ad,
      isFeatured: ad.isFeatured && (!ad.featuredUntil || new Date(ad.featuredUntil) >= now),
    }));
    const withMarket = await attachMarketPriceToAds(normalized as any[]);
    return { ads: JSON.parse(JSON.stringify(withMarket)), hasMore: total > 12 };
  } catch (err) {
    console.error('[home/latest] failed', err);
    return { ads: [], hasMore: false };
  }
}

async function getFeaturedAds() {
  try {
    await connectDB();
    const now = new Date();
    const ads = await Ad.find({ status: 'approved', isFeatured: true })
      .or([{ featuredUntil: { $exists: false } }, { featuredUntil: { $gte: now } }])
      .populate('userId', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(ads));
  } catch (err) {
    console.error('[home/featured] failed', err);
    return [];
  }
}

const TRENDING_QUERIES = [
  { q: 'اجاره آپارتمان', city: 'rome' },
  { q: 'هم‌خانه', city: 'milan' },
  { q: 'لپ‌تاپ', city: '' },
  { q: 'خودرو', city: 'berlin' },
  { q: 'استخدام', city: '' },
  { q: 'رزیدنسا', city: '' },
];

export default async function HomePage() {
  const [latestData, featuredAds] = await Promise.all([getLatestAds(), getFeaturedAds()]);
  const latestAds = latestData.ads;

  // Top 8 cities for the city pill row
  const topCities = CITIES.filter((c) => c.country !== 'other').slice(0, 12);

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [...featuredAds, ...latestAds].slice(0, 10).map((ad: any, idx: number) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: `${getAppUrl()}/ads/${ad._id}`,
      name: ad.title,
    })),
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
      <Navbar />

      {/* HERO — search-first, no decoration */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-orange-50/40 to-white">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-8 md:pt-16 md:pb-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight tracking-tight">
              نیازمندی‌های ایرانیان اروپا
            </h1>
            <p className="mt-3 text-base md:text-lg text-gray-600">
              خرید، فروش، اجاره مسکن و رزرو خانه در ایتالیا، آلمان و انگلستان.
            </p>
          </div>

          {/* Big search bar */}
          <form
            action="/search"
            method="GET"
            className="mt-6 grid gap-2 rounded-2xl border border-gray-200 bg-white p-2 shadow-sm md:grid-cols-[1.6fr_1fr_1fr_auto] md:p-2"
          >
            <div className="relative">
              <Search size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                name="q"
                type="text"
                placeholder="مثلاً آپارتمان رم، لپ‌تاپ دست دوم..."
                className="w-full rounded-xl border-0 bg-transparent pr-10 pl-3 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
              />
            </div>
            <select
              name="country"
              className="rounded-xl border-0 bg-gray-50 px-3 py-3 text-sm text-gray-700 focus:outline-none focus:bg-gray-100 cursor-pointer"
            >
              <option value="">همه کشورها</option>
              {COUNTRIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <select
              name="city"
              className="rounded-xl border-0 bg-gray-50 px-3 py-3 text-sm text-gray-700 focus:outline-none focus:bg-gray-100 cursor-pointer"
            >
              <option value="">همه شهرها</option>
              {CITIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 px-6 py-3 text-sm font-semibold text-white transition"
            >
              <Search size={16} />
              جست‌وجو
            </button>
          </form>

          {/* Trending searches */}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <TrendingUp size={12} /> ترند:
            </span>
            {TRENDING_QUERIES.map((t) => (
              <Link
                key={t.q + t.city}
                href={`/search?q=${encodeURIComponent(t.q)}${t.city ? `&city=${t.city}` : ''}`}
                className="text-xs px-3 py-1.5 rounded-full border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 text-gray-700 transition"
              >
                {t.q}{t.city ? ` در ${CITIES.find((c) => c.value === t.city)?.label.split(' ')[0]}` : ''}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CATEGORY ROW — horizontal scroll, dense */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">دسته‌بندی‌ها</h2>
            <Link href="/search" className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-0.5">
              همه <ArrowLeft size={12} />
            </Link>
          </div>
          <div className="-mx-4 px-4 overflow-x-auto scroll-smooth no-scrollbar">
            <div className="flex md:grid md:grid-cols-8 gap-2 min-w-max md:min-w-0">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.id}`}
                  className="group flex flex-col items-center gap-2 rounded-xl border border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm px-3 py-4 w-24 md:w-auto transition"
                >
                  <div className="w-9 h-9 rounded-lg bg-gray-50 group-hover:bg-orange-50 flex items-center justify-center transition">
                    <CategoryIcon categoryId={cat.id} size={18} className="text-gray-700 group-hover:text-orange-600 transition" />
                  </div>
                  <span className="text-[11px] text-gray-700 text-center leading-tight line-clamp-2">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CITY ROW */}
      <section className="border-b border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">شهرهای محبوب</h2>
            <Link href="/search" className="text-xs text-gray-500 hover:text-gray-700 inline-flex items-center gap-0.5">
              همه <ArrowLeft size={12} />
            </Link>
          </div>
          <div className="-mx-4 px-4 overflow-x-auto no-scrollbar">
            <div className="flex md:flex-wrap gap-2 min-w-max md:min-w-0">
              {topCities.map((city) => (
                <Link
                  key={city.value}
                  href={`/search?country=${city.country}&city=${city.value}`}
                  className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white hover:border-gray-300 hover:bg-white px-3 py-2 text-xs text-gray-700 transition"
                >
                  <CityIcon city={city.value} size={14} />
                  {city.label.split(' ')[0]}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED — only if any */}
      {featuredAds.length > 0 && (
        <section className="border-b border-gray-100">
          <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                  ویژه
                </div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900">آگهی‌های ویژه</h2>
              </div>
              <Link href="/search?featured=1" className="text-xs text-gray-600 hover:text-gray-900 inline-flex items-center gap-0.5">
                همه <ArrowLeft size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featuredAds.slice(0, 8).map((ad: any) => (
                <AdCard key={ad._id} ad={ad as any} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* RESERVATION CTA — single card */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            href="/house-reservation"
            className="group block rounded-2xl border border-gray-200 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6 md:p-8 hover:border-orange-300 hover:shadow-md transition"
          >
            <div className="flex items-start gap-4">
              <div className="hidden md:flex w-12 h-12 rounded-xl bg-white border border-orange-100 items-center justify-center text-orange-600">
                <Calendar size={22} />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-1.5">
                  <HomeIcon size={11} /> رزرو خانه
                </div>
                <h2 className="text-lg md:text-xl font-black text-gray-900 mb-1">
                  خانه روزانه و هفتگی برای ایرانیان اروپا
                </h2>
                <p className="text-sm text-gray-600 leading-6">
                  با تاریخ ورود و خروج جست‌وجو کن، مستقیم با میزبان ایرانی صحبت کن.
                </p>
              </div>
              <div className="self-center text-gray-400 group-hover:text-orange-600 transition">
                <ArrowLeft size={18} />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* LATEST */}
      <section>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-end justify-between mb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                به‌روز
              </div>
              <h2 className="text-xl md:text-2xl font-black text-gray-900">جدیدترین آگهی‌ها</h2>
              {latestAds.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  {toFaDigits(String(latestAds.length))} آگهی تازه از سراسر اروپا
                </p>
              )}
            </div>
            <Link
              href="/ads/new"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-xs font-semibold transition"
            >
              <Plus size={14} /> ثبت آگهی
            </Link>
          </div>

          {latestAds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-gray-500 text-sm mb-3">هنوز آگهی‌ای ثبت نشده.</p>
              <Link
                href="/ads/new"
                className="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 text-sm font-semibold"
              >
                <Plus size={14} /> اولین آگهی رو ثبت کن
              </Link>
            </div>
          ) : (
            <LatestAdsSection initialAds={latestAds} initialHasMore={latestData.hasMore} />
          )}
        </div>
      </section>

      <Footer />
      <BottomNav />
    </div>
  );
}
