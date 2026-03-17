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

const estimateReadMinutes = (text: string) => Math.max(1, Math.ceil(text.trim().split(/\s+/).length / 220));

async function getArticles(q?: string, tag?: string) {
  try {
    await connectDB();
    const query: any = { status: 'published' };
    if (q?.trim()) {
      query.$or = [
        { title: { $regex: q.trim(), $options: 'i' } },
        { excerpt: { $regex: q.trim(), $options: 'i' } },
        { content: { $regex: q.trim(), $options: 'i' } },
      ];
    }
    if (tag?.trim()) {
      query.tags = tag.trim();
    }
    const items = await Article.find(query)
      .populate('authorId', 'name avatar role')
      .sort({ isHot: -1, createdAt: -1 })
      .limit(30)
      .lean();
    return JSON.parse(JSON.stringify(items));
  } catch {
    return [];
  }
}

export default async function NewsPage({ searchParams }: { searchParams?: { q?: string; tag?: string } }) {
  const currentQuery = searchParams?.q || '';
  const currentTag = searchParams?.tag || '';
  const articles = await getArticles(currentQuery, currentTag);
  const session = await getServerSession(authOptions);
  const canPublish = session?.user?.role === 'admin' || session?.user?.role === 'editor';

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-gray-50 to-gray-100">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="rounded-3xl border border-orange-100 bg-white/80 backdrop-blur-sm p-4 md:p-6 mb-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h1 className="text-2xl font-black text-gray-800">اخبار و مقالات بازارینو</h1>
              <p className="text-sm text-gray-500 mt-1">به‌روزترین خبرها، آموزش‌ها و تحلیل بازار ایران و ایتالیا</p>
            </div>
            <span className="hidden md:inline-flex text-xs px-3 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-100">تعداد مقالات: {toFaDigits(String(articles.length))}</span>
          </div>
          <form className="grid md:grid-cols-[1fr_auto] gap-2 mb-2" action="/news" method="get">
            <input
              name="q"
              defaultValue={currentQuery}
              placeholder="جستجو در عنوان یا متن مقاله..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <button className="bg-brand-500 hover:bg-brand-600 text-white rounded-xl px-4 py-2 text-sm font-semibold transition-colors" type="submit">جستجو</button>
          </form>
          {(currentQuery || currentTag) && (
            <div className="text-xs text-gray-500">
              {currentQuery && <span className="ml-3">نتایج برای: <b className="text-gray-700">{currentQuery}</b></span>}
              {currentTag && <span>برچسب: <b className="text-gray-700">{currentTag}</b></span>}
            </div>
          )}
          {canPublish && (
            <Link href="/news/new" className="inline-flex mt-3 text-sm text-brand-600 font-semibold">+ انتشار مقاله</Link>
          )}
        </div>

        {articles.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-500">مقاله‌ای برای نمایش یافت نشد.</div>
        )}

        <div className="grid md:grid-cols-2 gap-4 items-stretch auto-rows-fr">
          {articles.map((a: any) => (
            <Link key={a._id} href={`/news/${a.slug}`} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all flex flex-col">
              {a.coverImage && (
                <div className="relative aspect-[16/9]">
                  <Image src={a.coverImage} alt={a.title} fill className="object-cover" />
                </div>
              )}
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {a.isHot && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500 text-white">داغ</span>}
                  <span className="text-[11px] text-gray-400">{toFaDigits(new Date(a.createdAt).toLocaleDateString('fa-IR'))}</span>
                  <span className="text-[11px] text-gray-400">• {toFaDigits(String(estimateReadMinutes(a.content || '')))} دقیقه مطالعه</span>
                </div>
                <h2 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">{a.title}</h2>
                <p className="text-sm text-gray-600 line-clamp-3">{a.excerpt}</p>
                {Array.isArray(a.tags) && a.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.tags.slice(0, 3).map((tag: string) => (
                      <span key={`${a._id}-${tag}`} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">#{tag}</span>
                    ))}
                  </div>
                )}
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
