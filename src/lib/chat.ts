import mongoose from 'mongoose';
import Message from '@/models/Message';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';
import { getAppUrl } from '@/lib/app-url';

const ONLINE_WINDOW_MS = 90 * 1000;
const EMAIL_DELAY_MS = 60 * 1000;

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

export async function scheduleUnreadMessageEmail(args: {
  receiverId: string;
  senderName: string;
  conversationId: string;
  messagePreview: string;
}) {
  const { receiverId, senderName, conversationId, messagePreview } = args;

  setTimeout(async () => {
    try {
      const receiver = await User.findById(receiverId)
        .select('name email chatEmailNotificationsEnabled lastSeenAt')
        .lean<{
          name?: string;
          email?: string;
          chatEmailNotificationsEnabled?: boolean;
          lastSeenAt?: Date;
        }>();

      if (!receiver?.email) return;
      if (receiver.chatEmailNotificationsEnabled === false) return;
      if (isUserOnline(receiver.lastSeenAt)) return;

      const unreadStillExists = await Message.exists({
        conversationId: new mongoose.Types.ObjectId(conversationId),
        receiverId: new mongoose.Types.ObjectId(receiverId),
        isRead: false,
      });
      if (!unreadStillExists) return;

      const appUrl = getAppUrl();
      const targetUrl = `${appUrl}/messages/${conversationId}`;
      const safePreview = messagePreview || 'شما یک پیام جدید دارید.';

      await sendEmail({
        to: receiver.email,
        subject: 'پیام جدید در بازارینو',
        text: `${senderName} برای شما پیام فرستاد.\n\n${safePreview}\n\nمشاهده گفتگو: ${targetUrl}`,
        html: `
          <div style="font-family: sans-serif; line-height: 1.7;">
            <h3>پیام جدید در بازارینو</h3>
            <p><strong>${senderName}</strong> برای شما پیام فرستاد.</p>
            <p>${safePreview}</p>
            <p><a href="${targetUrl}">مشاهده گفتگو</a></p>
          </div>
        `,
      });
    } catch {
      // ignore email errors
    }
  }, EMAIL_DELAY_MS);
}
