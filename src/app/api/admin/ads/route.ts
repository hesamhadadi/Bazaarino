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
    const q = searchParams.get('q');
    const city = searchParams.get('city');
    const category = searchParams.get('category');
    const isFeatured = searchParams.get('isFeatured');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const now = new Date();

    const query: any = status !== 'all' ? { status } : {};

    if (city) query.city = city;
    if (category) query.category = category;
    if (q) {
      query.$and = [...(query.$and || []), {
        $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        ],
      }];
    }

    if (isFeatured === 'true') {
      query.isFeatured = true;
      query.$and = [...(query.$and || []), { $or: [{ featuredUntil: { $exists: false } }, { featuredUntil: { $gte: now } }] }];
    }
    if (isFeatured === 'false') {
      query.$and = [...(query.$and || []), {
        $or: [
          { isFeatured: { $ne: true } },
          { featuredUntil: { $lt: now } },
        ],
      }];
    }

    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) query.createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    const skip = (page - 1) * limit;

    const [ads, total] = await Promise.all([
      Ad.find(query)
        .populate('userId', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Ad.countDocuments(query),
    ]);

    return NextResponse.json({
      ads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
