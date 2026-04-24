import type { Metadata } from 'next';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';

export const metadata: Metadata = {
  title: 'شرایط استفاده',
  description: 'شرایط استفاده از خدمات بازارینو.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">شرایط استفاده از بازارینو</h1>
        <p className="text-xs text-gray-500 mb-6">آخرین به‌روزرسانی: {new Date().toLocaleDateString('fa-IR')}</p>

        <div className="space-y-6 text-sm text-gray-700 leading-8">
          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۱. پذیرش شرایط</h2>
            <p>با ساخت حساب یا استفاده از خدمات بازارینو، شما با این شرایط و سیاست حفظ حریم خصوصی ما موافقت می‌کنید.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۲. حساب کاربری</h2>
            <p>مسئولیت حفظ امنیت حساب و گذرواژه شما با شماست. تمام فعالیت‌ها از طریق حساب شما به نام شما ثبت می‌شود.</p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۳. محتوای کاربر</h2>
            <p>
              شما مسئول کامل اطلاعاتی هستید که در آگهی‌ها و پیام‌های خود منتشر می‌کنید. ارسال محتوای غیرقانونی،
              گمراه‌کننده، دارای مالکیت فکری دیگران، یا توهین‌آمیز ممنوع است.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۴. معاملات بین کاربران</h2>
            <p>
              بازارینو یک پلتفرم واسطه است. ما طرف هیچ قرارداد خرید/فروش/اجاره بین کاربران نیستیم و مسئولیت
              کیفیت کالا/خدمات، صحت ادعاها و اجرای توافق بر عهده دو طرف معامله است.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۵. ممنوعیت‌ها</h2>
            <ul className="list-disc pr-5 space-y-1">
              <li>ارسال اسپم، تبلیغ جعلی یا کلاه‌برداری</li>
              <li>جعل هویت یا استفاده از اطلاعات دیگران</li>
              <li>آگهی اقلام غیرقانونی (مواد مخدر، سلاح، کالای سرقتی)</li>
              <li>سوءاستفاده از سیستم پیام/چت</li>
              <li>تلاش برای دور زدن محدودیت‌های فنی پلتفرم</li>
            </ul>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۶. مسئولیت و جبران خسارت</h2>
            <p>
              بازارینو تا حد مجاز قانون، هیچ مسئولیتی در قبال خسارات مستقیم یا غیرمستقیم ناشی از استفاده از
              سرویس ندارد. شما موافقت می‌کنید در صورت ادعای ثالث ناشی از محتوای شما، از بازارینو جبران خسارت کنید.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-gray-800 text-base mb-2">۷. تغییرات و خاتمه</h2>
            <p>
              بازارینو می‌تواند این شرایط را به‌روزرسانی کند. ادامه استفاده پس از تغییرات به معنای پذیرش آن‌هاست.
              حساب کاربری متخلف ممکن است بدون اطلاع قبلی غیرفعال شود.
            </p>
          </section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}
