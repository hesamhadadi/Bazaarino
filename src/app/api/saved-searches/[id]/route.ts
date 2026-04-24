import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SavedSearch from '@/models/SavedSearch';
import { resolveSessionUserId } from '@/lib/session-user';

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  if (!session) return null;
  return resolveSessionUserId(session.user);
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'شناسه نامعتبر' }, { status: 400 });
    }
    const body = await request.json().catch(() => ({}));
    const update: any = {};
    if (typeof body.name === 'string') update.name = body.name.trim().slice(0, 120);
    if (typeof body.alertEnabled === 'boolean') update.alertEnabled = body.alertEnabled;

    await connectDB();
    const item = await SavedSearch.findOneAndUpdate({ _id: params.id, userId }, update, { new: true }).lean();
    if (!item) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
    return NextResponse.json({ item: JSON.parse(JSON.stringify(item)) });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json({ message: 'شناسه نامعتبر' }, { status: 400 });
    }
    await connectDB();
    const res = await SavedSearch.findOneAndDelete({ _id: params.id, userId });
    if (!res) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
