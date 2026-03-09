import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AdCard from '@/components/ads/AdCard';
import { CATEGORIES, CITIES } from '@/lib/constants';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Banner from '@/models/Banner';
import HousingCityImage from '@/models/HousingCityImage';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';

interface SearchParams {
  q?: string;
  city?: string;
  category?: string;
  subcategory?: string;
  minPrice?: string;
  maxPrice?: string;
  priceType?: string;
  featured?: string;
  hasImage?: string;
  residence?: string;
  sort?: string;
  page?: string;
}

function withParams(params: SearchParams, updates: Record<string, string | undefined>) {
  const merged: Record<string, string> = {};
  const base = { ...params, ...updates };

  Object.entries(base).forEach(([key, value]) => {
    if (value && value !== 'all') merged[key] = value;
  });

  return new URLSearchParams(merged).toString();
}

async function searchAds(params: SearchParams) {
  try {
    await connectDB();

    const query: any = { status: 'approved' };

    if (params.city) query.city = params.city;
    if (params.category) query.category = params.category;
    if (params.subcategory) query.subcategory = params.subcategory;
    if (params.featured === 'true') query.isFeatured = true;
    if (params.hasImage === 'true') query.images = { $exists: true, $ne: [] };
    if (params.residence === 'yes') query['housing.residenceEligible'] = true;
    if (params.residence === 'no') query['housing.residenceEligible'] = { $ne: true };
    if (params.priceType && params.priceType !== 'all') query.priceType = params.priceType;

    if (params.minPrice || params.maxPrice) {
      query.price = {};
      if (params.minPrice) query.price.$gte = Number(params.minPrice);
      if (params.maxPrice) query.price.$lte = Number(params.maxPrice);
    }

    if (params.q) {
      query.$or = [
        { title: { $regex: params.q, $options: 'i' } },
        { description: { $regex: params.q, $options: 'i' } },
      ];
    }

    const page = parseInt(params.page || '1');
    const limit = 20;
    const skip = (page - 1) * limit;
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { isFeatured: -1, createdAt: -1 },
      oldest: { createdAt: 1 },
      priceAsc: { price: 1, createdAt: -1 },
      priceDesc: { price: -1, createdAt: -1 },
      popular: { views: -1, createdAt: -1 },
    };
    const sortOption = sortMap[params.sort || 'newest'] || sortMap.newest;

    const [ads, total] = await Promise.all([
      Ad.find(query).sort(sortOption).skip(skip).limit(limit).lean(),
      Ad.countDocuments(query),
    ]);

    return { ads: JSON.parse(JSON.stringify(ads)), total, page, totalPages: Math.ceil(total / limit) };
  } catch {
    return { ads: [], total: 0, page: 1, totalPages: 0 };
  }
}

async function getCategoryBanners(category?: string) {
  if (!category) return [];
  try {
    await connectDB();
    const now = new Date();
    const banners = await Banner.find({
      isActive: true,
      placement: 'category',
      categoryId: category,
      startsAt: { $lte: now },
      endsAt: { $gte: now },
    })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();
    return JSON.parse(JSON.stringify(banners));
  } catch {
    return [];
  }
}

async function getHousingCityImage(city?: string, category?: string) {
  if (!city || category !== 'real-estate') return null;
  try {
    await connectDB();
    const item = await HousingCityImage.findOne({ city, isActive: true }).lean();
    return item ? JSON.parse(JSON.stringify(item)) : null;
  } catch {
    return null;
  }
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const [{ ads, total, page, totalPages }, categoryBanners, housingCityImage] = await Promise.all([
    searchAds(searchParams),
    getCategoryBanners(searchParams.category),
    getHousingCityImage(searchParams.city, searchParams.category),
  ]);
  const selectedCategory = CATEGORIES.find(c => c.id === searchParams.category);
  const selectedSubcategories = selectedCategory?.subcategories || [];
  const selectedCity = CITIES.find((c) => c.value === searchParams.city);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4 pb-24 md:pb-10">
        {selectedCity && (
          <div
            className="rounded-2xl overflow-hidden h-40 md:h-52 relative mb-4 border border-gray-200"
            style={{
              backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.45), rgba(0,0,0,0.05)), url(${housingCityImage?.imageUrl || `https://source.unsplash.com/1600x500/?${selectedCity.value},italy,city`})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="absolute inset-0 flex items-end p-4">
              <div className="text-white">
                <p className="text-xs opacity-90">شهر انتخابی</p>
                <h2 className="text-xl md:text-2xl font-bold">{selectedCity.label}</h2>
                {housingCityImage?.title && <p className="text-xs mt-1 opacity-90">{housingCityImage.title}</p>}
              </div>
            </div>
          </div>
        )}

        {categoryBanners.length > 0 && (
          <div className="grid md:grid-cols-2 gap-3 mb-4">
            {categoryBanners.map((b: any) => (
              <Link key={b._id} href={b.linkUrl || '#'} className="block rounded-2xl overflow-hidden border border-gray-100">
                <div className="relative h-24 md:h-28">
                  <img src={b.imageUrl} alt={b.title || 'banner'} className="w-full h-full object-cover" />
                  {b.title && (
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                      <p className="text-white text-xs font-semibold line-clamp-1">{b.title}</p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Search header */}
        <div className="mb-4">
          <form method="GET" className="flex gap-2 mb-4">
            <input
              type="text"
              name="q"
              defaultValue={searchParams.q}
              placeholder="جستجو در آگهی‌ها..."
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
            />
            <button type="submit" className="bg-brand-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium">
              جستجو
            </button>
          </form>

          {/* City Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Link
              href={`/search?${withParams(searchParams, { city: undefined, page: undefined })}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                !searchParams.city ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              همه شهرها
            </Link>
            {CITIES.map(city => (
              <Link
                key={city.value}
                href={`/search?${withParams(searchParams, { city: city.value, page: undefined })}`}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                  searchParams.city === city.value ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200'
                }`}
              >
                {city.label.split(' ')[0]}
              </Link>
            ))}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          <Link
            href={`/search?${withParams(searchParams, { category: undefined, subcategory: undefined, page: undefined })}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              !searchParams.category ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            همه دسته‌ها
          </Link>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              href={`/search?${withParams(searchParams, { category: cat.id, subcategory: undefined, page: undefined })}`}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                searchParams.category === cat.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
        </div>

        {/* Extra filters */}
        <div className="bg-white rounded-2xl border border-gray-100 p-3 md:p-4 mb-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
            <SlidersHorizontal size={16} />
            فیلتر پیشرفته
          </div>
          <form method="GET" className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <input type="hidden" name="q" value={searchParams.q || ''} />
            <input type="hidden" name="city" value={searchParams.city || ''} />
            <input type="hidden" name="category" value={searchParams.category || ''} />

            <select name="subcategory" defaultValue={searchParams.subcategory || ''} className="border border-gray-200 rounded-xl px-3 py-2 text-xs">
              <option value="">همه زیردسته‌ها</option>
              {selectedSubcategories.map((sub) => (
                <option key={sub.value} value={sub.value}>{sub.label}</option>
              ))}
            </select>

            <input name="minPrice" defaultValue={searchParams.minPrice || ''} placeholder="حداقل قیمت (€)" className="border border-gray-200 rounded-xl px-3 py-2 text-xs" />
            <input name="maxPrice" defaultValue={searchParams.maxPrice || ''} placeholder="حداکثر قیمت (€)" className="border border-gray-200 rounded-xl px-3 py-2 text-xs" />

            <select name="priceType" defaultValue={searchParams.priceType || 'all'} className="border border-gray-200 rounded-xl px-3 py-2 text-xs">
              <option value="all">همه نوع قیمت</option>
              <option value="fixed">قیمت ثابت</option>
              <option value="negotiable">توافقی</option>
              <option value="free">رایگان</option>
              <option value="exchange">معاوضه</option>
            </select>

            <select name="sort" defaultValue={searchParams.sort || 'newest'} className="border border-gray-200 rounded-xl px-3 py-2 text-xs">
              <option value="newest">جدیدترین</option>
              <option value="popular">پربازدیدترین</option>
              <option value="priceAsc">ارزان‌ترین</option>
              <option value="priceDesc">گران‌ترین</option>
              <option value="oldest">قدیمی‌ترین</option>
            </select>

            <select name="residence" defaultValue={searchParams.residence || ''} className="border border-gray-200 rounded-xl px-3 py-2 text-xs">
              <option value="">رزیدنسا: همه</option>
              <option value="yes">فقط دارای رزیدنسا</option>
              <option value="no">فقط بدون رزیدنسا</option>
            </select>

            <div className="flex items-center gap-3 col-span-2 md:col-span-6 text-xs text-gray-600 mt-1">
              <label className="flex items-center gap-1">
                <input type="checkbox" name="featured" value="true" defaultChecked={searchParams.featured === 'true'} />
                فقط ویژه
              </label>
              <label className="flex items-center gap-1">
                <input type="checkbox" name="hasImage" value="true" defaultChecked={searchParams.hasImage === 'true'} />
                فقط دارای عکس
              </label>
              <button type="submit" className="ms-auto bg-gray-800 text-white px-4 py-2 rounded-xl text-xs">اعمال فیلتر</button>
            </div>
          </form>
        </div>

        {/* Price range chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          <Link href={`/search?${withParams(searchParams, { minPrice: undefined, maxPrice: undefined, page: undefined })}`} className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs border ${!searchParams.minPrice && !searchParams.maxPrice ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-600 border-gray-200'}`}>
            همه قیمت‌ها
          </Link>
          <Link href={`/search?${withParams(searchParams, { minPrice: '0', maxPrice: '100', page: undefined })}`} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs border bg-white text-gray-600 border-gray-200">تا 100€</Link>
          <Link href={`/search?${withParams(searchParams, { minPrice: '100', maxPrice: '300', page: undefined })}`} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs border bg-white text-gray-600 border-gray-200">100€ تا 300€</Link>
          <Link href={`/search?${withParams(searchParams, { minPrice: '300', maxPrice: '700', page: undefined })}`} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs border bg-white text-gray-600 border-gray-200">300€ تا 700€</Link>
          <Link href={`/search?${withParams(searchParams, { minPrice: '700', maxPrice: undefined, page: undefined })}`} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs border bg-white text-gray-600 border-gray-200">700€ به بالا</Link>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {total > 0 ? `${total.toLocaleString('fa-IR')} آگهی یافت شد` : 'آگهی‌ای یافت نشد'}
          </p>
          {selectedCategory && (
            <span className={`text-xs px-2 py-1 rounded-full ${selectedCategory.color}`}>
              {selectedCategory.icon} {selectedCategory.label}
            </span>
          )}
        </div>

        {/* Ads Grid */}
        {ads.length > 0 ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {ads.map((ad: any) => (
                <AdCard key={ad._id} ad={ad} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {page > 1 && (
                  <Link
                    href={`/search?${withParams(searchParams, { page: String(page - 1) })}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
                  >
                    قبلی
                  </Link>
                )}
                <span className="px-4 py-2 bg-brand-500 text-white rounded-xl text-sm">
                  {page} از {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/search?${withParams(searchParams, { page: String(page + 1) })}`}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
                  >
                    بعدی
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-600 font-medium mb-2">نتیجه‌ای یافت نشد</p>
            <p className="text-gray-400 text-sm mb-4">فیلترهای خود را تغییر دهید</p>
            <Link href="/search" className="text-brand-500 text-sm underline">پاک کردن فیلترها</Link>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
