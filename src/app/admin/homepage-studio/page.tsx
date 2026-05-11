import Link from 'next/link';
import {
  ArrowLeft,
  Image as ImageIcon,
  Layers,
  MapPin,
  Palette,
  PanelTop,
  Settings,
  Sparkles,
} from 'lucide-react';

const STUDIO_BLOCKS = [
  {
    title: 'Hero و بنرهای صفحه اصلی',
    text: 'بنر اصلی، بنرهای عریض، زمان‌بندی، اولویت نمایش و لینک کمپین‌ها را مدیریت کن.',
    href: '/admin/banners',
    icon: PanelTop,
    tone: 'bg-sky-50 text-sky-700 border-sky-100',
  },
  {
    title: 'ویژوال شهرها',
    text: 'عکس، گرادیان، ایموجی، ترتیب و فعال/غیرفعال بودن کارت‌های شهری صفحه اصلی را تنظیم کن.',
    href: '/admin/city-visuals',
    icon: MapPin,
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  {
    title: 'صفحات لندینگ',
    text: 'برای شهر، دسته‌بندی یا کمپین صفحه بساز؛ سکشن‌ها، SEO و تصویر OG را همان‌جا کنترل کن.',
    href: '/admin/pages',
    icon: Layers,
    tone: 'bg-violet-50 text-violet-700 border-violet-100',
  },
  {
    title: 'رنگ برند و پیام سایت',
    text: 'تم، پیام اطلاع‌رسانی، حالت نگهداری، ثبت‌نام و تایید خودکار را از تنظیمات کنترل کن.',
    href: '/admin/legacy?tab=settings',
    icon: Palette,
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  {
    title: 'کتابخانه رسانه',
    text: 'عکس‌های خراب یا سنگین را پیدا کن و قبل از زشت شدن صفحه اصلی درستشان کن.',
    href: '/admin/media-library',
    icon: ImageIcon,
    tone: 'bg-rose-50 text-rose-700 border-rose-100',
  },
  {
    title: 'مرکز عملیات',
    text: 'صف بررسی، گزارش‌ها، احراز هویت، سلامت سرور و وضعیت مدیا را روزانه چک کن.',
    href: '/admin/operations',
    icon: Settings,
    tone: 'bg-gray-100 text-gray-800 border-gray-200',
  },
];

export default function HomepageStudioPage() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
          <Sparkles size={12} />
          Homepage Studio
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-4">
          کنترل ظاهر صفحه اصلی، بدون دست زدن به کد
        </h1>
        <p className="text-sm text-gray-500 leading-7 mt-2 max-w-2xl">
          این صفحه مرکز فرمان صفحه اصلی است: بنرها، شهرها، لندینگ‌ها، رنگ برند و سلامت عکس‌ها از همین‌جا به مسیر درست وصل شده‌اند.
        </p>
      </div>

      <section className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {STUDIO_BLOCKS.map((block) => {
          const Icon = block.icon;
          return (
            <Link
              key={block.href}
              href={block.href}
              className="group rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${block.tone}`}>
                <Icon size={18} />
              </div>
              <h2 className="text-base font-black text-gray-900 mt-4">{block.title}</h2>
              <p className="text-sm text-gray-500 leading-7 mt-2">{block.text}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-gray-700 group-hover:text-gray-950">
                باز کردن
                <ArrowLeft size={12} className="transition group-hover:-translate-x-1" />
              </span>
            </Link>
          );
        })}
      </section>

      <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-lg font-black text-gray-900">چک‌لیست بهتر شدن صفحه اصلی</h2>
        <div className="mt-4 grid md:grid-cols-3 gap-3">
          <Tip title="هر شهر مهم باید عکس واقعی داشته باشد" text="کارت‌های گرادیانی را فقط برای fallback نگه داریم؛ شهرهای اصلی باید تصویر واضح داشته باشند." />
          <Tip title="بنر hero را کمپینی نگه دار" text="برای رزرو خانه، آگهی رایگان یا شهرهای جدید، بنر زمان‌دار بگذار." />
          <Tip title="سکشن‌های کم‌محتوا را پایین ببر" text="شهر یا دسته‌ای که آگهی ندارد، نباید بالای صفحه حس خالی بودن بدهد." />
        </div>
      </section>
    </div>
  );
}

function Tip({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-sm font-bold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500 leading-6 mt-1">{text}</p>
    </div>
  );
}
