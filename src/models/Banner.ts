import mongoose, { Schema, Document } from 'mongoose';

export interface IBanner extends Document {
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
  {
    title: String,
    imageUrl: { type: String, required: true },
    linkUrl: String,
    startsAt: { type: Date, required: true },
    endsAt: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

BannerSchema.index({ isActive: 1, startsAt: 1, endsAt: 1 });

const Banner = mongoose.models.Banner || mongoose.model<IBanner>('Banner', BannerSchema);

export default Banner;
