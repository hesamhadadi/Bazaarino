import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import Comment from '@/models/Comment';
import User from '@/models/User';
import '@/models/User';
import { resolveSessionUserId } from '@/lib/session-user';

async function findArticleId(slug: string): Promise<mongoose.Types.ObjectId | null> {
  const trimmed = slug.toLowerCase().trim();
  let doc = await Article.findOne({ slug: trimmed })
    .select('_id status')
    .lean<{ _id: mongoose.Types.ObjectId; status: string } | null>();
  if (!doc && mongoose.Types.ObjectId.isValid(slug)) {
    doc = await Article.findById(slug)
      .select('_id status')
      .lean<{ _id: mongoose.Types.ObjectId; status: string } | null>();
  }
  if (!doc) return null;
  // Comments only on published articles for the public; staff bypass below in POST.
  return doc._id;
}

async function refreshCommentCount(articleId: mongoose.Types.ObjectId) {
  const count = await Comment.countDocuments({
    articleId,
    status: 'approved',
    deletedAt: null,
  });
  await Article.updateOne({ _id: articleId }, { $set: { commentCount: count } });
}

/**
 * GET → list approved, non-deleted comments for the public.
 * Staff can pass ?status=pending|all to inspect moderation queues.
 */
export async function GET(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectDB();
    const articleId = await findArticleId(params.slug);
    if (!articleId) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });

    const session = await getServerSession(authOptions);
    const isStaff = ['admin', 'editor'].includes(session?.user?.role || '');
    const statusParam = req.nextUrl.searchParams.get('status');

    const query: any = { articleId };
    if (isStaff && (statusParam === 'pending' || statusParam === 'all')) {
      if (statusParam === 'pending') query.status = 'pending';
      // 'all' → no status filter
    } else {
      query.status = 'approved';
      query.deletedAt = null;
    }

    const items = await Comment.find(query)
      .populate('userId', 'name avatar role')
      .sort({ createdAt: 1 })
      .limit(500)
      .lean();

    return NextResponse.json({ items: JSON.parse(JSON.stringify(items)) });
  } catch (err) {
    console.error('[articles/comments GET]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

/**
 * POST → submit a new comment (or reply when `parentId` is provided).
 * Staff comments are auto-approved; everyone else lands in `pending`.
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body?.body || '').trim();
    const parentRaw = body?.parentId ? String(body.parentId) : null;

    if (text.length < 2) {
      return NextResponse.json({ message: 'متن خیلی کوتاه است' }, { status: 400 });
    }
    if (text.length > 2000) {
      return NextResponse.json({ message: 'متن طولانی‌تر از حد مجاز' }, { status: 400 });
    }

    await connectDB();
    const articleId = await findArticleId(params.slug);
    if (!articleId) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });

    const userId = await resolveSessionUserId(session.user);
    if (!userId) {
      return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });
    }

    let parentId: mongoose.Types.ObjectId | null = null;
    if (parentRaw && mongoose.Types.ObjectId.isValid(parentRaw)) {
      const parent = await Comment.findOne({
        _id: parentRaw,
        articleId,
        deletedAt: null,
      })
        .select('_id status')
        .lean<{ _id: mongoose.Types.ObjectId; status: string } | null>();
      if (parent && parent.status === 'approved') {
        parentId = parent._id;
      }
    }

    // Quick spam guard: rate-limit one pending submission every 30s per user/article.
    const recent = await Comment.findOne({
      articleId,
      userId,
      createdAt: { $gt: new Date(Date.now() - 30 * 1000) },
    })
      .select('_id')
      .lean();
    if (recent) {
      return NextResponse.json(
        { message: 'لطفاً کمی صبر کنید و دوباره ارسال کنید' },
        { status: 429 }
      );
    }

    const role = session.user.role;
    const isStaff = role === 'admin' || role === 'editor';

    const author = await User.findById(userId)
      .select('name avatar')
      .lean<{ name: string; avatar?: string } | null>();

    const comment = await Comment.create({
      articleId,
      userId,
      parentId,
      body: text,
      status: isStaff ? 'approved' : 'pending',
      isStaffReply: isStaff,
      authorNameSnapshot: author?.name,
      authorAvatarSnapshot: author?.avatar,
    });

    if (isStaff) await refreshCommentCount(articleId);

    return NextResponse.json({
      item: JSON.parse(JSON.stringify(comment)),
      pending: !isStaff,
    });
  } catch (err) {
    console.error('[articles/comments POST]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
