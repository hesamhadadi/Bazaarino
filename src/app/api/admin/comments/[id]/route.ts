import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Article from '@/models/Article';

async function refreshCount(articleId: mongoose.Types.ObjectId) {
  const count = await Comment.countDocuments({
    articleId,
    status: 'approved',
    deletedAt: null,
  });
  await Article.updateOne({ _id: articleId }, { $set: { commentCount: count } });
}

/**
 * PATCH /api/admin/comments/[id]
 * body: { status?: 'approved' | 'rejected' | 'pending' }
 * Used by moderation panel to approve/reject pending comments.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!['admin', 'editor'].includes(session.user.role)) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'شناسه نامعتبر' }, { status: 400 });
    }

    await connectDB();
    const body = await req.json().catch(() => ({}));
    const status = body?.status;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json({ message: 'وضعیت نامعتبر' }, { status: 400 });
    }

    const comment = await Comment.findById(params.id);
    if (!comment) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });

    comment.status = status;
    await comment.save();

    await refreshCount(comment.articleId);

    return NextResponse.json({ item: JSON.parse(JSON.stringify(comment)) });
  } catch (err) {
    console.error('[admin/comments PATCH]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/comments/[id] → soft-delete (sets deletedAt).
 * Soft-delete preserves threading for already-approved descendants.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!['admin', 'editor'].includes(session.user.role)) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'شناسه نامعتبر' }, { status: 400 });
    }

    await connectDB();
    const comment = await Comment.findById(params.id);
    if (!comment) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });

    comment.deletedAt = new Date();
    comment.status = 'rejected';
    await comment.save();

    await refreshCount(comment.articleId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[admin/comments DELETE]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
