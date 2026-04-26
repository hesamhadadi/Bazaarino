import mongoose, { Schema, Document } from 'mongoose';

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface IComment extends Document {
  articleId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  parentId?: mongoose.Types.ObjectId | null;
  body: string;
  status: CommentStatus;
  // Light denormalised author snapshot so listings don't need a populate
  // when the user later renames themselves; the canonical name still comes
  // from the populate when available.
  authorNameSnapshot?: string;
  authorAvatarSnapshot?: string;
  // Admin/editor reply mark for visual distinction.
  isStaffReply?: boolean;
  // Soft-delete: preserve threading even after removal.
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    articleId: { type: Schema.Types.ObjectId, ref: 'Article', required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null, index: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    authorNameSnapshot: { type: String },
    authorAvatarSnapshot: { type: String },
    isStaffReply: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Common access patterns
CommentSchema.index({ articleId: 1, status: 1, createdAt: 1 });
CommentSchema.index({ status: 1, createdAt: -1 }); // moderation queue

const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
