import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Ad from '@/models/Ad';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === 'admin';
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await connectDB();
    const user = await User.findById(params.id).lean();
    if (!user) {
      return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404 });
    }

    const ads = await Ad.find({ userId: params.id }).sort({ createdAt: -1 }).limit(100).lean();

    return NextResponse.json({
      user: {
        ...user,
      },
      ads,
    });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const session = await getServerSession(authOptions);
    // Refuse to delete self
    const selfId = (session?.user as any)?.id;
    if (selfId && String(selfId) === String(params.id)) {
      return NextResponse.json({ message: 'نمی‌توانید حساب خود را حذف کنید' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(params.id);
    if (!user) {
      return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404 });
    }
    if (user.role === 'admin') {
      return NextResponse.json({ message: 'برای حذف ادمین، ابتدا نقش او را تغییر دهید' }, { status: 400 });
    }

    // Cascade delete the user's ads
    const adsResult = await Ad.deleteMany({ userId: params.id });
    await User.findByIdAndDelete(params.id);

    return NextResponse.json({
      message: 'کاربر حذف شد',
      deletedAds: adsResult.deletedCount || 0,
    });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
