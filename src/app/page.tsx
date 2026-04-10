import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AdCard from '@/components/ads/AdCard';
import LatestAdsSection from '@/components/home/LatestAdsSection';
import { CATEGORIES, CITIES, COUNTRIES } from '@/lib/constants';
import {
  Search, ChevronLeft, TrendingUp, MapPin, ShieldCheck, Sparkles, CircleDashed, ArrowUpLeft,
  UserPlus, FileText, ShoppingBag, BrainCircuit, Rocket, PackageSearch, Users, Building2, Megaphone,
} from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Banner from '@/models/Banner';
import CategoryIcon from '@/components/ui/CategoryIcon';
import CityIcon from '@/components/ui/CityIcon';
import { attachMarketPriceToAds } from '@/lib/market-price';
import { toFaDigits } from '@/lib/locale';

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
    const normalizedWithMarketPrice = await attachMarketPriceToAds(normalized as any[]);
    return {
      ads: JSON.parse(JSON.stringify(normalizedWithMarketPrice)),
      hasMore: total > 12,
    };
  } catch {
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
  const [latestAdsData, featuredAds, banners] = await Promise.all([getLatestAds(), getFeaturedAds(), getActiveBanners()]);
  const latestAds = latestAdsData.ads;
  const countryCards = [
    { id: 'italy', label: 'ایتالیا', stripes: ['bg-green-500', 'bg-white', 'bg-red-500'], subtitle: 'رم، میلان، تورین' },
    { id: 'germany', label: 'آلمان', stripes: ['bg-black', 'bg-red-600', 'bg-yellow-400'], subtitle: 'برلین، هامبورگ، مونیخ' },
    { id: 'uk', label: 'انگلستان', stripes: ['bg-blue-700', 'bg-white', 'bg-red-600'], subtitle: 'لندن، منچستر، بیرمنگام' },
  ];
  const quickStats = [
    { label: 'آگهی تازه', value: toFaDigits(latestAds.length), tone: 'from-orange-500 to-amber-400' },
    { label: 'ویژه فعال', value: toFaDigits(featuredAds.length), tone: 'from-emerald-500 to-teal-400' },
    { label: 'شهر پوشش‌داده‌شده', value: toFaDigits(CITIES.length), tone: 'from-sky-500 to-cyan-400' },
  ];
  const trustPoints = [
    { icon: Sparkles, title: 'ثبت سریع', text: 'فرم سبک و انتشار سریع برای آگهی‌های روزمره' },
    { icon: MapPin, title: 'جست‌وجوی محلی', text: 'فیلتر بر اساس کشور، شهر و دسته‌بندی در چند ثانیه' },
    { icon: ShieldCheck, title: 'مدیریت و گزارش', text: 'پنل نظارت و گزارش تخلف برای تجربه امن‌تر' },
  ];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ed_0%,#fffdf8_18%,#f8fafc_44%,#f8fafc_100%)]">
      <Navbar />

      <div className="hero-cinematic text-white" style={{ backgroundImage: "url('/hero-europe.svg')" }}>
        <div className="hero-grid absolute inset-0"></div>
        <div className="hero-noise absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 pt-10 pb-12 md:pt-16 md:pb-20">
          <div className="grid items-center gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-md">
                <CircleDashed size={14} className="text-orange-200" />
                نیازمندی ایرانیان اروپا
              </div>
              <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight md:text-6xl md:leading-[1.15] drop-shadow-[0_6px_30px_rgba(0,0,0,0.35)]">
                بازار خرید، فروش و اجاره برای زندگی ایرانی‌ها در اروپا
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 md:text-lg">
                از خانه و هم‌خانه تا وسایل، خدمات و فرصت‌های روزمره. سریع جست‌وجو کن، شهر را انتخاب کن و مستقیم به آگهی‌های به‌روز برس.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-white/85 md:text-sm">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-300"></span>
                  به‌روزرسانی روزانه آگهی‌ها
                </span>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-2 backdrop-blur-sm">
                  <ShieldCheck size={14} className="text-emerald-200" />
                  مدیریت و گزارش تخلف
                </span>
              </div>
            </div>

            <div className="fade-up fade-up-delay-1 hero-panel">
              <div className="rounded-[2rem] border border-white/20 bg-white/12 p-5 shadow-[0_30px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl md:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-white/70">شروع سریع</p>
                    <h2 className="mt-1 text-xl font-bold text-white">جست‌وجوی هوشمند آگهی</h2>
                  </div>
                  <div className="rounded-2xl bg-white/12 p-3">
                    <Search size={20} className="text-orange-200" />
                  </div>
                </div>

                <div className="mx-auto max-w-3xl soft-float">
                  <form action="/search" method="GET">
                    <div className="grid gap-3 rounded-[1.5rem] bg-white/95 p-3 text-right shadow-[0_10px_40px_rgba(0,0,0,0.18)] ring-1 ring-white/40 md:grid-cols-[1.4fr_0.8fr_0.8fr_auto]">
                      <input
                        type="text"
                        name="q"
                        placeholder="مثلاً خانه در میلان یا لپ‌تاپ دست دوم"
                        className="min-w-0 rounded-2xl border border-orange-100 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-brand-400"
                      />
                      <select
                        name="country"
                        className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 outline-none transition focus:border-brand-300"
                      >
                        <option value="">همه کشورها</option>
                        {COUNTRIES.map((country) => (
                          <option key={country.value} value={country.value}>{country.label}</option>
                        ))}
                      </select>
                      <select
                        name="city"
                        className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600 outline-none transition focus:border-brand-300"
                      >
                        <option value="">همه شهرها</option>
                        {CITIES.map((city) => (
                          <option key={city.value} value={city.value}>{city.label}</option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-500 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 shadow-lg shadow-orange-300/30"
                      >
                        <Search size={16} />
                        جستجو
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  {quickStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/15 bg-black/10 px-4 py-3 text-center">
                      <div className={`mx-auto mb-2 h-1.5 w-14 rounded-full bg-gradient-to-r ${stat.tone}`}></div>
                      <p className="text-lg font-black text-white md:text-2xl">{stat.value}</p>
                      <p className="mt-1 text-[11px] text-white/70 md:text-xs">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="fade-up fade-up-delay-2 mt-6 flex justify-center pointer-events-none select-none" aria-hidden="true">
            <svg viewBox="0 0 800 140" className="w-full max-w-3xl opacity-30" fill="none" xmlns="http://www.w3.org/2000/svg" role="img">
              <title>نمای شهری اروپا با بناهای تاریخی</title>
              <rect x="60" y="60" width="80" height="80" rx="4" fill="white" fillOpacity="0.25" />
              <path d="M70 60 Q100 30 130 60" stroke="white" strokeWidth="2" fill="none" strokeOpacity="0.4" />
              <rect x="78" y="80" width="12" height="20" rx="6" fill="white" fillOpacity="0.2" />
              <rect x="98" y="80" width="12" height="20" rx="6" fill="white" fillOpacity="0.2" />
              <rect x="118" y="80" width="12" height="20" rx="6" fill="white" fillOpacity="0.2" />
              <rect x="200" y="20" width="30" height="120" rx="2" fill="white" fillOpacity="0.2" />
              <rect x="207" y="10" width="16" height="15" rx="2" fill="white" fillOpacity="0.3" />
              <polygon points="215,0 207,10 223,10" fill="white" fillOpacity="0.35" />
              <rect x="210" y="50" width="10" height="10" rx="1" fill="white" fillOpacity="0.15" />
              <rect x="210" y="70" width="10" height="10" rx="1" fill="white" fillOpacity="0.15" />
              <rect x="310" y="50" width="60" height="90" rx="3" fill="white" fillOpacity="0.2" />
              <ellipse cx="340" cy="50" rx="30" ry="20" fill="white" fillOpacity="0.15" />
              <line x1="340" y1="30" x2="340" y2="20" stroke="white" strokeWidth="2" strokeOpacity="0.4" />
              <rect x="430" y="70" width="90" height="70" rx="3" fill="white" fillOpacity="0.2" />
              <polygon points="430,70 475,40 520,70" fill="white" fillOpacity="0.18" />
              <rect x="450" y="100" width="15" height="20" rx="1" fill="white" fillOpacity="0.12" />
              <rect x="475" y="100" width="15" height="20" rx="1" fill="white" fillOpacity="0.12" />
              <rect x="455" y="75" width="40" height="4" rx="1" fill="white" fillOpacity="0.2" />
              <g transform="rotate(-5, 590, 140)">
                <rect x="580" y="30" width="20" height="110" rx="2" fill="white" fillOpacity="0.2" />
                <ellipse cx="590" cy="30" rx="14" ry="6" fill="white" fillOpacity="0.25" />
                <rect x="583" y="55" width="14" height="3" rx="1" fill="white" fillOpacity="0.15" />
                <rect x="583" y="75" width="14" height="3" rx="1" fill="white" fillOpacity="0.15" />
                <rect x="583" y="95" width="14" height="3" rx="1" fill="white" fillOpacity="0.15" />
              </g>
              <rect x="660" y="55" width="80" height="85" rx="2" fill="white" fillOpacity="0.2" />
              <rect x="670" y="45" width="60" height="12" rx="2" fill="white" fillOpacity="0.25" />
              <rect x="675" y="70" width="8" height="40" rx="1" fill="white" fillOpacity="0.15" />
              <rect x="693" y="70" width="8" height="40" rx="1" fill="white" fillOpacity="0.15" />
              <rect x="711" y="70" width="8" height="40" rx="1" fill="white" fillOpacity="0.15" />
              <line x1="0" y1="140" x2="800" y2="140" stroke="white" strokeWidth="1" strokeOpacity="0.2" />
            </svg>
          </div>
        </div>
      </div>

      <div className="relative z-10 -mt-6 mx-auto max-w-4xl px-4">
        <div className="grid grid-cols-3 divide-x divide-gray-100 rounded-2xl border border-gray-100 bg-white shadow-lg shadow-gray-200/60 rtl:divide-x-reverse">
          <div className="flex flex-col items-center gap-1.5 px-3 py-5">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50">
              <Megaphone size={20} className="text-brand-500" />
            </div>
            <span className="tabular-nums text-xl font-black text-gray-800 md:text-2xl">۱۰۰۰+</span>
            <span className="text-xs font-medium text-gray-500">آگهی فعال</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-3 py-5">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
              <Building2 size={20} className="text-blue-500" />
            </div>
            <span className="tabular-nums text-xl font-black text-gray-800 md:text-2xl">۵۰+</span>
            <span className="text-xs font-medium text-gray-500">شهر اروپایی</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 px-3 py-5">
            <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
              <Users size={20} className="text-emerald-500" />
            </div>
            <span className="tabular-nums text-xl font-black text-gray-800 md:text-2xl">۱۰۰۰+</span>
            <span className="text-xs font-medium text-gray-500">کاربر فعال</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-24 md:pb-10">
        <section className="-mt-6 py-6 md:-mt-10">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="surface-panel p-5 md:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="section-kicker">شروع سریع</p>
                  <h2 className="mt-2 text-xl font-black text-slate-900 md:text-2xl">ورود سریع به بازار هر کشور</h2>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">انتخاب مقصد</span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {countryCards.map((c) => (
                  <Link
                    key={c.id}
                    href={`/search?country=${c.id}`}
                    className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-[radial-gradient(circle_at_top_right,_rgba(255,237,213,0.9),_rgba(255,255,255,0.95)_55%)] p-4 text-right transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_20px_45px_rgba(251,146,60,0.16)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex overflow-hidden rounded-xl border border-gray-200 shadow-sm">
                        <span className={`h-4 w-2.5 ${c.stripes[0]}`}></span>
                        <span className={`h-4 w-2.5 ${c.stripes[1]}`}></span>
                        <span className={`h-4 w-2.5 ${c.stripes[2]}`}></span>
                      </span>
                      <ArrowUpLeft size={16} className="text-slate-300 transition group-hover:text-orange-500" />
                    </div>
                    <div className="mt-6">
                      <p className="text-base font-bold text-slate-800">{c.label}</p>
                      <p className="mt-1 text-xs text-slate-500">{c.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div className="surface-panel surface-panel-dark p-5 md:p-6">
              <p className="section-kicker text-orange-200/90">چرا بازارینو</p>
              <h2 className="mt-2 text-xl font-black text-white">تجربه‌ای سریع‌تر و مطمئن‌تر برای آگهی‌های روزمره</h2>
              <div className="mt-5 space-y-3">
                {trustPoints.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                    <div className="mt-0.5 rounded-2xl bg-white/10 p-2 text-orange-200">
                      <Icon size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="mt-1 text-xs leading-6 text-white/65">{text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mb-4 py-2">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <BrainCircuit size={18} className="text-indigo-500" />
                <h3 className="text-base font-bold text-gray-800">هوش مصنوعی بازارینو</h3>
              </div>
              <p className="mb-3 text-sm text-gray-500">به‌زودی با تحلیل رفتار کاربران، آگهی‌های مرتبط را پیشنهاد می‌دهیم و میانگین قیمت منطقه را در ثبت آگهی نشان می‌دهیم.</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• پیشنهادگر آگهی‌های مشابه برای افزایش زمان ماندگاری</li>
                <li>• تخمین قیمت اتاق/ملک بر اساس داده‌های واقعی پلتفرم</li>
              </ul>
            </div>
            <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <div className="mb-2 flex items-center gap-2">
                <Rocket size={18} className="text-red-500" />
                <h3 className="text-base font-bold text-gray-800">درآمدزایی و دیده‌شدن</h3>
              </div>
              <p className="mb-3 text-sm text-gray-500">نردبان و فوری برای بیشتر دیده‌شدن آگهی‌ها فعال است. همچنین بیزینس‌ها می‌توانند پروفایل اختصاصی خود را بسازند.</p>
              <ul className="space-y-1 text-xs text-gray-600">
                <li>• نردبان: انتقال آگهی به صدر لیست</li>
                <li>• فوری: برچسب قرمز برای جلب توجه بیشتر</li>
                <li>• پروفایل بیزینسی برای خدمات ایرانیان اروپا</li>
              </ul>
            </div>
          </div>
        </section>

        {banners.length > 0 && (
          <section className="py-5">
            <div className="grid gap-3 md:grid-cols-3">
              {banners.map((banner: any) => (
                <Link key={banner._id} href={banner.linkUrl || '#'} className="block overflow-hidden rounded-2xl border border-gray-100 transition-shadow hover:shadow-md">
                  <div className="relative h-28 md:h-32">
                    <Image src={banner.imageUrl} alt={banner.title || 'banner'} fill className="object-cover" />
                    {banner.title && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                        <p className="line-clamp-1 text-xs font-semibold text-white">{banner.title}</p>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="py-6">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="section-kicker">دسترسی سریع</p>
              <h2 className="mt-2 text-lg font-black text-slate-900">دسته‌بندی‌های پرکاربرد</h2>
            </div>
            <span className="hidden rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500 md:inline-flex">
              {toFaDigits(CATEGORIES.length)} دسته فعال
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 lg:grid-cols-10">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/search?category=${cat.id}`}
                className="group flex h-24 flex-col items-center justify-center gap-2 rounded-[1.5rem] border border-white bg-white/90 p-2 shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_16px_35px_rgba(251,146,60,0.16)] sm:h-28 md:h-32"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100 text-orange-600 transition-transform group-hover:scale-105 sm:h-11 sm:w-11">
                  <CategoryIcon categoryId={cat.id} size={18} className="text-orange-600" />
                </span>
                <span className="max-w-[84px] truncate text-center text-[11px] leading-tight text-slate-600 sm:text-xs">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mb-6">
          <div className="surface-panel px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="section-kicker">شهرها</p>
                <h2 className="mt-1 text-base font-bold text-slate-900">فیلتر سریع بر اساس شهر</h2>
              </div>
              <span className="text-xs text-slate-400">اسکرول افقی</span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <Link href="/search" className="flex-shrink-0 rounded-full bg-brand-500 px-3 py-2 text-xs font-medium text-white shadow-lg shadow-orange-200/50">
                <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> همه شهرها</span>
              </Link>
              {CITIES.slice(0, 8).map((city) => (
                <Link
                  key={city.value}
                  href={`/search?city=${city.value}`}
                  className="flex-shrink-0 whitespace-nowrap rounded-full border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 transition-colors hover:border-brand-300 hover:text-brand-600"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <CityIcon city={city.value} size={12} />
                    {city.label}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-6">
          <div className="rounded-3xl border border-gray-100 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <PackageSearch size={18} className="text-brand-500" />
              <h2 className="text-base font-bold text-gray-800">محبوب‌ترین نیازهای «متقاضی / هم‌خونه»</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/search?category=requests&subcategory=roommate-request" className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-700">هم‌خونه ایرانی</Link>
              <Link href="/search?category=requests&subcategory=roommate-request&preferredGender=female" className="rounded-full border border-pink-100 bg-pink-50 px-3 py-1.5 text-xs text-pink-700">هم‌خونه خانم</Link>
              <Link href="/search?category=requests&subcategory=roommate-request&preferredGender=male" className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs text-sky-700">هم‌خونه آقا</Link>
              <Link href="/search?category=requests&subcategory=cargo-passenger" className="rounded-full border border-orange-100 bg-orange-50 px-3 py-1.5 text-xs text-orange-700">ارسال بار / مسافر</Link>
            </div>
          </div>
        </section>

        <section className="py-6">
          <div className="mb-6 text-center">
            <h2 className="mb-1 text-lg font-bold text-gray-800">چطوری کار می‌کنه؟</h2>
            <p className="text-sm text-gray-400">تنها با ۳ قدم ساده آگهی خود را ثبت کنید</p>
          </div>
          <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-3">
            <div className="relative rounded-2xl border border-gray-100 bg-white p-5 text-center transition-shadow hover:shadow-lg hover:shadow-orange-100/40">
              <div className="absolute -top-3 right-1/2 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white shadow-md shadow-orange-200">۱</div>
              <div className="mx-auto mb-3 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50">
                <UserPlus size={26} className="text-brand-500" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-800">ثبت‌نام کنید</h3>
              <p className="text-xs leading-relaxed text-gray-400">یک حساب کاربری رایگان بسازید و وارد پنل خود شوید</p>
            </div>
            <div className="relative rounded-2xl border border-gray-100 bg-white p-5 text-center transition-shadow hover:shadow-lg hover:shadow-blue-100/40">
              <div className="absolute -top-3 right-1/2 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow-md shadow-blue-200">۲</div>
              <div className="mx-auto mb-3 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50">
                <FileText size={26} className="text-blue-500" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-800">آگهی ثبت کنید</h3>
              <p className="text-xs leading-relaxed text-gray-400">عکس و توضیحات محصول خود را اضافه کنید</p>
            </div>
            <div className="relative rounded-2xl border border-gray-100 bg-white p-5 text-center transition-shadow hover:shadow-lg hover:shadow-emerald-100/40">
              <div className="absolute -top-3 right-1/2 flex h-7 w-7 translate-x-1/2 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-200">۳</div>
              <div className="mx-auto mb-3 mt-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                <ShoppingBag size={26} className="text-emerald-500" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-gray-800">بفروشید!</h3>
              <p className="text-xs leading-relaxed text-gray-400">با خریداران ارتباط بگیرید و معامله کنید</p>
            </div>
          </div>
        </section>

        {featuredAds.length > 0 && (
          <section className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp size={18} className="text-brand-500" />
                <div>
                  <p className="section-kicker">پیشنهاد ویژه</p>
                  <h2 className="mt-1 text-lg font-black text-slate-900">آگهی‌های ویژه</h2>
                </div>
              </div>
              <Link href="/search?featured=true" className="flex items-center gap-1 text-sm text-brand-500">
                همه <ChevronLeft size={14} />
              </Link>
            </div>
            <div className="grid auto-rows-fr grid-cols-2 gap-3 items-stretch md:grid-cols-4">
              {featuredAds.map((ad: any) => (
                <AdCard key={ad._id} ad={ad} />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="section-kicker">به‌روزترین‌ها</p>
              <h2 className="mt-1 text-lg font-black text-slate-900">جدیدترین آگهی‌ها</h2>
            </div>
            <Link href="/search" className="flex items-center gap-1 text-sm text-brand-500">
              همه <ChevronLeft size={14} />
            </Link>
          </div>

          <LatestAdsSection initialAds={latestAds} initialHasMore={latestAdsData.hasMore} />
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
