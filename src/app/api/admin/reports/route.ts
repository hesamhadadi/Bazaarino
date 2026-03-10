import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Report from '@/models/Report';

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  return !!session && session.user.role === 'admin';
}

export async function GET() {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }
    await connectDB();
    const reports = await Report.find()
      .populate('adId', 'title city')
      .populate('reporterId', 'name email')
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ reports });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!(await ensureAdmin())) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }
    const body = await request.json();
    const { reportId, status } = body;
    if (!reportId || !['open', 'resolved'].includes(status)) {
      return NextResponse.json({ message: 'درخواست نامعتبر است' }, { status: 400 });
    }
    await connectDB();
    const report = await Report.findByIdAndUpdate(reportId, { status }, { new: true });
    return NextResponse.json({ report });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
