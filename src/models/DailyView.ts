import mongoose, { Schema, Document } from 'mongoose';

export type DailyViewEntityType = 'ad' | 'article' | 'landingPage';

export interface IDailyView extends Document {
  entityType: DailyViewEntityType;
  entityId: mongoose.Types.ObjectId;
  dateKey: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

const DailyViewSchema = new Schema<IDailyView>(
  {
    entityType: {
      type: String,
      enum: ['ad', 'article', 'landingPage'],
      required: true,
    },
    entityId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    dateKey: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

DailyViewSchema.index({ entityType: 1, entityId: 1, dateKey: 1 }, { unique: true });
DailyViewSchema.index({ entityType: 1, dateKey: -1 });

const DailyView =
  mongoose.models.DailyView || mongoose.model<IDailyView>('DailyView', DailyViewSchema);

export default DailyView;
