import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';
import { answerCallback, editMessageReplyMarkup } from '@/lib/telegram';
import { updateAdStatusAndNotifyOwner } from '@/lib/ad-moderation';

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
    const normalizeUsername = (value?: string) => (value || '').replace(/^@/, '').trim().toLowerCase();
    const configuredChat = String(chatId || '').trim();
    const messageUsername = normalizeUsername(callback.message?.chat?.username);
    const senderUsername = normalizeUsername(callback.from?.username);
    const isNumericChat = /^\-?\d+$/.test(String(chatId || ''));
    if (configuredChat && messageChatId) {
      const matchNumeric = isNumericChat && (configuredChat === messageChatId || configuredChat === senderId);
      const configuredUsername = normalizeUsername(configuredChat);
      const matchUsername = !isNumericChat && (configuredUsername === messageUsername || configuredUsername === senderUsername);
      if (!matchNumeric && !matchUsername) {
        return NextResponse.json({ ok: true });
      }
    }

    const callbackData = String(callback.data || '');
    const [action, adId] = callbackData.split(':');
    if (!['approve', 'reject'].includes(action) || !adId) {
      await answerCallback(token, callback.id, 'درخواست معتبر نیست');
      return NextResponse.json({ ok: true });
    }

    const messageId = callback.message?.message_id;

    if (action === 'approve') {
      const updated = await updateAdStatusAndNotifyOwner(adId, 'approved');
      await answerCallback(token, callback.id, updated ? '✅ آگهی تأیید شد' : 'آگهی یافت نشد');
      if (updated && messageChatId && messageId) {
        await editMessageReplyMarkup(token, messageChatId, messageId, { inline_keyboard: [] });
      }
    } else if (action === 'reject') {
      const updated = await updateAdStatusAndNotifyOwner(adId, 'rejected', 'رد شده توسط مدیر از طریق ربات تلگرام');
      await answerCallback(token, callback.id, updated ? '❌ آگهی رد شد' : 'آگهی یافت نشد');
      if (updated && messageChatId && messageId) {
        await editMessageReplyMarkup(token, messageChatId, messageId, { inline_keyboard: [] });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ ok: true });
  }
}
