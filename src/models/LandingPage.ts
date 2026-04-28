import mongoose, { Schema, type Model } from 'mongoose';

/**
 * Flexible landing-page CMS model. Each page is a sequence of typed
 * "sections" so admins can compose city pages, campaign pages, category
 * hubs, etc. without us needing to ship code for every variant.
 *
 * Section types are intentionally a finite enum on the renderer side —
 * the schema accepts arbitrary `data: Mixed` so we can iterate on new
 * section shapes without migrations, but the renderer only renders ones
 * it understands.
 */

export type LandingSectionType =
  | 'hero'
  | 'stats'
  | 'ad-grid'
  | 'article-grid'
  | 'rich-text'
  | 'faq'
  | 'cta-banner'
  | 'feature-grid'
  | 'testimonials'
  | 'gallery';

export interface LandingSection {
  id: string;
  type: LandingSectionType;
  // Free-form data bag — shape depends on type. Documented next to each
  // renderer in src/components/landing/sections.
  data: Record<string, unknown>;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface LandingPageDoc extends mongoose.Document {
  slug: string;
  /** High-level kind used for templates and routing helpers. */
  pageType: 'city' | 'category' | 'campaign' | 'general';
  status: 'draft' | 'published' | 'archived';
  // SEO
  title: string;
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: string;
  ogImageAlt?: string;
  canonicalUrl?: string;
  noindex?: boolean;
  // Targeting (used by some sections to auto-fill content)
  targetCity?: string;
  targetCategory?: string;
  targetSubcategory?: string;
  // Content
  sections: LandingSection[];
  faq?: FaqItem[];
  // Stats
  views?: number;
  publishedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SectionSchema = new Schema<LandingSection>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: [
        'hero',
        'stats',
        'ad-grid',
        'article-grid',
        'rich-text',
        'faq',
        'cta-banner',
        'feature-grid',
        'testimonials',
        'gallery',
      ],
    },
    data: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: false },
);

const FaqSchema = new Schema<FaqItem>(
  {
    q: { type: String, required: true, trim: true },
    a: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const LandingPageSchema = new Schema<LandingPageDoc>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    pageType: {
      type: String,
      enum: ['city', 'category', 'campaign', 'general'],
      default: 'general',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    metaDescription: { type: String, trim: true, maxlength: 320 },
    metaKeywords: [{ type: String, trim: true }],
    ogImage: { type: String, trim: true },
    ogImageAlt: { type: String, trim: true, maxlength: 160 },
    canonicalUrl: { type: String, trim: true },
    noindex: { type: Boolean, default: false },
    targetCity: { type: String, trim: true, index: true },
    targetCategory: { type: String, trim: true, index: true },
    targetSubcategory: { type: String, trim: true },
    sections: { type: [SectionSchema], default: [] },
    faq: { type: [FaqSchema], default: [] },
    views: { type: Number, default: 0 },
    publishedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
);

// Surface published pages quickly when generating sitemap entries.
LandingPageSchema.index({ status: 1, updatedAt: -1 });

const LandingPage: Model<LandingPageDoc> =
  (mongoose.models.LandingPage as Model<LandingPageDoc>) ||
  mongoose.model<LandingPageDoc>('LandingPage', LandingPageSchema);

export default LandingPage;
