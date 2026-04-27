/* eslint-disable no-console */
/**
 * Seed scheduled articles into the database.
 *
 * Reads the article array from `scripts/scheduled-articles-data.js`,
 * connects to the same MongoDB the app uses, and inserts every entry as
 * a `status: 'scheduled'` Article document (so the existing publish-cron
 * promotes them automatically on the configured `scheduledFor` date).
 *
 * Idempotent: if an article with the same slug already exists, it's
 * skipped (we never overwrite content the editor may have hand-edited).
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/seed-scheduled-articles.js [--author-email you@example.com] [--dry-run]
 *
 * Flags:
 *   --author-email   pick a specific user as authorId. Defaults to the
 *                    first user with role=admin.
 *   --dry-run        print what would be inserted without writing.
 */
const mongoose = require('mongoose');
const articles = require('./scheduled-articles-data');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI env var');
  process.exit(1);
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const authorEmailIdx = args.indexOf('--author-email');
const authorEmail = authorEmailIdx >= 0 ? args[authorEmailIdx + 1] : null;

// Use loose schemas so we don't have to pull the full app's Mongoose models
// (which would require ts-node / TS path aliases). Strict:false lets us write
// arbitrary fields and the app's stricter schema will validate on read.
const ArticleSchema = new mongoose.Schema({}, { strict: false, collection: 'articles', timestamps: true });
const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
const Article = mongoose.models._SeedArticle || mongoose.model('_SeedArticle', ArticleSchema);
const User = mongoose.models._SeedUser || mongoose.model('_SeedUser', UserSchema);

(async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  // Resolve author. Either explicit email or first admin.
  const authorQuery = authorEmail ? { email: authorEmail } : { role: 'admin' };
  const author = await User.findOne(authorQuery).lean();
  if (!author) {
    console.error(
      `No author found for query ${JSON.stringify(authorQuery)}. ` +
        'Pass --author-email <email> with an existing user.',
    );
    await mongoose.disconnect();
    process.exit(1);
  }
  console.log(`Using author: ${author.name || author.email} (${author._id})`);

  let created = 0;
  let skipped = 0;

  for (const a of articles) {
    if (!a.slug || !a.title || !a.content || !a.scheduledFor) {
      console.warn(`Skipping malformed entry: ${a.title || a.slug || '(unknown)'}`);
      continue;
    }

    const existing = await Article.findOne({ slug: a.slug }).lean();
    if (existing) {
      console.log(`✓ skip — already exists: ${a.slug}`);
      skipped++;
      continue;
    }

    const scheduledFor = new Date(a.scheduledFor);
    if (Number.isNaN(scheduledFor.getTime())) {
      console.warn(`Skipping ${a.slug} — invalid scheduledFor: ${a.scheduledFor}`);
      continue;
    }

    const doc = {
      title: a.title,
      slug: a.slug,
      excerpt: a.excerpt,
      content: a.content,
      coverImage: a.coverImage || undefined,
      tags: Array.isArray(a.tags) ? a.tags : [],
      isHot: Boolean(a.isHot),
      status: 'scheduled',
      scheduledFor,
      authorId: author._id,
      views: 0,
      ratingAvg: 0,
      ratingCount: 0,
      commentCount: 0,
      previousSlugs: [],
    };

    if (dryRun) {
      console.log(`(dry-run) would insert: ${a.slug}  →  ${scheduledFor.toISOString()}`);
    } else {
      await Article.create(doc);
      console.log(`+ scheduled: ${a.slug}  →  ${scheduledFor.toISOString()}`);
    }
    created++;
  }

  console.log('---');
  console.log(`Done. ${created} created, ${skipped} skipped (already existed).`);
  await mongoose.disconnect();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
