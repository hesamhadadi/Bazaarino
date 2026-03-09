import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Favorite from '@/models/Favorite';
import Ad from '@/models/Ad';
import { resolveSessionUserId } from '@/lib/session-user';

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
    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');

    if (adId) {
      const exists = await Favorite.exists({ userId, adId });
      return NextResponse.json({ favorited: Boolean(exists) });
    }

    const favorites = await Favorite.find({ userId })
      .sort({ createdAt: -1 })
      .populate({
        path: 'adId',
        model: Ad,
        match: { status: 'approved' },
      })
      .lean();

    const ads = favorites
      .map((item: any) => item.adId)
      .filter(Boolean);

    return NextResponse.json({ ads: JSON.parse(JSON.stringify(ads)) });
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
    const { adId } = body;
    if (!adId) {
      return NextResponse.json({ message: 'شناسه آگهی الزامی است' }, { status: 400 });
    }

    await connectDB();
    const existing = await Favorite.findOne({ userId, adId });
    if (existing) {
      await Favorite.deleteOne({ _id: existing._id });
      return NextResponse.json({ favorited: false });
    }

    await Favorite.create({ userId, adId });
    return NextResponse.json({ favorited: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const adId = searchParams.get('adId');
    if (!adId) {
      return NextResponse.json({ message: 'شناسه آگهی الزامی است' }, { status: 400 });
    }

    await connectDB();
    await Favorite.deleteOne({ userId, adId });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
