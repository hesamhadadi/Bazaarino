import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AdCard from '@/components/ads/AdCard';
import { CATEGORIES, CITIES } from '@/lib/constants';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';

interface SearchParams {
  q?: string;
  city?: string;
  category?: string;
  page?: string;
}

async function searchAds(params: SearchParams) {
  try {
    await connectDB();

    const query: any = { status: 'approved' };

    if (params.city) query.city = params.city;
    if (params.category) query.category = params.category;
    if (params.q) {
      query.$or = [
        { title: { $regex: params.q, $options: 'i' } },
        { description: { $regex: params.q, $options: 'i' } },
      ];
    }

    const page = parseInt(params.page || '1');
    const limit = 20;
    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      Ad.find(query).sort({ isFeatured: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Ad.countDocuments(query),
    ]);

    return { ads: JSON.parse(JSON.stringify(ads)), total, page, totalPages: Math.ceil(total / limit) };
  } catch {
    return { ads: [], total: 0, page: 1, totalPages: 0 };
  }
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const { ads, total, page, totalPages } = await searchAds(searchParams);
  const selectedCategory = CATEGORIES.find(c => c.id === searchParams.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4 pb-24 md:pb-10">
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

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Link
              href={`/search${searchParams.q ? `?q=${searchParams.q}` : ''}`}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                !searchParams.city ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              همه شهرها
            </Link>
            {CITIES.map(city => (
              <Link
                key={city.value}
                href={`/search?${new URLSearchParams({ ...searchParams, city: city.value }).toString()}`}
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
            href={`/search${searchParams.q ? `?q=${searchParams.q}` : ''}${searchParams.city ? `&city=${searchParams.city}` : ''}`}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs border transition-colors ${
              !searchParams.category ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            همه دسته‌ها
          </Link>
          {CATEGORIES.map(cat => (
            <Link
              key={cat.id}
              href={`/search?${new URLSearchParams({ ...searchParams, category: cat.id }).toString()}`}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors ${
                searchParams.category === cat.id ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </Link>
          ))}
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
                    href={`/search?${new URLSearchParams({ ...searchParams, page: String(page - 1) }).toString()}`}
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
                    href={`/search?${new URLSearchParams({ ...searchParams, page: String(page + 1) }).toString()}`}
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
