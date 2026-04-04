import mongoose from 'mongoose';
import Message from '@/models/Message';
import User from '@/models/User';
import ChatNotification from '@/models/ChatNotification';
import { sendEmail } from '@/lib/email';
import { getAppUrl } from '@/lib/app-url';

const ONLINE_WINDOW_MS = 90 * 1000;
export const CHAT_EMAIL_DELAY_MS = 60 * 1000;

export function isUserOnline(lastSeenAt?: Date | string | null) {
  if (!lastSeenAt) return false;
  const ts = new Date(lastSeenAt).getTime();
  if (Number.isNaN(ts)) return false;
  return Date.now() - ts <= ONLINE_WINDOW_MS;
}

export async function getUnreadCountForUser(userId: string) {
  if (!mongoose.Types.ObjectId.isValid(userId)) return 0;
  return Message.countDocuments({
    receiverId: new mongoose.Types.ObjectId(userId),
    isRead: false,
  });
}

export async function enqueueUnreadMessageEmail(args: {
  receiverId: string;
  senderName: string;
  conversationId: string;
  messagePreview: string;
}) {
  const { receiverId, senderName, conversationId, messagePreview } = args;
  if (!mongoose.Types.ObjectId.isValid(receiverId) || !mongoose.Types.ObjectId.isValid(conversationId)) return;
  await ChatNotification.create({
    receiverId: new mongoose.Types.ObjectId(receiverId),
    conversationId: new mongoose.Types.ObjectId(conversationId),
    senderName: String(senderName || 'کاربر'),
    messagePreview: String(messagePreview || 'شما یک پیام جدید دارید.'),
    dueAt: new Date(Date.now() + CHAT_EMAIL_DELAY_MS),
    status: 'pending',
  });
}

export async function processPendingUnreadMessageEmails(maxBatch = 50) {
  const pending = await ChatNotification.find({
    status: 'pending',
    dueAt: { $lte: new Date() },
  })
    .sort({ dueAt: 1 })
    .limit(maxBatch)
    .lean<{
      _id: mongoose.Types.ObjectId;
      receiverId: mongoose.Types.ObjectId;
      conversationId: mongoose.Types.ObjectId;
      senderName: string;
      messagePreview: string;
    }[]>();

  for (const item of pending) {
    try {
      const receiver = await User.findById(item.receiverId)
        .select('email chatEmailNotificationsEnabled lastSeenAt')
        .lean<{
          email?: string;
          chatEmailNotificationsEnabled?: boolean;
          lastSeenAt?: Date;
        }>();

      if (!receiver?.email || receiver.chatEmailNotificationsEnabled === false || isUserOnline(receiver.lastSeenAt)) {
        await ChatNotification.findByIdAndUpdate(item._id, { $set: { status: 'skipped', sentAt: new Date() } });
        continue;
      }

      const unreadStillExists = await Message.exists({
        conversationId: item.conversationId,
        receiverId: item.receiverId,
        isRead: false,
      });
      if (!unreadStillExists) {
        await ChatNotification.findByIdAndUpdate(item._id, { $set: { status: 'skipped', sentAt: new Date() } });
        continue;
      }

      const conversationId = item.conversationId.toString();
      const appUrl = getAppUrl();
      const targetUrl = `${appUrl}/messages/${conversationId}`;

      await sendEmail({
        to: receiver.email,
        subject: 'پیام جدید در بازارینو',
        text: `${item.senderName} برای شما پیام فرستاد.\n\n${item.messagePreview}\n\nمشاهده گفتگو: ${targetUrl}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.7;">
            <h3>پیام جدید در بازارینو</h3>
            <p><strong>${item.senderName}</strong> برای شما پیام فرستاد.</p>
            <p>${item.messagePreview}</p>
            <p><a href="${targetUrl}">مشاهده گفتگو</a></p>
          </div>
        `,
      });

      await ChatNotification.findByIdAndUpdate(item._id, { $set: { status: 'sent', sentAt: new Date() } });
    } catch {
      await ChatNotification.findByIdAndUpdate(item._id, { $set: { status: 'failed' } });
    }
  }
}
