import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { resolveSessionUserId } from '@/lib/session-user';
import { isUserOnline } from '@/lib/chat';
import Ad from '@/models/Ad';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import '@/models/User';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    await connectDB();

    const query = request.nextUrl.searchParams.get('q')?.trim().toLowerCase() || '';
    const sortMode = request.nextUrl.searchParams.get('sort') || 'recent';
    const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
    const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || 20)));
    const conversations = await Conversation.find({
      $or: [{ buyerId: userId }, { sellerId: userId }],
    })
      .sort({ lastMessageAt: -1, updatedAt: -1 })
      .populate('adId', 'title images city status')
      .populate('buyerId', 'name avatar lastSeenAt')
      .populate('sellerId', 'name avatar lastSeenAt')
      .lean();

    const enriched = await Promise.all(
      conversations.map(async (conversation: any) => {
        const isBuyer = String(conversation.buyerId?._id) === userId;
        const otherUser = isBuyer ? conversation.sellerId : conversation.buyerId;
        const unreadCount = await Message.countDocuments({
          conversationId: conversation._id,
          receiverId: new mongoose.Types.ObjectId(userId),
          isRead: false,
        });

        return {
          _id: conversation._id,
          ad: conversation.adId,
          otherUser: {
            ...otherUser,
            isOnline: isUserOnline(otherUser?.lastSeenAt),
            lastSeenAt: otherUser?.lastSeenAt,
          },
          lastMessage: conversation.lastMessage || '',
          lastMessageAt: conversation.lastMessageAt,
          unreadCount,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
        };
      })
    );

    let filtered = enriched;
    if (query) {
      filtered = filtered.filter((item: any) => {
        const name = String(item.otherUser?.name || '').toLowerCase();
        const title = String(item.ad?.title || '').toLowerCase();
        const message = String(item.lastMessage || '').toLowerCase();
        return name.includes(query) || title.includes(query) || message.includes(query);
      });
    }

    filtered.sort((a: any, b: any) => {
      if (sortMode === 'unread') return Number(b.unreadCount || 0) - Number(a.unreadCount || 0);
      const ta = new Date(a.lastMessageAt || a.updatedAt || 0).getTime();
      const tb = new Date(b.lastMessageAt || b.updatedAt || 0).getTime();
      return tb - ta;
    });

    const total = filtered.length;
    const start = (page - 1) * limit;
    const conversationsPaged = filtered.slice(start, start + limit);

    return NextResponse.json({ conversations: conversationsPaged, total, page, limit });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const body = await request.json();
    const adId = body?.adId;

    if (!adId || !mongoose.Types.ObjectId.isValid(adId)) {
      return NextResponse.json({ message: 'شناسه آگهی معتبر نیست' }, { status: 400 });
    }

    await connectDB();

    const ad = await Ad.findById(adId).select('_id userId').lean<{ _id: mongoose.Types.ObjectId; userId: mongoose.Types.ObjectId }>();
    if (!ad) {
      return NextResponse.json({ message: 'آگهی یافت نشد' }, { status: 404 });
    }

    const sellerId = ad.userId.toString();
    if (sellerId === userId) {
      return NextResponse.json({ message: 'امکان چت با آگهی خودتان وجود ندارد' }, { status: 400 });
    }

    const query = {
      adId: ad._id,
      buyerId: new mongoose.Types.ObjectId(userId),
      sellerId: ad.userId,
    };

    let conversation = await Conversation.findOne(query).lean<{ _id: mongoose.Types.ObjectId }>();

    if (!conversation) {
      try {
        const created = await Conversation.create({
          ...query,
          lastMessage: '',
          lastMessageAt: new Date(),
        });
        conversation = { _id: created._id };
      } catch (error: any) {
        if (error?.code === 11000) {
          const existing = await Conversation.findOne(query).lean<{ _id: mongoose.Types.ObjectId }>();
          if (!existing) {
            return NextResponse.json({ message: 'خطا در ایجاد گفتگو' }, { status: 500 });
          }
          conversation = existing;
        } else {
          return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ conversationId: conversation._id.toString() });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
