import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import User from '@/models/User';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import { toFaDigits } from '@/lib/locale';
import { getAppUrl } from '@/lib/app-url';
import { Calendar, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getAuthor(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  try {
    await connectDB();
    const author: any = await User.findById(id).select('name avatar role bio').lean();
    if (!author) return null;
    return JSON.parse(JSON.stringify(author));
  } catch (err) {
    console.error('[news/author] failed to fetch author', err);
    return null;
  }
}

async function getAuthorArticles(id: string, limit = 30) {
  try {
    await connectDB();
    const items = await Article.find({ status: 'published', authorId: id })
      .sort({ isHot: -1, createdAt: -1 })
      .limit(limit)
      .lean();
    return JSON.parse(JSON.stringify(items));
  } catch (err) {
    console.error('[news/author] failed to fetch articles', err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const author = await getAuthor(params.id);
  if (!author) return { title: 'نویسنده یافت نشد', robots: { index: false, follow: true } };
  return {
    title: `مقالات ${author.name}`,
    description: `مقالات و خبرهای منتشرشده توسط ${author.name} در بازارینو.`,
    alternates: { canonical: `/news/author/${params.id}` },
    openGraph: {
      title: `${author.name} | نویسنده بازارینو`,
      description: `مقالات منتشرشده توسط ${author.name}`,
      type: 'profile',
      images: author.avatar ? [author.avatar] : undefined,
    },
  };
}

export default async function AuthorPage({ params }: { params: { id: string } }) {
  const author = await getAuthor(params.id);
  if (!author) notFound();
  const articles = await getAuthorArticles(params.id);

  const base = getAppUrl();
  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    image: author.avatar || undefined,
    description: author.bio || `نویسنده در بازارینو`,
    url: `${base}/news/author/${params.id}`,
    worksFor: {
      '@type': 'Organization',
      name: 'بازارینو',
      url: base,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <nav aria-label="breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-brand-600">خانه</Link>
          <span>/</span>
          <Link href="/news" className="hover:text-brand-600">اخبار</Link>
          <span>/</span>
          <span className="text-gray-700">{author.name}</span>
        </nav>

        <header className="bg-white rounded-3xl border border-gray-100 p-6 mb-6 flex items-center gap-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={author.avatar || '/default-avatar.svg'}
              alt={author.name}
              width={80}
              height={80}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900">{author.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {author.role === 'admin' ? 'ادمین' : author.role === 'editor' ? 'دبیر' : 'نویسنده'} بازارینو · {toFaDigits(String(articles.length))} مقاله
            </p>
            {author.bio && <p className="text-sm text-gray-600 mt-2">{author.bio}</p>}
          </div>
        </header>

        {articles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">
            هنوز مقاله‌ای از این نویسنده منتشر نشده است.
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
            <ArrowRight size={14} /> همه مقالات بازارینو
          </Link>
        </div>
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
}
