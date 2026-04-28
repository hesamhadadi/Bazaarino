/**
 * Default catalog of "خفن" badges that ship with the platform.
 *
 * The seeder upserts these on demand so an admin running the platform
 * gets a sensible starting set without manually creating each one. The
 * admin can later edit / delete / add to the collection from the panel.
 */

export interface DefaultBadge {
  slug: string;
  label: string;
  description: string;
  icon: string; // lucide name
  color?: string;
  gradient?: string;
  tier: string;
  sortOrder: number;
}

export const DEFAULT_BADGES: DefaultBadge[] = [
  {
    slug: 'founder',
    label: 'بنیان‌گذار',
    description: 'بنیان‌گذار و خالق بازارینو',
    icon: 'Crown',
    gradient: 'from-amber-400 via-orange-500 to-rose-500',
    color: '#f59e0b',
    tier: 'founder',
    sortOrder: 1,
  },
  {
    slug: 'team',
    label: 'تیم بازارینو',
    description: 'عضو رسمی تیم بازارینو',
    icon: 'Sparkles',
    gradient: 'from-fuchsia-500 via-purple-500 to-indigo-500',
    color: '#a855f7',
    tier: 'staff',
    sortOrder: 5,
  },
  {
    slug: 'verified-pro',
    label: 'متخصص تأیید شده',
    description: 'هویت و تخصص این کاربر توسط تیم بازارینو تأیید شده است',
    icon: 'BadgeCheck',
    color: '#0ea5e9',
    tier: 'verified',
    sortOrder: 10,
  },
  {
    slug: 'top-seller',
    label: 'فروشنده برتر',
    description: 'فروشنده‌ای با تعداد معاملات و امتیاز بالا',
    icon: 'Trophy',
    gradient: 'from-orange-400 via-amber-400 to-yellow-400',
    color: '#f97316',
    tier: 'achievement',
    sortOrder: 15,
  },
  {
    slug: 'early-adopter',
    label: 'همراه اول',
    description: 'از روزهای ابتدایی همراه ما بوده است',
    icon: 'Rocket',
    color: '#8b5cf6',
    tier: 'achievement',
    sortOrder: 20,
  },
  {
    slug: 'trusted',
    label: 'مورد اعتماد',
    description: 'فروشنده‌ای با سابقه طولانی مثبت',
    icon: 'ShieldCheck',
    color: '#10b981',
    tier: 'verified',
    sortOrder: 25,
  },
  {
    slug: 'mentor',
    label: 'راهنما',
    description: 'به ایرانی‌های تازه‌وارد در ایتالیا کمک می‌کند',
    icon: 'GraduationCap',
    color: '#6366f1',
    tier: 'community',
    sortOrder: 30,
  },
  {
    slug: 'top-author',
    label: 'نویسنده برتر',
    description: 'نویسنده مقالات پربازدید بازارینو',
    icon: 'PenLine',
    gradient: 'from-rose-500 via-pink-500 to-fuchsia-500',
    color: '#ec4899',
    tier: 'achievement',
    sortOrder: 35,
  },
  {
    slug: 'vip',
    label: 'VIP',
    description: 'کاربر ویژه بازارینو',
    icon: 'Star',
    gradient: 'from-yellow-300 via-amber-400 to-orange-500',
    color: '#facc15',
    tier: 'special',
    sortOrder: 40,
  },
  {
    slug: 'helper',
    label: 'یاری‌گر',
    description: 'به سؤالات کاربران دیگر پاسخ داده است',
    icon: 'HeartHandshake',
    color: '#14b8a6',
    tier: 'community',
    sortOrder: 45,
  },
  {
    slug: 'business-pro',
    label: 'کسب‌وکار حرفه‌ای',
    description: 'حساب تجاری فعال و تأیید شده',
    icon: 'Briefcase',
    color: '#0f172a',
    tier: 'verified',
    sortOrder: 50,
  },
  {
    slug: 'legend',
    label: 'افسانه',
    description: 'کاربری استثنایی با تأثیر بزرگ روی جامعه بازارینو',
    icon: 'Flame',
    gradient: 'from-red-500 via-orange-500 to-yellow-400',
    color: '#ef4444',
    tier: 'legend',
    sortOrder: 2,
  },
];

export const DEFAULT_BADGE_SLUGS = new Set(DEFAULT_BADGES.map((b) => b.slug));
