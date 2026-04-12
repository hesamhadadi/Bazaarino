import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Ad from '@/models/Ad';
import User from '@/models/User';
import Report from '@/models/Report';
import Banner from '@/models/Banner';
import Favorite from '@/models/Favorite';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await connectDB();

    const now = new Date();
    const startToday = new Date(now);
    startToday.setHours(0, 0, 0, 0);
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const last14Days = new Date(Date.now() - 13 * 24 * 60 * 60 * 1000);

    const [
      totalAds,
      pendingAds,
      approvedAds,
      rejectedAds,
      expiredAds,
      soldAds,
      totalUsers,
      activeUsers,
      inactiveUsers,
      newUsersLast7Days,
      adsToday,
      featuredAds,
      urgentAds,
      openReports,
      resolvedReports,
      activeBanners,
      pendingIdentityUsers,
      totalFavorites,
      totalViewsAgg,
      recentAds,
      topCities,
      topCategories,
      adsLast7Days,
      adsTrend,
      usersTrend,
      statusBreakdown,
      listingModeBreakdown,
      topViewedAds,
      topReportedAds,
      newestUsers,
    ] = await Promise.all([
      Ad.countDocuments(),
      Ad.countDocuments({ status: 'pending' }),
      Ad.countDocuments({ status: 'approved' }),
      Ad.countDocuments({ status: 'rejected' }),
      Ad.countDocuments({ status: 'expired' }),
      Ad.countDocuments({ status: 'sold' }),
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ isActive: true, role: 'user' }),
      User.countDocuments({ isActive: false, role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: last7Days } }),
      Ad.countDocuments({ createdAt: { $gte: startToday } }),
      Ad.countDocuments({
        isFeatured: true,
        $or: [{ featuredUntil: { $exists: false } }, { featuredUntil: { $gte: now } }],
      }),
      Ad.countDocuments({ isUrgent: true }),
      Report.countDocuments({ status: 'open' }),
      Report.countDocuments({ status: 'resolved' }),
      Banner.countDocuments({ isActive: true, startsAt: { $lte: now }, endsAt: { $gte: now } }),
      User.countDocuments({
        role: 'user',
        $or: [
          { identityStatus: 'pending' },
          { fiscalCodeStatus: 'pending' },
          { passportStatus: 'pending' },
          { selfieStatus: 'pending' },
        ],
      }),
      Favorite.countDocuments(),
      Ad.aggregate([{ $group: { _id: null, totalViews: { $sum: '$views' }, avgViews: { $avg: '$views' } } }]),
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
      Ad.aggregate([
        { $match: { createdAt: { $gte: last14Days } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { role: 'user', createdAt: { $gte: last14Days } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Ad.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ad.aggregate([
        { $group: { _id: { $ifNull: ['$listingMode', 'offer'] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Ad.find({ status: 'approved' })
        .populate('userId', 'name email')
        .sort({ views: -1, createdAt: -1 })
        .limit(5)
        .select('title city category views status userId createdAt')
        .lean(),
      Ad.find({ fraudReportCount: { $gt: 0 } })
        .populate('userId', 'name email')
        .sort({ fraudReportCount: -1, createdAt: -1 })
        .limit(5)
        .select('title city category fraudReportCount status userId createdAt')
        .lean(),
      User.find({ role: 'user' })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name email city createdAt identityStatus')
        .lean(),
    ]);

    const totalViews = totalViewsAgg[0]?.totalViews || 0;

    return NextResponse.json({
      stats: {
        totalAds,
        pendingAds,
        approvedAds,
        rejectedAds,
        expiredAds,
        soldAds,
        totalUsers,
        activeUsers,
        inactiveUsers,
        newUsersLast7Days,
        adsToday,
        featuredAds,
        urgentAds,
        openReports,
        resolvedReports,
        activeBanners,
        pendingIdentityUsers,
        totalFavorites,
        totalViews,
        avgViews: Math.round(totalViewsAgg[0]?.avgViews || 0),
        topCities,
        topCategories,
        adsLast7Days,
        adsTrend,
        usersTrend,
        statusBreakdown,
        listingModeBreakdown,
        topViewedAds,
        topReportedAds,
        newestUsers,
      },
      recentAds,
    });
  } catch (error) {
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
