import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import { authOptions } from '@/lib/auth';
import { getVapidPublicKey } from '@/lib/push-notifications';
import { resolveSessionUserId } from '@/lib/session-user';
import PushSubscription from '@/models/PushSubscription';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

export async function GET() {
  const publicKey = getVapidPublicKey();
  return NextResponse.json({ publicKey, enabled: Boolean(publicKey) });
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const subscription = body?.subscription;
    const endpoint = String(subscription?.endpoint || '').trim();
    const p256dh = String(subscription?.keys?.p256dh || '').trim();
    const auth = String(subscription?.keys?.auth || '').trim();

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ message: 'اشتراک نوتیفیکیشن معتبر نیست' }, { status: 400 });
    }

    await connectDB();

    const item = await PushSubscription.findOneAndUpdate(
      { endpoint },
      {
        userId,
        endpoint,
        expirationTime: subscription?.expirationTime ?? null,
        keys: { p256dh, auth },
        userAgent: request.headers.get('user-agent') || '',
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ ok: true, subscriptionId: item._id });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const endpoint = String(body?.endpoint || '').trim();
    if (!endpoint) return NextResponse.json({ ok: true });

    await connectDB();
    await PushSubscription.deleteOne({ userId, endpoint });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
