import type { LucideIcon } from 'lucide-react';
import {
  Award,
  BadgeCheck,
  Briefcase,
  Crown,
  Flame,
  GraduationCap,
  HeartHandshake,
  PenLine,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
} from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Badge from '@/models/Badge';

interface Props {
  badges?: string[];
  size?: 'sm' | 'md' | 'lg';
  /** Limit how many badges to render; the rest become a `+N` chip */
  max?: number;
}

interface BadgeDoc {
  slug: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  gradient?: string;
  tier?: string;
  sortOrder?: number;
}

/**
 * Explicit icon map. We avoid `import * as Lucide` because the bundler
 * tree-shakes unknown identifiers and the runtime lookup silently fails
 * in production. Adding a new icon to a Badge means adding it here too.
 */
const ICONS: Record<string, LucideIcon> = {
  Award,
  BadgeCheck,
  Briefcase,
  Crown,
  Flame,
  GraduationCap,
  HeartHandshake,
  PenLine,
  Rocket,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
};

/**
 * Tiers that are special enough to render with the label visible. Everything
 * else collapses to a clean icon-only pill with a tooltip on hover, so
 * profiles stay tidy even when a user collects a lot of badges.
 */
const LABELED_TIERS = new Set(['founder', 'legend', 'staff', 'special']);

const SIZE_MAP = {
  sm: { wrap: 'gap-1', dot: 'w-5 h-5', icon: 12, chip: 'h-5 px-2 text-[10px]', chipIcon: 10, chipGap: 'gap-1' },
  md: { wrap: 'gap-1.5', dot: 'w-7 h-7', icon: 14, chip: 'h-7 px-2.5 text-xs', chipIcon: 12, chipGap: 'gap-1.5' },
  lg: { wrap: 'gap-2', dot: 'w-9 h-9', icon: 18, chip: 'h-9 px-3 text-sm', chipIcon: 14, chipGap: 'gap-2' },
} as const;

/**
 * Server component. Resolves a denormalised list of badge slugs against
 * the Badge collection in a single query, then renders branded chips.
 */
export default async function UserBadges({ badges, size = 'md', max }: Props) {
  if (!badges || badges.length === 0) return null;

  await connectDB();
  const docs = (await Badge.find({ slug: { $in: badges }, isPublic: true }).lean()) as BadgeDoc[];

  if (docs.length === 0) return null;

  // Preserve admin-defined sort order; ties broken by the order in
  // user.badges so users have *some* control over their own ordering.
  const userOrder = new Map(badges.map((slug, idx) => [slug, idx]));
  docs.sort((a, b) => {
    const pa = a.sortOrder ?? 100;
    const pb = b.sortOrder ?? 100;
    if (pa !== pb) return pa - pb;
    return (userOrder.get(a.slug) ?? 0) - (userOrder.get(b.slug) ?? 0);
  });

  const visible = max ? docs.slice(0, max) : docs;
  const hidden = max && docs.length > max ? docs.length - max : 0;
  const sz = SIZE_MAP[size];

  return (
    <div className={`flex flex-wrap items-center ${sz.wrap}`}>
      {visible.map((b) => {
        const Icon = (b.icon && ICONS[b.icon]) || Award;
        const showLabel = LABELED_TIERS.has(b.tier || '');

        const gradientClass = b.gradient
          ? `bg-gradient-to-br ${b.gradient}`
          : '';
        const inlineStyle: React.CSSProperties | undefined = b.gradient
          ? undefined
          : { backgroundColor: b.color || '#f97316' };

        const baseClasses = `inline-flex items-center justify-center text-white shadow-sm ring-1 ring-white/30 transition-transform hover:scale-105 hover:shadow-md`;

        if (showLabel) {
          return (
            <BadgeWithTooltip key={b.slug} label={b.label} description={b.description}>
              <span
                className={`${baseClasses} rounded-full font-semibold ${sz.chip} ${sz.chipGap} ${gradientClass}`}
                style={inlineStyle}
              >
                <Icon size={sz.chipIcon} strokeWidth={2.5} />
                <span>{b.label}</span>
              </span>
            </BadgeWithTooltip>
          );
        }

        return (
          <BadgeWithTooltip key={b.slug} label={b.label} description={b.description}>
            <span
              className={`${baseClasses} rounded-full ${sz.dot} ${gradientClass}`}
              style={inlineStyle}
              aria-label={b.label}
            >
              <Icon size={sz.icon} strokeWidth={2.5} />
            </span>
          </BadgeWithTooltip>
        );
      })}
      {hidden > 0 && (
        <span
          className={`inline-flex items-center justify-center rounded-full ${sz.dot} bg-gray-100 text-gray-600 text-[10px] font-bold ring-1 ring-gray-200`}
          title={`و ${hidden} بج دیگر`}
        >
          +{hidden}
        </span>
      )}
    </div>
  );
}

/**
 * Tooltip wrapper. Uses a CSS-only popover with `group-hover:` so it
 * renders without any client JS — important since this component is a
 * server component. The tooltip is positioned below the trigger and is
 * hidden by default.
 */
function BadgeWithTooltip({
  children,
  label,
  description,
}: {
  children: React.ReactNode;
  label: string;
  description?: string;
}) {
  return (
    <span className="relative group inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 whitespace-nowrap rounded-lg bg-gray-900 text-white text-[11px] px-2.5 py-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        <span className="font-semibold">{label}</span>
        {description && (
          <span className="block text-gray-300 font-normal mt-0.5 max-w-[200px] whitespace-normal text-right" dir="rtl">
            {description}
          </span>
        )}
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-b-gray-900" />
      </span>
    </span>
  );
}
