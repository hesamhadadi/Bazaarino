import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ArticleEditor from '@/components/articles/ArticleEditor';

export const metadata = {
  title: 'انتشار مقاله جدید',
};

export default function NewArticlePage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/articles"
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition mb-2"
        >
          <ArrowRight size={12} /> بازگشت به لیست مقالات
        </Link>
        <h1 className="text-2xl font-black text-gray-900">مقاله جدید</h1>
        <p className="text-sm text-gray-500 mt-1">
          عنوان، خلاصه و متن کامل رو پر کن، یه تصویر کاور آپلود کن و منتشر یا ذخیره کن.
        </p>
      </div>

      <ArticleEditor redirectTo="/admin/articles" />
    </div>
  );
}
