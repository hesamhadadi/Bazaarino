import Image from 'next/image';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Ad from '@/models/Ad';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import AdCard from '@/components/ads/AdCard';
import { StarRating } from '@/components/ui/StarRating';
import UserBadges from '@/components/ui/UserBadges';
import { Store } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getUser(id: string) {
  await connectDB();
  const user = await User.findById(id).lean();
  if (!user) return null;
  return JSON.parse(JSON.stringify(user));
}

async function getUserAds(id: string) {
  await connectDB();
  const ads = await Ad.find({ userId: id, status: 'approved' }).sort({ createdAt: -1 }).lean();
  return JSON.parse(JSON.stringify(ads));
}

export default async function UserPage({ params }: { params: { id: string } }) {
  const [user, ads] = await Promise.all([getUser(params.id), getUserAds(params.id)]);
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">کاربر یافت نشد.</div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden mb-5">
          <div className="h-36 relative overflow-hidden bg-gradient-to-br from-orange-400 via-amber-400 to-rose-400">
            {user.banner ? (
              <Image src={user.banner} alt="banner" width={1200} height={300} className="w-full h-full object-cover relative z-10" />
            ) : (
              <>
                {/* Decorative dot pattern matching the author page banner */}
                <div
                  aria-hidden
                  className="absolute inset-0 opacity-30"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
                    backgroundSize: '20px 20px',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent" />
              </>
            )}
          </div>
          <div className="p-5 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
              <Image src={user.avatar || '/default-avatar.svg'} alt={user.name || 'user'} width={64} height={64} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-gray-900">{user.name || 'کاربر بازارینو'}</h1>
                {user.identityStatus === 'verified' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">احراز شده</span>
                )}
              </div>
              <div className="mt-1">
                <StarRating value={Number(user.ratingAvg || 0)} count={Number(user.ratingCount || 0)} />
              </div>
              {user.badges && user.badges.length > 0 && (
                <div className="mt-3">
                  <UserBadges badges={user.badges} size="md" />
                </div>
              )}
              {user.bio && <p className="text-sm text-gray-600 mt-2">{user.bio}</p>}
              {user.businessName && (
                <div className="mt-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                    <Store size={12} /> بیزینس: {user.businessName}
                  </span>
                  {user.businessCategory && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100 ms-1">
                      {user.businessCategory}
                    </span>
                  )}
                  {user.businessSubscriptionActive && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 ms-1">
                      اشتراک فعال
                    </span>
                  )}
                  {user.businessDescription && <p className="text-sm text-gray-600 mt-2">{user.businessDescription}</p>}
                </div>
              )}
            </div>
            {user.telegram && (
              <Link href={`https://t.me/${String(user.telegram).replace('@', '')}`} target="_blank" className="text-sm text-brand-600">تلگرام</Link>
            )}
          </div>
        </div>

        <h2 className="text-lg font-bold text-gray-800 mb-3">آگهی‌های این کاربر</h2>
        {ads.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-sm text-gray-500">آگهی‌ای یافت نشد.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch auto-rows-fr">
            {ads.map((ad: any) => (
              <AdCard key={ad._id} ad={ad} />
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
