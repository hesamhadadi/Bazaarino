import mongoose from 'mongoose';
import webpush, { PushSubscription as WebPushSubscription } from 'web-push';
import PushSubscription from '@/models/PushSubscription';

type PushPayload = {
  title: string;
  body: string;
  href?: string;
  type?: string;
  data?: Record<string, unknown>;
};

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
}

function getVapidConfig() {
  const publicKey = getVapidPublicKey();
  const privateKey = process.env.VAPID_PRIVATE_KEY || '';
  const subject = process.env.VAPID_SUBJECT || process.env.NEXTAUTH_URL || 'mailto:admin@bazaarino.online';

  if (!publicKey || !privateKey) return null;
  return { publicKey, privateKey, subject };
}

function configureWebPush() {
  const config = getVapidConfig();
  if (!config) return false;

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  return true;
}

export async function sendPushNotificationToUser(userId: string | mongoose.Types.ObjectId, payload: PushPayload) {
  if (!configureWebPush()) return { sent: 0, skipped: true };

  const subscriptions = await PushSubscription.find({ userId }).lean();
  if (!subscriptions.length) return { sent: 0, skipped: false };

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    href: payload.href || '/notifications',
    type: payload.type,
    data: payload.data || {},
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (subscription) => {
      const pushSubscription: WebPushSubscription = {
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime || null,
        keys: subscription.keys,
      };

      try {
        await webpush.sendNotification(pushSubscription, body);
        return true;
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await PushSubscription.deleteOne({ _id: subscription._id });
        }
        throw error;
      }
    })
  );

  return {
    sent: results.filter((result) => result.status === 'fulfilled').length,
    skipped: false,
  };
}
