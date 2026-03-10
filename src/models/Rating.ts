import mongoose, { Schema, Document } from 'mongoose';

export interface IRating extends Document {
  targetUserId: mongoose.Types.ObjectId;
  raterUserId: mongoose.Types.ObjectId;
  score: number;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    targetUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    raterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, min: 1, max: 5, required: true },
  },
  { timestamps: true }
);

RatingSchema.index({ targetUserId: 1, raterUserId: 1 }, { unique: true });

const Rating = mongoose.models.Rating || mongoose.model<IRating>('Rating', RatingSchema);

export default Rating;
