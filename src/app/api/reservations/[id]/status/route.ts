import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { resolveSessionUserId } from '@/lib/session-user';
import Reservation from '@/models/Reservation';
import Message from '@/models/Message';
import Conversation from '@/models/Conversation';
import { overlapQuery } from '@/lib/reservation';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'شناسه رزرو معتبر نیست' }, { status: 400 });
    }

    const body = await request.json();
    const nextStatus = body?.status === 'approved' ? 'approved' : body?.status === 'rejected' ? 'rejected' : null;
    if (!nextStatus) {
      return NextResponse.json({ message: 'وضعیت معتبر نیست' }, { status: 400 });
    }

    await connectDB();

    const reservation = await Reservation.findById(params.id);
    if (!reservation) {
      return NextResponse.json({ message: 'رزرو یافت نشد' }, { status: 404 });
    }

    if (reservation.sellerId.toString() !== userId) {
      return NextResponse.json({ message: 'فقط صاحب آگهی می‌تواند رزرو را مدیریت کند' }, { status: 403 });
    }

    if (reservation.status !== 'pending') {
      return NextResponse.json({ message: 'این رزرو قبلاً تعیین‌تکلیف شده است' }, { status: 400 });
    }

    if (nextStatus === 'approved') {
      const overlapApproved = await Reservation.exists({
        _id: { $ne: reservation._id },
        adId: reservation.adId,
        status: 'approved',
        ...overlapQuery(reservation.startDate, reservation.endDate),
      });

      if (overlapApproved) {
        return NextResponse.json({ message: 'در این بازه، رزرو تاییدشده دیگری وجود دارد' }, { status: 409 });
      }

      reservation.status = 'approved';
      reservation.approvedAt = new Date();
    } else {
      reservation.status = 'rejected';
      reservation.rejectedAt = new Date();
      reservation.rejectionReason = body?.reason ? String(body.reason).slice(0, 300) : null;
    }

    await reservation.save();

    const statusLabel = reservation.status === 'approved' ? '✅ تایید شد' : '❌ رد شد';
    await Message.create({
      conversationId: reservation.conversationId,
      adId: reservation.adId,
      senderId: reservation.sellerId,
      receiverId: reservation.buyerId,
      type: 'text',
      content: `نتیجه درخواست رزرو شما: ${statusLabel}\n[reservation:${reservation._id.toString()}]`,
      isRead: false,
      deliveredAt: new Date(),
    });

    await Conversation.findByIdAndUpdate(reservation.conversationId, {
      $set: {
        lastMessage: `نتیجه رزرو: ${reservation.status === 'approved' ? 'تایید شد' : 'رد شد'}`,
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json({
      message: reservation.status === 'approved' ? 'رزرو تایید شد' : 'رزرو رد شد',
      reservation: {
        _id: reservation._id,
        status: reservation.status,
        approvedAt: reservation.approvedAt,
        rejectedAt: reservation.rejectedAt,
      },
    });
  } catch (error) {
    console.error('Reservation API error:', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
