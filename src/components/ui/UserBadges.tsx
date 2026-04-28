import * as Lucide from 'lucide-react';
import connectDB from '@/lib/mongodb';
import Badge from '@/models/Badge';

interface Props {
  badges?: string[];
  size?: 'sm' | 'md' | 'lg';
  /** Hide labels and only show icons (handy on tight cards) */
  compact?: boolean;
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

const SIZE_MAP = {
  sm: { wrap: 'gap-1', chip: 'px-2 py-0.5 text-[10px]', icon: 10, gap: 'gap-1' },
  md: { wrap: 'gap-1.5', chip: 'px-2.5 py-1 text-xs', icon: 12, gap: 'gap-1.5' },
  lg: { wrap: 'gap-2', chip: 'px-3 py-1.5 text-sm', icon: 14, gap: 'gap-1.5' },
} as const;

/**
 * Server component. Resolves a denormalised list of badge slugs against
 * the Badge collection in a single query, then renders branded chips.
 *
 * The icon is looked up on the lucide module by name. We fall back to a
 * generic Award icon if the admin sets a name that doesn't exist (e.g.
 * after a lucide rename) so the chip is never broken.
 */
export default async function UserBadges({
  badges,
  size = 'md',
  compact = false,
  max,
}: Props) {
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
        const IconComp = (b.icon && (Lucide as Record<string, unknown>)[b.icon]) as
          | React.ComponentType<{ size?: number; className?: string }>
          | undefined;
        const Icon = IconComp || Lucide.Award;

        const gradientClass = b.gradient
          ? `bg-gradient-to-r ${b.gradient} text-white shadow-sm`
          : 'text-white';
        const inlineStyle: React.CSSProperties | undefined = b.gradient
          ? undefined
          : { backgroundColor: b.color || '#f97316' };

        return (
          <span
            key={b.slug}
            title={b.description || b.label}
            className={`inline-flex items-center font-semibold rounded-full ${sz.chip} ${sz.gap} ${gradientClass}`}
            style={inlineStyle}
          >
            <Icon size={sz.icon} className="flex-shrink-0" />
            {!compact && <span>{b.label}</span>}
          </span>
        );
      })}
      {hidden > 0 && (
        <span
          className={`inline-flex items-center rounded-full ${sz.chip} bg-gray-100 text-gray-600 font-semibold`}
          title={`و ${hidden} بج دیگر`}
        >
          +{hidden}
        </span>
      )}
    </div>
  );
}
