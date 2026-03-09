import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import { resolveSessionUserId } from '@/lib/session-user';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    await connectDB();
    const userId = await resolveSessionUserId(session.user);
    if (!userId) {
      return NextResponse.json({ message: 'کاربر معتبر یافت نشد، لطفاً دوباره وارد شوید' }, { status: 401 });
    }

    const ads = await Ad.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ ads: JSON.parse(JSON.stringify(ads)) });
  } catch (error) {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
