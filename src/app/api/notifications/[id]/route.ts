import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { resolveSessionUserId } from '@/lib/session-user';
import Notification from '@/models/Notification';

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
      return NextResponse.json({ message: 'شناسه اعلان معتبر نیست' }, { status: 400 });
    }

    await connectDB();

    const notification = await Notification.findOneAndUpdate(
      { _id: params.id, userId },
      { $set: { isRead: true, readAt: new Date() } },
      { new: true }
    ).lean();

    if (!notification) {
      return NextResponse.json({ message: 'اعلان یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({ notification });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
