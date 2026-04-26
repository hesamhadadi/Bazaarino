import Link from 'next/link';
import { Search } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AdCard from '@/components/ads/AdCard';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Reservation from '@/models/Reservation';
import { CITIES, COUNTRIES, getCityLabel } from '@/lib/constants';
import { attachMarketPriceToAds } from '@/lib/market-price';
import ReservationSearchForm from '@/components/reservations/ReservationSearchForm';
import {
  calculateNights,
  overlapQuery,
  parseDateOnlyInput,
  RENTAL_REAL_ESTATE_SUBCATEGORIES,
} from '@/lib/reservation';
import { formatFaNumber, toFaDigits } from '@/lib/locale';

export const dynamic = 'force-dynamic';

type SearchParams = {
  country?: string;
  city?: string;
  startDate?: string;
  endDate?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
};

const RESERVATION_SORT_MAP: Record<string, Record<string, 1 | -1>> = {
  newest: { isFeatured: -1, bumpedAt: -1, createdAt: -1 },
  priceAsc: { price: 1, createdAt: -1 },
  priceDesc: { price: -1, createdAt: -1 },
};

function parseNonNegativeNumber(value?: string): number | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized) return null;
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return parsed;
}

async function getAvailableHomes(params: SearchParams) {
  const startDate = parseDateOnlyInput(params.startDate);
  const endDate = parseDateOnlyInput(params.endDate);
  if (!startDate || !endDate) return { ads: [], nights: 0, hasDates: false };

  const nights = calculateNights(startDate, endDate);
  if (nights < 1) return { ads: [], nights: 0, hasDates: true };

  await connectDB();

  const baseQuery: any = {
    status: 'approved',
    category: 'real-estate',
    subcategory: { $in: RENTAL_REAL_ESTATE_SUBCATEGORIES },
    listingMode: { $ne: 'request' },
    'housing.allowReservations': true,
  };
  if (params.country) baseQuery.country = params.country;
  if (params.city) baseQuery.city = params.city;
  if (params.minPrice || params.maxPrice) {
    baseQuery.price = {};
    const minPrice = parseNonNegativeNumber(params.minPrice);
    const maxPrice = parseNonNegativeNumber(params.maxPrice);
    if (minPrice !== null) baseQuery.price.$gte = minPrice;
    if (maxPrice !== null) baseQuery.price.$lte = maxPrice;
    if (Object.keys(baseQuery.price).length === 0) delete baseQuery.price;
  }

  const overlapping = await Reservation.find({
    status: 'approved',
    ...overlapQuery(startDate, endDate),
  })
    .select('adId')
    .lean<any[]>();

  const blockedAdIds = overlapping.map((item) => item.adId);
  if (blockedAdIds.length > 0) {
    baseQuery._id = { $nin: blockedAdIds };
  }

  const sortOption = RESERVATION_SORT_MAP[params.sort || 'newest'] || RESERVATION_SORT_MAP.newest;

  const ads = await Ad.find(baseQuery)
    .populate('userId', 'name avatar role')
    .sort(sortOption)
    .limit(60)
    .lean();

  const now = new Date();
  const normalized = ads.map((ad: any) => ({
    ...ad,
    isFeatured: ad.isFeatured && (!ad.featuredUntil || new Date(ad.featuredUntil) >= now),
  }));

  const normalizedWithMarketPrice = await attachMarketPriceToAds(normalized as any[]);
  return {
    ads: JSON.parse(JSON.stringify(normalizedWithMarketPrice)),
    nights,
    hasDates: true,
  };
}

export default async function HouseReservationPage({ searchParams }: { searchParams: SearchParams }) {
  const { ads, nights, hasDates } = await getAvailableHomes(searchParams);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-orange-50/50 to-white">
        <div className="max-w-5xl mx-auto px-4 pt-8 pb-6 md:pt-12 md:pb-8">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-orange-600 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            رزرو کوتاه‌مدت
          </div>
          <h1 className="text-2xl md:text-4xl font-black text-gray-900 leading-tight tracking-tight">
            خونه‌ای دنج برای روزهای بعدی پیدا کن
          </h1>
          <p className="mt-2 text-sm md:text-base text-gray-600 max-w-xl leading-7">
            تاریخ ورود و خروج رو انتخاب کن تا فقط خونه‌هایی که توی همون بازه آزادن نمایش داده بشه.
          </p>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 py-6 pb-28 md:pb-12">
        <ReservationSearchForm
          countries={COUNTRIES}
          cities={CITIES}
          initialCountry={searchParams.country || ''}
          initialCity={searchParams.city || ''}
          initialStartDate={searchParams.startDate || ''}
          initialEndDate={searchParams.endDate || ''}
          initialMinPrice={searchParams.minPrice || ''}
          initialMaxPrice={searchParams.maxPrice || ''}
          initialSort={searchParams.sort || 'newest'}
          showAdvancedFilters
        />

        <div className="mt-8">
          {!hasDates ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                <Search size={18} />
              </div>
              <p className="text-base font-semibold text-gray-800 mb-1">
                تاریخ ورود و خروج رو انتخاب کن
              </p>
              <p className="text-sm text-gray-500">
                نتایج بر اساس بازه‌ی تاریخی که انتخاب می‌کنی فیلتر می‌شن.
              </p>
            </div>
          ) : ads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-12 text-center">
              <p className="text-base font-semibold text-gray-800 mb-2">
                توی این بازه خونه‌ی آزادی پیدا نشد
              </p>
              <p className="text-sm text-gray-500 mb-4">
                با تاریخ یا شهر دیگه امتحان کن.
              </p>
              <Link
                href="/search?category=real-estate"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700"
              >
                مشاهده همه آگهی‌های مسکن
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 mb-4">
                <h2 className="text-lg md:text-xl font-black text-gray-900">
                  {toFaDigits(ads.length)} خونه آزاد
                </h2>
                <span className="text-xs text-gray-500">
                  بازه‌ی {toFaDigits(nights)} شب
                  {searchParams.city ? ` · ${getCityLabel(searchParams.city)}` : ''}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.map((ad: any) => {
                  const totalPrice = Number(ad?.price || 0) * nights;
                  return (
                    <div key={ad._id} className="space-y-2">
                      <AdCard ad={ad} />
                      <div className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-2 text-xs text-orange-800 flex items-center justify-between gap-2">
                        <span>مجموع برای {toFaDigits(nights)} شب</span>
                        <span className="font-bold">
                          {ad.priceType === 'fixed' && ad.price
                            ? `€${formatFaNumber(totalPrice)}`
                            : 'توافقی'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
