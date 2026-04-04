import mongoose, { Document, Schema } from 'mongoose';

export interface IChatNotification extends Document {
  receiverId: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderName: string;
  messagePreview: string;
  dueAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'skipped' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const ChatNotificationSchema = new Schema<IChatNotification>(
  {
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderName: { type: String, required: true, trim: true, maxlength: 120 },
    messagePreview: { type: String, required: true, trim: true, maxlength: 1000 },
    dueAt: { type: Date, required: true, index: true },
    sentAt: { type: Date },
    status: { type: String, enum: ['pending', 'sent', 'skipped', 'failed'], default: 'pending', index: true },
  },
  { timestamps: true }
);

ChatNotificationSchema.index({ status: 1, dueAt: 1 });

const ChatNotification =
  mongoose.models.ChatNotification || mongoose.model<IChatNotification>('ChatNotification', ChatNotificationSchema);

export default ChatNotification;
