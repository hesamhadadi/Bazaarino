import type { Metadata } from 'next';
import { ShieldCheck } from 'lucide-react';
import ProsePage from '@/components/layout/ProsePage';

export const metadata: Metadata = {
  title: 'سیاست حفظ حریم خصوصی',
  description: 'سیاست حفظ حریم خصوصی بازارینو مطابق با GDPR.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <ProsePage
      eyebrow="اطلاعات حقوقی"
      title="سیاست حفظ حریم خصوصی"
      subtitle="منطبق با مقررات GDPR اتحادیه اروپا. می‌دونیم اعتماد چقدر مهمه — این صفحه دقیقاً می‌گه با داده‌های شما چه می‌کنیم."
      meta={`آخرین به‌روزرسانی: ${new Date().toLocaleDateString('fa-IR')}`}
      icon={<ShieldCheck size={20} />}
    >
      <div className="space-y-6 text-sm text-gray-700 leading-8">
          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۱. داده‌هایی که جمع‌آوری می‌کنیم</h2>
            <ul className="list-disc pr-5 space-y-1">
              <li>اطلاعات حساب: نام، ایمیل، شماره تماس، تصویر پروفایل</li>
              <li>اطلاعات آگهی‌ها و پیام‌های کاربر</li>
              <li>اطلاعات فنی: IP، نوع دستگاه، مرورگر، کوکی‌های ضروری</li>
              <li>داده‌های احراز هویت (در صورت ارسال مدرک اختیاری KYC)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۲. مبنای قانونی پردازش (GDPR Art. 6)</h2>
            <ul className="list-disc pr-5 space-y-1">
              <li>رضایت شما (Art. 6(1)(a)) — برای اعلان‌های بازاریابی و کوکی‌های غیرضروری</li>
              <li>اجرای قرارداد (Art. 6(1)(b)) — برای ارائه خدمات پلتفرم</li>
              <li>منافع مشروع (Art. 6(1)(f)) — برای جلوگیری از تقلب و بهبود سرویس</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۳. اشتراک‌گذاری داده‌ها</h2>
            <p>
              ما داده‌های شخصی شما را نمی‌فروشیم. داده‌ها فقط با ارائه‌دهندگان زیرساخت (مثل هاست، ارسال ایمیل)
              به مقدار لازم به اشتراک گذاشته می‌شود، همگی با قراردادهای پردازش داده (DPA) منطبق با GDPR.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۴. حقوق شما</h2>
            <p>شما طبق GDPR این حقوق را دارید:</p>
            <ul className="list-disc pr-5 space-y-1 mt-2">
              <li>دسترسی به داده‌های خود (Art. 15)</li>
              <li>اصلاح داده‌های نادرست (Art. 16)</li>
              <li>حذف حساب و داده‌ها (Art. 17 — «حق فراموش شدن»)</li>
              <li>محدود کردن یا اعتراض به پردازش (Art. 18, 21)</li>
              <li>قابلیت انتقال داده‌ها (Art. 20)</li>
            </ul>
            <p className="mt-2">
              برای اعمال این حقوق با <a href="mailto:privacy@bazaarino.online" className="text-brand-600 font-semibold">privacy@bazaarino.online</a> در تماس باشید.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۵. نگهداری داده‌ها</h2>
            <p>
              داده‌های حساب کاربری تا زمان حذف حساب نگهداری می‌شوند. لاگ‌های امنیتی تا ۱۲ ماه و داده‌های بکاپ حداکثر ۹۰ روز.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۶. کوکی‌ها</h2>
            <p>
              از کوکی‌های ضروری برای عملکرد سایت و کوکی‌های تحلیل جمعی (anonymized) استفاده می‌کنیم. می‌توانید
              از طریق بنر کوکی تنظیمات را تغییر دهید.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۷. کودکان</h2>
            <p>بازارینو برای افراد زیر ۱۶ سال طراحی نشده و داده‌ای از این افراد جمع‌آوری نمی‌کنیم.</p>
          </section>
      </div>
    </ProsePage>
  );
}
