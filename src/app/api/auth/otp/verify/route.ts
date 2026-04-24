import { NextRequest, NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { verifyOtp } from '@/lib/otp';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const phone = normalizePhone(typeof body.phone === 'string' ? body.phone : '');
    const code = typeof body.code === 'string' ? body.code.trim() : '';

    if (!phone) {
      return NextResponse.json({ ok: false, message: 'شماره موبایل نامعتبر است' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, message: 'کد باید ۶ رقم باشد' }, { status: 400 });
    }

    const result = await verifyOtp(phone, code);
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.error || 'کد نامعتبر' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('otp/verify error:', err);
    return NextResponse.json({ ok: false, message: 'خطای سرور' }, { status: 500 });
  }
}
