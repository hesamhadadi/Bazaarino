import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { getAppUrl } from '@/lib/app-url';
import crypto from 'crypto';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === 'admin';
}

export async function GET() {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }
    await connectDB();
    const settings = (await Setting.findOne({ key: 'global' }).lean()) as any;
    return NextResponse.json({
      settings: {
        telegramToken: settings?.telegramToken || '',
        telegramChatId: settings?.telegramChatId || '',
        telegramSecret: settings?.telegramSecret || '',
      },
    });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }
    const body = await request.json();
    const { telegramToken, telegramChatId } = body;

    await connectDB();
    const existing = (await Setting.findOne({ key: 'global' })) as any;
    const telegramSecret = existing?.telegramSecret || crypto.randomBytes(16).toString('hex');

    const settings = await Setting.findOneAndUpdate(
      { key: 'global' },
      { telegramToken, telegramChatId, telegramSecret },
      { new: true, upsert: true }
    );
    return NextResponse.json({ settings });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }
    const body = await request.json();
    if (body?.action !== 'setWebhook') {
      return NextResponse.json({ message: 'درخواست نامعتبر است' }, { status: 400 });
    }

    await connectDB();
    const settings = (await Setting.findOne({ key: 'global' }).lean()) as any;
    if (!settings?.telegramToken) {
      return NextResponse.json({ message: 'توکن تلگرام تنظیم نشده است' }, { status: 400 });
    }
    const secret = settings.telegramSecret || crypto.randomBytes(16).toString('hex');
    if (!settings.telegramSecret) {
      await Setting.findOneAndUpdate({ key: 'global' }, { telegramSecret: secret });
    }

    const appUrl = getAppUrl();
    const webhookUrl = `${appUrl}/api/telegram/webhook`;
    const res = await fetch(`https://api.telegram.org/bot${settings.telegramToken}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl, secret_token: secret }),
    });
    const data = await res.json();
    return NextResponse.json({ ok: data.ok, result: data.result });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
