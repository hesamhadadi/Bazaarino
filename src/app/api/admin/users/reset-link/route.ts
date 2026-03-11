import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import crypto from 'crypto';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import PasswordResetToken from '@/models/PasswordResetToken';
import Setting from '@/models/Setting';
import { getAppUrl } from '@/lib/app-url';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === 'admin';
}

export async function POST(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ message: 'شناسه کاربر الزامی است' }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId).select('_id email');
    if (!user) {
      return NextResponse.json({ message: 'کاربر یافت نشد' }, { status: 404 });
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
    });

    const settings = (await Setting.findOne({ key: 'global' }).lean()) as any;
    const appUrl = (settings?.siteUrl || getAppUrl()).replace(/\/$/, '');
    const resetUrl = `${appUrl}/auth/reset?token=${rawToken}`;

    return NextResponse.json({ resetUrl });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
