import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import Ad from '@/models/Ad';
import { answerCallback } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const settings = (await Setting.findOne({ key: 'global' }).lean()) as any;
    const secret = settings?.telegramSecret;
    const headerSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (secret && headerSecret && headerSecret !== secret) {
      return NextResponse.json({ ok: true });
    }

    const update = await request.json();
    const callback = update?.callback_query;
    if (!callback?.data) {
      return NextResponse.json({ ok: true });
    }

    const token = settings?.telegramToken;
    const chatId = settings?.telegramChatId;
    if (!token || !chatId) return NextResponse.json({ ok: true });

    const messageChatId = String(callback.message?.chat?.id || '');
    if (chatId && messageChatId && chatId !== messageChatId) {
      return NextResponse.json({ ok: true });
    }

    const [action, adId] = String(callback.data).split(':');
    if (!adId) return NextResponse.json({ ok: true });

    if (action === 'approve') {
      await Ad.findByIdAndUpdate(adId, { status: 'approved' });
      await answerCallback(token, callback.id, 'آگهی تأیید شد');
    } else if (action === 'reject') {
      await Ad.findByIdAndUpdate(adId, { status: 'rejected' });
      await answerCallback(token, callback.id, 'آگهی رد شد');
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
