import mongoose from 'mongoose';
import DailyView, { DailyViewEntityType } from '@/models/DailyView';

const SITE_TIME_ZONE = 'Europe/Rome';

export function getViewDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SITE_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function isLikelyBot(userAgent = '') {
  return /bot|crawler|spider|crawling|preview|facebookexternalhit|whatsapp|telegram|slack|discord|linkedinbot|twitterbot/i.test(
    userAgent,
  );
}

export async function recordDailyView(entityType: DailyViewEntityType, entityId: string) {
  if (!mongoose.Types.ObjectId.isValid(entityId)) return;

  await DailyView.updateOne(
    {
      entityType,
      entityId: new mongoose.Types.ObjectId(entityId),
      dateKey: getViewDateKey(),
    },
    { $inc: { count: 1 } },
    { upsert: true },
  );
}
