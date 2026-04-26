import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import '@/models/User'; // ensure User schema registered for populate('authorId')

/**
 * Robustly fetch a published article. Handles:
 *  - slug as-is
 *  - lowercased / trimmed slug (DB stores lowercase: true)
 *  - URL-decoded slug (defensive — Next normally decodes params, but proxies sometimes don't)
 *  - fallback by ObjectId (so old `/news/<id>` links keep working)
 *
 *  Errors are logged with context to make Vercel logs actionable.
 */
export async function fetchArticleBySlug(rawSlug: string) {
  if (!rawSlug) return null;
  try {
    await connectDB();

    const candidates = new Set<string>();
    candidates.add(rawSlug);
    candidates.add(rawSlug.toLowerCase().trim());
    try {
      const decoded = decodeURIComponent(rawSlug);
      candidates.add(decoded);
      candidates.add(decoded.toLowerCase().trim());
    } catch {
      // ignore malformed URI
    }

    const slugList = Array.from(candidates).filter(Boolean);

    let item: any = await Article.findOne({
      slug: { $in: slugList },
      status: 'published',
    })
      .populate('authorId', 'name avatar role')
      .lean();

    if (!item && mongoose.Types.ObjectId.isValid(rawSlug)) {
      item = await Article.findOne({ _id: rawSlug, status: 'published' })
        .populate('authorId', 'name avatar role')
        .lean();
    }

    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch (err) {
    console.error('[fetchArticleBySlug] failed for slug=', rawSlug, err);
    return null;
  }
}

export async function fetchRelatedArticles(slug: string, tags: string[] = [], limit = 3) {
  try {
    await connectDB();
    const items = await Article.find({
      status: 'published',
      slug: { $ne: slug },
      ...(tags.length ? { tags: { $in: tags } } : {}),
    })
      .populate('authorId', 'name')
      .sort({ isHot: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(items));
  } catch (err) {
    console.error('[fetchRelatedArticles] failed', err);
    return [];
  }
}

export async function fetchPrevNextArticles(currentCreatedAt: Date) {
  try {
    await connectDB();
    const [prev, next] = await Promise.all([
      Article.findOne({ status: 'published', createdAt: { $lt: currentCreatedAt } })
        .sort({ createdAt: -1 })
        .select('title slug')
        .lean(),
      Article.findOne({ status: 'published', createdAt: { $gt: currentCreatedAt } })
        .sort({ createdAt: 1 })
        .select('title slug')
        .lean(),
    ]);
    return {
      prev: prev ? JSON.parse(JSON.stringify(prev)) : null,
      next: next ? JSON.parse(JSON.stringify(next)) : null,
    };
  } catch (err) {
    console.error('[fetchPrevNextArticles] failed', err);
    return { prev: null, next: null };
  }
}

/**
 * Increment view counter (fire-and-forget). Errors are logged but never thrown.
 */
export async function incrementArticleViews(articleId: string) {
  try {
    await connectDB();
    await Article.updateOne({ _id: articleId }, { $inc: { views: 1 } });
  } catch (err) {
    console.error('[incrementArticleViews] failed', err);
  }
}
