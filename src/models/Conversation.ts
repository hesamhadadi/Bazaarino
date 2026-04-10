import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  adId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  lastMessage?: string;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    adId: { type: Schema.Types.ObjectId, ref: 'Ad', required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastMessage: { type: String, trim: true, maxlength: 1000 },
    lastMessageAt: { type: Date, index: true },
  },
  { timestamps: true }
);

ConversationSchema.index({ adId: 1, buyerId: 1, sellerId: 1 }, { unique: true });
ConversationSchema.index({ buyerId: 1, lastMessageAt: -1 });
ConversationSchema.index({ sellerId: 1, lastMessageAt: -1 });

const Conversation = mongoose.models.Conversation || mongoose.model<IConversation>('Conversation', ConversationSchema);

export default Conversation;
