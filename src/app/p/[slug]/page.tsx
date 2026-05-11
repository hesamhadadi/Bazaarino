import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Home } from 'lucide-react';
import connectDB from '@/lib/mongodb';
import LandingPage, { type LandingPageDoc } from '@/models/LandingPage';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Footer from '@/components/layout/Footer';
import { renderSection } from '@/components/landing/sections';
import { getAppUrl } from '@/lib/app-url';
import { isLikelyBot, recordDailyView } from '@/lib/view-stats';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function fetchPage(slug: string): Promise<LandingPageDoc | null> {
  await connectDB();
  const page = await LandingPage.findOne({
    slug: slug.toLowerCase(),
    status: 'published',
  }).lean();
  return page as unknown as LandingPageDoc | null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) {
    return { title: 'صفحه پیدا نشد | بازارینو' };
  }
  const url = `${getAppUrl()}/p/${page.slug}`;
  const description =
    page.metaDescription ||
    `${page.title} در بازارینو — مارکت‌پلیس فارسی‌زبانان مقیم اروپا`;

  return {
    title: page.title,
    description,
    keywords: page.metaKeywords?.join(', '),
    alternates: {
      canonical: page.canonicalUrl || url,
    },
    robots: page.noindex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      type: 'website',
      url,
      title: page.title,
      description,
      siteName: 'بازارینو',
      locale: 'fa_IR',
      images: page.ogImage
        ? [
            {
              url: page.ogImage,
              alt: page.ogImageAlt || page.title,
              width: 1200,
              height: 630,
            },
          ]
        : [`${url}/opengraph-image`],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description,
      images: page.ogImage ? [page.ogImage] : [`${url}/opengraph-image`],
    },
  };
}

export default async function LandingPageView({ params }: PageProps) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();

  // Fire-and-forget view counter — never blocks the render path.
  const ua = headers().get('user-agent') || '';
  if (!isLikelyBot(ua)) {
    Promise.all([
      LandingPage.updateOne({ _id: page._id }, { $inc: { views: 1 } }),
      recordDailyView('landingPage', String(page._id)),
    ]).catch(() => {});
  }

  const baseUrl = getAppUrl();
  const pageUrl = `${baseUrl}/p/${page.slug}`;

  // -------------- JSON-LD: BreadcrumbList --------------
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'خانه',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.title,
        item: pageUrl,
      },
    ],
  };

  // -------------- JSON-LD: FAQPage (when FAQ exists) --------------
  const faqLd =
    page.faq && page.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: page.faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  // -------------- JSON-LD: Place / Webpage --------------
  const webpageLd = {
    '@context': 'https://schema.org',
    '@type': page.pageType === 'city' ? 'Place' : 'WebPage',
    name: page.title,
    url: pageUrl,
    description: page.metaDescription,
    inLanguage: 'fa-IR',
    isPartOf: {
      '@type': 'WebSite',
      name: 'بازارینو',
      url: baseUrl,
    },
  };

  // Merge FAQ items declared on the page-level into a synthetic faq
  // section if the admin didn't add one to the visual builder. This way
  // the FAQPage schema and the visible UI stay in sync.
  const faqSectionAlreadyVisible = page.sections.some((s) => s.type === 'faq');
  const sectionsToRender = [...page.sections];
  if (page.faq && page.faq.length > 0 && !faqSectionAlreadyVisible) {
    sectionsToRender.push({
      id: 'auto-faq',
      type: 'faq',
      data: { items: page.faq },
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-12">
        {/* Breadcrumb */}
        <nav
          aria-label="مسیر صفحه"
          className="flex items-center gap-1.5 text-xs text-gray-500 mb-4"
        >
          <Link
            href="/"
            className="inline-flex items-center gap-1 hover:text-orange-600"
          >
            <Home size={12} />
            بازارینو
          </Link>
          <ChevronLeft size={12} />
          <span className="text-gray-700 truncate max-w-[55ch]">{page.title}</span>
        </nav>

        <div className="space-y-6 md:space-y-8">
          {sectionsToRender.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center">
              <p className="text-gray-400 text-sm">این صفحه هنوز محتوایی ندارد.</p>
            </div>
          ) : (
            sectionsToRender.map(async (section) => (
              <div key={section.id}>{await renderSection(section)}</div>
            ))
          )}
        </div>
      </main>

      <Footer />
      <BottomNav />

      {/* Structured data — keeps Google delighted with rich snippets */}
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webpageLd) }}
      />
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />
      {faqLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
        />
      )}
    </div>
  );
}
