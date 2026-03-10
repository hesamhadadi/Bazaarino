import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Report from '@/models/Report';
import { resolveSessionUserId } from '@/lib/session-user';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();
    const { adId, message, images } = body;
    if (!adId || !message) {
      return NextResponse.json({ message: 'اطلاعات ناقص است' }, { status: 400 });
    }

    await connectDB();
    const reporterId = session ? await resolveSessionUserId(session.user) : undefined;

    const report = await Report.create({
      adId,
      reporterId,
      message,
      images: Array.isArray(images) ? images : [],
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
