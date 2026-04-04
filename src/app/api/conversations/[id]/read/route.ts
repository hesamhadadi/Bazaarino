import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { resolveSessionUserId } from '@/lib/session-user';
import { publishChatEvent } from '@/lib/chat-events';
import { getUnreadCountForUser } from '@/lib/chat';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

export async function PATCH(_: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'شناسه گفتگو معتبر نیست' }, { status: 400 });
    }

    await connectDB();

    const conversation = await Conversation.findById(params.id)
      .select('buyerId sellerId')
      .lean<{ buyerId: mongoose.Types.ObjectId; sellerId: mongoose.Types.ObjectId }>();

    if (!conversation) {
      return NextResponse.json({ message: 'گفتگو یافت نشد' }, { status: 404 });
    }

    const isParticipant =
      conversation.buyerId.toString() === userId ||
      conversation.sellerId.toString() === userId;

    if (!isParticipant) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const result = await Message.updateMany(
      {
        conversationId: new mongoose.Types.ObjectId(params.id),
        receiverId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      },
      {
        $set: { isRead: true, readAt: new Date() },
      }
    );

    const buyerId = conversation.buyerId.toString();
    const sellerId = conversation.sellerId.toString();
    const otherUserId = buyerId === userId ? sellerId : buyerId;
    const unreadCount = await getUnreadCountForUser(userId);
    publishChatEvent({
      type: 'message:read',
      userIds: [userId, otherUserId],
      payload: { conversationId: params.id, readerId: userId },
    });
    publishChatEvent({
      type: 'unread:changed',
      userIds: [userId],
      payload: { unreadCount },
    });

    return NextResponse.json({ updated: result.modifiedCount });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
