import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { getAppUrl } from '@/lib/app-url';
import crypto from 'crypto';
import { DEFAULT_BRAND_PRIMARY, normalizeBrandPrimary } from '@/lib/brand-color';

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
        siteUrl: settings?.siteUrl || '',
        siteName: settings?.siteName || '',
        siteDescription: settings?.siteDescription || '',
        brandPrimary: settings?.brandPrimary || DEFAULT_BRAND_PRIMARY,
        supportEmail: settings?.supportEmail || '',
        supportPhone: settings?.supportPhone || '',
        maintenanceMode: !!settings?.maintenanceMode,
        registrationEnabled: settings?.registrationEnabled !== false,
        adAutoApprove: !!settings?.adAutoApprove,
        maxAdsPerUser: settings?.maxAdsPerUser || 0,
        featuredPrice1d: settings?.featuredPrice1d || 0,
        featuredPrice7d: settings?.featuredPrice7d || 0,
        featuredPrice30d: settings?.featuredPrice30d || 0,
        announcementText: settings?.announcementText || '',
        announcementEnabled: !!settings?.announcementEnabled,
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
    const telegramToken = String(body?.telegramToken || '').trim();
    const telegramChatId = String(body?.telegramChatId || '').trim();
    const siteUrl = String(body?.siteUrl || '').trim();
    const siteName = String(body?.siteName || '').trim();
    const siteDescription = String(body?.siteDescription || '').trim();
    const brandPrimary = normalizeBrandPrimary(body?.brandPrimary);
    const supportEmail = String(body?.supportEmail || '').trim();
    const supportPhone = String(body?.supportPhone || '').trim();
    const maintenanceMode = Boolean(body?.maintenanceMode);
    const registrationEnabled = body?.registrationEnabled !== false;
    const adAutoApprove = Boolean(body?.adAutoApprove);
    const maxAdsPerUser = Math.max(0, Number(body?.maxAdsPerUser) || 0);
    const featuredPrice1d = Math.max(0, Number(body?.featuredPrice1d) || 0);
    const featuredPrice7d = Math.max(0, Number(body?.featuredPrice7d) || 0);
    const featuredPrice30d = Math.max(0, Number(body?.featuredPrice30d) || 0);
    const announcementText = String(body?.announcementText || '').trim();
    const announcementEnabled = Boolean(body?.announcementEnabled);

    await connectDB();
    const existing = (await Setting.findOne({ key: 'global' })) as any;
    const telegramSecret = existing?.telegramSecret || crypto.randomBytes(16).toString('hex');

    const settings = await Setting.findOneAndUpdate(
      { key: 'global' },
      {
        telegramToken,
        telegramChatId,
        telegramSecret,
        siteUrl,
        siteName,
        siteDescription,
        brandPrimary,
        supportEmail,
        supportPhone,
        maintenanceMode,
        registrationEnabled,
        adAutoApprove,
        maxAdsPerUser,
        featuredPrice1d,
        featuredPrice7d,
        featuredPrice30d,
        announcementText,
        announcementEnabled,
      },
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
