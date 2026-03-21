import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  telegramToken?: string;
  telegramChatId?: string;
  telegramSecret?: string;
  siteUrl?: string;
  brandPrimary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true },
    telegramToken: { type: String },
    telegramChatId: { type: String },
    telegramSecret: { type: String },
    siteUrl: { type: String },
    brandPrimary: { type: String },
  },
  { timestamps: true }
);

const Setting = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
