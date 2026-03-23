'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BILLS_INFO_OPTIONS, CATEGORIES, CITIES, LISTING_MODES } from '@/lib/constants';
import Navbar from '@/components/layout/Navbar';
import dynamic from 'next/dynamic';
import { Upload, X, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { LatLng } from '@/lib/map-data';

const HousingLocationPicker = dynamic(() => import('@/components/maps/HousingLocationPicker'), { ssr: false });

const adSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  category: z.string().min(1),
  subcategory: z.string().min(1),
  city: z.string().min(1),
  priceType: z.enum(['fixed', 'negotiable', 'free', 'exchange']),
  price: z.string().optional(),
  phone: z.string().optional(),
  showPhone: z.boolean().optional(),
  listingMode: z.enum(['offer', 'request']),
  deposit: z.string().optional(),
  residenceEligible: z.boolean().optional(),
  preferredGender: z.enum(['male', 'female', 'any']).optional(),
  preferredAgeMin: z.string().optional(),
  preferredAgeMax: z.string().optional(),
  preferredUniversity: z.string().max(120).optional(),
  roommatesCount: z.string().optional(),
  availabilityStartDate: z.string().optional(),
  billsInfo: z.union([z.enum(['included', 'not-included', 'partial']), z.literal('')]).optional(),
  agencyFee: z.string().optional(),
  isAllInclusivePrice: z.boolean().optional(),
  address: z.string().optional(),
  locationLat: z.string().optional(),
  locationLng: z.string().optional(),
});

type AdForm = z.infer<typeof adSchema>;

export default function EditAdPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const adId = params.id as string;
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAd, setLoadingAd] = useState(true);
  const [location, setLocation] = useState<LatLng | null>(null);

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AdForm>({
    resolver: zodResolver(adSchema),
    defaultValues: { listingMode: 'offer', preferredGender: 'any', billsInfo: '' },
  });

  const priceType = watch('priceType');
  const category = watch('category');
  const listingMode = watch('listingMode');
  const currentCategory = CATEGORIES.find(c => c.id === category);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (session && adId) fetchAd();
  }, [session, adId]);

  const fetchAd = async () => {
    try {
      const res = await fetch(`/api/ads/${adId}`);
      const data = await res.json();
      const ad = data.ad;

      reset({
        title: ad.title,
        description: ad.description,
        category: ad.category,
        subcategory: ad.subcategory,
        city: ad.city,
        priceType: ad.priceType,
        price: ad.price?.toString(),
        listingMode: ad.listingMode || 'offer',
        phone: ad.phone,
        showPhone: ad.showPhone,
        deposit: ad.housing?.deposit?.toString(),
        residenceEligible: ad.housing?.residenceEligible,
        preferredGender: ad.housing?.preferredGender || 'any',
        preferredAgeMin: ad.housing?.preferredAgeMin?.toString(),
        preferredAgeMax: ad.housing?.preferredAgeMax?.toString(),
        preferredUniversity: ad.housing?.preferredUniversity || '',
        roommatesCount: ad.housing?.roommatesCount?.toString(),
        availabilityStartDate: ad.housing?.availabilityStartDate ? String(ad.housing.availabilityStartDate).slice(0, 10) : '',
        billsInfo: ad.housing?.billsInfo || '',
        agencyFee: ad.housing?.agencyFee?.toString(),
        isAllInclusivePrice: ad.housing?.isAllInclusivePrice === true,
        address: ad.housing?.address || '',
        locationLat: ad.housing?.location?.lat ? String(ad.housing.location.lat) : '',
        locationLng: ad.housing?.location?.lng ? String(ad.housing.location.lng) : '',
      });
      if (ad.housing?.location?.lat && ad.housing?.location?.lng) {
        setLocation({ lat: ad.housing.location.lat, lng: ad.housing.location.lng });
      }
      setImages(ad.images || []);
    } catch {
      toast.error('خطا در دریافت آگهی');
    } finally {
      setLoadingAd(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 8) { toast.error('حداکثر ۸ تصویر'); return; }

    setUploading(true);
    const formData = new FormData();
    files.forEach(f => formData.append('images', f));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) setImages(prev => [...prev, ...data.urls]);
    } catch {
      toast.error('خطا در آپلود');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: AdForm) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/ads/${adId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images,
          housing: category === 'real-estate' ? {
            deposit: data.deposit ? Number(data.deposit) : undefined,
            residenceEligible: data.residenceEligible === true,
            preferredGender: data.preferredGender || 'any',
            preferredAgeMin: data.preferredAgeMin ? Number(data.preferredAgeMin) : undefined,
            preferredAgeMax: data.preferredAgeMax ? Number(data.preferredAgeMax) : undefined,
            preferredUniversity: data.preferredUniversity?.trim() || undefined,
            roommatesCount: data.roommatesCount ? Number(data.roommatesCount) : undefined,
            availabilityStartDate: data.availabilityStartDate || undefined,
            billsInfo: data.billsInfo || undefined,
            agencyFee: data.agencyFee ? Number(data.agencyFee) : undefined,
            isAllInclusivePrice: data.isAllInclusivePrice === true,
            address: data.address || undefined,
            location: data.locationLat && data.locationLng
              ? { lat: Number(data.locationLat), lng: Number(data.locationLng) }
              : undefined,
          } : undefined,
        }),
      });

      if (res.ok) {
        toast.success('آگهی بروزرسانی شد');
        router.push('/profile/ads');
      } else {
        const result = await res.json();
        toast.error(result.message);
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingAd) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/profile/ads" className="text-gray-400"><ChevronLeft size={20} /></Link>
          <h1 className="text-xl font-bold text-gray-800">ویرایش آگهی</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">نوع آگهی</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {LISTING_MODES.map((mode) => (
                <label
                  key={mode.value}
                  className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                    listingMode === mode.value ? 'border-brand-400 bg-brand-50' : 'border-gray-200'
                  }`}
                >
                  <input type="radio" value={mode.value} {...register('listingMode')} className="accent-brand-500" />
                  <span className="text-sm">{mode.label}</span>
                </label>
              ))}
            </div>
            <h2 className="font-semibold text-gray-800 mb-3">دسته‌بندی</h2>
            <select {...register('category')} onChange={(e) => { setValue('category', e.target.value); setValue('subcategory', ''); }}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 mb-3">
              <option value="">انتخاب دسته‌بندی</option>
              {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>)}
            </select>
            {currentCategory && (
              <select {...register('subcategory')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                <option value="">انتخاب زیر دسته</option>
                {currentCategory.subcategories.map(sub => <option key={sub.value} value={sub.value}>{sub.label}</option>)}
              </select>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">عنوان *</label>
              <input {...register('title')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">توضیحات *</label>
              <textarea {...register('description')} rows={5} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none" />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">شهر *</label>
              <select {...register('city')} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300">
                <option value="">انتخاب شهر</option>
                {CITIES.map(city => <option key={city.value} value={city.value}>{city.label}</option>)}
              </select>
            </div>

            {category === 'real-estate' && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-3">
                <h3 className="text-sm font-semibold text-amber-800">جزئیات مسکن</h3>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">مبلغ رهن (€)</label>
                  <input {...register('deposit')} type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">مناسب برای</label>
                    <select {...register('preferredGender')} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                      <option value="any">فرقی ندارد</option>
                      <option value="female">خانم</option>
                      <option value="male">آقا</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">تعداد هم‌خانه</label>
                    <input {...register('roommatesCount')} type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">حداقل سن دلخواه</label>
                    <input {...register('preferredAgeMin')} type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">حداکثر سن دلخواه</label>
                    <input {...register('preferredAgeMax')} type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">دانشگاه دلخواه (اختیاری)</label>
                  <input {...register('preferredUniversity')} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">تاریخ شروع سکونت</label>
                    <input {...register('availabilityStartDate')} type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">وضعیت قبض‌ها</label>
                    <select {...register('billsInfo')} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
                      <option value="">انتخاب نشده</option>
                      {BILLS_INFO_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">مبلغ agency (€)</label>
                    <input {...register('agencyFee')} type="number" min="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer self-end pb-1">
                    <input type="checkbox" {...register('isAllInclusivePrice')} className="accent-brand-500" />
                    مبلغ ماهانه all-inclusive است
                  </label>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input type="checkbox" {...register('residenceEligible')} className="accent-brand-500" />
                  این واحد قابلیت رزیدنسا دارد
                </label>

                <div className="pt-1">
                  <label className="block text-xs text-gray-600 mb-1">آدرس دقیق روی نقشه</label>
                  <input
                    {...register('address')}
                    placeholder="مثلاً: Via Roma 12"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm mb-2"
                  />
                  <HousingLocationPicker
                    city={watch('city') || 'turin'}
                    value={location}
                    onChange={(val) => {
                      setLocation(val);
                      setValue('locationLat', String(val.lat));
                      setValue('locationLng', String(val.lng));
                    }}
                  />
                  <p className="text-[11px] text-gray-500 mt-2">روی نقشه کلیک کن تا لوکیشن ثبت شود. نقشه بر اساس شهر انتخابی مرکز می‌گیرد.</p>
                  <input type="hidden" {...register('locationLat')} />
                  <input type="hidden" {...register('locationLng')} />
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">تصاویر</h2>
            <div className="grid grid-cols-4 gap-2">
              {images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                    className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              ))}
              {images.length < 8 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-brand-400">
                  {uploading ? <div className="w-5 h-5 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" /> : <Upload size={18} className="text-gray-400" />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white py-3.5 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2">
            {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : '💾 ذخیره تغییرات'}
          </button>
        </form>
      </div>
    </div>
  );
}
