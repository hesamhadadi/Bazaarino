import type { Metadata } from 'next';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import '@/models/User';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import { toFaDigits } from '@/lib/locale';
import { notFound } from 'next/navigation';
import { getAppUrl } from '@/lib/app-url';

export const dynamic = 'force-dynamic';
const estimateReadMinutes = (text: string) => Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));

async function getArticle(slug: string) {
  try {
    await connectDB();
    const item = await Article.findOne({ slug, status: 'published' })
      .populate('authorId', 'name avatar role')
      .lean();
    if (!item) return null;
    return JSON.parse(JSON.stringify(item));
  } catch {
    return null;
  }
}

async function getRelatedArticles(slug: string, tags: string[] = []) {
  try {
    await connectDB();
    const items = await Article.find({
      status: 'published',
      slug: { $ne: slug },
      ...(tags.length ? { tags: { $in: tags } } : {}),
    })
      .populate('authorId', 'name')
      .sort({ isHot: -1, createdAt: -1 })
      .limit(3)
      .lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) {
    return { title: 'خبر یافت نشد' };
  }
  const base = getAppUrl();
  const canonicalPath = `/news/${encodeURIComponent(article.slug)}`;
  const image = article.coverImage || '/og-default.png';

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: canonicalPath },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `${base}${canonicalPath}`,
      type: 'article',
      locale: 'fa_IR',
      images: [{ url: image.startsWith('http') ? image : `${base}${image}` }],
      publishedTime: article.createdAt ? new Date(article.createdAt).toISOString() : undefined,
      modifiedTime: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
      authors: article.authorId?.name ? [article.authorId.name] : undefined,
      tags: Array.isArray(article.tags) ? article.tags : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [image.startsWith('http') ? image : `${base}${image}`],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) {
    notFound();
  }
  const readMinutes = estimateReadMinutes(article.content || '');
  const relatedArticles = await getRelatedArticles(article.slug, Array.isArray(article.tags) ? article.tags : []);

  const base = getAppUrl();
  const articleUrl = `${base}/news/${encodeURIComponent(article.slug)}`;
  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? [article.coverImage] : [`${base}/og-default.svg`],
    datePublished: new Date(article.createdAt).toISOString(),
    dateModified: new Date(article.updatedAt || article.createdAt).toISOString(),
    author: {
      '@type': 'Person',
      name: article.authorId?.name || 'تحریریه بازارینو',
    },
    publisher: {
      '@type': 'Organization',
      name: 'بازارینو',
      logo: { '@type': 'ImageObject', url: `${base}/logo-eu.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    keywords: Array.isArray(article.tags) ? article.tags.join(', ') : undefined,
  };
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: base },
      { '@type': 'ListItem', position: 2, name: 'اخبار', item: `${base}/news` },
      { '@type': 'ListItem', position: 3, name: article.title, item: articleUrl },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <Navbar />
      <article className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {article.isHot && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500 text-white">خبر داغ</span>
          )}
          <span className="text-xs text-gray-400">{toFaDigits(new Date(article.createdAt).toLocaleDateString('fa-IR'))}</span>
          <span className="text-xs text-gray-400">• {toFaDigits(String(readMinutes))} دقیقه مطالعه</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight mb-4">{article.title}</h1>
        <p className="text-gray-600 text-sm mb-6">{article.excerpt}</p>
        {Array.isArray(article.tags) && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {article.tags.map((tag: string) => (
              <Link key={tag} href={`/news?tag=${encodeURIComponent(tag)}`} className="text-xs px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">#{tag}</Link>
            ))}
          </div>
        )}

        {article.coverImage && (
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-gray-100 mb-6 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.coverImage} alt={article.title} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        )}

        <div className="prose prose-sm max-w-none text-gray-800 leading-8">
          {article.content.split('\n').filter(Boolean).map((p: string, idx: number) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-100 pt-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={article.authorId?.avatar || '/default-avatar.svg'} alt={article.authorId?.name || 'author'} width={48} height={48} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{article.authorId?.name || 'نویسنده بازارینو'}</p>
            <p className="text-xs text-gray-500">تحریریه بازارینو</p>
          </div>
        </div>

        {relatedArticles.length > 0 && (
          <section className="mt-10 border-t border-gray-100 pt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">مطالب مرتبط</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {relatedArticles.map((item: any) => (
                <Link key={item._id} href={`/news/${item.slug}`} className="rounded-2xl border border-gray-100 p-3 bg-white hover:shadow-md transition-shadow">
                  <p className="font-semibold text-sm text-gray-800 line-clamp-2 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
      <Footer />
      <BottomNav />
    </div>
  );
}
