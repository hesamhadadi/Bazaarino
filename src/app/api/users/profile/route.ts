import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { resolveSessionUserId } from '@/lib/session-user';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

    await connectDB();
    const userId = await resolveSessionUserId(session.user);
    if (!userId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });

    const user = await User.findById(userId).select('name email phone city avatar telegram bio banner fiscalCode passportImage selfieImage fiscalCodeStatus passportStatus selfieStatus identityStatus').lean();
    return NextResponse.json({ user: JSON.parse(JSON.stringify(user)) });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

    const body = await request.json();
    const { name, phone, city, avatar, telegram, bio, banner, fiscalCode, passportImage, selfieImage } = body;

    await connectDB();
    const userId = await resolveSessionUserId(session.user);
    if (!userId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });

    const updates: any = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (phone !== undefined) updates.phone = phone;
    if (city !== undefined) updates.city = city;
    if (avatar !== undefined) updates.avatar = avatar || '';
    if (telegram !== undefined) updates.telegram = String(telegram).trim();
    if (bio !== undefined) updates.bio = String(bio).trim();
    if (banner !== undefined) updates.banner = banner || '';
    if (fiscalCode !== undefined) {
      updates.fiscalCode = String(fiscalCode).trim();
      updates.fiscalCodeStatus = updates.fiscalCode ? 'pending' : 'none';
    }
    if (passportImage !== undefined) {
      updates.passportImage = passportImage || '';
      updates.passportStatus = updates.passportImage ? 'pending' : 'none';
    }
    if (selfieImage !== undefined) {
      updates.selfieImage = selfieImage || '';
      updates.selfieStatus = updates.selfieImage ? 'pending' : 'none';
    }
    const hasAny = Boolean(updates.fiscalCode || updates.passportImage || updates.selfieImage);
    updates.identityStatus = hasAny ? 'pending' : 'none';

    const user = await User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true })
      .select('name email phone city avatar telegram bio banner fiscalCode passportImage selfieImage fiscalCodeStatus passportStatus selfieStatus identityStatus')
      .lean();

    return NextResponse.json({ user: JSON.parse(JSON.stringify(user)) });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
