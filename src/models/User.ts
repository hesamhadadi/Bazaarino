import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role: 'user' | 'admin';
  isActive: boolean;
  city?: string;
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
    avatar: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    city: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
