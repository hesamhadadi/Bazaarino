import Image from 'next/image';
import Link from 'next/link';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { toFaDigits } from '@/lib/locale';

export const dynamic = 'force-dynamic';

async function getArticle(slug: string) {
  await connectDB();
  const item = await Article.findOne({ slug, status: 'published' })
    .populate('authorId', 'name avatar role')
    .lean();
  if (!item) return null;
  return JSON.parse(JSON.stringify(item));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) {
    return { title: 'خبر یافت نشد | بازارینو' };
  }

  return {
    title: `${article.title} | بازارینو`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-10">
          <h1 className="text-2xl font-bold text-gray-800">خبر یافت نشد</h1>
          <Link href="/news" className="text-brand-600 text-sm">بازگشت به اخبار</Link>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <article className="max-w-3xl mx-auto px-4 py-8 pb-24 md:pb-10">
        <div className="flex items-center gap-2 mb-3">
          {article.isHot && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-red-500 text-white">خبر داغ</span>
          )}
          <span className="text-xs text-gray-400">{toFaDigits(new Date(article.createdAt).toLocaleDateString('fa-IR'))}</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 leading-tight mb-4">{article.title}</h1>
        <p className="text-gray-600 text-sm mb-6">{article.excerpt}</p>

        {article.coverImage && (
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden border border-gray-100 mb-6">
            <Image src={article.coverImage} alt={article.title} fill className="object-cover" />
          </div>
        )}

        <div className="prose prose-sm max-w-none text-gray-800 leading-8">
          {article.content.split('\n').filter(Boolean).map((p: string, idx: number) => (
            <p key={idx}>{p}</p>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-100 pt-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
            <Image src={article.authorId?.avatar || '/default-avatar.svg'} alt={article.authorId?.name || 'author'} width={48} height={48} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{article.authorId?.name || 'نویسنده بازارینو'}</p>
            <p className="text-xs text-gray-500">تحریریه بازارینو</p>
          </div>
        </div>
      </article>
      <BottomNav />
    </div>
  );
}
