import Link from 'next/link';
import Image from 'next/image';
import { Mail, MessageCircle, Send } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import LandingPage from '@/models/LandingPage';

export const dynamic = 'force-dynamic';

/**
 * Pulls a small set of published city landing pages so the footer can
 * link directly to them. This builds an internal-link graph from every
 * page on the site → city hubs, which is one of the cheapest SEO wins
 * we can get for keyword targeting.
 *
 * Errors are swallowed so a DB hiccup never breaks the global footer.
 */
async function fetchCityLinks() {
  try {
    await connectDB();
    const pages = await LandingPage.find({
      status: 'published',
      pageType: 'city',
    })
      .select('slug title targetCity')
      .sort({ updatedAt: -1 })
      .limit(8)
      .lean();
    return pages as Array<{ slug: string; title: string; targetCity?: string }>;
  } catch {
    return [];
  }
}

/**
 * Strips the marketing tail from titles like
 *   "ایرانیان تورین | آگهی، مسکن و راهنمای تورین | بازارینو"
 * so the footer link reads "ایرانیان تورین" — short, scannable, and
 * still keyword-rich.
 */
function shortLabel(title: string) {
  const head = title.split('|')[0]?.trim() || title;
  return head.length > 30 ? head.slice(0, 30) + '…' : head;
}

export default async function Footer() {
  const year = new Date().getFullYear();
  const cityLinks = await fetchCityLinks();

  return (
    <footer className="bg-white border-t border-gray-200 mt-10">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-5 gap-8">
        <div className="col-span-2 md:col-span-1">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <Image src="/logo-eu.svg" alt="bazaarino" width={28} height={28} />
            <span className="text-xl font-bold text-gray-800">بازارینو</span>
          </Link>
          <p className="text-sm text-gray-500 leading-7">
            پلتفرم آگهی و خدمات ایرانیان در اروپا — از آپارتمان و رزرو خونه تا استخدام، خرید و فروش.
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">بازارینو</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/about" className="hover:text-brand-600">درباره ما</Link></li>
            <li><Link href="/contact" className="hover:text-brand-600">تماس با ما</Link></li>
            <li><Link href="/faq" className="hover:text-brand-600">سؤالات متداول</Link></li>
            <li><Link href="/news" className="hover:text-brand-600">اخبار</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">خدمات</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/search" className="hover:text-brand-600">جست‌وجوی آگهی</Link></li>
            <li><Link href="/ads/new" className="hover:text-brand-600">ثبت آگهی رایگان</Link></li>
            <li><Link href="/house-reservation" className="hover:text-brand-600">رزرو خونه</Link></li>
            <li><Link href="/saved-searches" className="hover:text-brand-600">جست‌وجوهای ذخیره شده</Link></li>
          </ul>
        </div>

        {/* SEO money column — only renders when we actually have published
            city pages, so we don't ship an empty list to the user. */}
        {cityLinks.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">جامعه ایرانیان</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              {cityLinks.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`/p/${p.slug}`}
                    className="hover:text-brand-600 inline-block"
                  >
                    {shortLabel(p.title)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-gray-800 mb-3 text-sm">قانونی</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li><Link href="/terms" className="hover:text-brand-600">شرایط استفاده</Link></li>
            <li><Link href="/privacy" className="hover:text-brand-600">سیاست حفظ حریم خصوصی</Link></li>
            <li>
              <a
                href="mailto:support@bazaarino.online"
                className="hover:text-brand-600 inline-flex items-center gap-1"
              >
                <Mail size={14} /> support@bazaarino.online
              </a>
            </li>
            <li className="flex items-center gap-3 pt-1">
              <a href="https://t.me/bazaarino" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-sky-500" aria-label="Telegram">
                <Send size={18} />
              </a>
              <a href="https://wa.me/000000000000" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-emerald-500" aria-label="WhatsApp">
                <MessageCircle size={18} />
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-gray-500 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {year} Bazaarino. کلیه حقوق محفوظ است.</p>
          <p>
            ساخته شده با ❤️ برای ایرانیان اروپا
          </p>
        </div>
      </div>
    </footer>
  );
}
