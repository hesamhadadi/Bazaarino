# Bazaarino Mobile

اپ موبایل Bazaarino با Expo/React Native در این پوشه قرار دارد و به API فعلی Next.js در ریشه repo وصل می‌شود.

## معماری

- `App.tsx`: ورودی اپ و تعریف navigation stack
- `src/screens/HomeScreen.tsx`: دریافت لیست آگهی‌ها از `GET /api/ads`
- `src/screens/AdDetailsScreen.tsx`: دریافت جزئیات آگهی از `GET /api/ads/:id`
- `src/screens/RegisterScreen.tsx`: ثبت نام با `POST /api/auth/register`
- `src/lib/config.ts`: تعیین Base URL بک‌اند
- `eas.json`: پروفایل‌های build اندروید

## اجرای محلی

1. در ریشه repo وب را اجرا کنید:

```bash
npm run dev
```

2. در پوشه `mobile` فایل env بسازید:

```bash
cp .env.example .env
```

3. در `.env`، آدرس API را روی IP سیستم خودتان بگذارید. مثال:

```bash
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.20:3000
```

4. اپ موبایل را اجرا کنید:

```bash
npm run start
```

برای اندروید:

```bash
npm run android
```

## خروجی APK

ساده‌ترین مسیر برای APK استفاده از EAS Build است:

```bash
npx eas-cli login
npx eas-cli build:configure
npx eas-cli build --platform android --profile preview
```

پروفایل `preview` در [`eas.json`](/Users/hesamhadadinick/Desktop/My%20Projects/Bazaarino/bazaarino-final/bazaarino_work/mobile/eas.json) روی `apk` تنظیم شده است.

## محدودیت فعلی

احراز هویت وب در پروژه اصلی با `NextAuth` و cookie-based session انجام می‌شود. این نسخه موبایل فعلاً:

- مرور آگهی‌ها را پشتیبانی می‌کند
- جزئیات آگهی را نشان می‌دهد
- ثبت نام کاربر جدید را انجام می‌دهد

برای لاگین و عملیات نیازمند session در موبایل، باید auth token-based مخصوص موبایل به بک‌اند اضافه شود.
