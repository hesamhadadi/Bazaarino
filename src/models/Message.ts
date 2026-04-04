import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  adId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  type: 'text' | 'image';
  content?: string;
  imageUrl?: string;
  isRead: boolean;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['text', 'image'], default: 'text', index: true },
    content: { type: String, trim: true, maxlength: 1000 },
    imageUrl: { type: String, trim: true, maxlength: 1200 },
    isRead: { type: Boolean, default: false, index: true },
    deliveredAt: { type: Date },
    readAt: { type: Date },
  },
  { timestamps: true }
);

MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.pre('validate', function (next) {
  const currentType = this.type || 'text';
  const content = String(this.content || '').trim();
  const imageUrl = String(this.imageUrl || '').trim();
  if (currentType === 'text' && !content) {
    return next(new Error('Text message content is required'));
  }
  if (currentType === 'image' && !imageUrl) {
    return next(new Error('Image message url is required'));
  }
  next();
});

const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);

export default Message;
