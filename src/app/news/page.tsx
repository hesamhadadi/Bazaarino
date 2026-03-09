import Link from 'next/link';
import Image from 'next/image';
import connectDB from '@/lib/mongodb';
import Article from '@/models/Article';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { toFaDigits } from '@/lib/locale';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'اخبار و مقالات | بازارینو',
  description: 'آخرین اخبار و مقالات بازارینو برای ایرانیان ایتالیا',
};

async function getArticles() {
  await connectDB();
  const items = await Article.find({ status: 'published' })
    .populate('authorId', 'name avatar role')
    .sort({ isHot: -1, createdAt: -1 })
    .limit(20)
    .lean();
  return JSON.parse(JSON.stringify(items));
}

export default async function NewsPage() {
  const articles = await getArticles();
  const session = await getServerSession(authOptions);
  const canPublish = session?.user?.role === 'admin' || session?.user?.role === 'editor';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-2xl font-bold text-gray-800">اخبار و مقالات</h1>
          {canPublish && (
            <Link href="/news/new" className="text-sm text-brand-600">انتشار مقاله</Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4 items-stretch auto-rows-fr">
          {articles.map((a: any) => (
            <Link key={a._id} href={`/news/${a.slug}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              {a.coverImage && (
                <div className="relative aspect-[16/9]">
                  <Image src={a.coverImage} alt={a.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  {a.isHot && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">داغ</span>}
                  <span className="text-[11px] text-gray-400">{toFaDigits(new Date(a.createdAt).toLocaleDateString('fa-IR'))}</span>
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{a.title}</h2>
                <p className="text-sm text-gray-600 line-clamp-3">{a.excerpt}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100">
                    <Image src={a.authorId?.avatar || '/default-avatar.svg'} alt={a.authorId?.name || 'author'} width={24} height={24} className="w-full h-full object-cover" />
                  </div>
                  <span>{a.authorId?.name || 'نویسنده بازارینو'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
