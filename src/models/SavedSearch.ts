import mongoose, { Schema, Document } from 'mongoose';

export interface ISavedSearch extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  query: string;
  params: Record<string, string>;
  alertEnabled: boolean;
  lastNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SavedSearchSchema = new Schema<ISavedSearch>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    query: { type: String, required: true, trim: true, maxlength: 2000 },
    params: { type: Schema.Types.Mixed, default: {} },
    alertEnabled: { type: Boolean, default: false },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true }
);

SavedSearchSchema.index({ userId: 1, query: 1 }, { unique: true });

const SavedSearch =
  mongoose.models.SavedSearch || mongoose.model<ISavedSearch>('SavedSearch', SavedSearchSchema);

export default SavedSearch;
