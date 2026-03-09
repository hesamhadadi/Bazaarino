import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || 'pending';

    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      Ad.find(status !== 'all' ? { status } : {})
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ad.countDocuments(status !== 'all' ? { status } : {}),
    ]);

    return NextResponse.json({
      ads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
