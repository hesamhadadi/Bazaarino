import mongoose, { Schema, Document } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  isHot: boolean;
  status: 'draft' | 'published';
  authorId: mongoose.Types.ObjectId;
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
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

ArticleSchema.index({ createdAt: -1 });

const Article = mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);

export default Article;
