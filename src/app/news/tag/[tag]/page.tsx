import type { Metadata } from 'next';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import '@/models/User';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import { toFaDigits } from '@/lib/locale';
import { getAppUrl } from '@/lib/app-url';
import { Tag as TagIcon, Calendar, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
const MIN_TAG_ARTICLES_FOR_INDEX = 3;

async function getArticlesByTag(tag: string, limit = 30) {
  try {
    await connectDB();
    const items = await Article.find({ status: 'published', tags: tag })
      .populate('authorId', 'name avatar')
      .sort({ isHot: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(items));
  } catch (err) {
    console.error('[news/tag] failed', err);
    return [];
  }
}

async function getTagArticleCount(tag: string) {
  try {
    await connectDB();
    return Article.countDocuments({ status: 'published', tags: tag });
  } catch {
    return 0;
  }
}

function tagDescription(tag: string, count?: number) {
  const countText = typeof count === 'number' && count > 0 ? ` شامل ${count} مطلب منتشرشده` : '';
  return `آرشیو موضوعی ${tag} در مجله بازارینو${countText}؛ راهنماها و خبرهای کاربردی برای ایرانیان ساکن اروپا.`;
}

export async function generateMetadata({
  params,
}: {
  params: { tag: string };
}): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  const count = await getTagArticleCount(tag);
  const shouldIndex = count >= MIN_TAG_ARTICLES_FOR_INDEX;
  const description = tagDescription(tag, count);
  return {
    title: `مقالات با برچسب «${tag}»`,
    description,
    robots: { index: shouldIndex, follow: true },
    alternates: { canonical: `/news/tag/${encodeURIComponent(tag)}` },
    openGraph: {
      title: `برچسب: ${tag}`,
      description,
      type: 'website',
    },
  };
}

export default async function TagArchivePage({ params }: { params: { tag: string } }) {
  const tag = decodeURIComponent(params.tag);
  const articles = await getArticlesByTag(tag);
  const base = getAppUrl();

  const itemListLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `مقالات با برچسب ${tag}`,
    url: `${base}/news/tag/${encodeURIComponent(tag)}`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: articles.slice(0, 20).map((a: any, idx: number) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${base}/news/${encodeURIComponent(a.slug)}`,
        name: a.title,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-brand-600">خانه</Link>
          <span>/</span>
          <Link href="/news" className="hover:text-brand-600">اخبار</Link>
          <span>/</span>
          <span className="text-gray-700">{tag}</span>
        </nav>

        <header className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 text-xs mb-3">
            <TagIcon size={12} /> برچسب
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">{tag}</h1>
          <p className="text-sm text-gray-500">
            {toFaDigits(String(articles.length))} مقاله با این برچسب
          </p>
          {articles.length >= MIN_TAG_ARTICLES_FOR_INDEX && (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              {tagDescription(tag, articles.length)}
            </p>
          )}
        </header>

        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            هنوز مقاله‌ای با این برچسب منتشر نشده است.{' '}
            <Link href="/news" className="text-brand-600 font-semibold">
              همه مقالات
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {articles.map((a: any) => (
              <Link
                key={a._id}
                href={`/news/${encodeURIComponent(a.slug)}`}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col"
              >
                {a.coverImage && (
                  <div className="relative aspect-[16/9] bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.coverImage}
                      alt={a.title}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center gap-2 mb-2 text-xs text-gray-400">
                    <Calendar size={11} />
                    <time dateTime={new Date(a.createdAt).toISOString()}>
                      {toFaDigits(new Date(a.createdAt).toLocaleDateString('fa-IR'))}
                    </time>
                  </div>
                  <h2 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{a.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-3">{a.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/news"
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
          >
            <ArrowRight size={14} /> بازگشت به همه مقالات
          </Link>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
