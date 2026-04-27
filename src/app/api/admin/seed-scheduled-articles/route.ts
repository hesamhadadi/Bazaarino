import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';

// Pull the article list straight from the existing CommonJS source-of-truth
// so we don't have to maintain two copies. Next.js compiles this fine via
// webpack — the require call resolves at build time.
//
// eslint-disable-next-line @typescript-eslint/no-var-requires
const articleData: ScheduledArticleSeed[] =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../../../../../scripts/scheduled-articles-data.js');

interface ScheduledArticleSeed {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage?: string;
  tags?: string[];
  isHot?: boolean;
  scheduledFor: string;
}

/**
 * Idempotent admin endpoint that bulk-inserts the pre-written articles in
 * `scripts/scheduled-articles-data.js` as `status: 'scheduled'` documents.
 *
 * Skips slugs that already exist so it's safe to re-run after appending more
 * entries to the data file.
 *
 * Auth: must be logged in as a user with `role === 'admin'`.
 *
 * Usage from browser DevTools console while logged in as admin:
 *
 *   fetch('/api/admin/seed-scheduled-articles', { method: 'POST' })
 *     .then(r => r.json()).then(console.log)
 *
 * Pass `?dryRun=1` to preview without writing.
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ message: 'دسترسی ندارید' }, { status: 403 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get('dryRun') === '1';
  const fixAuthor = url.searchParams.get('fixAuthor') === '1';
  const syncMeta = url.searchParams.get('syncMeta') === '1';

  await connectDB();

  // Author the articles as the currently logged-in admin (the one calling
  // this endpoint), not "the first admin in the DB" — otherwise an early
  // admin account ends up credited for everyone's seeded posts.
  const sessionUser = session.user as { id?: string; name?: string; email?: string };
  if (!sessionUser.id || !mongoose.Types.ObjectId.isValid(sessionUser.id)) {
    return NextResponse.json({ message: 'شناسه کاربر معتبر نیست' }, { status: 400 });
  }
  const authorId = new mongoose.Types.ObjectId(sessionUser.id);

  // Maintenance mode: sync metadata (cover image, title, excerpt, tags,
  // scheduledFor) for already-seeded slugs from the data file. Skips the
  // `content` field on purpose so that any manual edits in the admin
  // editor are preserved.
  if (syncMeta) {
    const updates: Array<{ slug: string; modified: boolean; fields: string[] }> = [];
    for (const a of articleData) {
      if (!a.slug) continue;
      const set: Record<string, unknown> = {
        title: a.title,
        excerpt: a.excerpt,
        coverImage: a.coverImage,
        tags: Array.isArray(a.tags) ? a.tags : [],
        scheduledFor: new Date(a.scheduledFor),
      };
      const res = await Article.updateOne({ slug: a.slug }, { $set: set });
      updates.push({
        slug: a.slug,
        modified: res.modifiedCount > 0,
        fields: Object.keys(set),
      });
    }
    return NextResponse.json({ mode: 'syncMeta', updates });
  }

  // Maintenance mode: re-assign authorId on already-seeded slugs to the
  // current admin. Useful when the first run picked up the wrong author.
  if (fixAuthor) {
    const slugs = articleData.map((a) => a.slug).filter(Boolean);
    const res = await Article.updateMany(
      { slug: { $in: slugs } },
      { $set: { authorId } },
    );
    return NextResponse.json({
      mode: 'fixAuthor',
      author: { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email },
      matched: res.matchedCount,
      modified: res.modifiedCount,
      slugs,
    });
  }

  const results = {
    dryRun,
    author: { id: sessionUser.id, name: sessionUser.name, email: sessionUser.email },
    total: articleData.length,
    created: [] as string[],
    skipped: [] as string[],
    errors: [] as { slug: string; error: string }[],
  };

  for (const a of articleData) {
    if (!a.slug || !a.title || !a.content || !a.scheduledFor) {
      results.errors.push({ slug: a.slug || '(missing)', error: 'malformed entry' });
      continue;
    }

    const scheduledFor = new Date(a.scheduledFor);
    if (Number.isNaN(scheduledFor.getTime())) {
      results.errors.push({ slug: a.slug, error: `invalid scheduledFor: ${a.scheduledFor}` });
      continue;
    }

    const existing = await Article.findOne({ slug: a.slug }).select('_id').lean();
    if (existing) {
      results.skipped.push(a.slug);
      continue;
    }

    if (dryRun) {
      results.created.push(`(dry-run) ${a.slug}`);
      continue;
    }

    try {
      await Article.create({
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        content: a.content,
        coverImage: a.coverImage,
        tags: Array.isArray(a.tags) ? a.tags : [],
        isHot: Boolean(a.isHot),
        status: 'scheduled',
        scheduledFor,
        authorId,
        previousSlugs: [],
      });
      results.created.push(a.slug);
    } catch (err) {
      results.errors.push({
        slug: a.slug,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return NextResponse.json(results);
}
