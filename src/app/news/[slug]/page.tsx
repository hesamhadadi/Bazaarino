import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { EyeOff } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import ArticleShareSection from '@/components/articles/ArticleShareSection';
import ArticleBody from '@/components/articles/ArticleBody';
import ArticleRating from '@/components/articles/ArticleRating';
import ArticleComments from '@/components/articles/ArticleComments';
import { toFaDigits } from '@/lib/locale';
import { getAppUrl } from '@/lib/app-url';
import {
  fetchArticleBySlug,
  fetchRelatedArticles,
  fetchPrevNextArticles,
  incrementArticleViews,
} from '@/lib/articles';
import { ArrowRight, ArrowLeft, Eye, Clock, Calendar, Tag } from 'lucide-react';

export const dynamic = 'force-dynamic';

const estimateReadMinutes = (text: string) =>
  Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));

async function isPrivilegedViewer() {
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    return role === 'admin' || role === 'editor';
  } catch {
    return false;
  }
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const canPreview = await isPrivilegedViewer();
  const article = await fetchArticleBySlug(params.slug, {
    includeUnpublished: canPreview,
  });
  if (!article) {
    return { title: 'خبر یافت نشد', robots: { index: false, follow: true } };
  }
  // Hide unpublished previews from search engines and crawlers no matter what.
  const isPublished = article.status === 'published';
  const base = getAppUrl();
  const canonicalPath = `/news/${encodeURIComponent(article.slug)}`;
  const image = article.coverImage || '/og-default.png';
  const fullImage = image.startsWith('http') ? image : `${base}${image}`;

  return {
    title: isPublished ? article.title : `[پیش‌نمایش] ${article.title}`,
    description: article.excerpt,
    keywords: Array.isArray(article.tags) ? article.tags.join(', ') : undefined,
    authors: article.authorId?.name ? [{ name: article.authorId.name }] : undefined,
    robots: isPublished
      ? undefined
      : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
    alternates: {
      canonical: canonicalPath,
      types: {
        'application/rss+xml': '/feed.xml',
      },
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      url: `${base}${canonicalPath}`,
      type: 'article',
      locale: 'fa_IR',
      siteName: 'بازارینو',
      images: [{ url: fullImage, width: 1200, height: 630, alt: article.title }],
      publishedTime: article.createdAt ? new Date(article.createdAt).toISOString() : undefined,
      modifiedTime: article.updatedAt ? new Date(article.updatedAt).toISOString() : undefined,
      authors: article.authorId?.name ? [article.authorId.name] : undefined,
      tags: Array.isArray(article.tags) ? article.tags : undefined,
      section: 'اخبار',
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [fullImage],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const canPreview = await isPrivilegedViewer();
  const article = await fetchArticleBySlug(params.slug, {
    includeUnpublished: canPreview,
  });
  if (!article) {
    notFound();
  }

  // Permanent redirect when the requested slug isn't the canonical one.
  // This preserves SEO ranking after slug renames (Persian → Latin migration,
  // typo fixes, etc.) by 301-ing every previousSlugs hit to the live URL.
  // We compare both raw and decoded forms because Next forwards URL-encoded
  // params, while DB stores plain text.
  let decodedRequested = params.slug;
  try {
    decodedRequested = decodeURIComponent(params.slug);
  } catch {
    // ignore malformed URI — fall through with the raw value
  }
  if (
    article.slug &&
    article.slug !== params.slug &&
    article.slug !== decodedRequested
  ) {
    redirect(`/news/${article.slug}`);
  }

  const isPublished = article.status === 'published';
  const isPreview = !isPublished; // implies viewer is privileged (otherwise fetch returned null)

  // Only count views for the public, published version. Previews and bots do
  // not pollute the stats.
  const ua = headers().get('user-agent') || '';
  const isBot = /bot|crawler|spider|crawling|preview|facebookexternalhit|whatsapp|telegram|slack/i.test(ua);
  if (!isBot && isPublished) {
    incrementArticleViews(String(article._id));
  }

  const wordCount = (article.content || '').trim().split(/\s+/).length;
  const readMinutes = estimateReadMinutes(article.content || '');
  const tags = Array.isArray(article.tags) ? article.tags : [];

  const [relatedArticles, { prev, next }] = await Promise.all([
    fetchRelatedArticles(article.slug, tags),
    fetchPrevNextArticles(new Date(article.createdAt)),
  ]);

  const base = getAppUrl();
  const articleUrl = `${base}/news/${encodeURIComponent(article.slug)}`;
  const fullImage = article.coverImage
    ? (article.coverImage.startsWith('http') ? article.coverImage : `${base}${article.coverImage}`)
    : `${base}/og-default.png`;

  const articleLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: [fullImage],
    datePublished: new Date(article.createdAt).toISOString(),
    dateModified: new Date(article.updatedAt || article.createdAt).toISOString(),
    inLanguage: 'fa-IR',
    articleSection: tags[0] || 'اخبار',
    wordCount,
    keywords: tags.join(', ') || undefined,
    author: {
      '@type': 'Person',
      name: article.authorId?.name || 'تحریریه بازارینو',
      ...(article.authorId?._id ? { url: `${base}/news/author/${article.authorId._id}` } : {}),
    },
    publisher: {
      '@type': 'Organization',
      name: 'بازارینو',
      logo: { '@type': 'ImageObject', url: `${base}/logo-eu.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-speakable-summary]'],
    },
    ...(article.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: Number(article.ratingAvg || 0).toFixed(1),
            ratingCount: article.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(article.commentCount > 0 ? { commentCount: article.commentCount } : {}),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'خانه', item: base },
      { '@type': 'ListItem', position: 2, name: 'اخبار', item: `${base}/news` },
      ...(tags[0]
        ? [{
            '@type': 'ListItem',
            position: 3,
            name: tags[0],
            item: `${base}/news/tag/${encodeURIComponent(tags[0])}`,
          }]
        : []),
      {
        '@type': 'ListItem',
        position: tags[0] ? 4 : 3,
        name: article.title,
        item: articleUrl,
      },
    ],
  };

  return (
    <div className="relative min-h-screen bg-white">
      {/* Decorative backdrop */}
      <div className="absolute inset-x-0 top-0 h-[460px] bg-gradient-to-b from-orange-50/70 via-amber-50/30 to-transparent pointer-events-none" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-[460px] pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(249,115,22,0.18) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          maskImage: 'radial-gradient(ellipse at top, black 30%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(ellipse at top, black 30%, transparent 75%)',
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      {prev && (
        <link rel="prev" href={`${base}/news/${encodeURIComponent(prev.slug)}`} />
      )}
      {next && (
        <link rel="next" href={`${base}/news/${encodeURIComponent(next.slug)}`} />
      )}
      <Navbar />

      {isPreview && (
        <div className="sticky top-0 z-30 bg-amber-500 text-white shadow-md">
          <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2 font-bold">
              <EyeOff size={14} />
              <span>
                حالت پیش‌نمایش — وضعیت:{' '}
                <span className="underline">
                  {article.status === 'scheduled' ? 'زمان‌بندی شده' : 'پیش‌نویس'}
                </span>
              </span>
            </div>
            <span className="text-xs opacity-90 hidden sm:block">
              فقط ادمین‌ها/ویراستارها این صفحه رو می‌بینن. گوگل ایندکس نمی‌کنه.
            </span>
          </div>
        </div>
      )}

      <article className="relative max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <nav aria-label="breadcrumb" className="mb-3 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-brand-600">خانه</Link>
          <span>/</span>
          <Link href="/news" className="hover:text-brand-600">اخبار</Link>
          {tags[0] && (
            <>
              <span>/</span>
              <Link href={`/news/tag/${encodeURIComponent(tags[0])}`} className="hover:text-brand-600">
                {tags[0]}
              </Link>
            </>
          )}
        </nav>

        <header>
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {article.isHot && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-red-500 text-white">خبر داغ</span>
            )}
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={12} />
              <time dateTime={new Date(article.createdAt).toISOString()}>
                {toFaDigits(new Date(article.createdAt).toLocaleDateString('fa-IR'))}
              </time>
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} /> {toFaDigits(String(readMinutes))} دقیقه مطالعه
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-gray-500">
              <Eye size={12} /> {toFaDigits(String((article.views || 0) + 1))} بازدید
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight mb-4">
            {article.title}
          </h1>
          <p data-speakable-summary className="text-gray-600 text-base mb-6 leading-8">
            {article.excerpt}
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/news/tag/${encodeURIComponent(tag)}`}
                  rel="tag"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100 hover:bg-brand-100"
                >
                  <Tag size={11} />
                  {tag}
                </Link>
              ))}
            </div>
          )}
        </header>

        {article.coverImage && (
          <figure className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-gray-100 mb-8 bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt={article.title}
              loading="eager"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </figure>
        )}

        <ArticleBody content={article.content || ''} />

        {article.status === 'published' && (
          <ArticleRating
            slug={article.slug}
            initialAvg={article.ratingAvg || 0}
            initialCount={article.ratingCount || 0}
          />
        )}

        <ArticleShareSection
          title={article.title}
          excerpt={article.excerpt}
          url={articleUrl}
        />

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
          <Link href="/news" className="text-sm text-gray-600 hover:text-brand-600 inline-flex items-center gap-1">
            <ArrowRight size={14} /> بازگشت به اخبار
          </Link>
        </div>

        {/* Author bio card — links to full author page when available */}
        <address className="not-italic mt-8 rounded-3xl bg-gradient-to-l from-orange-50 to-amber-50/40 ring-1 ring-orange-100 p-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white ring-2 ring-white shadow-md flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.authorId?.avatar || '/default-avatar.svg'}
                alt={article.authorId?.name || 'author'}
                width={56}
                height={56}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                {article.authorId?._id ? (
                  <Link
                    href={`/news/author/${article.authorId._id}`}
                    className="text-base font-bold text-gray-900 hover:text-orange-600"
                    rel="author"
                  >
                    {article.authorId.name || 'نویسنده بازارینو'}
                  </Link>
                ) : (
                  <p className="text-base font-bold text-gray-900">نویسنده بازارینو</p>
                )}
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-gray-700 ring-1 ring-gray-200">
                  {article.authorId?.role === 'admin'
                    ? 'ادمین'
                    : article.authorId?.role === 'editor'
                      ? 'دبیر'
                      : 'نویسنده'}{' '}
                  بازارینو
                </span>
              </div>
              {article.authorId?.bio ? (
                <p className="mt-1.5 text-sm text-gray-700 leading-7 line-clamp-3">
                  {article.authorId.bio}
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-gray-500">
                  تحریریه بازارینو — راهنمای ایرانیان اروپا
                </p>
              )}
              {article.authorId?._id && (
                <Link
                  href={`/news/author/${article.authorId._id}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  همه مقاله‌های این نویسنده
                  <ArrowLeft size={12} />
                </Link>
              )}
            </div>
          </div>
        </address>

        {(prev || next) && (
          <nav className="mt-8 grid sm:grid-cols-2 gap-3" aria-label="ناوبری مقالات">
            {prev ? (
              <Link
                href={`/news/${encodeURIComponent(prev.slug)}`}
                rel="prev"
                className="group rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                  <ArrowRight size={12} /> مقاله قبلی
                </div>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-600">
                  {prev.title}
                </p>
              </Link>
            ) : <span />}
            {next ? (
              <Link
                href={`/news/${encodeURIComponent(next.slug)}`}
                rel="next"
                className="group rounded-2xl border border-gray-100 bg-white p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center justify-end gap-1 text-xs text-gray-400 mb-1">
                  مقاله بعدی <ArrowLeft size={12} />
                </div>
                <p className="text-sm font-semibold text-gray-800 line-clamp-2 group-hover:text-brand-600">
                  {next.title}
                </p>
              </Link>
            ) : <span />}
          </nav>
        )}

        {relatedArticles.length > 0 && (
          <section className="mt-10 border-t border-gray-100 pt-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">مطالب مرتبط</h2>
            <div className="grid md:grid-cols-3 gap-3">
              {relatedArticles.map((item: any) => (
                <Link
                  key={item._id}
                  href={`/news/${encodeURIComponent(item.slug)}`}
                  className="rounded-2xl border border-gray-100 p-3 bg-white hover:shadow-md transition-shadow"
                >
                  <p className="font-semibold text-sm text-gray-800 line-clamp-2 mb-1">{item.title}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {article.status === 'published' && (
          <ArticleComments
            slug={article.slug}
            initialCount={article.commentCount || 0}
          />
        )}
      </article>
      <Footer />
      <BottomNav />
    </div>
  );
}
