import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import PasswordResetToken from '@/models/PasswordResetToken';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;
    if (!token || !password) {
      return NextResponse.json({ message: 'توکن و رمز عبور الزامی است' }, { status: 400 });
    }

    await connectDB();
    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

    const record = await PasswordResetToken.findOne({
      tokenHash,
      usedAt: null,
      expiresAt: { $gte: new Date() },
    }).lean();

    if (!record) {
      return NextResponse.json({ message: 'لینک معتبر نیست یا منقضی شده است' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    await User.findByIdAndUpdate(record.userId, { password: hashedPassword });
    await PasswordResetToken.updateOne({ _id: record._id }, { usedAt: new Date() });

    return NextResponse.json({ message: 'رمز عبور تغییر کرد' });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
