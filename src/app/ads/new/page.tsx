'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { CATEGORIES, CITIES } from '@/lib/constants';
import Navbar from '@/components/layout/Navbar';
import { Upload, X, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const adSchema = z.object({
  title: z.string().min(5, 'عنوان باید حداقل ۵ کاراکتر باشد').max(100),
  description: z.string().min(20, 'توضیحات باید حداقل ۲۰ کاراکتر باشد').max(2000),
  category: z.string().min(1, 'دسته‌بندی را انتخاب کنید'),
  subcategory: z.string().min(1, 'زیر دسته را انتخاب کنید'),
  city: z.string().min(1, 'شهر را انتخاب کنید'),
  priceType: z.enum(['fixed', 'negotiable', 'free', 'exchange']),
  price: z.string().optional(),
  phone: z.string().optional(),
  showPhone: z.boolean().optional(),
  deposit: z.string().optional(),
  residenceEligible: z.boolean().optional(),
  preferredGender: z.enum(['male', 'female', 'any']).optional(),
  roommatesCount: z.string().optional(),
});

type AdForm = z.infer<typeof adSchema>;

export default function NewAdPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<AdForm>({
    resolver: zodResolver(adSchema),
    defaultValues: { priceType: 'fixed', showPhone: true },
  });

  const priceType = watch('priceType');
  const category = watch('category');

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
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
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
                <label className="block text-sm text-gray-600 mb-1.5">شهر *</label>
                <select
                  {...register('city')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                >
                  <option value="">انتخاب شهر</option>
                  {CITIES.map(city => (
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

                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" {...register('residenceEligible')} className="accent-brand-500" />
                    این واحد قابلیت رزیدنسا دارد
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Price */}
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
