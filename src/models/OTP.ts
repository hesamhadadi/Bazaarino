import mongoose, { Schema, Document } from 'mongoose';

export interface IOTP extends Document {
  identifier: string; // phone (+E164) or email (lowercased)
  channel: 'telegram' | 'email';
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OTPSchema = new Schema<IOTP>(
  {
    identifier: { type: String, required: true, index: true },
    channel: { type: String, enum: ['telegram', 'email'], required: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL: auto-delete expired documents
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.models.OTP || mongoose.model<IOTP>('OTP', OTPSchema);

export default OTP;
