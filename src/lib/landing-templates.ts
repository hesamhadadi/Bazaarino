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

/**
 * Hand-curated facts per city. The renderer uses these as fallback
 * paragraphs and FAQ context so even cities without a single ad still
 * have meaningful content for SEO. Anything missing falls back to a
 * generic city-agnostic paragraph.
 */
interface CityFacts {
  highlights: string[];
  universities?: string[];
  description: string;
}

const CITY_FACTS: Record<string, CityFacts> = {
  turin: {
    description:
      'تورین (Torino) پایتخت منطقه پیمونته در شمال غرب ایتالیا و چهارمین شهر بزرگ ایتالیاست. این شهر صنعتی و فرهنگی، خانه دانشگاه پلی‌تکنیک تورین، یکی از معتبرترین دانشگاه‌های فنی اروپا، است و جامعه‌ای رو به رشد از دانشجویان و متخصصان ایرانی را در خود جای داده.',
    highlights: [
      'مقصد محبوب دانشجویان ایرانی به دلیل دانشگاه پلی‌تکنیک تورین (Politecnico di Torino)',
      'هزینه زندگی پایین‌تر از میلان و رم، با کیفیت زندگی بالا',
      'مرکز صنعت خودروسازی ایتالیا (FIAT) و فرصت‌های شغلی مهندسی',
      'فرهنگ غنی، موزه‌های کلاسیک و کوه‌های آلپ در نزدیکی',
    ],
    universities: ['Politecnico di Torino', 'Università degli Studi di Torino'],
  },
  milan: {
    description:
      'میلان (Milano) پایتخت اقتصادی و مد ایتالیا و دومین شهر بزرگ کشور است. میلان پویاترین جامعه ایرانیان شمال ایتالیا را در خود دارد و قطب کسب‌وکار، طراحی و دانشگاه‌های معتبر مانند Politecnico di Milano و Bocconi است.',
    highlights: [
      'پایتخت کسب‌وکار، مد و دیزاین ایتالیا',
      'دانشگاه‌های جهانی: Politecnico di Milano, Bocconi, Università Statale',
      'بازار کار قوی برای متخصصان فناوری، مالی و طراحی',
      'متروی گسترده و دسترسی عالی به شهرهای دیگر اروپا',
    ],
    universities: [
      'Politecnico di Milano',
      'Università Bocconi',
      'Università degli Studi di Milano',
    ],
  },
  rome: {
    description:
      'رم (Roma) پایتخت ایتالیا و یکی از تاریخی‌ترین شهرهای جهان است. رم بزرگ‌ترین شهر ایتالیا با جامعه گسترده ایرانی شامل دانشجویان، متخصصان، کارمندان دیپلماتیک و خانواده‌های مهاجر است.',
    highlights: [
      'پایتخت سیاسی و فرهنگی ایتالیا — مرکز سفارت‌ها و سازمان‌های بین‌المللی',
      'دانشگاه La Sapienza، یکی از قدیمی‌ترین دانشگاه‌های اروپا',
      'فرصت‌های شغلی در سازمان ملل (FAO, IFAD, WFP) و سایر نهادهای بین‌المللی',
      'بازار اجاره گسترده و آپشن‌های متنوع',
    ],
    universities: [
      'Sapienza Università di Roma',
      'Università di Roma Tor Vergata',
      'Roma Tre',
    ],
  },
  bologna: {
    description:
      'بولونیا (Bologna) پایتخت منطقه امیلیا-رومانیا و خانه قدیمی‌ترین دانشگاه جهان غرب (تأسیس ۱۰۸۸) است. این شهر دانشجویی پر از انرژی، یکی از مقاصد محبوب دانشجویان ایرانی پزشکی، مهندسی و علوم انسانی است.',
    highlights: [
      'دانشگاه بولونیا — قدیمی‌ترین دانشگاه دنیا با شهرت جهانی',
      'محیط دانشجویی پویا با هزینه زندگی متعادل',
      'مرکز فرهنگ، غذا و موسیقی ایتالیا',
      'موقعیت استراتژیک بین شمال و مرکز ایتالیا',
    ],
    universities: ['Università di Bologna'],
  },
  florence: {
    description:
      'فلورانس (Firenze) پایتخت توسکانی و گهواره رنسانس است. این شهر هنر و معماری مقصد دانشجویان رشته‌های هنر، طراحی و معماری از جمله ایرانیان مقیم است.',
    highlights: [
      'پایتخت رنسانس — شهری زنده با موزه‌های جهانی Uffizi و Accademia',
      'دانشگاه فلورانس و آکادمی هنر',
      'محیطی آرام‌تر از میلان و رم با فرهنگ فوق‌العاده',
      'پل قدیمی Ponte Vecchio و کلیسای Duomo از جاذبه‌های شهر',
    ],
    universities: [
      'Università degli Studi di Firenze',
      'Accademia di Belle Arti di Firenze',
    ],
  },
  venice: {
    description:
      'ونیز (Venezia) شهر کانال‌ها و یکی از منحصربه‌فردترین شهرهای جهان است. ونیز با Ca\' Foscari و IUAV دو دانشگاه قدرتمند در حوزه‌های اقتصاد، زبان و معماری دارد و میزبان دانشجویان ایرانی به‌ویژه در مقاطع تحصیلات تکمیلی است.',
    highlights: [
      'یکی از زیباترین شهرهای جهان با کانال‌ها، گوندولا و معماری بی‌نظیر',
      'دانشگاه‌های معتبر Ca\' Foscari (اقتصاد و علوم انسانی) و IUAV (معماری)',
      'فرصت‌های شغلی در گردشگری، هنر، صنایع دستی و کشتیرانی',
      'دسترسی عالی به شمال شرق ایتالیا، اتریش و اسلوونی',
    ],
    universities: ['Ca\' Foscari Università di Venezia', 'IUAV Università di Venezia'],
  },
  naples: {
    description:
      'ناپل (Napoli) سومین شهر بزرگ ایتالیا و پایتخت منطقه کامپانیا در جنوب کشور است. ناپل با هزینه زندگی بسیار پایین‌تر از شمال، دانشگاه قدیمی Federico II و فرهنگ منحصربه‌فرد جنوبی، گزینه‌ای جذاب برای دانشجویان و خانواده‌های ایرانی است.',
    highlights: [
      'هزینه زندگی پایین‌تر از میلان، رم و تورین — اجاره خانه ارزان‌تر',
      'دانشگاه Federico II، یکی از قدیمی‌ترین دانشگاه‌های دولتی جهان (تأسیس ۱۲۲۴)',
      'فرهنگ غنی، آشپزی معروف ایتالیا (پیتزای ناپلی) و دریا در دسترس',
      'موقعیت استراتژیک برای سفر به جنوب ایتالیا، سیسیل و ساردنیا',
    ],
    universities: [
      'Università degli Studi di Napoli Federico II',
      'Università degli Studi di Napoli L\'Orientale',
    ],
  },
  verona: {
    description:
      'ورونا (Verona) شهر تاریخی منطقه ونتو و خانه داستان رومئو و ژولیت است. ورونا با موقعیت میان میلان و ونیز، هزینه زندگی متعادل و دانشگاه با کیفیت، انتخابی هوشمندانه برای دانشجویان ایرانی است.',
    highlights: [
      'موقعیت عالی بین میلان و ونیز، ۱.۵ ساعت تا هرکدام',
      'هزینه زندگی پایین‌تر از کلان‌شهرها با کیفیت بالا',
      'آمفی‌تئاتر Arena di Verona و فستیوال اپرای جهانی',
      'دانشگاه ورونا قوی در پزشکی، اقتصاد و علوم انسانی',
    ],
    universities: ['Università degli Studi di Verona'],
  },
  padua: {
    description:
      'پادوا (Padova) یکی از قدیمی‌ترین شهرهای دانشگاهی اروپا با دانشگاهی که از سال ۱۲۲۲ فعال است. پادوا نزدیک ونیز، با محیط دانشجویی پر انرژی و هزینه زندگی متعادل، مقصدی محبوب برای دانشجویان ایرانی پزشکی و علوم پایه است.',
    highlights: [
      'دانشگاه Padova، دومین دانشگاه قدیمی ایتالیا (Galileo Galilei اینجا تدریس می‌کرد)',
      'یکی از بهترین دانشگاه‌های پزشکی، مهندسی و علوم پایه ایتالیا',
      'فقط ۳۰ دقیقه با قطار تا ونیز',
      'محیط دانشجویی پر جنب و جوش با هزینه زندگی متعادل',
    ],
    universities: ['Università degli Studi di Padova'],
  },
};

function getCityFacts(city: string): CityFacts {
  return (
    CITY_FACTS[city] || {
      description:
        'این شهر یکی از مقاصد محبوب ایرانیان مقیم اروپا است و جامعه‌ای رو به رشد از دانشجویان، متخصصان و خانواده‌های مهاجر را در خود جای داده.',
      highlights: [
        'دسترسی عالی به آموزش، کار و زیرساخت‌های شهری',
        'جامعه فعال ایرانیان با گفتگوها و رویدادهای منظم',
        'فرهنگ غنی ایتالیایی در کنار راحتی زندگی روزمره',
      ],
    }
  );
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
  // CITIES labels look like "تورین (Torino)". Split into a clean Persian-only
  // form for use in headlines/body copy, and keep the Latin form for use in
  // eyebrow / subtitle / SEO meta — much cleaner than dropping the raw label
  // into every <h1>.
  const rawLabel = cityLabel || getCityLabel(city) || 'تورین';
  const cityFa = rawLabel.split(' (')[0].trim();
  const cityEn = rawLabel.match(/\(([^)]+)\)/)?.[1]?.trim() || '';
  const country = getCountryByCity(city) || 'italy';
  const countryFa = country === 'italy' ? 'ایتالیا' : country;
  const facts = getCityFacts(city);
  const highlightLines = facts.highlights.map((h) => `• ${h}`).join('\n');
  const universitiesLine = facts.universities && facts.universities.length > 0
    ? `\n\n**دانشگاه‌های اصلی ${cityFa}:**\n${facts.universities.map((u) => `• ${u}`).join('\n')}`
    : '';

  const sections: LandingSection[] = [
    {
      id: nanoid(),
      type: 'hero',
      data: {
        eyebrow: `جامعه ایرانیان ${cityFa}`,
        title: `بازارینوی ${cityFa}`,
        cityEn,
        subtitle: `همه چیز برای ایرانیان مقیم ${cityFa} در یک مکان: اجاره خانه، آگهی‌ها، گفتگو، اخبار و راهنماهای کاربردی.`,
        showFlag: country === 'italy',
        cityValue: city,
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
        title: `زندگی در ${cityFa} با بازارینو، ساده‌تر`,
        subtitle: `هر چیزی که یک ایرانی تازه‌وارد یا مقیم ${cityFa} لازم دارد — یک‌جا، فارسی، رایگان`,
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
        title: `چرا ${cityFa}؟ نگاهی به زندگی ایرانی در این شهر`,
        body: `${facts.description}\n\n**ویژگی‌های شاخص ${cityFa} برای ایرانیان مقیم:**\n${highlightLines}${universitiesLine}\n\nبازارینو تلاش می‌کند زندگی روزمره ایرانیان ${cityFa} را با ارائه پلتفرمی فارسی، امن و رایگان ساده‌تر کند — از پیدا کردن خانه دانشجویی گرفته تا خرید مبلمان دست دوم، یافتن همخانه فارسی‌زبان و خواندن راهنماهای ورود به ${countryFa}.`,
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
