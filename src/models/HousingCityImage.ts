import mongoose, { Schema, Document } from 'mongoose';

export interface IHousingCityImage extends Document {
  city: string;
  imageUrl: string;
  title?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HousingCityImageSchema = new Schema<IHousingCityImage>(
  {
    city: { type: String, required: true, unique: true },
    imageUrl: { type: String, required: true },
    title: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

HousingCityImageSchema.index({ city: 1, isActive: 1 });

const HousingCityImage =
  mongoose.models.HousingCityImage ||
  mongoose.model<IHousingCityImage>('HousingCityImage', HousingCityImageSchema);

export default HousingCityImage;
