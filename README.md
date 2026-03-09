# 🇮🇹 بازارینو (Bazaarino)
## نیازمندی‌های ایرانیان ایتالیا

پلتفرم آگهی آنلاین برای ایرانیان مقیم ایتالیا - مشابه دیوار

---

## 🔐 راه‌اندازی Google Login

### ۱. ساخت پروژه در Google Cloud Console
1. به [console.cloud.google.com](https://console.cloud.google.com) برو
2. پروژه جدید بساز → **APIs & Services → Credentials**
3. روی **Create Credentials → OAuth 2.0 Client ID** کلیک کن
4. نوع رو **Web application** انتخاب کن
5. در بخش **Authorized redirect URIs** اضافه کن:
   - `http://localhost:3000/api/auth/callback/google` (محلی)
   - `https://your-domain.vercel.app/api/auth/callback/google` (پروداکشن)
6. `Client ID` و `Client Secret` رو کپی کن

### ۲. اضافه کردن به `.env.local`
```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
```

---



### ۱. نصب پیش‌نیازها
```bash
npm install
```

### ۲. تنظیم متغیرهای محیطی
فایل `.env.local` بسازید:
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/bazaarino

# NextAuth (یک رشته تصادفی ۳۲+ کاراکتری)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-min-32-chars

# Cloudinary (برای آپلود تصاویر)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### ۳. ساخت اکانت ادمین
```bash
# اول سرور رو اجرا کن
npm run dev

# بعد این آدرس رو باز کن تا اکانت ادمین بسازی:
# POST http://localhost:3000/api/auth/register
# body: { "name": "مدیر", "email": "admin@bazaarino.com", "password": "your-pass" }
# بعداً از MongoDB Atlas مقدار role رو به "admin" تغییر بده
```

### ۴. اجرای محلی
```bash
npm run dev
# http://localhost:3000
```

---

## 📦 ساختار پروژه

```
src/
├── app/
│   ├── page.tsx              # صفحه اصلی
│   ├── search/               # جستجو و فیلتر
│   ├── ads/
│   │   ├── new/              # ثبت آگهی جدید
│   │   └── [id]/             # صفحه آگهی
│   ├── auth/
│   │   ├── login/            # ورود
│   │   └── register/         # ثبت‌نام
│   ├── profile/
│   │   ├── page.tsx          # پروفایل کاربر
│   │   └── ads/              # آگهی‌های من
│   ├── admin/                # پنل مدیریت
│   └── api/                  # API routes
├── components/
│   ├── layout/               # Navbar, BottomNav
│   ├── ads/                  # AdCard
│   └── providers/            # AuthProvider
├── lib/
│   ├── mongodb.ts            # اتصال دیتابیس
│   ├── auth.ts               # NextAuth config
│   └── constants.ts          # شهرها، دسته‌بندی‌ها
└── models/
    ├── User.ts               # مدل کاربر
    └── Ad.ts                 # مدل آگهی
```

---

## 🌐 استقرار روی Vercel

### ۱. Push به GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/username/bazaarino.git
git push -u origin main
```

### ۲. اتصال به Vercel
1. وارد [vercel.com](https://vercel.com) شو
2. روی "Import Project" کلیک کن
3. مخزن GitHub رو انتخاب کن
4. Environment Variables رو اضافه کن (همان مقادیر `.env.local`)
5. مقدار `NEXTAUTH_URL` رو به دامنه Vercel تغییر بده
6. Deploy!

---

## ✨ امکانات

- ✅ ثبت و مدیریت آگهی
- ✅ ۱۰ دسته‌بندی + ۴۰ زیر دسته
- ✅ ۱۶ شهر ایتالیا
- ✅ احراز هویت (ورود/ثبت‌نام)
- ✅ پنل مدیریت (تأیید/رد آگهی)
- ✅ آپلود تصاویر (Cloudinary)
- ✅ جستجو و فیلتر پیشرفته
- ✅ طراحی موبایل‌فرست
- ✅ فونت وزیرمتن فارسی
- ✅ RTL کامل

---

## 🛠 تکنولوژی‌ها

| بخش | تکنولوژی |
|-----|---------|
| Frontend | Next.js 14, React 18 |
| Styling | Tailwind CSS |
| Database | MongoDB + Mongoose |
| Auth | NextAuth.js |
| Images | Cloudinary |
| Font | Vazirmatn |
| Deploy | Vercel |

---

## 📱 صفحات

| مسیر | توضیح |
|------|-------|
| `/` | صفحه اصلی |
| `/search` | جستجو و فیلتر |
| `/ads/new` | ثبت آگهی |
| `/ads/:id` | صفحه آگهی |
| `/auth/login` | ورود |
| `/auth/register` | ثبت‌نام |
| `/profile` | پروفایل کاربر |
| `/profile/ads` | آگهی‌های من |
| `/admin` | پنل مدیریت |
