import mongoose, { Schema, Document } from 'mongoose';

export interface IReport extends Document {
  adId: mongoose.Types.ObjectId;
  reporterId?: mongoose.Types.ObjectId;
  message: string;
  images: string[];
  status: 'open' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
    reporterId: { type: Schema.Types.ObjectId, ref: 'User' },
    message: { type: String, required: true, maxlength: 2000 },
    images: [{ type: String }],
    status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  },
  { timestamps: true }
);

ReportSchema.index({ createdAt: -1 });

const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;
