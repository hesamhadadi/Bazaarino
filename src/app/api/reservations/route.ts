import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import { resolveSessionUserId } from '@/lib/session-user';
import Ad from '@/models/Ad';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';
import Reservation from '@/models/Reservation';
import {
  calculateNights,
  formatReservationRequestContent,
  overlapQuery,
  parseDateOnlyInput,
  RENTAL_REAL_ESTATE_SUBCATEGORIES,
} from '@/lib/reservation';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const body = await request.json();
    const adId = String(body?.adId || '');
    const startDate = parseDateOnlyInput(body?.startDate);
    const endDate = parseDateOnlyInput(body?.endDate);

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      return NextResponse.json({ message: 'شناسه آگهی معتبر نیست' }, { status: 400 });
    }
    if (!startDate || !endDate) {
      return NextResponse.json({ message: 'بازه تاریخ معتبر نیست' }, { status: 400 });
    }

    const nights = calculateNights(startDate, endDate);
    if (nights < 1) {
      return NextResponse.json({ message: 'حداقل مدت رزرو یک شب است' }, { status: 400 });
    }

    await connectDB();

    const ad = await Ad.findById(adId)
      .select('_id userId status category subcategory listingMode price priceType title')
      .lean<any>();
    if (!ad || ad.status !== 'approved') {
      return NextResponse.json({ message: 'این آگهی فعال نیست' }, { status: 400 });
    }

    const canReserve =
      ad.category === 'real-estate' &&
      RENTAL_REAL_ESTATE_SUBCATEGORIES.includes(ad.subcategory) &&
      (ad.listingMode || 'offer') === 'offer';

    if (!canReserve) {
      return NextResponse.json({ message: 'این آگهی قابلیت رزرو ندارد' }, { status: 400 });
    }

    if (ad.userId.toString() === userId) {
      return NextResponse.json({ message: 'امکان رزرو آگهی خودتان وجود ندارد' }, { status: 400 });
    }

    const nightlyPrice = ad.priceType === 'fixed' && Number(ad.price) > 0 ? Number(ad.price) : 0;
    const totalPrice = nightlyPrice * nights;

    const hasOverlap = await Reservation.exists({
      adId: ad._id,
      status: 'approved',
      ...overlapQuery(startDate, endDate),
    });

    if (hasOverlap) {
      return NextResponse.json({ message: 'این بازه قبلاً رزرو شده است' }, { status: 409 });
    }

    const conversationQuery = {
      adId: ad._id,
      buyerId: new mongoose.Types.ObjectId(userId),
      sellerId: ad.userId,
    };

    let conversation = await Conversation.findOne(conversationQuery).lean<{ _id: mongoose.Types.ObjectId }>();
    if (!conversation) {
      const created = await Conversation.create({
        ...conversationQuery,
        lastMessage: '',
        lastMessageAt: new Date(),
      });
      conversation = { _id: created._id };
    }

    const reservation = await Reservation.create({
      adId: ad._id,
      buyerId: new mongoose.Types.ObjectId(userId),
      sellerId: ad.userId,
      conversationId: conversation._id,
      startDate,
      endDate,
      nights,
      nightlyPrice,
      totalPrice,
      status: 'pending',
    });

    const reservationText = formatReservationRequestContent({
      reservationId: reservation._id.toString(),
      startDate,
      endDate,
      nights,
      nightlyPrice,
      totalPrice,
    });

    await Message.create({
      conversationId: conversation._id,
      adId: ad._id,
      senderId: new mongoose.Types.ObjectId(userId),
      receiverId: ad.userId,
      type: 'text',
      content: reservationText,
      isRead: false,
      deliveredAt: new Date(),
    });

    await Conversation.findByIdAndUpdate(conversation._id, {
      $set: {
        lastMessage: `درخواست رزرو: ${nights} شب`,
        lastMessageAt: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: 'درخواست رزرو برای صاحب آگهی ارسال شد',
        reservation: {
          _id: reservation._id,
          adId: reservation.adId,
          conversationId: reservation.conversationId,
          nights,
          totalPrice,
          nightlyPrice,
          status: reservation.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Reservation API error:', error);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
