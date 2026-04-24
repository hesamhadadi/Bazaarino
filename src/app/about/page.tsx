import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import { Users, Globe2, ShieldCheck, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'درباره بازارینو',
  description: 'بازارینو — پلتفرم آگهی و خدمات ایرانیان در اروپا. مأموریت، تیم و ویژگی‌های ما.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">درباره بازارینو</h1>
        <p className="text-gray-600 leading-8 mb-6">
          بازارینو (Bazaarino) یک پلتفرم آنلاین آگهی و خدمات برای ایرانیان ساکن اروپاست.
          هدف ما ساده کردن زندگی مهاجران ایرانی در ایتالیا، آلمان، انگلستان و سایر کشورهای اروپایی از راه
          فراهم کردن یک مرجع قابل اعتماد برای خرید و فروش، اجاره و رزرو مسکن، استخدام، خدمات بانکی و حمل‌ونقل است.
        </p>

        <section className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <Sparkles size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">مأموریت ما</h2>
            <p className="text-sm text-gray-600 leading-7">
              ساختن یک جامعه فارسی‌زبان در اروپا که اطلاعات درست، معاملات امن و دسترسی سریع به خدمات روزمره را تضمین می‌کند.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">امنیت و اعتماد</h2>
            <p className="text-sm text-gray-600 leading-7">
              احراز هویت کاربر، بررسی دستی آگهی‌های حساس، سیستم امتیازدهی و گزارش تخلف برای حفظ سلامت پلتفرم.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-3">
              <Globe2 size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">چند کشوره</h2>
            <p className="text-sm text-gray-600 leading-7">
              پوشش ایتالیا، آلمان و انگلستان با قابلیت افزوده شدن کشورهای بیشتر. فیلترهای دقیق برای هر شهر و محله.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Users size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">ساخته‌شده توسط جامعه</h2>
            <p className="text-sm text-gray-600 leading-7">
              بازارینو توسط تیمی از ایرانیان اروپا برای هم‌وطنان اروپا طراحی شده تا دغدغه‌های واقعی ما را پاسخ دهد.
            </p>
          </div>
        </section>

        <h2 className="text-xl font-bold text-gray-800 mb-3">ویژگی‌های اصلی</h2>
        <ul className="list-disc pr-5 text-sm text-gray-600 space-y-2 leading-7 mb-8">
          <li>زیردسته‌های بومی ایرانیان اروپا (Revolut، Mensa، ارسال بار، هم‌خونه، مشاوره مهاجرت)</li>
          <li>فیلترهای عمیق مسکن: رزیدنسا، all-inclusive، هزینه Agency، وضعیت قبض‌ها</li>
          <li>رزرو خونه با تاریخ شروع/پایان مشخص</li>
          <li>محاسبه فاصله تا مترو، اتوبوس و دانشگاه</li>
          <li>تقویم شمسی و میلادی</li>
          <li>جست‌وجوی ذخیره شده با آلارم</li>
          <li>چت داخلی و اعلان پیشخوان</li>
        </ul>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
