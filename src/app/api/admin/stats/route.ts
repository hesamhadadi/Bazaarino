import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await connectDB();

    const [
      totalAds,
      pendingAds,
      approvedAds,
      rejectedAds,
      totalUsers,
      activeUsers,
      inactiveUsers,
      recentAds,
      topCities,
      topCategories,
      adsLast7Days,
    ] = await Promise.all([
      Ad.countDocuments(),
      Ad.countDocuments({ status: 'pending' }),
      Ad.countDocuments({ status: 'approved' }),
      Ad.countDocuments({ status: 'rejected' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ isActive: true, role: 'user' }),
      User.countDocuments({ isActive: false, role: 'user' }),
      Ad.find({ status: 'pending' })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Ad.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Ad.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 6 },
      ]),
      Ad.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return NextResponse.json({
      stats: {
        totalAds,
        pendingAds,
        approvedAds,
        rejectedAds,
        totalUsers,
        activeUsers,
        inactiveUsers,
        topCities,
        topCategories,
        adsLast7Days,
      },
      recentAds,
    });
  } catch (error) {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
