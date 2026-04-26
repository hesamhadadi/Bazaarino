import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import ArticleRating from '@/models/ArticleRating';
import { resolveSessionUserId } from '@/lib/session-user';

/**
 * Locate the live article doc for a given URL slug. Falls back to lookup
 * by ObjectId so editors can rate previews while authoring.
 */
async function findArticle(slug: string) {
  const trimmed = slug.toLowerCase().trim();
  let article = await Article.findOne({ slug: trimmed }).select('_id status').lean<{
    _id: mongoose.Types.ObjectId;
    status: string;
  } | null>();
  if (!article && mongoose.Types.ObjectId.isValid(slug)) {
    article = await Article.findById(slug).select('_id status').lean<{
      _id: mongoose.Types.ObjectId;
      status: string;
    } | null>();
  }
  return article;
}

/** Recompute and persist rating aggregates on the article document. */
async function refreshAggregates(articleId: mongoose.Types.ObjectId) {
  const agg = await ArticleRating.aggregate([
    { $match: { articleId } },
    {
      $group: {
        _id: '$articleId',
        avg: { $avg: '$score' },
        count: { $sum: 1 },
      },
    },
  ]);
  const row = agg[0];
  await Article.updateOne(
    { _id: articleId },
    {
      $set: {
        ratingAvg: row ? Math.round(row.avg * 10) / 10 : 0,
        ratingCount: row ? row.count : 0,
      },
    }
  );
  return {
    ratingAvg: row ? Math.round(row.avg * 10) / 10 : 0,
    ratingCount: row ? row.count : 0,
  };
}

/**
 * GET → returns aggregate stats and (when signed in) the caller's score.
 */
export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    await connectDB();
    const article = await findArticle(params.slug);
    if (!article) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });

    const articleDoc = await Article.findById(article._id)
      .select('ratingAvg ratingCount')
      .lean<{ ratingAvg: number; ratingCount: number } | null>();

    let userScore: number | null = null;
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const userId = await resolveSessionUserId(session.user);
      if (userId) {
        const r = await ArticleRating.findOne({
          articleId: article._id,
          userId,
        }).lean<{ score: number } | null>();
        userScore = r?.score ?? null;
      }
    }

    return NextResponse.json({
      avg: articleDoc?.ratingAvg ?? 0,
      count: articleDoc?.ratingCount ?? 0,
      userScore,
    });
  } catch (err) {
    console.error('[articles/rating GET]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

/**
 * POST → upsert the caller's score (1..5). Returns refreshed aggregates.
 */
export async function POST(req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const score = Number(body?.score);
    if (!Number.isFinite(score) || score < 1 || score > 5) {
      return NextResponse.json({ message: 'امتیاز نامعتبر' }, { status: 400 });
    }

    await connectDB();
    const article = await findArticle(params.slug);
    if (!article) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });
    if (article.status !== 'published') {
      return NextResponse.json({ message: 'این مقاله هنوز منتشر نشده' }, { status: 403 });
    }

    const userId = await resolveSessionUserId(session.user);
    if (!userId) {
      return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });
    }

    await ArticleRating.findOneAndUpdate(
      { articleId: article._id, userId },
      { $set: { score: Math.round(score) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const stats = await refreshAggregates(article._id);
    return NextResponse.json({ ...stats, userScore: Math.round(score) });
  } catch (err) {
    console.error('[articles/rating POST]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}

/**
 * DELETE → revoke the caller's rating.
 */
export async function DELETE(_req: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });
    }

    await connectDB();
    const article = await findArticle(params.slug);
    if (!article) return NextResponse.json({ message: 'یافت نشد' }, { status: 404 });

    const userId = await resolveSessionUserId(session.user);
    if (!userId) {
      return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });
    }

    await ArticleRating.deleteOne({ articleId: article._id, userId });
    const stats = await refreshAggregates(article._id);
    return NextResponse.json({ ...stats, userScore: null });
  } catch (err) {
    console.error('[articles/rating DELETE]', err);
    return NextResponse.json({ message: 'خطای سرور' }, { status: 500 });
  }
}
