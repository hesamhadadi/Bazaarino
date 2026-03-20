'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { BILLS_INFO_OPTIONS, CATEGORIES, CITIES, COUNTRIES, LISTING_MODES, getCitiesByCountry, getCountryByCity } from '@/lib/constants';
import Navbar from '@/components/layout/Navbar';
import dynamic from 'next/dynamic';
import { Upload, X, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import type { LatLng } from '@/lib/map-data';

const HousingLocationPicker = dynamic(() => import('@/components/maps/HousingLocationPicker'), { ssr: false });

const adSchema = z.object({
  title: z.string().min(5, 'عنوان باید حداقل ۵ کاراکتر باشد').max(100),
  description: z.string().min(20, 'توضیحات باید حداقل ۲۰ کاراکتر باشد').max(2000),
  category: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  subcategory: z.string().min(1, 'زیر دسته را انتخاب کنید'),
  country: z.string().min(1, 'کشور را انتخاب کنید'),
  city: z.string().min(1, 'شهر را انتخاب کنید'),
  priceType: z.enum(['fixed', 'negotiable', 'free', 'exchange']),
  price: z.string().optional(),
  phone: z.string().optional(),
  showPhone: z.boolean().optional(),
  listingMode: z.enum(['offer', 'request']),
  deposit: z.string().optional(),
  residenceEligible: z.boolean().optional(),
  preferredGender: z.enum(['male', 'female', 'any']).optional(),
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

export default function NewAdPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [location, setLocation] = useState<LatLng | null>(null);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AdForm>({
    resolver: zodResolver(adSchema),
    defaultValues: { priceType: 'fixed', showPhone: true, address: '', locationLat: '', locationLng: '', country: 'italy', listingMode: 'offer', preferredGender: 'any', billsInfo: '' },
  });

  const priceType = watch('priceType');
  const category = watch('category');
  const listingMode = watch('listingMode');
  const country = watch('country');
  const filteredCities = getCitiesByCountry(country || getCountryByCity(watch('city')) || 'italy');

  const countryStyles: Record<string, { label: string; stripes: string[] }> = {
    italy: { label: 'ایتالیا', stripes: ['bg-green-500', 'bg-white', 'bg-red-500'] },
    germany: { label: 'آلمان', stripes: ['bg-black', 'bg-red-600', 'bg-yellow-400'] },
    uk: { label: 'انگلستان', stripes: ['bg-blue-700', 'bg-white', 'bg-red-600'] },
  };

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length + files.length > 8) {
      toast.error('حداکثر ۸ تصویر مجاز است');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImages(prev => [...prev, ...data.urls]);
        toast.success('تصاویر آپلود شدند');
      } else {
        toast.error(data.message || 'خطا در آپلود');
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: AdForm) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          images,
          housing: category === 'real-estate' ? {
            deposit: data.deposit ? Number(data.deposit) : undefined,
            residenceEligible: data.residenceEligible === true,
            preferredGender: data.preferredGender || 'any',
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

      const result = await res.json();

      if (res.ok) {
        toast.success('آگهی ثبت شد و در انتظار تأیید است ✅');
        router.push('/profile/ads');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setSubmitting(false);
    }
  };

  const currentCategory = CATEGORIES.find(c => c.id === category);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">ثبت آگهی جدید</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Category */}
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
            <div>
              <label className="block text-sm text-gray-600 mb-1.5">دسته اصلی *</label>
              <select
                {...register('category')}
                onChange={(e) => { setValue('category', e.target.value); setValue('subcategory', ''); }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              >
                <option value="">انتخاب دسته‌بندی</option>
                {CATEGORIES.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>

            {currentCategory && (
              <div className="mt-3">
                <label className="block text-sm text-gray-600 mb-1.5">زیر دسته *</label>
                <select
                  {...register('subcategory')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="">انتخاب زیر دسته</option>
                  {currentCategory.subcategories.map(sub => (
                    <option key={sub.value} value={sub.value}>{sub.label}</option>
                  ))}
                </select>
                {errors.subcategory && <p className="text-red-500 text-xs mt-1">{errors.subcategory.message}</p>}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">اطلاعات آگهی</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">عنوان آگهی *</label>
                <input
                  {...register('title')}
                  placeholder="مثلاً: آیفون ۱۵ پرو مکس ۲۵۶ گیگ"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">توضیحات *</label>
                <textarea
                  {...register('description')}
                  rows={5}
                  placeholder="توضیحات کامل آگهی را بنویسید..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
                />
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-2">کشور *</label>
                <div className="grid grid-cols-3 gap-2">
                  {COUNTRIES.map((c) => {
                    const meta = countryStyles[c.value];
                    const active = country === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        onClick={() => {
                          setValue('country', c.value);
                          setValue('city', '');
                        }}
                        className={`rounded-2xl border p-3 text-sm font-medium transition-all ${
                          active ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 bg-white text-gray-600 hover:border-brand-300'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex overflow-hidden rounded-md border border-gray-200">
                            <span className={`w-2.5 h-4 ${meta?.stripes?.[0] || 'bg-gray-300'}`}></span>
                            <span className={`w-2.5 h-4 ${meta?.stripes?.[1] || 'bg-gray-200'}`}></span>
                            <span className={`w-2.5 h-4 ${meta?.stripes?.[2] || 'bg-gray-300'}`}></span>
                          </span>
                          <span>{meta?.label || c.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" {...register('country')} />
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country.message}</p>}
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1.5">شهر *</label>
                <select
                  {...register('city')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="">انتخاب شهر</option>
                  {filteredCities.map(city => (
                    <option key={city.value} value={city.value}>{city.label}</option>
                  ))}
                </select>
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>

              {category === 'real-estate' && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 space-y-3">
                  <h3 className="text-sm font-semibold text-amber-800">جزئیات مسکن</h3>

                  <div>
                    <label className="block text-xs text-gray-600 mb-1">مبلغ رهن (€)</label>
                    <input
                      {...register('deposit')}
                      type="number"
                      min="0"
                      placeholder="مثلاً 2000"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    />
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
                      <input
                        {...register('roommatesCount')}
                        type="number"
                        min="0"
                        placeholder="مثلاً 2"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">تاریخ شروع سکونت</label>
                      <input
                        {...register('availabilityStartDate')}
                        type="date"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      />
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
                      <input
                        {...register('agencyFee')}
                        type="number"
                        min="0"
                        placeholder="مثلاً 500"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      />
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
          </div>

          {/* Price */}
          {listingMode !== 'request' && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">قیمت</h2>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { value: 'fixed', label: 'قیمت ثابت' },
                { value: 'negotiable', label: 'توافقی' },
                { value: 'free', label: 'رایگان' },
                { value: 'exchange', label: 'معاوضه' },
              ].map(type => (
                <label
                  key={type.value}
                  className={`flex items-center gap-2 p-3 border rounded-xl cursor-pointer transition-colors ${
                    priceType === type.value ? 'border-brand-400 bg-brand-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    value={type.value}
                    {...register('priceType')}
                    className="accent-brand-500"
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>

            {priceType === 'fixed' && (
              <div>
                <label className="block text-sm text-gray-600 mb-1.5">قیمت (یورو)</label>
                <div className="relative">
                  <input
                    {...register('price')}
                    type="number"
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                    dir="ltr"
                  />
                  <span className="absolute left-4 top-2.5 text-gray-400 text-sm">EUR €</span>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Images */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">تصاویر</h2>
            <p className="text-xs text-gray-400 mb-3">حداکثر ۸ تصویر (اختیاری)</p>

            <div className="grid grid-cols-4 gap-2">
              {images.map((url, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 left-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-1 right-1 bg-black/60 text-white text-xs px-1 rounded">اصلی</div>
                  )}
                </div>
              ))}

              {images.length < 8 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors">
                  {uploading ? (
                    <div className="w-6 h-6 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload size={20} className="text-gray-400 mb-1" />
                      <span className="text-xs text-gray-400">افزودن</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-3">اطلاعات تماس</h2>

            <div>
              <label className="block text-sm text-gray-600 mb-1.5">شماره تماس</label>
              <input
                {...register('phone')}
                type="tel"
                placeholder="+39 ..."
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>

            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" {...register('showPhone')} defaultChecked className="accent-brand-500" />
              <span className="text-sm text-gray-600">نمایش شماره تماس در آگهی</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting || uploading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white py-3.5 rounded-2xl font-bold text-base transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              '✅ ثبت آگهی رایگان'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
