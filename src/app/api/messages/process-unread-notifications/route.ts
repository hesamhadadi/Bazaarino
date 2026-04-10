import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { processPendingUnreadMessageEmails } from '@/lib/chat';

export async function POST(request: NextRequest) {
  try {
    const key = request.headers.get('x-cron-key') || '';
    if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await processPendingUnreadMessageEmails(100);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
