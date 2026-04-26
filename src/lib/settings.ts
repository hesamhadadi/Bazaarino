import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';

export type AppSettings = {
  telegramToken: string;
  telegramChatId: string;
  telegramSecret: string;
  siteUrl: string;
  siteName: string;
  siteDescription: string;
  brandPrimary: string;
  supportEmail: string;
  supportPhone: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  adAutoApprove: boolean;
  maxAdsPerUser: number;
  featuredPrice1d: number;
  featuredPrice7d: number;
  featuredPrice30d: number;
  announcementText: string;
  announcementEnabled: boolean;
};

const DEFAULTS: AppSettings = {
  telegramToken: '',
  telegramChatId: '',
  telegramSecret: '',
  siteUrl: '',
  siteName: 'بازارینو',
  siteDescription: 'نیازمندی‌های ایرانیان اروپا',
  brandPrimary: '#f97316',
  supportEmail: '',
  supportPhone: '',
  maintenanceMode: false,
  registrationEnabled: true,
  adAutoApprove: false,
  maxAdsPerUser: 0,
  featuredPrice1d: 0,
  featuredPrice7d: 0,
  featuredPrice30d: 0,
  announcementText: '',
  announcementEnabled: false,
};

// Simple in-memory TTL cache (per Node process)
const CACHE_TTL_MS = 30_000;
let cache: { value: AppSettings; at: number } | null = null;

export async function getAppSettings(opts?: { force?: boolean }): Promise<AppSettings> {
  if (!opts?.force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.value;
  }
  try {
    await connectDB();
    const s = (await Setting.findOne({ key: 'global' }).lean()) as any;
    const merged: AppSettings = {
      ...DEFAULTS,
      ...Object.fromEntries(
        Object.entries(s || {}).filter(([k]) => k in DEFAULTS),
      ),
    } as AppSettings;
    // Coerce booleans/numbers explicitly
    merged.maintenanceMode = !!s?.maintenanceMode;
    merged.registrationEnabled = s?.registrationEnabled !== false;
    merged.adAutoApprove = !!s?.adAutoApprove;
    merged.announcementEnabled = !!s?.announcementEnabled;
    merged.maxAdsPerUser = Number(s?.maxAdsPerUser) || 0;
    cache = { value: merged, at: Date.now() };
    return merged;
  } catch {
    return DEFAULTS;
  }
}

export function invalidateSettingsCache() {
  cache = null;
}

export const SETTINGS_DEFAULTS = DEFAULTS;
