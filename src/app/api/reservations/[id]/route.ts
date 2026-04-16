import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { resolveSessionUserId } from '@/lib/session-user';
import Reservation from '@/models/Reservation';

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
      return NextResponse.json({ message: 'شناسه رزرو معتبر نیست' }, { status: 400 });
    }

    await connectDB();

    const reservation = await Reservation.findById(params.id)
      .select('adId buyerId sellerId conversationId startDate endDate nights nightlyPrice totalPrice status approvedAt rejectedAt')
      .lean<any>();

    if (!reservation) {
      return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });
    }

    const isParticipant = [reservation.buyerId?.toString(), reservation.sellerId?.toString()].includes(userId);
    if (!isParticipant) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    console.error('Reservation API error:', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
