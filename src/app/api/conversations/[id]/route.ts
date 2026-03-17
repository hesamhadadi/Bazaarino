import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { resolveSessionUserId } from '@/lib/session-user';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import '@/models/User';
import '@/models/Ad';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
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
      .populate('adId', 'title images city status')
      .populate('buyerId', 'name avatar')
      .populate('sellerId', 'name avatar')
      .lean<any>();

    if (!conversation) {
      return NextResponse.json({ message: 'گفتگو یافت نشد' }, { status: 404 });
    }

    const isParticipant =
      String(conversation.buyerId?._id) === userId ||
      String(conversation.sellerId?._id) === userId;

    if (!isParticipant) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const isBuyer = String(conversation.buyerId?._id) === userId;
    const otherUser = isBuyer ? conversation.sellerId : conversation.buyerId;

    const unreadCount = await Message.countDocuments({
      conversationId: conversation._id,
      receiverId: new mongoose.Types.ObjectId(userId),
      isRead: false,
    });

    return NextResponse.json({
      conversation: {
        _id: conversation._id,
        ad: conversation.adId,
        otherUser,
        unreadCount,
        lastMessage: conversation.lastMessage || '',
        lastMessageAt: conversation.lastMessageAt,
      },
    });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
