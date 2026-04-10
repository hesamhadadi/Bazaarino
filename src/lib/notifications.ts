import mongoose from 'mongoose';
import Notification, { NotificationType } from '@/models/Notification';

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

  return Notification.create({
    userId,
    actorId,
    type: input.type,
    title: input.title.trim(),
    body: input.body.trim(),
    href: input.href?.trim(),
    data: input.data,
  });
}
