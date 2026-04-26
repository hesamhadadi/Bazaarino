import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/Comment';
import '@/models/User';
import '@/models/Article';

/**
 * GET /api/admin/comments?status=pending|approved|rejected|all
 * Returns comments with article+author populated for the moderation panel.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    if (!['admin', 'editor'].includes(session.user.role)) {
      return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
    }

    await connectDB();
    const status = req.nextUrl.searchParams.get('status') || 'pending';
    const query: any = { deletedAt: null };
    if (['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const items = await Comment.find(query)
      .populate('userId', 'name avatar role')
      .populate('articleId', 'title slug')
      .sort({ createdAt: -1 })
      .limit(300)
      .lean();

    const counts = await Comment.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const countMap = { pending: 0, approved: 0, rejected: 0 } as Record<string, number>;
    for (const c of counts) countMap[c._id] = c.count;

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(items)),
      counts: countMap,
    });
  } catch (err) {
    console.error('[admin/comments GET]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
