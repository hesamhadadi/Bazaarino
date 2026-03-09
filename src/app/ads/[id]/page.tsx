import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import '@/models/User';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { CATEGORIES, getCityLabel } from '@/lib/constants';
import { MapPin, Clock, Eye, Phone, Mail, Tag, ChevronRight, Share2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAd(id: string) {
  try {
    await connectDB();
    const ad = await Ad.findById(id)
      .populate('userId', 'name avatar phone email city createdAt')
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

function formatPrice(price?: number, priceType?: string): string {
  if (priceType === 'free') return 'رایگان';
  if (priceType === 'negotiable') return 'توافقی';
  if (priceType === 'exchange') return 'معاوضه';
  if (!price) return 'توافقی';
  return `€${price.toLocaleString()}`;
}

function preferredGenderLabel(value?: string): string {
  if (value === 'female') return 'خانم';
  if (value === 'male') return 'آقا';
  return 'فرقی ندارد';
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'همین الان';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} روز پیش`;
  return `${Math.floor(diff / 2592000)} ماه پیش`;
}

export default async function AdDetailPage({ params }: { params: { id: string } }) {
  const ad = await getAd(params.id);
  if (!ad) notFound();

  const category = CATEGORIES.find(c => c.id === ad.category);
  const subcategory = category?.subcategories?.find((s: any) => s.value === ad.subcategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-4 pb-24 md:pb-10">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
          <Link href="/" className="hover:text-gray-600">خانه</Link>
          <ChevronRight size={12} />
          <Link href={`/search?category=${ad.category}`} className="hover:text-gray-600">
            {category?.icon} {category?.label}
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              {ad.images?.length > 0 ? (
                <div>
                  <div className="relative aspect-[4/3]">
                    <Image src={ad.images[0]} alt={ad.title} fill className="object-cover" priority />
                  </div>
                  {ad.images.length > 1 && (
                    <div className="flex gap-2 p-2 overflow-x-auto">
                      {ad.images.map((img: string, i: number) => (
                        <div key={i} className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border border-gray-200">
                          <Image src={img} alt="" fill className="object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                  <span className="text-6xl">{category?.icon || '📦'}</span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-xl font-bold text-gray-900 leading-snug">{ad.title}</h1>
                <Share2 size={18} className="text-gray-400 flex-shrink-0 mt-1" />
              </div>
              <div className="text-2xl font-bold text-orange-600 mb-4">{formatPrice(ad.price, ad.priceType)}</div>
              <div className="flex flex-wrap gap-2 mb-5">
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                  <MapPin size={12} /> {getCityLabel(ad.city)}
                </span>
                {subcategory && (
                  <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                    <Tag size={12} /> {subcategory.label}
                  </span>
                )}
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                  <Eye size={12} /> {ad.views} بازدید
                </span>
                <span className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">
                  <Clock size={12} /> {timeAgo(ad.createdAt)}
                </span>
                {ad.category === 'real-estate' && ad.housing?.residenceEligible && (
                  <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs px-3 py-1.5 rounded-full font-semibold">
                    🏛️ رزیدنسا دارد
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
                      {ad.housing?.deposit ? `€${Number(ad.housing.deposit).toLocaleString()}` : 'ثبت نشده'}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">رزیدنسا</p>
                    <p className="text-sm font-semibold text-gray-700">{ad.housing?.residenceEligible ? 'دارد' : 'ندارد'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">مناسب برای</p>
                    <p className="text-sm font-semibold text-gray-700">{preferredGenderLabel(ad.housing?.preferredGender)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-1">تعداد هم‌خانه</p>
                    <p className="text-sm font-semibold text-gray-700">{ad.housing?.roommatesCount ?? 'ثبت نشده'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-3">اطلاعات فروشنده</h2>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-lg">{ad.userId?.name?.[0] || '?'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-800">{ad.userId?.name}</p>
                  <p className="text-xs text-gray-400">عضو بازارینو</p>
                </div>
              </div>
              <div className="space-y-2">
                {ad.showPhone && ad.phone && (
                  <>
                    <a href={`tel:${ad.phone}`}
                      className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-medium transition-colors text-sm">
                      <Phone size={16} /> تماس تلفنی
                    </a>
                    <a href={`https://wa.me/${ad.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#128C7E] text-white py-3 rounded-xl font-medium transition-colors text-sm">
                      💬 واتساپ
                    </a>
                  </>
                )}
                {ad.showEmail && ad.email && (
                  <a href={`mailto:${ad.email}`}
                    className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-medium transition-colors text-sm">
                    <Mail size={16} /> ارسال ایمیل
                  </a>
                )}
              </div>
            </div>
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <h3 className="font-medium text-amber-800 text-sm mb-2">🛡️ نکات ایمنی</h3>
              <ul className="text-xs text-amber-700 space-y-1">
                <li>• قبل از پرداخت، کالا را ببینید</li>
                <li>• از واریز پیش‌پرداخت خودداری کنید</li>
                <li>• معاملات را در مکان عمومی انجام دهید</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
