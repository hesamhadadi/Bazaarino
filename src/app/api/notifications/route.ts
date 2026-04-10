import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { createNotification } from '@/lib/notifications';
import { resolveSessionUserId } from '@/lib/session-user';
import Notification from '@/models/Notification';
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

    const limitParam = Number(request.nextUrl.searchParams.get('limit') || '20');
    const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(50, limitParam)) : 20;

    await connectDB();

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('actorId', 'name avatar')
        .lean(),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    await connectDB();

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return NextResponse.json({ updated: result.modifiedCount });
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

    const body = await request.json().catch(() => ({}));
    const mode = String(body?.mode || '');

    if (mode !== 'test') {
      return NextResponse.json({ message: 'درخواست نامعتبر است' }, { status: 400 });
    }

    await connectDB();

    const timestamp = new Intl.DateTimeFormat('fa-IR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date());

    const notification = await createNotification({
      userId,
      type: 'message',
      title: 'اعلان تستی',
      body: `این یک اعلان تستی برای بررسی زیرساخت نوتیفیکیشن است. زمان ثبت: ${timestamp}`,
      href: '/notifications',
      data: {
        mode: 'test',
        createdFrom: 'notifications-page',
      },
    });

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return NextResponse.json({ notification, unreadCount }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
