'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Clock, Eye, Star } from 'lucide-react';
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

  return (
    <Link href={`/ads/${ad._id}`}>
      <div className={`bg-white rounded-2xl overflow-hidden border cursor-pointer hover:-translate-y-0.5 hover:shadow-lg transition-all ${
        ad.isFeatured ? 'border-orange-300 shadow-orange-100 shadow-md' : 'border-gray-100'
      }`}>
        <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
          {ad.images?.[0] ? (
            <Image src={ad.images[0]} alt={ad.title} fill className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-4xl">{category?.icon || '📦'}</span>
            </div>
          )}
          {ad.isFeatured && (
            <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star size={10} fill="white" /> ویژه
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
