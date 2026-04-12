import mongoose from 'mongoose';
import Notification, { NotificationType } from '@/models/Notification';
import { sendPushNotificationToUser } from '@/lib/push-notifications';

type CreateNotificationInput = {
  userId: string | mongoose.Types.ObjectId;
  actorId?: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  data?: Record<string, unknown>;
};

function toObjectId(value?: string | mongoose.Types.ObjectId) {
  if (!value) return undefined;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return new mongoose.Types.ObjectId(value);
}

export async function createNotification(input: CreateNotificationInput) {
  const userId = toObjectId(input.userId);
  const actorId = toObjectId(input.actorId);

  if (!userId) {
    throw new Error('Notification userId is required');
  }

  if (actorId && actorId.equals(userId)) {
    return null;
  }

  const notification = await Notification.create({
    userId,
    actorId,
    type: input.type,
    title: input.title.trim(),
    body: input.body.trim(),
    href: input.href?.trim(),
    data: input.data,
  });

  sendPushNotificationToUser(userId, {
    title: notification.title,
    body: notification.body,
    href: notification.href,
    type: notification.type,
    data: {
      notificationId: notification._id.toString(),
      ...(notification.data || {}),
    },
  }).catch((error) => {
    console.error('Push notification error:', error);
  });

  return notification;
}
