import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { resolveSessionUserId } from '@/lib/session-user';
import { publishChatEvent } from '@/lib/chat-events';
import { emitToUsers } from '@/lib/socket-server';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

    await connectDB();
    const userId = await resolveSessionUserId(session.user);
    if (!userId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });

    const now = new Date();
    await User.findByIdAndUpdate(userId, { $set: { lastSeenAt: now } });
    publishChatEvent({
      type: 'presence:changed',
      userIds: [userId],
      payload: { userId, lastSeenAt: now, isOnline: true },
    });
    emitToUsers([userId], 'presence_changed', { userId, lastSeenAt: now, isOnline: true });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
