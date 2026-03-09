'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Eye, Sparkles } from 'lucide-react';
import { CATEGORIES, getCityLabel } from '@/lib/constants';

interface AdCardProps {
  ad: {
    _id: string;
    title: string;
    price?: number;
    priceType: string;
    city: string;
    category: string;
    images: string[];
    isFeatured: boolean;
    featuredUntil?: string;
    housing?: {
      residenceEligible?: boolean;
    };
    views: number;
    createdAt: string;
  };
}

function formatPrice(price?: number, priceType?: string): string {
  if (priceType === 'free') return 'رایگان';
  if (priceType === 'negotiable') return 'توافقی';
  if (priceType === 'exchange') return 'معاوضه';
  if (!price) return 'توافقی';
  return `€${price.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'همین الان';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} روز پیش`;
  return `${Math.floor(diff / 2592000)} ماه پیش`;
}

export default function AdCard({ ad }: AdCardProps) {
  const category = CATEGORIES.find(c => c.id === ad.category);
  const isFeaturedActive = ad.isFeatured && (!ad.featuredUntil || new Date(ad.featuredUntil) >= new Date());

  return (
    <Link href={`/ads/${ad._id}`}>
      <div className={`bg-white rounded-2xl overflow-hidden border cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all ${
        isFeaturedActive ? 'border-orange-300 shadow-orange-100 shadow-md' : 'border-gray-100'
      }`}>
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {ad.images?.[0] ? (
            <Image src={ad.images[0]} alt={ad.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">{category?.icon || '📦'}</span>
            </div>
          )}
          {isFeaturedActive && (
            <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-orange-300/40">
              <Sparkles size={10} />
              ویژه پلاس
            </div>
          )}
          {ad.category === 'real-estate' && ad.housing?.residenceEligible && (
            <div className="absolute top-2 left-2 bg-emerald-600/95 text-white text-[10px] px-2 py-1 rounded-full">
              رزیدنسا
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
            <Eye size={10} /> {ad.views}
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-gray-800 text-sm line-clamp-2 mb-2 leading-relaxed">{ad.title}</h3>
          <div className="text-orange-600 font-bold text-sm mb-2">{formatPrice(ad.price, ad.priceType)}</div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin size={10} />
              <span>{getCityLabel(ad.city)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={10} />
              <span>{timeAgo(ad.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
