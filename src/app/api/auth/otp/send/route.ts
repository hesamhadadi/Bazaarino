import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { normalizePhone } from '@/lib/phone';
import { canSendAgain, createOtp, generateCode, OTP_COOLDOWN_SECONDS, OTP_EXPIRY_SECONDS } from '@/lib/otp';
import { isGatewayConfigured, sendTelegramCode, checkSendAbility } from '@/lib/telegram-gateway';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawPhone: string = typeof body.phone === 'string' ? body.phone : '';
    const phone = normalizePhone(rawPhone);

    if (!phone) {
      return NextResponse.json({ ok: false, message: 'شماره موبایل نامعتبر است' }, { status: 400 });
    }

    if (!(await canSendAgain(phone))) {
      return NextResponse.json(
        { ok: false, message: `قبل از درخواست مجدد ${OTP_COOLDOWN_SECONDS} ثانیه صبر کنید` },
        { status: 429 }
      );
    }

    const code = generateCode();

    // Try Telegram Gateway first (free for users who have Telegram)
    let channel: 'telegram' | 'email' = 'telegram';
    let deliveryNote = 'کد تأیید به تلگرام شما ارسال شد';
    let telegramOk = false;

    if (isGatewayConfigured()) {
      const ability = await checkSendAbility(phone);
      if (ability.canSend) {
        const reqId = await sendTelegramCode(phone, code);
        telegramOk = Boolean(reqId);
      }
    }

    if (!telegramOk) {
      // Fallback: try email OTP if user with this phone has an email
      await connectDB();
      const user = await User.findOne({ phone }).lean<any>();
      if (user?.email) {
        const sent = await sendEmail({
          to: user.email,
          subject: 'کد ورود به بازارینو',
          text: `کد تأیید شما: ${code}\nاین کد تا ${Math.floor(OTP_EXPIRY_SECONDS / 60)} دقیقه معتبر است.`,
          html: `<div dir="rtl" style="font-family:Tahoma,Arial,sans-serif">
            <h3>کد ورود به بازارینو</h3>
            <p style="font-size:22px;letter-spacing:4px"><b>${code}</b></p>
            <p style="color:#666;font-size:12px">این کد تا ${Math.floor(OTP_EXPIRY_SECONDS / 60)} دقیقه معتبر است.</p>
          </div>`,
        });
        if (sent) {
          channel = 'email';
          deliveryNote = 'کد تأیید به ایمیل شما ارسال شد';
        } else {
          return NextResponse.json(
            { ok: false, message: 'ارسال کد به تلگرام و ایمیل ممکن نشد. بعداً امتحان کنید.' },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json(
          { ok: false, message: 'ارسال به تلگرام ممکن نبود و ایمیل فعال برای این شماره پیدا نشد' },
          { status: 502 }
        );
      }
    }

    await createOtp(phone, channel, code);

    if (process.env.OTP_DEV_MODE === 'true') {
      console.log(`[otp] ${phone} (${channel}) => ${code}`);
    }

    return NextResponse.json({
      ok: true,
      channel,
      message: deliveryNote,
      cooldownSeconds: OTP_COOLDOWN_SECONDS,
      expirySeconds: OTP_EXPIRY_SECONDS,
    });
  } catch (err) {
    console.error('otp/send error:', err);
    return NextResponse.json({ ok: false, message: 'خطای سرور' }, { status: 500 });
  }
}
