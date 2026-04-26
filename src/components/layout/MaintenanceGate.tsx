import Link from 'next/link';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { Wrench, ShieldCheck } from 'lucide-react';
import { authOptions } from '@/lib/auth';
import { getAppSettings } from '@/lib/settings';

const BYPASS_PREFIXES = ['/admin', '/auth', '/api'];

export default async function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const settings = await getAppSettings();
  if (!settings.maintenanceMode) return <>{children}</>;

  const h = headers();
  const pathname = h.get('x-pathname') || '/';
  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  // Admins bypass everywhere
  const session = await getServerSession(authOptions);
  if (session?.user?.role === 'admin' || session?.user?.role === 'editor') {
    return <>{children}</>;
  }

  const siteName = settings.siteName || 'بازارینو';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-white to-amber-50 px-6 py-12">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
          <Wrench size={28} />
        </div>
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3">
          سایت در حال به‌روزرسانی است
        </h1>
        <p className="text-sm md:text-base text-gray-600 leading-7 mb-8">
          {siteName} موقتاً در حال به‌روزرسانی برنامه‌ریزی‌شده است. لطفاً چند لحظه دیگر دوباره سر بزنید — ممنون از صبر و همراهی شما.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-700 transition"
          >
            <ShieldCheck size={14} />
            ورود ادمین
          </Link>
          {settings.supportEmail && (
            <a
              href={`mailto:${settings.supportEmail}`}
              className="text-xs text-gray-500 hover:text-gray-900 transition"
            >
              {settings.supportEmail}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
