import Link from 'next/link';
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-4 pb-24 md:pb-10">
        <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-5 mb-4">
          <h1 className="text-xl font-bold text-gray-800 mb-1">رزرو خونه</h1>
          <p className="text-sm text-gray-500 mb-4">بازه تاریخی انتخاب کن تا فقط خانه‌های فعال و آزاد در همان بازه را ببینی.</p>

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
        </div>

        {!hasDates ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-500">
            لطفاً تاریخ ورود و خروج را انتخاب کنید.
          </div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <p className="text-gray-600 mb-2">در این بازه زمانی خانه آزادی پیدا نشد.</p>
            <Link href="/search?category=real-estate" className="text-sm text-brand-600 underline">مشاهده همه آگهی‌های مسکن</Link>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              {toFaDigits(ads.length)} خانه آزاد برای بازه {toFaDigits(nights)} شب
              {searchParams.city ? ` در ${getCityLabel(searchParams.city)}` : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ads.map((ad: any) => {
                const totalPrice = Number(ad?.price || 0) * nights;
                return (
                  <div key={ad._id} className="space-y-2">
                    <AdCard ad={ad} />
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2 text-xs text-indigo-800">
                      مجموع برای {toFaDigits(nights)} شب:{' '}
                      <span className="font-bold">{ad.priceType === 'fixed' && ad.price ? `€${formatFaNumber(totalPrice)}` : 'توافقی'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
