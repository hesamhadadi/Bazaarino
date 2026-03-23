import mongoose, { Schema, Document } from 'mongoose';

export interface IAd extends Document {
  title: string;
  description: string;
  price?: number;
  priceType: 'fixed' | 'negotiable' | 'free' | 'exchange';
  currency: 'EUR' | 'توافقی';
  category: string;
  subcategory: string;
  country?: string;
  city: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected' | 'expired' | 'sold';
  userId: mongoose.Types.ObjectId;
  phone?: string;
  email?: string;
  showPhone: boolean;
  showEmail: boolean;
  listingMode?: 'offer' | 'request';
  views: number;
  isFeatured: boolean;
  featuredUntil?: Date;
  isUrgent?: boolean;
  bumpedAt?: Date;
  bumpCount?: number;
  rejectionReason?: string;
  fraudReportCount?: number;
  housing?: {
    deposit?: number;
    residenceEligible?: boolean;
    preferredGender?: 'male' | 'female' | 'any';
    preferredAgeMin?: number;
    preferredAgeMax?: number;
    preferredUniversity?: string;
    roommatesCount?: number;
    availabilityStartDate?: Date;
    billsInfo?: 'included' | 'not-included' | 'partial';
    agencyFee?: number;
    isAllInclusivePrice?: boolean;
    address?: string;
    location?: {
      lat: number;
      lng: number;
    };
    nearby?: Array<{
      key: string;
      label: string;
      distanceKm: number;
      driveMinutes: number;
      walkMinutes: number;
      icon?: string;
      metroName?: string;
      metroLines?: string[];
      busLines?: string[];
    }>;
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
    country: {
      type: String,
      default: 'italy',
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
    listingMode: {
      type: String,
      enum: ['offer', 'request'],
      default: 'offer',
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
    isUrgent: {
      type: Boolean,
      default: false,
    },
    bumpedAt: {
      type: Date,
      default: Date.now,
    },
    bumpCount: {
      type: Number,
      default: 0,
    },
    rejectionReason: String,
    fraudReportCount: {
      type: Number,
      default: 0,
    },
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
      preferredAgeMin: {
        type: Number,
        min: [0, 'حداقل سن نمی‌تواند منفی باشد'],
      },
      preferredAgeMax: {
        type: Number,
        min: [0, 'حداکثر سن نمی‌تواند منفی باشد'],
      },
      preferredUniversity: {
        type: String,
        trim: true,
        maxlength: [120, 'نام دانشگاه نباید بیشتر از ۱۲۰ کاراکتر باشد'],
      },
      roommatesCount: {
        type: Number,
        min: [0, 'تعداد هم‌خانه نمی‌تواند منفی باشد'],
        max: [30, 'تعداد هم‌خانه نامعتبر است'],
      },
      availabilityStartDate: {
        type: Date,
      },
      billsInfo: {
        type: String,
        enum: ['included', 'not-included', 'partial'],
      },
      agencyFee: {
        type: Number,
        min: [0, 'مبلغ agency نمی‌تواند منفی باشد'],
      },
      isAllInclusivePrice: {
        type: Boolean,
        default: false,
      },
      address: {
        type: String,
        trim: true,
      },
      location: {
        lat: { type: Number },
        lng: { type: Number },
      },
      nearby: [
        {
          key: { type: String },
          label: { type: String },
          distanceKm: { type: Number },
          driveMinutes: { type: Number },
          walkMinutes: { type: Number },
          icon: { type: String },
          metroName: { type: String },
          metroLines: [{ type: String }],
          busLines: [{ type: String }],
        },
      ],
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
AdSchema.index({ country: 1, city: 1, category: 1, status: 1 });
AdSchema.index({ userId: 1 });
AdSchema.index({ createdAt: -1 });
AdSchema.index({ title: 'text', description: 'text' });
AdSchema.index({ 'housing.preferredGender': 1, 'housing.preferredUniversity': 1 });

const Ad = mongoose.models.Ad || mongoose.model<IAd>('Ad', AdSchema);

export default Ad;
