import mongoose, { Schema, Document } from 'mongoose';

/**
 * Catalog of badges that admins can award to users.
 *
 * Why a separate collection (instead of a hard-coded enum):
 *   - admins can create new badges from the panel without a deploy
 *   - changing a badge's colour / icon takes effect everywhere instantly
 *   - keeps `User.badges` denormalised to a simple slug array (fast reads),
 *     while the metadata lives here and is fetched lazily by the UI
 */
export interface IBadge extends Document {
  slug: string;
  label: string;
  description?: string;
  /**
   * Lucide icon name (e.g. "Crown", "Star"). The display component does a
   * lookup against the lucide map so we keep the bundle small.
   */
  icon?: string;
  /**
   * Visual style. We store both a single tailwind colour token (for
   * compact chips) and an optional gradient class string for the larger
   * "founder"-style flashy variant.
   */
  color?: string;
  gradient?: string;
  /**
   * Logical tier — useful to sort badges on a profile so the rarest sit
   * at the front. We allow free-form here too in case the admin wants
   * to invent new tiers ("legend", "team-only", …).
   */
  tier?: string;
  /**
   * If true, the badge is visible to everyone on the user profile.
   * If false, it's a hidden internal marker (e.g. moderation flag).
   */
  isPublic: boolean;
  /**
   * Order hint — lower values display first within the same tier. Allows
   * an admin to pin "Founder" to the very front without renaming it.
   */
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema<IBadge>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, maxlength: 240 },
    icon: { type: String, default: 'Award' },
    color: { type: String, default: '#f97316' },
    gradient: { type: String },
    tier: { type: String, default: 'standard' },
    isPublic: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 100 },
  },
  { timestamps: true },
);

BadgeSchema.index({ sortOrder: 1, createdAt: -1 });

const Badge = (mongoose.models.Badge as mongoose.Model<IBadge>) ||
  mongoose.model<IBadge>('Badge', BadgeSchema);

export default Badge;
