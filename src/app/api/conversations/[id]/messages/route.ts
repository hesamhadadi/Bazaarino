import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { resolveSessionUserId } from '@/lib/session-user';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import '@/models/User';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

async function loadConversationForUser(conversationId: string, userId: string) {
  if (!mongoose.Types.ObjectId.isValid(conversationId)) return null;

  const conversation = await Conversation.findById(conversationId)
    .populate('buyerId', 'name avatar')
    .populate('sellerId', 'name avatar')
    .lean<any>();

  if (!conversation) return null;

  const isParticipant =
    String(conversation.buyerId?._id) === userId ||
    String(conversation.sellerId?._id) === userId;

  if (!isParticipant) return null;

  return conversation;
}

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    await connectDB();

    const conversation = await loadConversationForUser(params.id, userId);
    if (!conversation) {
      return NextResponse.json({ message: 'گفتگو یافت نشد یا دسترسی ندارید' }, { status: 404 });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .limit(300)
      .populate('senderId', 'name avatar')
      .lean();

    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const body = await request.json();
    const content = String(body?.content || '').trim();

    if (!content) {
      return NextResponse.json({ message: 'متن پیام نمی‌تواند خالی باشد' }, { status: 400 });
    }

    if (content.length > 1000) {
      return NextResponse.json({ message: 'طول پیام بیش از حد مجاز است' }, { status: 400 });
    }

    await connectDB();

    const conversation = await loadConversationForUser(params.id, userId);
    if (!conversation) {
      return NextResponse.json({ message: 'گفتگو یافت نشد یا دسترسی ندارید' }, { status: 404 });
    }

    const buyerId = String(conversation.buyerId?._id);
    const sellerId = String(conversation.sellerId?._id);

    const receiverId = userId === buyerId ? sellerId : buyerId;

    const message = await Message.create({
      conversationId: conversation._id,
      adId: conversation.adId,
      senderId: new mongoose.Types.ObjectId(userId),
      receiverId: new mongoose.Types.ObjectId(receiverId),
      content,
      isRead: false,
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name avatar')
      .lean();

    return NextResponse.json({ message: populatedMessage }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
