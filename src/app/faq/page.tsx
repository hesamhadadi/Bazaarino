import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'سؤالات متداول',
  description: 'پاسخ سؤالات رایج درباره بازارینو.',
  alternates: { canonical: '/faq' },
};

const FAQS: { q: string; a: string }[] = [
  { q: 'آیا استفاده از بازارینو رایگان است؟', a: 'بله، ساخت حساب و ثبت آگهی معمولی کاملاً رایگان است. سرویس‌های ویژه مانند «آگهی ویژه» و «نردبان» اختیاری و پولی هستند.' },
  { q: 'چطور می‌توانم آگهی ثبت کنم؟', a: 'پس از ورود به حساب، از دکمه «آگهی رایگان» در نوار بالا استفاده کنید. فرم را پر کرده و تصاویر مرتبط را آپلود کنید.' },
  { q: 'چگونه می‌توانم شماره تماس فروشنده را ببینم؟', a: 'اگر فروشنده گزینه نمایش تماس را فعال کرده باشد، در صفحه آگهی دکمه تماس/واتساپ/تلگرام در دسترس است. در غیر این صورت می‌توانید از چت داخلی استفاده کنید.' },
  { q: 'آیا بازارینو مسئول معاملات است؟', a: 'خیر. بازارینو یک پلتفرم واسطه است و طرف معامله بین کاربران نیست. توصیه می‌کنیم پیش از پرداخت، کالا را از نزدیک ببینید.' },
  { q: 'چطور هم‌خانه پیدا کنم؟', a: 'از دسته «مسکن و ملک» → زیرمجموعه «هم‌خونه» استفاده کنید و با فیلترهای جنسیت، بازه سنی، دانشگاه دلخواه و شهر نتایج را محدود کنید.' },
  { q: 'رزرو خونه چطور کار می‌کند؟', a: 'از صفحه رزرو خونه تاریخ شروع/پایان و شهر را انتخاب کنید. درخواست شما برای مالک ارسال می‌شود و پس از تأیید، پرداخت انجام می‌شود.' },
  { q: 'چگونه آگهی متخلف را گزارش کنم؟', a: 'در پایین هر صفحه آگهی، دکمه «گزارش تخلف» وجود دارد. تیم ما بررسی می‌کند و در صورت صحت، آگهی حذف می‌شود.' },
  { q: 'چطور حساب را حذف کنم؟', a: 'با ایمیل privacy@bazaarino.online مکاتبه کنید. طبق GDPR در کمتر از ۳۰ روز داده‌های شما حذف می‌شود.' },
];

export default function FAQPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
        <h1 className="text-3xl font-bold text-gray-900 mb-6">سؤالات متداول</h1>

        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <details key={i} className="bg-white rounded-2xl border border-gray-100 p-4 group">
              <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-gray-400 group-open:rotate-45 transition">+</span>
              </summary>
              <p className="text-sm text-gray-600 leading-8 mt-3 pt-3 border-t border-gray-100">{item.a}</p>
            </details>
          ))}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
