# گزارش جامع: باگ مقاله‌ها + ممیزی SEO + تحلیل رقبا

تاریخ: ۲۶ آوریل ۲۰۲۶  
کامیت: `7cb19cc` (branch: `feature/seo-legal-otp`)

---

## بخش ۱ — چرا مقاله‌ها باز نمی‌شن؟ (حل شد ✅)

### ریشه‌ی باگ

دو باگ همپوشان پیدا شد که هر کدام به‌تنهایی می‌تونن باعث خطا بشن:

#### باگ اصلی: `MissingSchemaError: Schema hasn't been registered for model "User"`

در `@/Users/hesamhadadinick/Desktop/My Projects/Bazaarino-work/src/app/news/[slug]/page.tsx:17-18` (نسخه قبلی) و `@/Users/hesamhadadinick/Desktop/My Projects/Bazaarino-work/src/app/news/page.tsx:33-34`:

```
Article.findOne(...).populate('authorId', 'name avatar role')
```

اما User model هیچ‌وقت `import` نشده بود. روی Vercel / در serverless cold start که مسیر `/news/[slug]` قبل از هر مسیر دیگری (که User رو لود می‌کنه) فراخوانی بشه، Mongoose این خطا رو پرتاب می‌کنه. 

بدتر از همه، `try/catch` اطراف `getArticle` این خطا رو می‌خورد (swallow) و `null` برمی‌گردونه → `notFound()` صدا زده می‌شه → کاربر یک صفحه 404 می‌بینه. به همین دلیل «مقاله با زدن روش باز نمی‌شه».

**فیکس**: اضافه کردن `import '@/models/User';` به هر دو فایل.

#### باگ دوم: `Invalid src prop ... hostname not configured`

در `@/Users/hesamhadadinick/Desktop/My Projects/Bazaarino-work/next.config.mjs` فقط دو host مجازند:
- `res.cloudinary.com`
- `lh3.googleusercontent.com`

ولی در `@/Users/hesamhadadinick/Desktop/My Projects/Bazaarino-work/src/app/news/new/page.tsx:101` کاربر (admin/editor) یک **لینک آزاد** برای coverImage وارد می‌کنه. اگه لینک از مثلاً Unsplash یا هر دامین دیگه‌ای باشه، `next/image` در زمان SSR throw می‌کنه → صفحه `error.tsx` نمایش داده می‌شه.

**فیکس**: جایگزینی `<Image>` با `<img>` ساده برای `coverImage` و avatar author (که هر دوشون URL آزاد هستن). این کار Cloudinary/Google rest رو هم نگه می‌داره امن.

### بهبودهای جانبی در همین پچ
- اضافه کردن JSON-LD `Article` + `BreadcrumbList` به صفحه مقاله (برای Google News / Discover).
- اضافه کردن `generateMetadata` کامل (og:type=article، publishedTime، author، tags).
- جایگزینی `og-default.svg` با **PNG 1200×630** (بسیاری شبکه‌های اجتماعی SVG رو قبول نمی‌کنن).
- `canonical` و `Footer` به صفحات مقاله اضافه شد.
- slug در sitemap با `encodeURIComponent` کدگذاری شد (حل مشکل URL‌های فارسی در XML).
- description مقاله در `public/manifest.webmanifest` به‌روز شد.

### فایل‌های تغییر کرده در این پچ
```
src/app/news/page.tsx
src/app/news/[slug]/page.tsx
src/app/ads/[id]/page.tsx
src/app/layout.tsx
src/app/page.tsx
src/app/sitemap.ts
public/manifest.webmanifest
public/og-default.png    (جدید)
public/og-default.svg    (جدید)
```

---

## بخش ۲ — ممیزی کامل زیرساخت SEO

### ✅ چیزهایی که الان درسته

| مورد | وضعیت |
|------|-------|
| `robots.ts` پویا با Disallow مسیرهای خصوصی | ✅ |
| `sitemap.xml` پویا (ads + articles + countries + cities + categories) | ✅ |
| `metadataBase` + `alternates.canonical` در layout | ✅ |
| `robots: { index: true, follow: true }` | ✅ |
| OpenGraph + Twitter Cards + og:image PNG | ✅ |
| JSON-LD: Organization + WebSite+SearchAction (global) | ✅ |
| JSON-LD: Apartment/Product + BreadcrumbList (ads) | ✅ |
| JSON-LD: Article + BreadcrumbList (news) | ✅ |
| JSON-LD: FAQPage | ✅ |
| `generateMetadata` پویا در ads، news، search | ✅ |
| `lang="fa"` + `dir="rtl"` | ✅ |
| HTTPS + NEXTAUTH_URL متغیر محیطی | ✅ |
| صفحات not-found / loading / error فارسی | ✅ |
| GDPR: Privacy + Terms + Contact + FAQ + CookieBanner | ✅ |

### ⚠️ نکاتی که می‌شه هنوز بهتر کرد (P1)

1. **HTML lang تگ فقط `fa`ست نه `fa-IR`**: بهتر است دقیق‌تر باشه.
   - فایل: `@/Users/hesamhadadinick/Desktop/My Projects/Bazaarino-work/src/app/layout.tsx:96`
   - فعلی: `<html lang="fa" dir="rtl">`
   - پیشنهاد: `<html lang="fa-IR" dir="rtl">` (یا اگر چندزبانه شد، `hreflang`s).

2. **iframes/فونت خارجی**: از CDN jsdelivr فونت Vazirmatn رو می‌گیریم. این یک external request است که CLS ایجاد می‌کنه. بهتره فونت رو self-host کنی یا از `next/font` استفاده کنی.
   - فایل: `@/Users/hesamhadadinick/Desktop/My Projects/Bazaarino-work/src/app/layout.tsx:100-104`
   - پیشنهاد:
     ```tsx
     import { Vazirmatn } from 'next/font/google';
     const vazir = Vazirmatn({ subsets: ['arabic'], display: 'swap' });
     // <body className={`${vazir.className} ...`}>
     ```

3. **`public/og-default.png` فقط انگلیسی‌خواناست**: تولیدش از SVG با `sips` بوده که فونت فارسی سیستم رو درست رندر نمی‌کنه. بهتره یک طراحی حرفه‌ای با Canva/Figma اکسپورت بشه و به همین نام جایگزین بشه. یا در برخی ابزارهای کمی پیشرفته‌تر.

4. **URL slug های فارسی برای مقالات**: Google و Bing آدرس‌های URL-encoded فارسی رو اندیس می‌کنن ولی در SERP کمتر clickable نشون می‌دن. پیشنهاد: در `@/Users/hesamhadadinick/Desktop/My Projects/Bazaarino-work/src/lib/slug.ts` به انگلیسی transliterate بشه (از `slugify` با `locale: 'fa'` یا یک lookup ساده).

5. **ads/[id] آدرس با ObjectId دارد، نه slug**: URL مثل `/ads/670abc…def` برای SEO ضعیف است. **راه‌حل**: اضافه کردن slug به Ad (title-based + suffix ID کوتاه):
   - مثال: `/ads/apartamento-roma-2-camere-ab12cd34`
   - یک middleware 301 redirect از id-only به slug-based.
   - تاثیر زیاد روی CTR گوگل.

6. **عدم وجود `<h1>` یکتا در home page**: صفحه اصلی شاید چند h1 یا h2-مانند h1 داشته باشه. باید بررسی بشه که فقط یک h1 دقیق باشه مثل «نیازمندی‌های ایرانیان اروپا».

7. **داده‌ی `ItemList` برای صفحات لیستی**: در `/search` و `/` می‌توان JSON-LD `ItemList` اضافه کرد با ۱۰ آگهی اول. این به Google rich results کمک می‌کنه.

8. **Core Web Vitals**:
   - تصویر بنرها با inline-style `background-image` لود می‌شن (در search) — این با Lighthouse LCP بد است. بهتره با `next/image` priority بشن.
   - از `<img>` برای cover مقاله (که الان برای فیکس اضافه کردم) lazy-loaded نیست. بهتره `loading="lazy"` اضافه بشه.

9. **Analytics و جست‌وجو**: Google Analytics 4 و Google Search Console هنوز نصب نیستن (حداقل در کد). بدون اینها نمی‌تونی بازدید رو اندازه بگیری.
   - اضافه کردن: `@vercel/analytics` (رایگان، privacy-friendly) یا GA4.
   - Plausible یا Umami برای تحلیل GDPR-friendly.

10. **Rich sitemap با `<image:image>` tags**: Next.js sitemap خودش از این پشتیبانی مستقیم نمی‌کنه ولی می‌تونی custom `route.xml.ts` بسازی. این کمک می‌کنه تا تصاویر آگهی‌ها در Google Images دیده بشن (ترافیک مهم برای املاک).

11. **Hreflang**: اگه بخوای نسخه انگلیسی/ایتالیایی داشته باشی، نیاز به `<link rel="alternate" hreflang="...">` هست.

12. **Canonical در search**: الان `canonical: '/search'` بدون query string است. این درسته برای جلوگیری از duplicate content — ولی باید مطمئن بشی Google ورژن فیلتر خاص رو هم در SERP کلیکابل نگه می‌داره. یک راه: برای صفحات فیلتر پرطرفدار (مثل شهر+دسته محبوب) صفحه ایستای اختصاصی بساز.

### ❌ مشکلات جدی‌تر (P0)

1. **`public/sw.js` سرویس‌ورکر قدیمی**: اگه فعال باشه ممکنه کش‌های منسوخ نگه داره. بررسی کن.

2. **`NEXT_PUBLIC_APP_URL` از env درست ست شده باشه در Vercel**: اگه نباشه، `getAppUrl()` به `localhost:3000` می‌افته و همه canonical/og خراب می‌شه. **این مرگ‌بارترین مشکل SEO ممکن است.** بررسی فوری کن.

3. **Tag‌های احتمالی `unset` در Vercel**: متغیرهای `NEXTAUTH_SECRET` یا `MONGODB_URI` — اگه نباشن، serverless function crash می‌کنه و Googlebot صفحه‌ی 500 می‌گیره → de-index.

4. **PWA service worker ممکنه مسیرهای جدید `/about`, `/terms` و... رو کش نکنه یا نسخه کشد قدیمی سرو کنه**: پس از deploy، service worker رو unregister کن یا نسخه‌اش رو آپدیت کن.

---

## بخش ۳ — تحلیل رقبا و استراتژی افزایش بازدید

> **توجه**: من دسترسی مستقیم به آنالیتیکس سایت‌های رقیب ندارم، ولی بر اساس شناخت بازار ایرانیان اروپا (به‌ویژه ایتالیا)، رقبا و کانال‌های رشدشون قابل تشخیصن.

### رقبای اصلی

| رقیب | مدل | نقطه قوت | نقطه ضعف |
|------|-----|----------|----------|
| **divar.com** | دیوار بین‌المللی (اخیراً کانال ایرانیان اروپا اضافه کرده) | برند شناخته‌شده، اپ موبایل، اعتبار | تمرکز اصلی روی ایران، UX برای اروپا سفارشی‌سازی ضعیف |
| **ایران‌استارز / ایتالیاپرس** | گروه‌های تلگرامی + سایت خبری | جامعه بزرگ تلگرامی، اخبار روز | بدون ساختار آگهی منظم، بدون جست‌وجو |
| **گروه‌های فیسبوک** (مثل "ایرانیان ایتالیا") | گروه‌های FB/Telegram | رایگان، community strong | هیچ SEO، آگهی‌ها گم می‌شن |
| **kijiji.it / subito.it** | بازار محلی ایتالیا | برند محلی قوی، SEO خوب | غیرفارسی، مختص ایتالیایی‌ها |
| **sahibinden.com / ebay-kleinanzeigen.de** | بازار محلی هر کشور | قدرتمند | غیرفارسی |
| **persian-europe.com / iranican.de** | پورتال‌های قدیمی | کامیونیتی | UI قدیمی، mobile ناسازگار |

### نقاط قوت منحصربه‌فرد بازارینو (USP)

1. **فارسی + اروپا محور** (divar روی ایران، subito روی ایتالیایی‌ها → تو تنها پلتفرم مدرنِ فارسی‌زبانی که به خانواده/دانشجوی تازه‌رسیده اروپا سرویس می‌ده)
2. **رزرو خونه روزانه/هفتگی** — هیچ رقیب فارسی‌زبانی این رو نداره
3. **فیلترهای بومی**: Revolut، رزیدنسا، مرور قبض‌ها، Agency fee — مختص نیاز مهاجران
4. **نقشه و فاصله تا دانشگاه** — دانشجویان نیاز دقیق دارن
5. **تقویم شمسی + میلادی**

### استراتژی جامع افزایش بازدید (به ترتیب ROI)

#### فاز ۱ — Quick Wins (هفته ۱–۴)

**۱. Google Search Console + Bing Webmaster راه‌اندازی**
- `sitemap.xml` جدید رو submit کن.
- URL inspection برای ۱۰ صفحه کلیدی.
- ساخت property `bazaarino.online` و تأیید مالکیت از طریق DNS TXT.

**۲. بک‌لینک‌های اولیه (حیاتی برای DA)**
- ثبت در دایرکتوری‌های ایرانیان خارج از کشور (iranianinus، iransalmon، ایران‌استارز).
- گروه‌های تلگرامی ۱۰K+ عضو: پست معرفی (رایگان یا با هماهنگی).
- وبلاگ‌های ایرانیان اروپا: یک guest post رایگان با لینک داخلی.
- هدف: ۱۵–۲۵ بک‌لینک کیفی تا هفته ۴.

**۳. تولید محتوای Long-tail (هر هفته ۲ مقاله)**
کلمات کلیدی با intent بالا و رقابت کم:
- "اجاره آپارتمان برای دانشجوی ایرانی در رم"
- "رزیدنسا چیه و چطور بگیریم در ایتالیا"
- "خرید ماشین دست دوم توسط تازه مهاجر آلمان"
- "قرارداد اجاره به فارسی (با نمونه)"
- "هم‌خانه ایرانی پیدا کردن در میلان"
- "افتتاح حساب Revolut بدون IBAN"
- "کار بدون پیمیت در ایتالیا (مجاز/غیرمجاز)"
- "ارسال بار از ایران به اروپا"
- "بهترین شهرهای آلمان برای فامیلی ایرانی"
- "تبدیل گواهینامه ایرانی به اروپایی"

هر مقاله ۱۲۰۰–۲۰۰۰ کلمه + تگ‌ها + coverImage + CTA به بخش آگهی مرتبط.

**۴. Structured Data بیشتر**
- `RealEstateListing` به‌جای `Apartment` (Google مخصوص این schema نتایج غنی می‌ده)
- `Product` + `Offer` + `AggregateRating` برای آگهی‌های با rating
- `Event` برای آگهی‌های ایونت (مهمانی‌های ایرانی)

**۵. نوتیفیکیشن وب‌پوش برای saved searches**
- کاربر ذخیره می‌کنه: "آپارتمان رم زیر ۸۰۰ یورو"
- cron هر ۳ ساعت بررسی + push notification
- بازگشت کاربر = retention = SEO signal قوی

#### فاز ۲ — رشد ارگانیک (ماه ۲–۶)

**۶. صفحات ایستای local-SEO**
- `/italy/roma/apartment` یا `/اجاره-خانه/رم` (نسخه ایستا با H1 هدفمند).
- صفحات شهر: `/cities/berlin` با ۳۰ آگهی برتر + توضیح شهر + FAQ.
- صفحات دسته + شهر: `/jobs/milan`، `/housing/munich`.
- با Next.js ISR: revalidate هر ۱ ساعت.

**۷. بک‌لینک با محتوا (Link Bait)**
- گزارش سالانه: "وضعیت مسکن ایرانیان در رم ۲۰۲۶" با آمار از دیتابیس خودت.
- ابزار رایگان: "محاسبه‌گر بودجه زندگی دانشجو در ایتالیا" (خودت build کن).
- اینفوگرافیک: "نقشه محلات ایرانی‌نشین اروپا".
- Press release به روزنامه‌های ایرانی اروپا.

**۸. تلگرام به‌عنوان موتور ترافیک اصلی**
- **کانال رسمی با cross-post خودکار آگهی‌های featured**
- ربات بازارینو: کاربر در تلگرام جست‌وجو می‌کنه → لینک سایت
- گروه‌های شهری: "بازارینو رم"، "بازارینو میلان" — ۳۰۰۰ عضو هر کدام در ۶ ماه.

**۹. اینستاگرام + TikTok**
- ویدیوهای ۶۰ ثانیه‌ای: "۵ چیزی که قبل از اجاره خونه در رم باید بدونی"
- هر ویدیو → لینک bio به یک landing page خاص.
- Reel با موضوع روز: "این آپارتمان رم ۵۰۰ یورو در هفته فقط" + لینک آگهی.

**۱۰. SEO فنی پیشرفته**
- **Image sitemap**: ترافیک Google Images.
- **News sitemap** (Google News approval): اگه مقالات خبری داشته باشی تعداد بالا.
- **hreflang** برای نسخه ایتالیایی/انگلیسی بعداً.
- **AMP** (دیگه خیلی مهم نیست ولی می‌تونه کمک کنه).

#### فاز ۳ — رشد پایدار (ماه ۶+)

**۱۱. برنامه ارجاع (Referral)**
- معرفی دوست = ۱ ماه آگهی ویژه رایگان.
- هر ارجاع = یک کاربر فعال + یک لینک WhatsApp.

**۱۲. SEO محلی (Google Business Profile)**
- ثبت در `business.google.com` به‌عنوان Online Marketplace.
- افزودن دفتر نمادین (یا home office) در رم / برلین.

**۱۳. پارتنرشیپ با رستوران‌ها/سوپرهای ایرانی**
- QR code "بازارینو برای ایرانیان" در منو/ویترین آن‌ها
- در ازای یک آگهی رایگان ویژه یک ماهه.

**۱۴. پادکست ایرانیان اروپا**
- برنامه هفتگی ۲۰ دقیقه‌ای: مصاحبه با ایرانی موفق در اروپا.
- پخش در Spotify، Apple Podcast، کست‌باکس.
- هر اپیزود Show Notes با لینک‌های آگهی‌های مرتبط.

**۱۵. ابزارهای رایگان (Lead Magnet)**
- محاسبه‌گر مالیات ایتالیا، مقایسه بانک‌های اروپا، چک‌لیست مهاجرت.
- هر ابزار = یک صفحه جداگانه = یک لینک‌سَر.

### KPIهای پیشنهادی برای پایش (هفتگی)

| KPI | هدف ۳ ماهه | هدف ۶ ماهه |
|-----|-------------|-------------|
| Impressions گوگل | 50K/month | 200K/month |
| Clicks گوگل | 2K/month | 10K/month |
| Domain Authority (Moz) | 10 | 20 |
| بک‌لینک‌های کیفی | 30 | 120 |
| ثبت‌نام جدید روزانه | 20 | 80 |
| آگهی فعال | 500 | 2500 |
| تایم ساعت‌روی‌سایت میانگین | 1:30 | 2:30 |

### ترند بازار

- **مهاجرت جدید ایرانیان پس از ۲۰۲۲ → رشد ۲۰–۳۰٪ سالانه** در ایتالیا/آلمان. این پنجره‌ی طلایی برای گرفتن سهم بازار است.
- **TikTok فارسی در اروپا** در حال رشد انفجاری — فرصت کم‌هزینه.
- **Reddit r/persian** و `r/iranianinItaly` — SEO-friendly community‌های کوچک ولی متعهد.

---

## پروسه اجرا

```bash
# ۱. push فیکس‌ها
cd "/Users/hesamhadadinick/Desktop/My Projects/Bazaarino-work"
git push -u origin feature/seo-legal-otp

# ۲. روی Vercel دیپلوی کن و این env‌ها رو حتماً ست کن:
#    NEXT_PUBLIC_APP_URL=https://bazaarino.online
#    NEXTAUTH_URL=https://bazaarino.online
#    NEXTAUTH_SECRET=...
#    MONGODB_URI=...
#    TELEGRAM_GATEWAY_TOKEN=... (اختیاری برای OTP)

# ۳. Google Search Console: sitemap submit کن
#    https://bazaarino.online/sitemap.xml

# ۴. تست کن: یک مقاله‌ی موجود رو باز کن → دیگه خطا نمی‌ده.
```
