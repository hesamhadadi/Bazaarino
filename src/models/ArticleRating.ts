import mongoose, { Schema, Document } from 'mongoose';

export interface IArticleRating extends Document {
  articleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  score: number; // 1..5
  createdAt: Date;
  updatedAt: Date;
}

const ArticleRatingSchema = new Schema<IArticleRating>(
  {
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

// One rating per (article, user); upsert is used to allow score changes.
ArticleRatingSchema.index({ articleId: 1, userId: 1 }, { unique: true });

const ArticleRating =
  mongoose.models.ArticleRating ||
  mongoose.model<IArticleRating>('ArticleRating', ArticleRatingSchema);

export default ArticleRating;
