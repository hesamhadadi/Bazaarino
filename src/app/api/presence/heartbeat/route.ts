import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { resolveSessionUserId } from '@/lib/session-user';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

    await connectDB();
    const userId = await resolveSessionUserId(session.user);
    if (!userId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });

    await User.findByIdAndUpdate(userId, { $set: { lastSeenAt: new Date() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
