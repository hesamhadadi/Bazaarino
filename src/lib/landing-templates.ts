/**
 * Pre-built landing page templates the admin can spin up with one click.
 * The templates are intentionally generous — better to have more sections
 * than the admin needs (which they can delete) than to make them assemble
 * a city page from scratch every time.
 */

import { getCityLabel, getCountryByCity } from '@/lib/constants';
import type { LandingSection, FaqItem } from '@/models/LandingPage';

interface TemplateInput {
  cityValue?: string;
  cityLabel?: string;
  category?: string;
}

function nanoid() {
  return Math.random().toString(36).slice(2, 10);
}

export interface TemplateResult {
  title: string;
  metaDescription: string;
  metaKeywords: string[];
  pageType: 'city' | 'category' | 'campaign' | 'general';
  targetCity?: string;
  targetCategory?: string;
  sections: LandingSection[];
  faq: FaqItem[];
}

/** Build a fully-loaded city landing page (the SEO money page). */
export function buildCityTemplate({ cityValue, cityLabel }: TemplateInput): TemplateResult {
  const city = cityValue || 'torino';
  const cityFa = cityLabel || getCityLabel(city) || 'تورین';
  const country = getCountryByCity(city) || 'italy';
  const countryFa = country === 'italy' ? 'ایتالیا' : country;

  const sections: LandingSection[] = [
    {
      id: nanoid(),
      type: 'hero',
      data: {
        eyebrow: `جامعه ایرانیان ${cityFa}`,
        title: `بازارینوی ${cityFa}`,
        subtitle: `همه چیز برای ایرانیان مقیم ${cityFa} در یک مکان: اجاره خانه، آگهی‌ها، گفتگو، اخبار و راهنماهای کاربردی.`,
        showFlag: country === 'italy',
        primaryCta: {
          label: `آگهی‌های ${cityFa}`,
          href: `/search?city=${city}`,
        },
        secondaryCta: {
          label: 'ثبت آگهی رایگان',
          href: '/ads/new',
        },
      },
    },
    {
      id: nanoid(),
      type: 'stats',
      data: {
        title: `بازارینو در ${cityFa} به یک نگاه`,
        auto: true,
        targetCity: city,
      },
    },
    {
      id: nanoid(),
      type: 'feature-grid',
      data: {
        title: `چرا بازارینو برای زندگی در ${cityFa}؟`,
        subtitle: 'تجربه‌ای ساخته‌شده برای ایرانیان مقیم اروپا',
        features: [
          {
            emoji: '🏠',
            title: 'اجاره خانه و اتاق',
            description: `بهترین آگهی‌های مسکن ${cityFa} از کاربران ایرانی، با امکان رزرو آنلاین.`,
          },
          {
            emoji: '🛒',
            title: 'خرید و فروش امن',
            description: 'آگهی از کاربران احراز هویت شده، چت داخلی و سیستم گزارش‌دهی.',
          },
          {
            emoji: '📚',
            title: 'راهنماهای کاربردی',
            description: `راهنمای زندگی، ویزا، دانشگاه و فرصت‌های شغلی در ${cityFa}.`,
          },
          {
            emoji: '🤝',
            title: 'جامعه فعال',
            description: 'گفتگو با ایرانیان دیگر، پیدا کردن همخانه، شغل و دوستان جدید.',
          },
          {
            emoji: '⭐',
            title: 'فروشنده‌های مورد اعتماد',
            description: 'سیستم امتیازدهی و بج‌های فروشنده برتر و متخصص تأیید شده.',
          },
          {
            emoji: '🆓',
            title: 'کاملاً رایگان',
            description: 'ثبت آگهی، چت و رزرو خانه برای کاربران عادی بدون هزینه است.',
          },
        ],
      },
    },
    {
      id: nanoid(),
      type: 'ad-grid',
      data: {
        title: `جدیدترین آگهی‌های ${cityFa}`,
        subtitle: 'مستقیم از کاربران ایرانی فعال در شهر',
        city,
        limit: 8,
      },
    },
    {
      id: nanoid(),
      type: 'ad-grid',
      data: {
        title: `اجاره خانه و اتاق در ${cityFa}`,
        subtitle: 'بهترین آگهی‌های مسکن از فروشندگان فارسی‌زبان',
        city,
        category: 'real-estate',
        limit: 6,
      },
    },
    {
      id: nanoid(),
      type: 'rich-text',
      data: {
        title: `زندگی ایرانی در ${cityFa}`,
        body: `${cityFa} یکی از شهرهای پویا و پرجاذبه ${countryFa} است که جامعه‌ای فعال از ایرانیان را در خود جای داده است.\n\nاز دانشجویان دانشگاه‌های معتبر گرفته تا متخصصان شاغل، کارآفرینان و خانواده‌های مهاجر، ${cityFa} مقصدی محبوب برای ایرانیان مقیم اروپا است.\n\nبازارینو تلاش می‌کند زندگی روزمره ایرانیان ${cityFa} را با ارائه پلتفرمی فارسی، امن و رایگان ساده‌تر کند.`,
      },
    },
    {
      id: nanoid(),
      type: 'article-grid',
      data: {
        title: `راهنماهای ${cityFa}`,
        subtitle: 'مقالاتی که زندگی شما را راحت‌تر می‌کند',
        tags: [city, cityFa, cityFa.toLowerCase()],
        limit: 4,
      },
    },
    {
      id: nanoid(),
      type: 'cta-banner',
      data: {
        title: `همین حالا به جامعه بازارینوی ${cityFa} بپیوند`,
        subtitle: 'ثبت‌نام رایگان، آگهی نامحدود، چت با کاربران ایرانی شهر شما',
        cta: {
          label: 'ثبت‌نام رایگان',
          href: '/auth/register',
        },
        variant: 'orange',
      },
    },
  ];

  const faq: FaqItem[] = [
    {
      q: `چطور در ${cityFa} از بازارینو استفاده کنم؟`,
      a: `کافی است ثبت‌نام کنید، شهر خود را روی ${cityFa} تنظیم کنید و آگهی‌ها، مقالات و کاربران فارسی‌زبان شهر را ببینید. ثبت آگهی هم رایگان است.`,
    },
    {
      q: `آیا اجاره خانه از طریق بازارینو در ${cityFa} امن است؟`,
      a: 'بازارینو ابزارهای احراز هویت، چت داخلی، سیستم رزرو و امتیازدهی را در اختیار شما می‌گذارد. توصیه می‌کنیم پیش از پرداخت، حضوری ملک را بازدید کرده و از کاربران دارای بج «احراز هویت شده» اولویت دهید.',
    },
    {
      q: `هزینه ثبت آگهی برای ایرانیان ${cityFa} چقدر است؟`,
      a: 'ثبت آگهی برای کاربران عادی کاملاً رایگان است. تنها در صورت تمایل به ویژه‌سازی آگهی (Featured) هزینه‌ای دریافت می‌شود.',
    },
    {
      q: `چطور با ایرانیان دیگر در ${cityFa} ارتباط بگیرم؟`,
      a: 'از طریق گفتگوی داخلی روی هر آگهی یا پروفایل می‌توانید مستقیم پیام بفرستید. به‌زودی تالار گفتگوی شهری هم اضافه می‌شود.',
    },
    {
      q: `آیا بازارینو در ${cityFa} فعال است؟`,
      a: `بله، صدها ایرانی مقیم ${cityFa} روزانه از بازارینو استفاده می‌کنند و آگهی‌های جدید مرتب اضافه می‌شود.`,
    },
  ];

  return {
    title: `ایرانیان ${cityFa} | آگهی، مسکن و راهنمای ${cityFa} | بازارینو`,
    metaDescription: `بزرگ‌ترین جامعه آنلاین ایرانیان ${cityFa}. آگهی، اجاره خانه، خرید و فروش، چت و راهنمای زندگی در ${cityFa} برای ایرانیان مقیم ${countryFa}.`,
    metaKeywords: [
      `ایرانیان ${cityFa}`,
      `اجاره خانه ${cityFa}`,
      `ایرانی در ${cityFa}`,
      `آگهی ${cityFa}`,
      `زندگی در ${cityFa}`,
      `بازارینو ${cityFa}`,
      'ایرانیان اروپا',
      'مهاجرت',
    ],
    pageType: 'city',
    targetCity: city,
    sections,
    faq,
  };
}
