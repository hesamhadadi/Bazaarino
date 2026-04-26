import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  // Telegram integration
  telegramToken?: string;
  telegramChatId?: string;
  telegramSecret?: string;
  // Site identity
  siteUrl?: string;
  siteName?: string;
  siteDescription?: string;
  brandPrimary?: string;
  // Contact
  supportEmail?: string;
  supportPhone?: string;
  // Feature flags
  maintenanceMode?: boolean;
  registrationEnabled?: boolean;
  adAutoApprove?: boolean;
  // Limits
  maxAdsPerUser?: number;
  // Featured ad pricing (display only — for now)
  featuredPrice1d?: number;
  featuredPrice7d?: number;
  featuredPrice30d?: number;
  // Announcement banner
  announcementText?: string;
  announcementEnabled?: boolean;
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
    siteName: { type: String },
    siteDescription: { type: String },
    brandPrimary: { type: String },
    supportEmail: { type: String },
    supportPhone: { type: String },
    maintenanceMode: { type: Boolean, default: false },
    registrationEnabled: { type: Boolean, default: true },
    adAutoApprove: { type: Boolean, default: false },
    maxAdsPerUser: { type: Number, default: 0 },
    featuredPrice1d: { type: Number, default: 0 },
    featuredPrice7d: { type: Number, default: 0 },
    featuredPrice30d: { type: Number, default: 0 },
    announcementText: { type: String },
    announcementEnabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Setting = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);

export default Setting;
