# 🇮🇹 بازارینو (Bazaarino)
## نیازمندی‌های ایرانیان ایتالیا

پلتفرم آگهی آنلاین برای ایرانیان مقیم ایتالیا - مشابه دیوار

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


