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
import UserBadges from '@/components/ui/UserBadges';
import { toFaDigits } from '@/lib/locale';
import { getAppUrl } from '@/lib/app-url';
import {
  Calendar,
  ArrowRight,
  Eye,
  FileText,
  Instagram,
  Twitter,
  Linkedin,
  Github,
  Youtube,
  Globe,
  Facebook,
  Send,
  ShieldCheck,
  PenLine,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

type SocialLinks = {
  instagram?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  youtube?: string;
  website?: string;
  facebook?: string;
};

async function getAuthor(id: string) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  try {
    await connectDB();
    const author: any = await User.findById(id)
      .select('name avatar role bio banner telegram socialLinks city createdAt badges')
      .lean();
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

async function getAuthorStats(id: string) {
  try {
    await connectDB();
    const result = await Article.aggregate([
      { $match: { status: 'published', authorId: new mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: null,
          articleCount: { $sum: 1 },
          totalViews: { $sum: { $ifNull: ['$views', 0] } },
        },
      },
    ]);
    return result[0] || { articleCount: 0, totalViews: 0 };
  } catch {
    return { articleCount: 0, totalViews: 0 };
  }
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const author = await getAuthor(params.id);
  if (!author) return { title: 'نویسنده یافت نشد', robots: { index: false, follow: true } };
  const desc =
    author.bio?.slice(0, 160) ||
    `مقالات و خبرهای منتشرشده توسط ${author.name} در بازارینو.`;
  return {
    title: `${author.name} | نویسنده بازارینو`,
    description: desc,
    alternates: { canonical: `/news/author/${params.id}` },
    openGraph: {
      title: `${author.name} | نویسنده بازارینو`,
      description: desc,
      type: 'profile',
      images: author.avatar ? [author.avatar] : undefined,
    },
  };
}

/* ───────── Helpers ───────── */

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  admin: { label: 'ادمین بازارینو', cls: 'bg-red-50 text-red-700 border-red-200' },
  editor: { label: 'دبیر تحریریه', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  user: { label: 'نویسنده مهمان', cls: 'bg-gray-50 text-gray-700 border-gray-200' },
};

/**
 * Normalize a social value (handle URL or just a handle) into a usable href.
 * The user can paste either a full URL or just an @handle / username.
 */
function socialHref(network: keyof SocialLinks, value?: string): string | null {
  if (!value) return null;
  const v = value.trim();
  if (!v) return null;
  if (v.startsWith('http://') || v.startsWith('https://')) return v;
  // strip leading @
  const handle = v.startsWith('@') ? v.slice(1) : v;
  switch (network) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'twitter':
      return `https://twitter.com/${handle}`;
    case 'linkedin':
      return `https://linkedin.com/in/${handle}`;
    case 'github':
      return `https://github.com/${handle}`;
    case 'youtube':
      // could be a channel id or a handle starting with @
      return v.startsWith('@')
        ? `https://youtube.com/${v}`
        : `https://youtube.com/@${handle}`;
    case 'facebook':
      return `https://facebook.com/${handle}`;
    case 'website':
      return `https://${handle}`;
    default:
      return null;
  }
}

const SOCIAL_NETWORKS: Array<{
  key: keyof SocialLinks;
  Icon: any;
  label: string;
  cls: string;
}> = [
  { key: 'instagram', Icon: Instagram, label: 'Instagram', cls: 'text-pink-500 hover:bg-pink-50' },
  { key: 'twitter', Icon: Twitter, label: 'Twitter / X', cls: 'text-sky-500 hover:bg-sky-50' },
  { key: 'linkedin', Icon: Linkedin, label: 'LinkedIn', cls: 'text-blue-700 hover:bg-blue-50' },
  { key: 'github', Icon: Github, label: 'GitHub', cls: 'text-gray-800 hover:bg-gray-100' },
  { key: 'youtube', Icon: Youtube, label: 'YouTube', cls: 'text-red-600 hover:bg-red-50' },
  { key: 'facebook', Icon: Facebook, label: 'Facebook', cls: 'text-blue-600 hover:bg-blue-50' },
  { key: 'website', Icon: Globe, label: 'وب‌سایت', cls: 'text-emerald-600 hover:bg-emerald-50' },
];

/* ───────── Page ───────── */

export default async function AuthorPage({ params }: { params: { id: string } }) {
  const author = await getAuthor(params.id);
  if (!author) notFound();
  const [articles, stats] = await Promise.all([
    getAuthorArticles(params.id),
    getAuthorStats(params.id),
  ]);
  const socialLinks: SocialLinks = author.socialLinks || {};
  const hasSocial =
    Object.values(socialLinks).some((v) => typeof v === 'string' && v.trim()) ||
    Boolean(author.telegram);

  const role = ROLE_BADGE[author.role] || ROLE_BADGE.user;

  const base = getAppUrl();
  const personLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: author.name,
    image: author.avatar || undefined,
    description: author.bio || `نویسنده در بازارینو`,
    url: `${base}/news/author/${params.id}`,
    sameAs: [
      socialHref('twitter', socialLinks.twitter),
      socialHref('linkedin', socialLinks.linkedin),
      socialHref('instagram', socialLinks.instagram),
      socialHref('github', socialLinks.github),
      socialHref('youtube', socialLinks.youtube),
      socialHref('facebook', socialLinks.facebook),
      socialHref('website', socialLinks.website),
    ].filter(Boolean),
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

      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-10">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-brand-600">خانه</Link>
          <span>/</span>
          <Link href="/news" className="hover:text-brand-600">اخبار</Link>
          <span>/</span>
          <span className="text-gray-700 truncate max-w-[40ch]">{author.name}</span>
        </nav>

        {/* Hero card with banner + avatar overlap. The banner uses a "blurred
            fill" technique (à la Spotify / Apple Music): the source image
            is rendered twice — once as a heavy-blur background that always
            fills the box edge-to-edge, and once on top with object-contain
            so the entire image is visible without any cropping. This works
            beautifully with any aspect ratio (portrait, landscape, square)
            and keeps a consistent box height across the site. */}
        <header className="relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="relative w-full h-44 md:h-64 overflow-hidden bg-gradient-to-br from-orange-400 via-amber-400 to-rose-400">
            {author.banner ? (
              <>
                {/* Blurred fill — covers the whole strip even if source is portrait */}
                <div
                  aria-hidden
                  className="absolute inset-0 scale-110"
                  style={{
                    backgroundImage: `url(${author.banner})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(28px) saturate(1.1)',
                  }}
                />
                {/* Subtle darkening so foreground image pops */}
                <div className="absolute inset-0 bg-black/20" />
                {/* Foreground image — entire photo always visible */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={author.banner}
                  alt=""
                  className="relative z-10 h-full w-full object-contain"
                  loading="eager"
                />
              </>
            ) : (
              // Decorative dot pattern when no custom banner
              <div
                aria-hidden
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)',
                  backgroundSize: '20px 20px',
                }}
              />
            )}
            {/* Bottom fade for legibility regardless of cover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent z-20 pointer-events-none" />
          </div>

          {/* Avatar overlaps the cover; ALL text sits below the cover so it's
              never rendered on top of a busy banner image. z-30 keeps the
              avatar above the banner's bottom-fade overlay. */}
          <div className="px-5 md:px-7 pb-5 md:pb-6">
            <div className="-mt-14 md:-mt-20 mb-3 flex relative z-30">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden bg-white ring-4 ring-white shadow-lg flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={author.avatar || '/default-avatar.svg'}
                  alt={author.name}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-3xl font-black text-gray-900 leading-tight">
                  {author.name}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] md:text-[11px] font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border ${role.cls}`}
                >
                  <ShieldCheck size={11} />
                  {role.label}
                </span>
                {author.badges && author.badges.length > 0 && (
                  <UserBadges badges={author.badges} size="md" />
                )}
              </div>
              {author.city && (
                <p className="text-xs text-gray-500 mt-1">📍 {author.city}</p>
              )}
            </div>

            {/* Bio */}
            {author.bio ? (
              <p className="mt-4 text-sm md:text-base text-gray-700 leading-7 whitespace-pre-line">
                {author.bio}
              </p>
            ) : (
              <p className="mt-4 text-sm text-gray-400 italic">
                این نویسنده هنوز بیویی ننوشته.
              </p>
            )}

            {/* Stats row */}
            <div className="mt-5 grid grid-cols-2 gap-3 md:flex md:items-center md:gap-2">
              <StatPill
                Icon={FileText}
                label="مقاله"
                value={toFaDigits(String(stats.articleCount))}
                color="text-orange-600 bg-orange-50 border-orange-100"
              />
              <StatPill
                Icon={Eye}
                label="بازدید"
                value={toFaDigits(formatCompact(stats.totalViews))}
                color="text-emerald-700 bg-emerald-50 border-emerald-100"
              />
            </div>

            {/* Social row */}
            {hasSocial && (
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2.5">
                  دنبال‌کن
                </p>
                <div className="flex flex-wrap gap-2">
                  {author.telegram && (
                    <SocialLink
                      href={`https://t.me/${author.telegram.replace(/^@/, '')}`}
                      Icon={Send}
                      label="Telegram"
                      cls="text-sky-500 hover:bg-sky-50"
                    />
                  )}
                  {SOCIAL_NETWORKS.map(({ key, Icon, label, cls }) => {
                    const href = socialHref(key, socialLinks[key]);
                    if (!href) return null;
                    return (
                      <SocialLink
                        key={key}
                        href={href}
                        Icon={Icon}
                        label={label}
                        cls={cls}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Articles section */}
        <section className="mt-8">
          <div className="flex items-end justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-black text-gray-900 inline-flex items-center gap-2">
              <PenLine size={18} className="text-orange-500" />
              مقاله‌های {author.name}
            </h2>
            <span className="text-xs text-gray-500">
              {toFaDigits(String(articles.length))} مقاله
            </span>
          </div>

          {articles.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-gray-500 text-sm">
                هنوز مقاله‌ای از این نویسنده منتشر نشده است.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {articles.map((a: any) => (
                <Link
                  key={a._id}
                  href={`/news/${encodeURIComponent(a.slug)}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 hover:border-orange-200 transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-[16/9] bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
                    {a.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.coverImage}
                        alt={a.title}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-orange-300">
                        <FileText size={36} />
                      </div>
                    )}
                    {a.isHot && (
                      <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        🔥 داغ
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-2 text-[11px] text-gray-400">
                      <Calendar size={11} />
                      <time dateTime={new Date(a.createdAt).toISOString()}>
                        {toFaDigits(new Date(a.createdAt).toLocaleDateString('fa-IR'))}
                      </time>
                      {(a.views || 0) > 0 && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Eye size={10} />
                            {toFaDigits(String(a.views))}
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-orange-600 transition mb-2 line-clamp-2 leading-6">
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 leading-5">{a.excerpt}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="mt-10 text-center">
          <Link
            href="/news"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 hover:underline"
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

/* ───────── Inline UI bits ───────── */

function StatPill({
  Icon,
  label,
  value,
  color,
}: {
  Icon: any;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border ${color} text-sm`}
    >
      <Icon size={15} />
      <span className="font-bold">{value}</span>
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

function SocialLink({
  href,
  Icon,
  label,
  cls,
}: {
  href: string;
  Icon: any;
  label: string;
  cls: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer me"
      title={label}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs font-semibold transition ${cls}`}
    >
      <Icon size={14} />
      {label}
    </a>
  );
}

/** Compact integer like 12.4k / 3.1M for big view counts. */
function formatCompact(n: number): string {
  if (!n || n < 1000) return String(n || 0);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0)}M`;
}
