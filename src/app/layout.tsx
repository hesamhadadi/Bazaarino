import type { Metadata, Viewport } from 'next';
import './globals.css';
import 'leaflet/dist/leaflet.css';
import { Toaster } from 'react-hot-toast';
import AuthProvider from '@/components/providers/AuthProvider';
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt';

export const metadata: Metadata = {
  title: 'بازارینو | نیازمندی‌های ایرانیان ایتالیا',
  description: 'بازارینو - پلتفرم آگهی ایرانیان ایتالیا. خرید، فروش، اجاره و خدمات در شهرهای ایتالیا',
  keywords: 'ایرانی ایتالیا، آگهی، خرید فروش، دیوار ایتالیا، bazaarino',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icons/apple-touch-icon.svg', type: 'image/svg+xml' }],
  },
  appleWebApp: {
    capable: true,
    title: 'بازارینو',
    statusBarStyle: 'default',
  },
  openGraph: {
    title: 'بازارینو | نیازمندی‌های ایرانیان ایتالیا',
    description: 'بازارینو - پلتفرم آگهی ایرانیان ایتالیا',
    locale: 'fa_IR',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
          type="text/css"
        />
      </head>
      <body className="font-vazir bg-gray-50 min-h-screen">
        <AuthProvider>
          {children}
          <PWAInstallPrompt />
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: 'Vazirmatn, sans-serif',
                direction: 'rtl',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
