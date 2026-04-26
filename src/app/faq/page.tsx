import type { Metadata } from 'next';
import { HelpCircle } from 'lucide-react';
import ProsePage from '@/components/layout/ProsePage';

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
    <ProsePage
      eyebrow="پشتیبانی"
      title="سؤالات متداول"
      subtitle="جواب پرسش‌های رایج درباره ثبت آگهی، رزرو خونه، حذف حساب و GDPR."
      icon={<HelpCircle size={20} />}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />
      <div className="space-y-2.5">
        {FAQS.map((item, i) => (
          <details
            key={i}
            className="rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white open:bg-white p-4 group transition"
          >
            <summary className="font-semibold text-gray-800 cursor-pointer list-none flex items-center justify-between gap-3">
              <span className="flex-1">{item.q}</span>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-orange-600 text-base font-bold group-open:rotate-45 transition">
                +
              </span>
            </summary>
            <p className="text-sm text-gray-600 leading-8 mt-3 pt-3 border-t border-gray-100">
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </ProsePage>
  );
}
