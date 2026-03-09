import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Ad from '@/models/Ad';

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
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const adCounts = await Ad.aggregate([{ $group: { _id: '$userId', adsCount: { $sum: 1 } } }]);
    const adCountMap = new Map(adCounts.map((x) => [String(x._id), x.adsCount]));

    const result = users.map((u: any) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      adsCount: adCountMap.get(String(u._id)) || 0,
    }));

    return NextResponse.json({ users: result });
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
    const { userId, isActive, role } = body;
    if (!userId) {
      return NextResponse.json({ message: 'شناسه کاربر الزامی است' }, { status: 400 });
    }
    if (isActive === undefined && role === undefined) {
      return NextResponse.json({ message: 'پارامتر نامعتبر' }, { status: 400 });
    }
    if (role !== undefined && !['user', 'admin', 'editor'].includes(role)) {
      return NextResponse.json({ message: 'نقش نامعتبر است' }, { status: 400 });
    }

    await connectDB();
    const updates: any = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (role !== undefined) updates.role = role;

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
