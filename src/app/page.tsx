import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AdCard from '@/components/ads/AdCard';
import LatestAdsSection from '@/components/home/LatestAdsSection';
import { CATEGORIES, CITIES, COUNTRIES } from '@/lib/constants';
import {
  Search, ChevronLeft, TrendingUp, MapPin,
  Zap, Shield, Globe, UserPlus, FileText,
  ShoppingBag, Users, Building2, Megaphone,
} from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Banner from '@/models/Banner';
import CategoryIcon from '@/components/ui/CategoryIcon';
import CityIcon from '@/components/ui/CityIcon';

export const dynamic = 'force-dynamic';

async function getLatestAds() {
  try {
    await connectDB();
    const now = new Date();
    const ads = await Ad.find({ status: 'approved' })
      .populate('userId', 'name avatar role')
      .sort({ createdAt: -1 })
      .lean();
    const normalized = ads.map((ad: any) => ({
      ...ad,
      isFeatured: ad.isFeatured && (!ad.featuredUntil || new Date(ad.featuredUntil) >= now),
    }));
    return JSON.parse(JSON.stringify(normalized));
  } catch {
    return [];
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
      .limit(4)
      .lean();
    return JSON.parse(JSON.stringify(ads));
  } catch {
    return [];
  }
}

async function getActiveBanners() {
  try {
    await connectDB();
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      $or: [{ placement: 'home' }, { placement: { $exists: false } }],
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();
    return JSON.parse(JSON.stringify(banners));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [latestAds, featuredAds, banners] = await Promise.all([getLatestAds(), getFeaturedAds(), getActiveBanners()]);
  const countryCards = [
    { id: 'italy', label: 'ایتالیا', stripes: ['bg-green-500', 'bg-white', 'bg-red-500'] },
    { id: 'germany', label: 'آلمان', stripes: ['bg-black', 'bg-red-600', 'bg-yellow-400'] },
    { id: 'uk', label: 'انگلستان', stripes: ['bg-blue-700', 'bg-white', 'bg-red-600'] },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div
        className="hero-cinematic text-white"
        style={{ backgroundImage: "url('/hero-europe.svg')" }}
      >
        <div className="hero-grid absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-10 md:py-16">
          <div className="text-center mb-6 fade-up">
            <div className="flex items-center justify-center gap-2 mb-3 opacity-95">
              <div className="flex gap-1">
                <span className="w-3 h-5 bg-green-400 rounded-sm opacity-80"></span>
                <span className="w-3 h-5 bg-white/80 rounded-sm"></span>
                <span className="w-3 h-5 bg-red-400 rounded-sm opacity-80"></span>
              </div>
              <span className="text-white/80 text-sm">نیازمندی ایرانیان اروپا</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-3 drop-shadow-[0_6px_30px_rgba(0,0,0,0.35)]">بازارینو</h1>
            <p className="text-white/90 text-sm md:text-lg font-medium">خرید، فروش و اجاره در شهرهای اروپا</p>
          </div>

          {/* Search Bar */}
          <div className="max-w-3xl mx-auto fade-up fade-up-delay-1 soft-float">
            <form action="/search" method="GET">
              <div className="flex gap-2 bg-white/95 backdrop-blur-sm rounded-2xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.18)] border border-white/30">
                <input
                  type="text"
                  name="q"
                  placeholder="دنبال چی می‌گردی؟"
                  className="flex-1 px-3 py-2 text-gray-800 outline-none text-sm bg-transparent placeholder:text-gray-400"
                />
                <select
                  name="country"
                  className="text-gray-600 text-sm bg-gray-50 border-0 rounded-xl px-3 py-2 outline-none"
                >
                  <option value="">همه کشورها</option>
                  {COUNTRIES.map((country) => (
                    <option key={country.value} value={country.value}>{country.label}</option>
                  ))}
                </select>
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
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-orange-300/30"
                >
                  <Search size={16} />
                  <span className="hidden sm:inline">جستجو</span>
                </button>
              </div>
            </form>
          </div>

          <div className="fade-up fade-up-delay-2 mt-5 flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-xs text-white/90">
              <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full"></span>
              آگهی‌های جدید هر روز به‌روزرسانی می‌شوند
            </div>
          </div>

          {/* European Cityscape SVG Illustration */}
          <div className="fade-up fade-up-delay-2 mt-6 flex justify-center pointer-events-none select-none" aria-hidden="true">
            <svg viewBox="0 0 800 140" className="w-full max-w-3xl opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
              <title>نمای شهری اروپا با بناهای تاریخی</title>
              {/* Colosseum-style arch */}
              <rect x="60" y="60" width="80" height="80" rx="4" fill="white" fillOpacity="0.25" />
              <path d="M70 60 Q100 30 130 60" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.4" />
              <rect x="78" y="80" width="12" height="20" rx="6" fill="white" fillOpacity="0.2" />
              <rect x="98" y="80" width="12" height="20" rx="6" fill="white" fillOpacity="0.2" />
              <rect x="118" y="80" width="12" height="20" rx="6" fill="white" fillOpacity="0.2" />
              {/* Tower / Big Ben style */}
              <rect x="200" y="20" width="30" height="120" rx="2" fill="white" fillOpacity="0.2" />
              <rect x="207" y="10" width="16" height="15" rx="2" fill="white" fillOpacity="0.3" />
              <polygon points="215,0 207,10 223,10" fill="white" fillOpacity="0.35" />
              <rect x="210" y="50" width="10" height="10" rx="1" fill="white" fillOpacity="0.15" />
              <rect x="210" y="70" width="10" height="10" rx="1" fill="white" fillOpacity="0.15" />
              {/* Church / Dome */}
              <rect x="310" y="50" width="60" height="90" rx="3" fill="white" fillOpacity="0.2" />
              <ellipse cx="340" cy="50" rx="30" ry="20" fill="white" fillOpacity="0.15" />
              <line x1="340" y1="30" x2="340" y2="20" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
              {/* Market building */}
              <rect x="430" y="70" width="90" height="70" rx="3" fill="white" fillOpacity="0.2" />
              <polygon points="430,70 475,40 520,70" fill="white" fillOpacity="0.18" />
              <rect x="450" y="100" width="15" height="20" rx="1" fill="white" fillOpacity="0.12" />
              <rect x="475" y="100" width="15" height="20" rx="1" fill="white" fillOpacity="0.12" />
              <rect x="455" y="75" width="40" height="4" rx="1" fill="white" fillOpacity="0.2" />
              {/* Leaning tower style */}
              <g transform="rotate(-5, 590, 140)">
                <rect x="580" y="30" width="20" height="110" rx="2" fill="white" fillOpacity="0.2" />
                <ellipse cx="590" cy="30" rx="14" ry="6" fill="white" fillOpacity="0.25" />
                <rect x="583" y="55" width="14" height="3" rx="1" fill="white" fillOpacity="0.15" />
                <rect x="583" y="75" width="14" height="3" rx="1" fill="white" fillOpacity="0.15" />
                <rect x="583" y="95" width="14" height="3" rx="1" fill="white" fillOpacity="0.15" />
              </g>
              {/* Brandenburg Gate style */}
              <rect x="660" y="55" width="80" height="85" rx="2" fill="white" fillOpacity="0.2" />
              <rect x="670" y="45" width="60" height="12" rx="2" fill="white" fillOpacity="0.25" />
              <rect x="675" y="70" width="8" height="40" rx="1" fill="white" fillOpacity="0.15" />
              <rect x="693" y="70" width="8" height="40" rx="1" fill="white" fillOpacity="0.15" />
              <rect x="711" y="70" width="8" height="40" rx="1" fill="white" fillOpacity="0.15" />
              {/* Ground line */}
              <line x1="0" y1="140" x2="800" y2="140" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            </svg>
          </div>
        </div>
      </div>

      {/* Animated Stats Counters */}
      <div className="relative -mt-6 z-10 max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-100 grid grid-cols-3 divide-x divide-gray-100 rtl:divide-x-reverse">
          <div className="flex flex-col items-center py-5 px-3 gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-1">
              <Megaphone size={20} className="text-brand-500" />
            </div>
            <span className="text-xl md:text-2xl font-black text-gray-800 tabular-nums">۱۰۰۰+</span>
            <span className="text-xs text-gray-500 font-medium">آگهی فعال</span>
          </div>
          <div className="flex flex-col items-center py-5 px-3 gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-1">
              <Building2 size={20} className="text-blue-500" />
            </div>
            <span className="text-xl md:text-2xl font-black text-gray-800 tabular-nums">۵۰+</span>
            <span className="text-xs text-gray-500 font-medium">شهر اروپایی</span>
          </div>
          <div className="flex flex-col items-center py-5 px-3 gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-1">
              <Users size={20} className="text-emerald-500" />
            </div>
            <span className="text-xl md:text-2xl font-black text-gray-800 tabular-nums">۱۰۰۰+</span>
            <span className="text-xs text-gray-500 font-medium">کاربر فعال</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-10">
        <section className="py-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-3xl border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-2">شروع سریع در اروپا</h2>
              <p className="text-sm text-gray-500 mb-4">کشور مورد نظر را انتخاب کن و آگهی‌ها را دقیق‌تر ببین.</p>
              <div className="grid grid-cols-3 gap-2">
                {countryCards.map((c) => (
                  <Link
                    key={c.id}
                    href={`/search?country=${c.id}`}
                    className="rounded-2xl border border-gray-200 bg-white p-3 text-center text-sm font-medium text-gray-700 hover:border-brand-300 hover:bg-brand-50 transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex overflow-hidden rounded-md border border-gray-200">
                        <span className={`w-2.5 h-4 ${c.stripes[0]}`}></span>
                        <span className={`w-2.5 h-4 ${c.stripes[1]}`}></span>
                        <span className={`w-2.5 h-4 ${c.stripes[2]}`}></span>
                      </span>
                      {c.label}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 p-5">
              <h2 className="text-lg font-bold text-gray-800 mb-1">چرا بازارینو؟</h2>
              <p className="text-xs text-gray-400 mb-4">پلتفرم مطمئن برای ایرانیان اروپا</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gradient-to-b from-orange-50 to-white rounded-2xl p-3 border border-orange-100/60">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-brand-500/10 flex items-center justify-center mb-2">
                    <Zap size={18} className="text-brand-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-700">ثبت سریع</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">کمتر از ۲ دقیقه</p>
                </div>
                <div className="bg-gradient-to-b from-blue-50 to-white rounded-2xl p-3 border border-blue-100/60">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-blue-500/10 flex items-center justify-center mb-2">
                    <Globe size={18} className="text-blue-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-700">پوشش شهری</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">ایتالیا، آلمان، انگلیس</p>
                </div>
                <div className="bg-gradient-to-b from-emerald-50 to-white rounded-2xl p-3 border border-emerald-100/60">
                  <div className="w-9 h-9 mx-auto rounded-xl bg-emerald-500/10 flex items-center justify-center mb-2">
                    <Shield size={18} className="text-emerald-500" />
                  </div>
                  <p className="text-xs font-bold text-gray-700">اعتماد</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">پنل مدیریت و گزارش‌ها</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {banners.length > 0 && (
          <section className="py-5">
            <div className="grid md:grid-cols-3 gap-3">
              {banners.map((banner: any) => (
                <Link key={banner._id} href={banner.linkUrl || '#'} className="block rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="relative h-28 md:h-32">
                    <Image src={banner.imageUrl} alt={banner.title || 'banner'} fill className="object-cover" />
                    {banner.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="text-white text-xs font-semibold line-clamp-1">{banner.title}</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="py-6">
          <div className="relative rounded-2xl bg-gradient-to-br from-orange-50 via-white to-amber-50/50 border border-orange-100/40 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">دسته‌بندی‌ها</h2>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-10 gap-2">
              {CATEGORIES.map(cat => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.id}`}
                  className="h-20 sm:h-24 md:h-28 flex flex-col items-center justify-center gap-1.5 p-2 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 hover:border-brand-200 hover:bg-white hover:shadow-md hover:shadow-orange-100/50 transition-all group"
                >
                  <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-600 group-hover:bg-brand-50 group-hover:text-brand-500 group-hover:scale-105 transition-all">
                    <CategoryIcon categoryId={cat.id} size={18} className="text-gray-600 group-hover:text-brand-500 transition-colors" />
                  </span>
                  <span className="text-[11px] sm:text-xs text-gray-600 text-center leading-tight whitespace-nowrap truncate max-w-[80px]">
                    {cat.label}
                  </span>
                </Link>
              ))}
            </div>
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
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-600 rounded-full text-xs whitespace-nowrap hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                <CityIcon city={city.value} size={12} />
                {city.label}
              </Link>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-6">
          <div className="text-center mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">چطوری کار می‌کنه؟</h2>
            <p className="text-sm text-gray-400">تنها با ۳ قدم ساده آگهی خود را ثبت کنید</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {/* Step 1 */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-lg hover:shadow-orange-100/40 transition-shadow">
              <div className="absolute -top-3 right-1/2 translate-x-1/2 w-7 h-7 rounded-full bg-brand-500 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-orange-200">۱</div>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center mb-3 mt-2">
                <UserPlus size={26} className="text-brand-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">ثبت‌نام کنید</h3>
              <p className="text-xs text-gray-400 leading-relaxed">یک حساب کاربری رایگان بسازید و وارد پنل خود شوید</p>
            </div>
            {/* Step 2 */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-lg hover:shadow-blue-100/40 transition-shadow">
              <div className="absolute -top-3 right-1/2 translate-x-1/2 w-7 h-7 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-blue-200">۲</div>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center mb-3 mt-2">
                <FileText size={26} className="text-blue-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">آگهی ثبت کنید</h3>
              <p className="text-xs text-gray-400 leading-relaxed">عکس و توضیحات محصول خود را اضافه کنید</p>
            </div>
            {/* Step 3 */}
            <div className="relative bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-lg hover:shadow-emerald-100/40 transition-shadow">
              <div className="absolute -top-3 right-1/2 translate-x-1/2 w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center shadow-md shadow-emerald-200">۳</div>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 flex items-center justify-center mb-3 mt-2">
                <ShoppingBag size={26} className="text-emerald-500" />
              </div>
              <h3 className="text-sm font-bold text-gray-800 mb-1">بفروشید!</h3>
              <p className="text-xs text-gray-400 leading-relaxed">با خریداران ارتباط بگیرید و معامله کنید</p>
            </div>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-stretch auto-rows-fr">
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

          <LatestAdsSection initialAds={latestAds} />
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
