import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendTelegramMessage } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, city } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: 'نام، ایمیل و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if email exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { message: 'این ایمیل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      city,
      avatar: '/default-avatar.svg',
    });

    try {
      const escapeHtml = (value: string) =>
        value
          .replaceAll('&', '&amp;')
          .replaceAll('<', '&lt;')
          .replaceAll('>', '&gt;')
          .replaceAll('"', '&quot;')
          .replaceAll("'", '&#39;');
      const safeName = escapeHtml(String(name));
      const safeEmail = escapeHtml(String(email).toLowerCase());
      const safePhone = phone ? escapeHtml(String(phone)) : 'ثبت نشده';
      const safeCity = city ? escapeHtml(String(city)) : 'ثبت نشده';

      await sendTelegramMessage(
        `👤 <b>کاربر جدید ثبت‌نام کرد</b>\n\n` +
          `📝 <b>نام:</b> ${safeName}\n` +
          `📧 <b>ایمیل:</b> ${safeEmail}\n` +
          `📱 <b>تلفن:</b> ${safePhone}\n` +
          `📍 <b>شهر:</b> ${safeCity}\n` +
          `🆔 <b>شناسه:</b> ${user._id}`
      );
    } catch (notifyError) {
      console.error('Register telegram notification error:', notifyError);
    }

    return NextResponse.json(
      { message: 'ثبت‌نام موفقیت‌آمیز', userId: user._id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Register error:', error);
    return NextResponse.json(
      { message: 'خطای سرور' },
      { status: 500 }
    );
  }
}
