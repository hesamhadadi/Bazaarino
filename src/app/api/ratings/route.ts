import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Rating from '@/models/Rating';
import User from '@/models/User';
import { resolveSessionUserId } from '@/lib/session-user';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) return NextResponse.json({ message: 'شناسه کاربر الزامی است' }, { status: 400 });

    const summary = await Rating.aggregate([
      { $match: { targetUserId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$targetUserId', avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);

    const data = summary[0] || { avg: 0, count: 0 };
    return NextResponse.json({ avg: Number(data.avg || 0), count: Number(data.count || 0) });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

    const body = await request.json();
    const { targetUserId, score } = body;
    if (!targetUserId || !score) {
      return NextResponse.json({ message: 'اطلاعات ناقص است' }, { status: 400 });
    }
    const numericScore = Number(score);
    if (numericScore < 1 || numericScore > 5) {
      return NextResponse.json({ message: 'امتیاز نامعتبر است' }, { status: 400 });
    }

    await connectDB();
    const raterId = await resolveSessionUserId(session.user);
    if (!raterId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });
    if (String(raterId) === String(targetUserId)) {
      return NextResponse.json({ message: 'امتیازدهی به خود مجاز نیست' }, { status: 400 });
    }

    await Rating.findOneAndUpdate(
      { targetUserId, raterUserId: raterId },
      { score: numericScore },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const summary = await Rating.aggregate([
      { $match: { targetUserId: new mongoose.Types.ObjectId(targetUserId) } },
      { $group: { _id: '$targetUserId', avg: { $avg: '$score' }, count: { $sum: 1 } } },
    ]);
    const data = summary[0] || { avg: 0, count: 0 };
    await User.findByIdAndUpdate(targetUserId, { ratingAvg: data.avg || 0, ratingCount: data.count || 0 });

    return NextResponse.json({ avg: Number(data.avg || 0), count: Number(data.count || 0) });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
