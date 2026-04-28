import mongoose, { Schema, Document } from 'mongoose';

/**
 * `size` defines the aspect-ratio slot the banner is designed for. The admin
 * UI shows the recommended pixel dimensions for each slot so creatives are
 * always sharp on retina screens. The home page reserves `hero` for the big
 * top billboard and `wide` for the narrow mid-page strip.
 *
 * Slot dimensions (recommended uploads):
 *   - `hero`   : 1600 × 500  (≈ 3.2 : 1)
 *   - `wide`   : 1200 × 200  (≈ 6 : 1)
 *   - `square` : 800  × 800  (1 : 1)
 */
export type BannerSize = 'hero' | 'wide' | 'square';

export interface IBanner extends Document {
  title?: string;
  description?: string;
  imageUrl: string;
  /** Optional second image for dark mode / mobile-specific creative. */
  imageUrlMobile?: string;
  linkUrl?: string;
  placement: 'home' | 'category';
  size: BannerSize;
  /** Higher = shown first when multiple banners share a slot. */
  priority: number;
  categoryId?: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  /** Counters bumped on render / click for basic analytics. */
  impressions: number;
  clicks: number;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: String,
    description: String,
    imageUrl: { type: String, required: true },
    imageUrlMobile: String,
    linkUrl: String,
    placement: {
      type: String,
      enum: ['home', 'category'],
      default: 'home',
    },
    size: {
      type: String,
      enum: ['hero', 'wide', 'square'],
      default: 'hero',
    },
    priority: { type: Number, default: 0 },
    categoryId: String,
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

BannerSchema.index({ isActive: 1, placement: 1, size: 1, startsAt: 1, endsAt: 1 });
BannerSchema.index({ priority: -1, createdAt: -1 });

const Banner = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;

