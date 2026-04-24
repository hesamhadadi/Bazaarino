# تغییرات اعمال شده — Bazaarino

شاخه: `feature/seo-legal-otp`  
کامیت: `28497d2` — «feat: SEO, GDPR, saved searches, share button, phone OTP login»  
آمار: **۳۳ فایل، ‎+۱٬۸۴۶ / −۱۶**  
وضعیت: `tsc --noEmit` و `next build` هر دو پاس شدند.

---

## ۱) SEO (P0)
- `src/app/robots.ts` — robots پویا با Disallow مسیرهای خصوصی (`/api/`, `/admin/`, `/profile/`, …) و sitemap.
- `src/app/sitemap.ts` — sitemap پویا با مسیرهای ایستا + همه کشور/شهر/دسته + تا ۵۰۰۰ آگهی + تا ۲۰۰۰ مقاله.
- `src/app/layout.tsx` — بازنویسی متادیتا:
  - `metadataBase` + `alternates.canonical`
  - `robots: { index: true, follow: true, googleBot: … }` (رفع noindex)
  - `openGraph` + `twitter: summary_large_image`
  - JSON-LD سراسری `Organization` و `WebSite` با `SearchAction` (Google sitelinks searchbox)
  - عنوان/توضیحات به «ایرانیان اروپا» تغییر کرد (پوشش ایتالیا + آلمان + انگلستان طبق `COUNTRIES`).
- `src/app/ads/[id]/page.tsx`:
  - `generateMetadata` پویا بر اساس آگهی (title/description/og:image/twitter card)
  - JSON-LD `Apartment` / `Product` با `Offer` + `BreadcrumbList` + `PostalAddress`
- `src/app/search/page.tsx`:
  - `generateMetadata` پویا از فیلترها (q/category/city/country)

## ۲) صفحات قانونی و GDPR
- `src/app/about/page.tsx` — معرفی، مأموریت، ویژگی‌ها.
- `src/app/terms/page.tsx` — شرایط استفاده (۷ بند).
- `src/app/privacy/page.tsx` — سیاست حفظ حریم خصوصی مطابق GDPR (Art. 6(1)(a/b/f)، Art. 15/16/17/18/20/21).
- `src/app/contact/page.tsx` — ایمیل + تلگرام + واتساپ.
- `src/app/faq/page.tsx` — ۸ سؤال با accordion و JSON-LD `FAQPage`.
- `src/components/layout/Footer.tsx` — فوتر ۴ ستونه با تمام لینک‌ها.
- `src/components/layout/CookieBanner.tsx` — بنر رضایت کوکی (قبول/فقط ضروری) با localStorage.
- فوتر به `layout.tsx` (سراسری) + صفحات ads/[id] و search اضافه شد.

## ۳) Saved Searches
- `src/models/SavedSearch.ts` — مدل با ایندکس یکتا `(userId, query)`.
- `src/app/api/saved-searches/route.ts` — `GET` + `POST` (نرمال‌سازی query، conflict detection).
- `src/app/api/saved-searches/[id]/route.ts` — `PATCH` (تغییر نام/آلارم) + `DELETE`.
- `src/components/search/SaveSearchButton.tsx` — دکمه ذخیره (اگر لاگین نباشد redirect).
- `src/app/saved-searches/page.tsx` — مدیریت جست‌وجوها: اجرا/فعال/غیرفعال آلارم/حذف.
- `src/middleware.ts` — محافظت `/saved-searches`.
- `src/components/layout/Navbar.tsx` — لینک «جست‌وجوهای ذخیره شده» در منوی کاربر.

## ۴) Share Button
- `src/components/ads/ShareButton.tsx` — Web Share API + fallback کپی لینک (با toast).
- جایگزین آیکون ایستای `Share2` در `ads/[id]`.

## ۵) صفحات پایدار
- `src/app/not-found.tsx` — 404 فارسی.
- `src/app/loading.tsx` — loader سفارشی.
- `src/app/error.tsx` — صفحه خطای کلاینت با دکمه تلاش مجدد.

## ۶) ورود با شماره موبایل + OTP (رایگان)
معماری: **Telegram Gateway اول** (رایگان برای کاربران تلگرامی، بدون سقف، https://gateway.telegram.org/) → اگر تلگرام غیرممکن بود، **fallback ایمیل** (از SMTP موجود).

- `src/lib/phone.ts` — نرمال‌سازی ارقام فارسی/عربی، تبدیل `09xxxxxxxxx` به `+98…`، اعتبارسنجی E.164.
- `src/lib/telegram-gateway.ts` — کلاینت REST برای `checkSendAbility` + `sendVerificationMessage`.
- `src/lib/otp.ts` — تولید کد ۶ رقمی، `bcrypt` hash، انقضای ۵ دقیقه، cooldown ۶۰ ثانیه، حداکثر ۵ تلاش.
- `src/models/OTP.ts` — با TTL index روی `expiresAt` (حذف خودکار از Mongo).
- `src/app/api/auth/otp/send/route.ts` — تلاش تلگرام → fallback ایمیل (اگر یوزر ایمیل دارد).
- `src/app/api/auth/otp/verify/route.ts` — اعتبارسنجی کد (اختیاری، برای UX).
- `src/lib/auth.ts` — CredentialsProvider جدید با `id: 'phone-otp'`. اگر کاربر نباشد، **خودکار** حساب جدید با ایمیل placeholder می‌سازد.
- `src/app/auth/phone-login/page.tsx` — UI دو مرحله‌ای (شماره → کد) با cooldown و ویرایش شماره.
- `src/app/auth/login/page.tsx` — دکمه «ورود با شماره موبایل».

## ۷) DevEx
- `.env.example` — کامل با همه کلیدها (NEXTAUTH_*، MONGODB_URI، GOOGLE_*، SMTP_*، **TELEGRAM_GATEWAY_TOKEN**، **OTP_DEV_MODE**، VAPID، …).

---

## فایل‌های تغییر یافته (۳۳)
### جدید (۲۰)
```
.env.example
src/app/about/page.tsx
src/app/api/auth/otp/send/route.ts
src/app/api/auth/otp/verify/route.ts
src/app/api/saved-searches/[id]/route.ts
src/app/api/saved-searches/route.ts
src/app/auth/phone-login/page.tsx
src/app/contact/page.tsx
src/app/error.tsx
src/app/faq/page.tsx
src/app/loading.tsx
src/app/not-found.tsx
src/app/privacy/page.tsx
src/app/robots.ts
src/app/saved-searches/page.tsx
src/app/sitemap.ts
src/app/terms/page.tsx
src/components/ads/ShareButton.tsx
src/components/layout/CookieBanner.tsx
src/components/layout/Footer.tsx
src/components/search/SaveSearchButton.tsx
src/lib/otp.ts
src/lib/phone.ts
src/lib/telegram-gateway.ts
src/models/OTP.ts
src/models/SavedSearch.ts
```

### ویرایش‌شده (۷)
```
src/app/ads/[id]/page.tsx
src/app/auth/login/page.tsx
src/app/layout.tsx
src/app/search/page.tsx
src/components/layout/Navbar.tsx
src/lib/auth.ts
src/middleware.ts
```

---

## قدم‌های بعدی برای رفتن به پروداکشن

1. **توکن Telegram Gateway**: برو به https://gateway.telegram.org/ با حساب تلگرام لاگین کن، از «API access» توکن بگیر، در Vercel env به نام `TELEGRAM_GATEWAY_TOKEN` اضافه کن. رایگانه برای شماره‌های دارای تلگرام.
2. **تست لوکال**: `OTP_DEV_MODE=true` در `.env.local` → کد در لاگ سرور چاپ می‌شه (بدون نیاز به توکن).
3. **Google Search Console**: sitemap جدید را submit کن: `https://bazaarino.online/sitemap.xml`.
4. **پیشنهاد نشده اما خوبه**: از robots قدیمی static که احتمالاً در `public/` بود مطمئن شو جوری حذف شده که با route `/robots.ts` تداخل نداشته باشه.

---

## Push و PR

```bash
git push -u origin feature/seo-legal-otp
# سپس در GitHub PR باز کن به main
```
