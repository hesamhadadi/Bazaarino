import { notFound } from 'next/navigation';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import Rating from '@/models/Rating';
import '@/models/User';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AdImageGallery from '@/components/ads/AdImageGallery';
import FavoriteButton from '@/components/ads/FavoriteButton';
import CategoryIcon from '@/components/ui/CategoryIcon';
import { StarRating } from '@/components/ui/StarRating';
import RateUser from '@/components/ads/RateUser';
import ReportForm from '@/components/ads/ReportForm';
import StartChatButton from '@/components/ads/StartChatButton';
import MarketPriceBadge from '@/components/ads/MarketPriceBadge';
import ReservationRequestForm from '@/components/reservations/ReservationRequestForm';
import Image from 'next/image';
import { CATEGORIES, getCityLabel, getCountryLabel, getCountryByCity } from '@/lib/constants';
import { MapPin, Clock, Eye, Phone, Mail, Tag, ChevronRight, Share2, Users, BadgeCheck, ShoppingCart, GraduationCap, Train, Bus, Send, MessageCircle, Sparkles, Siren, ArrowUp, FileText, Landmark, Shield } from 'lucide-react';
import { formatFaNumber, toFaDigits } from '@/lib/locale';
import nextDynamic from 'next/dynamic';
import mongoose from 'mongoose';
import { getMarketPriceSnapshot } from '@/lib/market-price';
import { RENTAL_REAL_ESTATE_SUBCATEGORIES } from '@/lib/reservation';

const HousingLocationPreview = nextDynamic(() => import('@/components/maps/HousingLocationPreview'), { ssr: false });

export const dynamic = 'force-dynamic';

async function getAd(id: string) {
  try {
    await connectDB();
    const ad = await Ad.findById(id)
      .populate('userId', 'name avatar phone email city createdAt role telegram identityStatus')
      .lean();

    if (!ad) {
      return null;
    }

    // Keep view counting separate to avoid null results from findAndUpdate edge-cases.
    await Ad.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return JSON.parse(JSON.stringify(ad));
  } catch (error) {
    console.error('Ad detail getAd error:', error);
    return null;
  }
}

async function getUserRating(userId?: string) {
  if (!userId) return { avg: 0, count: 0 };
  await connectDB();
  const summary = await Rating.aggregate([
    { $match: { targetUserId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$targetUserId', avg: { $avg: '$score' }, count: { $sum: 1 } } },
  ]);
  const data = summary[0] || { avg: 0, count: 0 };
  return { avg: Number(data.avg || 0), count: Number(data.count || 0) };
}

function formatPrice(price?: number, priceType?: string): string {
  if (priceType === 'free') return 'رایگان';
  if (priceType === 'negotiable') return 'توافقی';
  if (priceType === 'exchange') return 'معاوضه';
  if (!price) return 'توافقی';
  return `€${formatFaNumber(price)}`;
}

function preferredGenderLabel(value?: string): string {
  if (value === 'female') return 'خانم';
  if (value === 'male') return 'آقا';
  return 'فرقی ندارد';
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'همین الان';
  if (diff < 3600) return `${toFaDigits(Math.floor(diff / 60))} دقیقه پیش`;
  if (diff < 86400) return `${toFaDigits(Math.floor(diff / 3600))} ساعت پیش`;
  if (diff < 2592000) return `${toFaDigits(Math.floor(diff / 86400))} روز پیش`;
  return `${toFaDigits(Math.floor(diff / 2592000))} ماه پیش`;
}

function billsInfoLabel(value?: string): string {
  if (value === 'included') return 'قبض‌ها شامل اجاره است';
  if (value === 'not-included') return 'قبض‌ها جداگانه است';
  if (value === 'partial') return 'بخشی از قبض‌ها شامل است';
  return 'ثبت نشده';
}

function formatDateFa(date?: string | Date): string {
  if (!date) return 'ثبت نشده';
  const value = new Date(date);
  if (isNaN(value.getTime())) return 'ثبت نشده';
  return value.toLocaleDateString('fa-IR');
}

export default async function AdDetailPage({ params }: { params: { id: string } }) {
  const ad = await getAd(params.id);
  if (!ad) notFound();
  const ratingSummary = await getUserRating(ad.userId?._id?.toString());
  const now = new Date();
  const isFeaturedActive = ad.isFeatured && (!ad.featuredUntil || new Date(ad.featuredUntil) >= now);
  const isUrgentActive = ad.isUrgent === true;

  const category = CATEGORIES.find(c => c.id === ad.category);
  const countryLabel = getCountryLabel(ad.country || getCountryByCity(ad.city));
  const subcategory = category?.subcategories?.find((s: any) => s.value === ad.subcategory);
  const marketPrice = ad.category === 'real-estate' && ad.priceType === 'fixed' && ad.price
    ? await getMarketPriceSnapshot({
        city: ad.city,
        category: ad.category,
        subcategory: ad.subcategory,
        excludeAdId: String(ad._id),
      })
    : null;
  const isReservableHousing =
    ad.category === 'real-estate' &&
    RENTAL_REAL_ESTATE_SUBCATEGORIES.includes(ad.subcategory as any) &&
    (ad.listingMode || 'offer') === 'offer';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-4 pb-24 md:pb-10">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-gray-600">خانه</Link>
          <ChevronRight size={12} />
          <Link href={`/search?category=${ad.category}`} className="hover:text-gray-600">
            <span className="inline-flex items-center gap-1">
              <CategoryIcon categoryId={ad.category} size={13} />
              {category?.label}
            </span>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              {ad.images?.length > 0 ? (
                <AdImageGallery images={ad.images} title={ad.title} />
              ) : (
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                  <CategoryIcon categoryId={ad.category} size={56} className="text-gray-400" />
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 leading-snug">{ad.title}</h1>
                  {isFeaturedActive && (
                    <div className="inline-flex mt-2 items-center gap-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-xs px-2.5 py-1 rounded-full">
                      <Sparkles size={12} /> آگهی ویژه
                    </div>
                  )}
                  {isUrgentActive && (
                    <div className="inline-flex mt-2 me-2 items-center gap-1 bg-red-600 text-white text-xs px-2.5 py-1 rounded-full">
                      <Siren size={12} /> فوری
                    </div>
                  )}
                  {(ad.bumpCount || 0) > 0 && (
                    <div className="inline-flex mt-2 items-center gap-1 bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full">
                      <ArrowUp size={12} /> نردبان‌شده
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <FavoriteButton adId={ad._id} className="w-9 h-9 border border-gray-200" />
                  <Share2 size={18} className="text-gray-400 flex-shrink-0 mt-1" />
                </div>
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">{formatPrice(ad.price, ad.priceType)}</div>
              {ad.category === 'real-estate' && (
                <div className="mb-4">
                  <MarketPriceBadge price={ad.price} marketPrice={marketPrice || undefined} />
                </div>
              )}
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                  <MapPin size={12} /> {getCityLabel(ad.city)} · {countryLabel}
                </span>
                {subcategory && (
                  <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                    <Tag size={12} /> {subcategory.label}
                  </span>
                )}
                {ad.listingMode === 'request' && (
                  <span className="flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                    <FileText size={12} /> متقاضی
                  </span>
                )}
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                  <Eye size={12} /> {toFaDigits(ad.views)} بازدید
                </span>
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                  <Clock size={12} /> {timeAgo(ad.createdAt)}
                </span>
                {ad.category === 'real-estate' && ad.housing?.residenceEligible && (
                  <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                    <Landmark size={12} /> رزیدنسا دارد
                  </span>
                )}
                {ad.fraudReportCount > 0 && (
                  <span className="flex items-center gap-1 bg-red-50 text-red-600 text-xs px-3 py-1.5 rounded-full font-semibold">
                    گزارش کلاه‌برداری: {toFaDigits(ad.fraudReportCount)}
                  </span>
                )}
              </div>
              <h2 className="font-semibold text-gray-800 mb-2">توضیحات</h2>
              <p className="text-gray-600 text-sm leading-loose whitespace-pre-wrap">{ad.description}</p>

              {ad.category === 'real-estate' && (
                <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">رهن</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {ad.housing?.deposit ? `€${formatFaNumber(Number(ad.housing.deposit))}` : 'ثبت نشده'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">تاریخ شروع</p>
                    <p className="text-sm font-semibold text-gray-700">{formatDateFa(ad.housing?.availabilityStartDate)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">وضعیت قبض‌ها</p>
                    <p className="text-sm font-semibold text-gray-700">{billsInfoLabel(ad.housing?.billsInfo)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">مبلغ agency</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {ad.housing?.agencyFee !== undefined && ad.housing?.agencyFee !== null ? `€${formatFaNumber(Number(ad.housing.agencyFee))}` : 'ثبت نشده'}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${ad.housing?.residenceEligible ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-400 mb-1">رزیدنسا</p>
                    <p className={`text-sm font-semibold flex items-center gap-1 ${ad.housing?.residenceEligible ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {ad.housing?.residenceEligible && <BadgeCheck size={14} />}
                      {ad.housing?.residenceEligible ? 'دارد' : 'ندارد'}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${
                    ad.housing?.preferredGender === 'female'
                      ? 'bg-pink-50 border border-pink-100'
                      : ad.housing?.preferredGender === 'male'
                        ? 'bg-sky-50 border border-sky-100'
                        : 'bg-gray-50'
                  }`}>
                    <p className="text-xs text-gray-400 mb-1">مناسب برای</p>
                    <p className="text-sm font-semibold text-gray-700">{preferredGenderLabel(ad.housing?.preferredGender)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">بازه سنی دلخواه</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {ad.housing?.preferredAgeMin !== undefined && ad.housing?.preferredAgeMax !== undefined
                        ? `${toFaDigits(ad.housing.preferredAgeMin)} تا ${toFaDigits(ad.housing.preferredAgeMax)}`
                        : ad.housing?.preferredAgeMin !== undefined
                          ? `${toFaDigits(ad.housing.preferredAgeMin)} به بالا`
                          : ad.housing?.preferredAgeMax !== undefined
                            ? `تا ${toFaDigits(ad.housing.preferredAgeMax)}`
                            : 'ثبت نشده'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">دانشگاه دلخواه</p>
                    <p className="text-sm font-semibold text-gray-700">{ad.housing?.preferredUniversity || 'ثبت نشده'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">تعداد هم‌خانه</p>
                    <p className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                      <Users size={14} className="text-gray-500" />
                      {ad.housing?.roommatesCount !== undefined && ad.housing?.roommatesCount !== null ? toFaDigits(ad.housing.roommatesCount) : 'ثبت نشده'}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${ad.housing?.isAllInclusivePrice ? 'bg-emerald-50 border border-emerald-100' : 'bg-gray-50'}`}>
                    <p className="text-xs text-gray-400 mb-1">all-inclusive</p>
                    <p className={`text-sm font-semibold ${ad.housing?.isAllInclusivePrice ? 'text-emerald-700' : 'text-gray-700'}`}>
                      {ad.housing?.isAllInclusivePrice ? 'بله' : 'خیر'}
                    </p>
                  </div>
                </div>
              )}

              {ad.category === 'real-estate' && ad.housing?.nearby?.length > 0 && (
                <div className="mt-5">
                  <h3 className="font-semibold text-gray-800 mb-2">فاصله تقریبی از نقاط مهم</h3>
                  {ad.housing?.location && (
                    <div className="mb-3">
                      <HousingLocationPreview point={ad.housing.location} />
                      {ad.housing.address && (
                        <p className="text-xs text-gray-500 mt-2">آدرس ثبت‌شده: {ad.housing.address}</p>
                      )}
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-2">
                    {ad.housing.nearby.map((item: any) => (
                      <div key={item.key} className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          {item.icon === 'grocery' && <ShoppingCart size={16} className="text-emerald-600" />}
                          {item.icon === 'university' && <GraduationCap size={16} className="text-indigo-600" />}
                          {item.icon === 'metro' && <Train size={16} className="text-sky-600" />}
                          {item.icon === 'bus' && <Bus size={16} className="text-orange-600" />}
                          <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                        </div>
                        <p className="text-xs text-gray-500">فاصله: {toFaDigits(item.distanceKm)} کیلومتر</p>
                        <p className="text-xs text-gray-500">زمان: {toFaDigits(item.driveMinutes)} دقیقه با خودرو • {toFaDigits(item.walkMinutes)} دقیقه پیاده</p>
                        {item.metroName && (
                          <p className="text-xs text-gray-500 mt-1">ایستگاه مترو: {item.metroName}</p>
                        )}
                        {item.metroLines?.length ? (
                          <p className="text-xs text-gray-500">خطوط مترو: {item.metroLines.join('، ')}</p>
                        ) : null}
                        {item.busLines?.length ? (
                          <p className="text-xs text-gray-500">خطوط اتوبوس: {item.busLines.join('، ')}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ad.category === 'real-estate' && ad.housing?.location && (!ad.housing?.nearby || ad.housing.nearby.length === 0) && (
                <div className="mt-5">
                  <h3 className="font-semibold text-gray-800 mb-2">نقشه موقعیت</h3>
                  <HousingLocationPreview point={ad.housing.location} />
                  {ad.housing.address && (
                    <p className="text-xs text-gray-500 mt-2">آدرس ثبت‌شده: {ad.housing.address}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-3">اطلاعات صاحب آگهی</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-100">
                  <Image src={ad.userId?.avatar || '/default-avatar.svg'} alt={ad.userId?.name || 'user'} width={48} height={48} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 inline-flex items-center gap-1">
                    <Link href={`/u/${ad.userId?._id}`} className="hover:text-brand-600">
                      {ad.userId?.name}
                    </Link>
                    {ad.userId?.role === 'admin' && <BadgeCheck size={14} className="text-sky-500 fill-sky-500/20" />}
                    {ad.userId?.identityStatus === 'verified' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">احراز شده</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">عضو بازارینو</p>
                </div>
              </div>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs text-gray-500">امتیاز صاحب آگهی</div>
                <StarRating value={ratingSummary.avg} count={ratingSummary.count} />
              </div>
              {ad.userId?._id && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-2">امتیاز شما:</p>
                  <RateUser targetUserId={ad.userId._id.toString()} />
                </div>
              )}
              <div className="space-y-2">
                {ad.userId?._id && (
                  <StartChatButton adId={ad._id.toString()} sellerId={ad.userId._id.toString()} />
                )}
                <ReservationRequestForm
                  adId={ad._id.toString()}
                  nightlyPrice={ad.priceType === 'fixed' && ad.price ? Number(ad.price) : 0}
                  isReservable={isReservableHousing}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ad.showPhone && ad.phone && (
                    <a
                      href={`tel:${ad.phone}`}
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 rounded-2xl font-semibold text-sm shadow-sm"
                    >
                      <Phone size={16} /> تماس تلفنی
                    </a>
                  )}
                  {ad.showPhone && ad.phone && (
                    <a
                      href={`https://wa.me/${ad.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-[#25D366] to-[#1FAE58] text-white py-3 rounded-2xl font-semibold text-sm shadow-sm"
                    >
                      <MessageCircle size={16} /> واتساپ
                    </a>
                  )}
                  {ad.userId?.telegram && (
                    <a
                      href={`https://t.me/${String(ad.userId.telegram).replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-sky-500 to-blue-600 text-white py-3 rounded-2xl font-semibold text-sm shadow-sm"
                    >
                      <Send size={16} /> تلگرام
                    </a>
                  )}
                  {ad.showEmail && ad.email && (
                    <a
                      href={`mailto:${ad.email}`}
                      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-slate-500 to-slate-700 text-white py-3 rounded-2xl font-semibold text-sm shadow-sm"
                    >
                      <Mail size={16} /> ایمیل
                    </a>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <h3 className="font-medium text-amber-800 text-sm mb-2 inline-flex items-center gap-1"><Shield size={14} /> نکات ایمنی</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• قبل از پرداخت، کالا را ببینید</li>
                <li>• از واریز پیش‌پرداخت خودداری کنید</li>
                <li>• معاملات را در مکان عمومی انجام دهید</li>
              </ul>
            </div>
            <ReportForm adId={ad._id.toString()} />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
