import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  phoneVerified?: boolean;
  avatar?: string;
  role: 'user' | 'admin' | 'editor';
  isActive: boolean;
  city?: string;
  ratingAvg?: number;
  ratingCount?: number;
  telegram?: string;
  bio?: string;
  banner?: string;
  fiscalCode?: string;
  passportImage?: string;
  selfieImage?: string;
  fiscalCodeStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  passportStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  selfieStatus?: 'none' | 'pending' | 'approved' | 'rejected';
  identityStatus?: 'none' | 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'نام الزامی است'],
      trim: true,
      maxlength: [50, 'نام نباید بیشتر از ۵۰ کاراکتر باشد'],
    },
    email: {
      type: String,
      required: [true, 'ایمیل الزامی است'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: [6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'],
    },
    phone: {
      type: String,
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'editor'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    city: {
      type: String,
    },
    ratingAvg: {
      type: Number,
      default: 0,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    telegram: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      maxlength: 500,
    },
    banner: {
      type: String,
    },
    fiscalCode: {
      type: String,
      trim: true,
    },
    passportImage: {
      type: String,
    },
    selfieImage: {
      type: String,
    },
    fiscalCodeStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    passportStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    selfieStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    identityStatus: {
      type: String,
      enum: ['none', 'pending', 'verified', 'rejected'],
      default: 'none',
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
