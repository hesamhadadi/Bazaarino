import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  slug: string;
  /**
   * Historical slugs that this article used to live at. When an editor
   * renames the canonical slug (e.g. migrating Persian → Latin for SEO),
   * the previous value is pushed here so we can answer those URLs with a
   * 301 redirect and never lose Google ranking.
   */
  previousSlugs?: string[];
  excerpt: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  isHot: boolean;
  status: 'draft' | 'scheduled' | 'published';
  scheduledFor?: Date;
  publishedAt?: Date;
  authorId: mongoose.Types.ObjectId;
  views: number;
  ratingAvg: number;
  ratingCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, maxlength: 320 },
    content: { type: String, required: true },
    coverImage: { type: String },
    tags: [{ type: String }],
    isHot: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'published'],
      default: 'published',
    },
    scheduledFor: { type: Date },
    publishedAt: { type: Date },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    views: { type: Number, default: 0 },
    ratingAvg: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ tags: 1, createdAt: -1 });
ArticleSchema.index({ authorId: 1, createdAt: -1 });
ArticleSchema.index({ status: 1, createdAt: -1 });
ArticleSchema.index({ status: 1, scheduledFor: 1 });
ArticleSchema.index({ publishedAt: -1 });

const Article = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;
