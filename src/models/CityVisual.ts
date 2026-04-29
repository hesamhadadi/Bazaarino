import mongoose, { Schema, models, model } from 'mongoose';

/**
 * Admin-managed visual override for the per-city imagery shown on the
 * homepage city grid (`CityLandingCards`) and on the public landing-page
 * hero. The static map in `lib/city-images.ts` remains the default; this
 * collection lets the admin tune image URL, emoji, gradient and accent
 * colors without a redeploy, and validate the image URL before saving.
 */
export interface CityVisualDoc extends mongoose.Document {
  /** Lower-cased city slug, e.g. "milan", "rome" — must match Ad.city. */
  slug: string;
  /** Direct image URL (Unsplash, our CDN, anything reachable from the browser). */
  image?: string;
  /** Tailwind gradient stop classes, e.g. "from-rose-600 via-red-600 to-amber-600". */
  gradient?: string;
  /** Tailwind background class for the dot accent, e.g. "bg-rose-300". */
  accent?: string;
  /** Single emoji icon used on the home card and decorative chips. */
  emoji?: string;
  /** When false, hides the city from the homepage grid even if its landing page is published. */
  enabled: boolean;
  /** Bigger numbers float to the top of the homepage grid. */
  priority: number;
  /** ISO timestamp of the last successful image-URL validation. */
  imageVerifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CityVisualSchema = new Schema<CityVisualDoc>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    image: { type: String, trim: true },
    gradient: { type: String, trim: true },
    accent: { type: String, trim: true },
    emoji: { type: String, trim: true, maxlength: 8 },
    enabled: { type: Boolean, default: true, index: true },
    priority: { type: Number, default: 0, index: true },
    imageVerifiedAt: { type: Date },
  },
  { timestamps: true },
);

export default (models.CityVisual as mongoose.Model<CityVisualDoc>) ||
  model<CityVisualDoc>('CityVisual', CityVisualSchema);
