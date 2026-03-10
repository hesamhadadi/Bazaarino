import connectDB from '@/lib/mongodb';
import Setting from '@/models/Setting';

type TelegramConfig = {
  token?: string;
  chatId?: string;
  secret?: string;
};

export async function getTelegramConfig(): Promise<TelegramConfig> {
  await connectDB();
  const settings = (await Setting.findOne({ key: 'global' }).lean()) as any;
  return {
    token: settings?.telegramToken,
    chatId: settings?.telegramChatId,
    secret: settings?.telegramSecret,
  };
}

export async function sendTelegramMessage(text: string, options?: { inlineKeyboard?: any }) {
  const { token, chatId } = await getTelegramConfig();
  if (!token || !chatId) return { ok: false };

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: options?.inlineKeyboard ? { inline_keyboard: options.inlineKeyboard } : undefined,
  };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function sendTelegramPhoto(imageUrl: string, caption: string, options?: { inlineKeyboard?: any }) {
  const { token, chatId } = await getTelegramConfig();
  if (!token || !chatId) return { ok: false };

  const payload = {
    chat_id: chatId,
    photo: imageUrl,
    caption,
    parse_mode: 'HTML',
    reply_markup: options?.inlineKeyboard ? { inline_keyboard: options.inlineKeyboard } : undefined,
  };

  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function answerCallback(token: string, callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text, show_alert: false }),
  });
}
