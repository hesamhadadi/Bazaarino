import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import User from '@/models/User';

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

  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1';

  await connectDB();

  // Resolve author — first admin user.
  const admin = await User.findOne({ role: 'admin' }).select('_id name email').lean<{
    _id: unknown;
    name?: string;
    email?: string;
  }>();
  if (!admin) {
    return NextResponse.json({ message: 'هیچ کاربر ادمینی یافت نشد' }, { status: 500 });
  }

  const results = {
    dryRun,
    author: { id: String(admin._id), name: admin.name, email: admin.email },
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
        authorId: admin._id,
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
