# 🇮🇹 بازارینو (Bazaarino)

پلتفرم آگهی، چت لحظه‌ای، و رزرو مسکن برای فارسی‌زبانان ایتالیا، آلمان و انگلستان — ساخته‌شده با Next.js 14 + MongoDB.

Website: [bazaarino.com](https://bazaarino.com)

---

## ✨ امکانات

### آگهی و جستجو
- ثبت و مدیریت آگهی با ۱۱ دسته‌بندی و ۵۲ زیر‌دسته
- پشتیبانی از ۳ کشور (ایتالیا، آلمان، انگلستان) و ۲۴ شهر
- جستجو و فیلتر پیشرفته
- آپلود تصاویر با Cloudinary
- نقشه Leaflet روی صفحه آگهی
- ذخیره آگهی در علاقه‌مندی‌ها

### چت و تعامل لحظه‌ای
- چت خریدار و فروشنده با Socket.IO (Conversation, Message, Read receipt)
- ارسال تصویر در چت
- نشانگر آنلاین بودن / آخرین بازدید (Presence)
- شمارنده پیام‌های خوانده‌نشده
- گزارش آگهی یا کاربر متخلف

### رزرو مسکن
- سیستم رزرو اتاق و خانه (`/house-reservation`)
- تأیید/رد رزرو توسط صاحب ملک
- تقویم شمسی/میلادی برای انتخاب تاریخ
- تخمین قیمت بازار از feed خارجی

### احراز هویت
- ورود با Email/Password (NextAuth Credentials)
- ورود با Google OAuth
- بازنشانی رمز عبور با ایمیل (token-based)

### اعلان‌ها
- Web Push Notification (PWA آماده نصب)
- اعلان ایمیلی تأیید/رد آگهی
- تلگرام bot برای اعلان‌های ادمین

### پنل مدیریت
- تأیید/رد آگهی
- مدیریت کاربران، بنرها، و تصاویر شهرها
- داشبورد آمار (تعداد آگهی، کاربر فعال، و ...)
- مدیریت گزارش‌های تخلف
- تنظیمات global اپ

### سایر
- بخش اخبار و مقاله (`/news`)
- پروفایل عمومی کاربران (`/u/[id]`)
- سیستم امتیازدهی به کاربران
- Import آگهی از کانال تلگرام (`scripts/import-telegram-ads.js`)
- طراحی موبایل‌فرست، RTL کامل، فونت وزیرمتن
- نسخه Expo/React Native در `mobile/`

---

## 🛠 تکنولوژی‌ها

| بخش | ابزار |
|-----|------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| UI | React 18, Tailwind CSS 3, lucide-react |
| State / Forms | React Hook Form + Zod |
| Auth | NextAuth.js (Credentials + Google OAuth) |
| Database | MongoDB 7 + Mongoose |
| Realtime | Socket.IO |
| Maps | Leaflet + react-leaflet |
| Media | Cloudinary |
| Email | Nodemailer (SMTP) |
| Push | web-push (VAPID) |
| Date | date-fns, react-multi-date-picker |
| Local DB | Docker Compose (mongo:7) |
| Mobile | Expo 54, React Native 0.81 |
| Deploy | Vercel |

---

## 📦 ساختار پروژه

```
src/
├── app/
│   ├── ads/                  # لیست، جزئیات، ثبت آگهی
│   ├── search/               # جستجو و فیلتر
│   ├── messages/             # چت کاربران
│   ├── house-reservation/    # رزرو خانه/اتاق
│   ├── news/                 # اخبار و مقالات
│   ├── favorites/            # علاقه‌مندی‌ها
│   ├── notifications/        # اعلان‌ها
│   ├── profile/              # پروفایل کاربر
│   ├── u/[id]/               # پروفایل عمومی کاربر
│   ├── auth/                 # ورود، ثبت‌نام، reset
│   ├── admin/                # پنل مدیریت
│   └── api/                  # API routes (ads, auth, conversations, ...)
├── components/
│   ├── ads/                  # AdCard و ...
│   ├── home/                 # Hero و بنرها
│   ├── layout/               # Navbar, BottomNav
│   ├── maps/                 # Leaflet wrapper
│   ├── notifications/
│   ├── providers/            # Auth, Theme, ...
│   ├── pwa/                  # Service worker و install prompt
│   ├── reservations/
│   └── ui/                   # اجزای عمومی
├── lib/
│   ├── mongodb.ts            # اتصال Mongoose (با cache)
│   ├── auth.ts               # NextAuth config
│   ├── email.ts              # SMTP helpers
│   ├── push-notifications.ts # web-push + VAPID
│   ├── socket-server.ts      # Socket.IO server
│   ├── telegram.ts           # Telegram bot client
│   ├── market-price.ts       # قیمت بازار مسکن
│   ├── ad-moderation.ts      # منطق تأیید/رد آگهی
│   ├── constants.ts          # کشورها، شهرها، دسته‌بندی‌ها
│   └── ...
├── models/                   # Ad, User, Conversation, Message, Reservation,
│                             # Rating, Report, Article, Banner, Notification,
│                             # PushSubscription, ...
├── pages/                    # (اگر نیاز به Pages Router داریم)
├── types/
└── middleware.ts             # Auth guard برای /admin, /profile, /messages, ...
mobile/                       # نسخه Expo/React Native
scripts/
└── import-telegram-ads.js    # import آگهی از کانال تلگرام
docker-compose.yml            # MongoDB محلی
```

---

## 🚀 اجرای محلی

### ۱. نصب وابستگی‌ها

```bash
npm install
```

### ۲. بالا آوردن MongoDB محلی (اختیاری)

```bash
npm run db:up       # MongoDB روی localhost:27017
npm run db:logs     # مشاهده لاگ
npm run db:down     # خاموش کردن
```

### ۳. تنظیم متغیرهای محیطی

یک فایل `.env.local` در ریشه پروژه بساز:

```bash
# ---- Database ----
MONGODB_URI=mongodb://localhost:27017/bazaarino

# ---- NextAuth ----
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ---- Google OAuth (اختیاری) ----
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# ---- Cloudinary (برای آپلود تصویر) ----
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# ---- SMTP (برای ایمیل تأیید/رد آگهی و reset پسورد) ----
SMTP_HOST=
SMTP_PORT=587                 # 587 یا 465
SMTP_SECURE=false             # true برای TLS مستقیم (port 465)
SMTP_USER=
SMTP_PASS=
SMTP_FROM=                    # اختیاری، در غیر این صورت از SMTP_USER

# ---- Web Push (PWA notifications) ----
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com

# ---- Cron (برای پردازش اعلان‌های چت) ----
CRON_SECRET=your-cron-secret

# ---- Market Price Feed (اختیاری) ----
EXTERNAL_HOUSING_PRICE_FEED_URL=
EXTERNAL_HOUSING_PRICE_STATIC=
EXTERNAL_HOUSING_PRICE_STATIC_SOURCE=
```

> **VAPID keys:** می‌تونی با `npx web-push generate-vapid-keys` بسازی‌شون.

### ۴. اجرای dev server

```bash
npm run dev
```

اپ روی http://localhost:3000 بالا میاد.

---

## 📜 Scripts

| دستور | کار |
|------|-----|
| `npm run dev` | اجرای dev (Next.js) |
| `npm run build` | ساخت production |
| `npm start` | اجرای build |
| `npm run lint` | lint |
| `npm run db:up` / `db:down` / `db:logs` | MongoDB محلی با Docker |
| `npm run mobile:start` | اجرای Expo dev server |
| `npm run mobile:android` | اجرای اندروید |
| `npm run mobile:typecheck` | type-check اپ موبایل |
| `node scripts/import-telegram-ads.js` | import آگهی از کانال تلگرام |

---

## 📱 نسخه موبایل (React Native / Expo)

نسخه موبایل در پوشه [`mobile/`](./mobile) قرار داره و به همان API وصل می‌شه. برای اجرا، به `mobile/README.md` مراجعه کن.

خلاصه build اندروید:

```bash
cd mobile
npx eas-cli login
npx eas-cli build --platform android --profile preview
```

---

## 🚢 Deploy (Vercel)

- تمام متغیرهای `.env.local` رو توی Vercel Project → Settings → Environment Variables کپی کن
- `NEXTAUTH_URL` رو روی domain production بگذار
- MongoDB Atlas (یا هر cluster خارجی) برای `MONGODB_URI`
- Webhook تلگرام رو روی `https://<domain>/api/telegram/webhook` ست کن

---

## 👤 نویسنده

**Hesam Hadadi** — [hesamhaddadi.com](https://hesamhaddadi.com) · [GitHub](https://github.com/hesamhadadi)
