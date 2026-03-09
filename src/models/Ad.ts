import mongoose, { Schema, Document } from 'mongoose';

export interface IAd extends Document {
  title: string;
  description: string;
  price?: number;
  priceType: 'fixed' | 'negotiable' | 'free' | 'exchange';
  currency: 'EUR' | 'توافقی';
  category: string;
  subcategory: string;
  city: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'sold';
  userId: mongoose.Types.ObjectId;
  phone?: string;
  email?: string;
  showPhone: boolean;
  showEmail: boolean;
  views: number;
  isFeatured: boolean;
  featuredUntil?: Date;
  rejectionReason?: string;
  housing?: {
    deposit?: number;
    residenceEligible?: boolean;
    preferredGender?: 'male' | 'female' | 'any';
    roommatesCount?: number;
  };
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    title: {
      type: String,
      required: [true, 'عنوان آگهی الزامی است'],
      trim: true,
      maxlength: [100, 'عنوان نباید بیشتر از ۱۰۰ کاراکتر باشد'],
    },
    description: {
      type: String,
      required: [true, 'توضیحات آگهی الزامی است'],
      maxlength: [2000, 'توضیحات نباید بیشتر از ۲۰۰۰ کاراکتر باشد'],
    },
    price: {
      type: Number,
      min: [0, 'قیمت نمی‌تواند منفی باشد'],
    },
    priceType: {
      type: String,
      enum: ['fixed', 'negotiable', 'free', 'exchange'],
      default: 'fixed',
    },
    currency: {
      type: String,
      enum: ['EUR', 'توافقی'],
      default: 'EUR',
    },
    category: {
      type: String,
      required: [true, 'دسته‌بندی الزامی است'],
    },
    subcategory: {
      type: String,
      required: [true, 'زیر دسته‌بندی الزامی است'],
    },
    city: {
      type: String,
      required: [true, 'شهر الزامی است'],
    },
    images: {
      type: [String],
      validate: {
        validator: (v: string[]) => v.length <= 8,
        message: 'حداکثر ۸ تصویر می‌توانید آپلود کنید',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'expired', 'sold'],
      default: 'pending',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    phone: String,
    email: String,
    showPhone: {
      type: Boolean,
      default: true,
    },
    showEmail: {
      type: Boolean,
      default: false,
    },
    views: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    featuredUntil: {
      type: Date,
    },
    rejectionReason: String,
    housing: {
      deposit: {
        type: Number,
        min: [0, 'رهن نمی‌تواند منفی باشد'],
      },
      residenceEligible: {
        type: Boolean,
        default: false,
      },
      preferredGender: {
        type: String,
        enum: ['male', 'female', 'any'],
        default: 'any',
      },
      roommatesCount: {
        type: Number,
        min: [0, 'تعداد هم‌خانه نمی‌تواند منفی باشد'],
        max: [30, 'تعداد هم‌خانه نامعتبر است'],
      },
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
AdSchema.index({ city: 1, category: 1, status: 1 });
AdSchema.index({ userId: 1 });
AdSchema.index({ createdAt: -1 });
AdSchema.index({ title: 'text', description: 'text' });

const Ad = mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema);

export default Ad;
