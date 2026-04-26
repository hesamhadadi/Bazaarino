import type { Metadata } from 'next';
import { Users, Globe2, ShieldCheck, Sparkles, Heart } from 'lucide-react';
import ProsePage from '@/components/layout/ProsePage';

export const metadata: Metadata = {
  title: 'درباره بازارینو',
  description: 'بازارینو — پلتفرم آگهی و خدمات ایرانیان در اروپا. مأموریت، تیم و ویژگی‌های ما.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <ProsePage
      eyebrow="داستان ما"
      title="درباره بازارینو"
      subtitle="بازارینو یک پلتفرم آنلاین آگهی و خدمات برای ایرانیان ساکن اروپاست. هدف ما ساده‌کردن زندگی روزمره‌ی مهاجرین در ایتالیا، آلمان و انگلستانه."
      icon={<Heart size={20} />}
      maxWidth="4xl"
    >
      <p className="text-gray-700 leading-8 mb-6">
        از خرید و فروش گرفته تا اجاره و رزرو مسکن، استخدام، خدمات بانکی و حمل‌ونقل — یه مرجع قابل اعتماد و فارسی‌زبون که دغدغه‌های واقعی هم‌وطن‌های ساکن اروپا رو می‌فهمه و جواب می‌ده.
      </p>

      <section className="grid md:grid-cols-2 gap-4 mb-8">
          <div className="rounded-2xl p-5 bg-gradient-to-br from-orange-50/60 to-white border border-orange-100/70">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
              <Sparkles size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">مأموریت ما</h2>
            <p className="text-sm text-gray-600 leading-7">
              ساختن یک جامعه فارسی‌زبان در اروپا که اطلاعات درست، معاملات امن و دسترسی سریع به خدمات روزمره را تضمین می‌کند.
            </p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-emerald-50/60 to-white border border-emerald-100/70">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
              <ShieldCheck size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">امنیت و اعتماد</h2>
            <p className="text-sm text-gray-600 leading-7">
              احراز هویت کاربر، بررسی دستی آگهی‌های حساس، سیستم امتیازدهی و گزارش تخلف برای حفظ سلامت پلتفرم.
            </p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-sky-50/60 to-white border border-sky-100/70">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-3">
              <Globe2 size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">چند کشوره</h2>
            <p className="text-sm text-gray-600 leading-7">
              پوشش ایتالیا، آلمان و انگلستان با قابلیت افزوده شدن کشورهای بیشتر. فیلترهای دقیق برای هر شهر و محله.
            </p>
          </div>
          <div className="rounded-2xl p-5 bg-gradient-to-br from-amber-50/60 to-white border border-amber-100/70">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-3">
              <Users size={18} />
            </div>
            <h2 className="font-bold text-gray-800 mb-1">ساخته‌شده توسط جامعه</h2>
            <p className="text-sm text-gray-600 leading-7">
              بازارینو توسط تیمی از ایرانیان اروپا برای هم‌وطنان اروپا طراحی شده تا دغدغه‌های واقعی ما را پاسخ دهد.
            </p>
          </div>
      </section>

      <h2 className="text-xl font-bold text-gray-800 mb-3">ویژگی‌های اصلی</h2>
      <ul className="list-disc pr-5 text-sm text-gray-600 space-y-2 leading-7 mb-2">
          <li>زیردسته‌های بومی ایرانیان اروپا (Revolut، Mensa، ارسال بار، هم‌خونه، مشاوره مهاجرت)</li>
          <li>فیلترهای عمیق مسکن: رزیدنسا، all-inclusive، هزینه Agency، وضعیت قبض‌ها</li>
          <li>رزرو خونه با تاریخ شروع/پایان مشخص</li>
          <li>محاسبه فاصله تا مترو، اتوبوس و دانشگاه</li>
          <li>تقویم شمسی و میلادی</li>
          <li>جست‌وجوی ذخیره شده با آلارم</li>
          <li>چت داخلی و اعلان پیشخوان</li>
      </ul>
    </ProsePage>
  );
}
