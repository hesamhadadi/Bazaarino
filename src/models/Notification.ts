import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'message';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  actorId?: mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  isRead: boolean;
  readAt?: Date;
  data?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    actorId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    type: { type: String, enum: ['message'], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    body: { type: String, required: true, trim: true, maxlength: 500 },
    href: { type: String, trim: true, maxlength: 500 },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },
    data: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;
