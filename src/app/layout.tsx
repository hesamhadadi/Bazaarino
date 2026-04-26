import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/providers/AuthProvider';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';
import BrandColorProvider from '@/components/providers/BrandColorProvider';
import ChatProvider from '@/components/providers/ChatProvider';
import PushNotificationProvider from '@/components/providers/PushNotificationProvider';
import CookieBanner from '@/components/layout/CookieBanner';
import AnnouncementBar from '@/components/layout/AnnouncementBar';
import MaintenanceGate from '@/components/layout/MaintenanceGate';
import { getAppUrl } from '@/lib/app-url';

const vazir = Vazirmatn({
  subsets: ['arabic', 'latin'],
  display: 'swap',
  variable: '--font-vazir',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
});

const appUrl = getAppUrl();

const siteName = 'بازارینو';
const siteTitle = 'بازارینو | نیازمندی‌های ایرانیان اروپا';
const siteDescription =
  'بازارینو - پلتفرم آگهی و خدمات ایرانیان در اروپا. خرید، فروش، اجاره مسکن، رزرو خونه، استخدام و خدمات در ایتالیا، آلمان و انگلستان.';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  alternates: {
    canonical: '/',
    types: {
      'application/rss+xml': '/feed.xml',
    },
  },
  title: {
    default: siteTitle,
    template: '%s | بازارینو',
  },
  description: siteDescription,
  keywords: [
    'ایرانیان اروپا', 'ایرانیان ایتالیا', 'ایرانیان آلمان', 'ایرانیان انگلستان',
    'آگهی', 'خرید فروش', 'اجاره خانه', 'رزرو خونه', 'دیوار ایتالیا',
    'bazaarino', 'iranians in europe',
  ],
  applicationName: siteName,
  authors: [{ name: 'Bazaarino Team' }],
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-touch-icon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    title: siteName,
    statusBarStyle: 'default',
  },
  openGraph: {
    siteName,
    title: siteTitle,
    description: siteDescription,
    url: appUrl,
    locale: 'fa_IR',
    type: 'website',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteTitle,
    description: siteDescription,
    images: ['/og-default.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    alternateName: 'Bazaarino',
    url: appUrl,
    logo: `${appUrl}/logo-eu.svg`,
    sameAs: [
      'https://t.me/bazaarino',
    ],
  };

  const siteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: appUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${appUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="fa-IR" dir="rtl" className={vazir.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
        />
      </head>
      <body className={`${vazir.className} font-vazir bg-gray-50 min-h-screen`}>
        <AuthProvider>
          <BrandColorProvider />
          <ChatProvider>
            <AnnouncementBar />
            <MaintenanceGate>{children}</MaintenanceGate>
            <PWAInstallPrompt />
            <PushNotificationProvider />
            <CookieBanner />
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  fontFamily: 'var(--font-vazir), Vazirmatn, sans-serif',
                  direction: 'rtl',
                },
              }}
            />
          </ChatProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
