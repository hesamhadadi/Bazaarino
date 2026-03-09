import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AdCard from '@/components/ads/AdCard';
import { CATEGORIES, CITIES } from '@/lib/constants';
import { Search, ChevronLeft, TrendingUp, MapPin } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';

async function getLatestAds() {
  try {
    await connectDB();
    const ads = await Ad.find({ status: 'approved' })
      .sort({ isFeatured: -1, createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(ads));
  } catch {
    return [];
  }
}

async function getFeaturedAds() {
  try {
    await connectDB();
    const ads = await Ad.find({ status: 'approved', isFeatured: true })
      .sort({ createdAt: -1 })
      .limit(4)
      .lean();
    return JSON.parse(JSON.stringify(ads));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [latestAds, featuredAds] = await Promise.all([getLatestAds(), getFeaturedAds()]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-gradient-to-bl from-brand-600 via-brand-500 to-orange-400 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-14">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex gap-1">
                <span className="w-3 h-5 bg-green-400 rounded-sm opacity-80"></span>
                <span className="w-3 h-5 bg-white/80 rounded-sm"></span>
                <span className="w-3 h-5 bg-red-400 rounded-sm opacity-80"></span>
              </div>
              <span className="text-white/80 text-sm">نیازمندی ایرانیان ایتالیا</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-2">بازارینو</h1>
            <p className="text-white/80 text-sm md:text-base">خرید، فروش و اجاره در شهرهای ایتالیا</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form action="/search" method="GET">
              <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-xl">
                <input
                  type="text"
                  name="q"
                  placeholder="دنبال چی می‌گردی؟"
                  className="flex-1 px-3 py-2 text-gray-800 outline-none text-sm bg-transparent"
                />
                <select
                  name="city"
                  className="text-gray-600 text-sm bg-gray-50 border-0 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">همه شهرها</option>
                  {CITIES.map(city => (
                    <option key={city.value} value={city.value}>{city.label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
                >
                  <Search size={16} />
                  <span className="hidden sm:inline">جستجو</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-10">
        {/* Categories */}
        <section className="py-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">دسته‌بندی‌ها</h2>
          </div>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className="flex flex-col items-center gap-1.5 p-2 bg-white rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-brand-50 transition-all group"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                <span className="text-xs text-gray-600 text-center leading-tight line-clamp-2">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Cities Quick Filter */}
        <section className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Link href="/search" className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-brand-500 text-white rounded-full text-xs font-medium">
              <MapPin size={12} /> همه شهرها
            </Link>
            {CITIES.slice(0, 8).map(city => (
              <Link
                key={city.value}
                href={`/search?city=${city.value}`}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                {city.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Featured Ads */}
        {featuredAds.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-500" />
                <h2 className="text-lg font-bold text-gray-800">آگهی‌های ویژه</h2>
              </div>
              <Link href="/search?featured=true" className="text-sm text-brand-500 flex items-center gap-1">
                همه <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featuredAds.map((ad: any) => (
                <AdCard key={ad._id} ad={ad} />
              ))}
            </div>
          </section>
        )}

        {/* Latest Ads */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">جدیدترین آگهی‌ها</h2>
            <Link href="/search" className="text-sm text-brand-500 flex items-center gap-1">
              همه <ChevronLeft size={14} />
            </Link>
          </div>

          {latestAds.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {latestAds.map((ad: any) => (
                <AdCard key={ad._id} ad={ad} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-4">📦</p>
              <p className="text-gray-500 mb-4">هنوز آگهی‌ای ثبت نشده</p>
              <Link href="/ads/new" className="bg-brand-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium">
                اولین آگهی رو ثبت کن!
              </Link>
            </div>
          )}
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
