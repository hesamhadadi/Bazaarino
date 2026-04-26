import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import '@/models/User';
import ArticleEditor from '@/components/articles/ArticleEditor';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'ویرایش مقاله',
};

async function getArticle(slug: string) {
  try {
    await connectDB();
    const item = await Article.findOne({ slug: slug.toLowerCase().trim() }).lean();
    return item ? JSON.parse(JSON.stringify(item)) : null;
  } catch {
    return null;
  }
}

export default async function EditArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(decodeURIComponent(params.slug));
  if (!article) notFound();

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role === 'admin';

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition mb-2"
        >
          <ArrowRight size={12} /> بازگشت به لیست مقالات
        </Link>
        <h1 className="text-2xl font-black text-gray-900">ویرایش مقاله</h1>
        <p className="text-sm text-gray-500 mt-1 truncate">{article.title}</p>
      </div>

      <ArticleEditor
        initial={{
          slug: article.slug,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          tags: article.tags,
          isHot: article.isHot,
          status: article.status,
        }}
        redirectTo="/admin/articles"
        allowDelete={isAdmin}
      />
    </div>
  );
}
