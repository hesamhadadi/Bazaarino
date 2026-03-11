import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import Ad from '@/models/Ad';
import { answerCallback, editMessageReplyMarkup } from '@/lib/telegram';

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
    const senderId = String(callback.from?.id || '');
    const messageUsername = callback.message?.chat?.username ? `@${callback.message.chat.username}` : '';
    const senderUsername = callback.from?.username ? `@${callback.from.username}` : '';
    const isNumericChat = /^\-?\d+$/.test(String(chatId || ''));
    if (chatId && messageChatId && senderId) {
      const matchNumeric = isNumericChat && (chatId === messageChatId || chatId === senderId);
      const matchUsername = !isNumericChat && (chatId === messageUsername || chatId === senderUsername);
      if (!matchNumeric && !matchUsername) {
        return NextResponse.json({ ok: true });
      }
    }

    const [action, adId] = String(callback.data).split(':');
    if (!adId) return NextResponse.json({ ok: true });

    const messageId = callback.message?.message_id;

    if (action === 'approve') {
      const updated = await Ad.findByIdAndUpdate(adId, { status: 'approved' });
      await answerCallback(token, callback.id, updated ? '✅ آگهی تأیید شد' : 'آگهی یافت نشد');
      if (updated && messageChatId && messageId) {
        await editMessageReplyMarkup(token, messageChatId, messageId, { inline_keyboard: [] });
      }
    } else if (action === 'reject') {
      const updated = await Ad.findByIdAndUpdate(adId, { status: 'rejected' });
      await answerCallback(token, callback.id, updated ? '❌ آگهی رد شد' : 'آگهی یافت نشد');
      if (updated && messageChatId && messageId) {
        await editMessageReplyMarkup(token, messageChatId, messageId, { inline_keyboard: [] });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
