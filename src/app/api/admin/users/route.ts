import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Ad from '@/models/Ad';

function computeIdentityStatus(user: any) {
  const statuses = [user.fiscalCodeStatus, user.passportStatus, user.selfieStatus];
  if (statuses.every((s) => s === 'approved')) return 'verified';
  if (statuses.some((s) => s === 'rejected')) return 'rejected';
  if (statuses.some((s) => s === 'pending')) return 'pending';
  const hasAny = Boolean(user.fiscalCode || user.passportImage || user.selfieImage);
  return hasAny ? 'pending' : 'none';
}

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
      phone: u.phone || '',
      phoneVerified: Boolean(u.phoneVerified),
      role: u.role,
      isActive: u.isActive,
      createdAt: u.createdAt,
      adsCount: adCountMap.get(String(u._id)) || 0,
      identityStatus: computeIdentityStatus(u),
      fiscalCode: u.fiscalCode || '',
      passportImage: u.passportImage || '',
      selfieImage: u.selfieImage || '',
      fiscalCodeStatus: u.fiscalCodeStatus || 'none',
      passportStatus: u.passportStatus || 'none',
      selfieStatus: u.selfieStatus || 'none',
      banner: u.banner || '',
      bio: u.bio || '',
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
    const { userId, isActive, role, identityStatus, fiscalCodeStatus, passportStatus, selfieStatus, phoneVerified } = body;
    if (!userId) {
      return NextResponse.json({ message: 'شناسه کاربر الزامی است' }, { status: 400 });
    }
    if (isActive === undefined && role === undefined && identityStatus === undefined && fiscalCodeStatus === undefined && passportStatus === undefined && selfieStatus === undefined && phoneVerified === undefined) {
      return NextResponse.json({ message: 'پارامتر نامعتبر' }, { status: 400 });
    }
    if (role !== undefined && !['user', 'admin', 'editor'].includes(role)) {
      return NextResponse.json({ message: 'نقش نامعتبر است' }, { status: 400 });
    }
    if (identityStatus !== undefined && !['none', 'pending', 'verified', 'rejected'].includes(identityStatus)) {
      return NextResponse.json({ message: 'وضعیت احراز هویت نامعتبر است' }, { status: 400 });
    }
    const docStatuses = ['none', 'pending', 'approved', 'rejected'];
    if (fiscalCodeStatus !== undefined && !docStatuses.includes(fiscalCodeStatus)) {
      return NextResponse.json({ message: 'وضعیت کد فیسکاله نامعتبر است' }, { status: 400 });
    }
    if (passportStatus !== undefined && !docStatuses.includes(passportStatus)) {
      return NextResponse.json({ message: 'وضعیت پاسپورت نامعتبر است' }, { status: 400 });
    }
    if (selfieStatus !== undefined && !docStatuses.includes(selfieStatus)) {
      return NextResponse.json({ message: 'وضعیت سلفی نامعتبر است' }, { status: 400 });
    }

    await connectDB();
    const updates: any = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (role !== undefined) updates.role = role;
    if (typeof phoneVerified === 'boolean') updates.phoneVerified = phoneVerified;
    if (identityStatus !== undefined) updates.identityStatus = identityStatus;
    if (fiscalCodeStatus !== undefined) updates.fiscalCodeStatus = fiscalCodeStatus;
    if (passportStatus !== undefined) updates.passportStatus = passportStatus;
    if (selfieStatus !== undefined) updates.selfieStatus = selfieStatus;

    const userBefore = await User.findById(userId).lean();
    const merged = { ...userBefore, ...updates };
    updates.identityStatus = computeIdentityStatus(merged);

    const user = await User.findByIdAndUpdate(userId, updates, { new: true });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
