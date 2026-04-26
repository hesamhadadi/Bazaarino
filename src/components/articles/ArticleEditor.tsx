'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ImagePlus,
  Loader2,
  Save,
  Trash2,
  Tag as TagIcon,
  Sparkles,
  Eye,
  X,
} from 'lucide-react';
import SmartSelect from '@/components/ui/SmartSelect';
import Switch from '@/components/ui/Switch';

export type ArticleEditorInitial = {
  slug?: string; // present in edit mode
  title?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  tags?: string[];
  isHot?: boolean;
  status?: 'draft' | 'published';
};

type Props = {
  initial?: ArticleEditorInitial;
  /** Where to redirect after successful create/update. Defaults to /admin/articles. */
  redirectTo?: string;
  /** Allow deleting the article (only in edit mode + admin). */
  allowDelete?: boolean;
};

const STATUS_OPTIONS = [
  { value: 'published', label: 'منتشر شده' },
  { value: 'draft', label: 'پیش‌نویس' },
];

const estimateReadMinutes = (text: string) =>
  Math.max(1, Math.ceil((text || '').trim().split(/\s+/).filter(Boolean).length / 220));

export default function ArticleEditor({
  initial,
  redirectTo = '/admin/articles',
  allowDelete,
}: Props) {
  const router = useRouter();
  const isEdit = Boolean(initial?.slug);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title || '');
  const [excerpt, setExcerpt] = useState(initial?.excerpt || '');
  const [content, setContent] = useState(initial?.content || '');
  const [coverImage, setCoverImage] = useState(initial?.coverImage || '');
  const [tags, setTags] = useState((initial?.tags || []).join(', '));
  const [isHot, setIsHot] = useState(Boolean(initial?.isHot));
  const [status, setStatus] = useState<'draft' | 'published'>(initial?.status || 'published');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('حجم تصویر نباید بیشتر از ۵ مگابایت باشد');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append('images', file);
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'خطا در آپلود');
      const url = data.urls?.[0];
      if (url) {
        setCoverImage(url);
        toast.success('تصویر آپلود شد');
      }
    } catch (err: any) {
      toast.error(err.message || 'خطا در آپلود تصویر');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!title.trim() || !excerpt.trim() || !content.trim()) {
      toast.error('عنوان، خلاصه و متن الزامی است');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        coverImage: coverImage.trim() || null,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        isHot,
        status,
      };
      const url = isEdit ? `/api/articles/${initial!.slug}` : '/api/articles';
      const method = isEdit ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'خطا در ذخیره');
        return;
      }
      toast.success(isEdit ? 'مقاله ذخیره شد' : 'مقاله منتشر شد');
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;
    if (!confirm('این مقاله حذف بشه؟ این عمل قابل بازگشت نیست.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/articles/${initial!.slug}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'خطا در حذف');
        return;
      }
      toast.success('مقاله حذف شد');
      router.push(redirectTo);
      router.refresh();
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setDeleting(false);
    }
  };

  const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* MAIN COLUMN */}
      <div className="space-y-5">
        {/* Cover image */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {coverImage ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={coverImage}
                alt="cover"
                className="w-full aspect-[16/7] object-cover"
              />
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 rounded-lg bg-white/90 backdrop-blur px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-white shadow"
                >
                  <ImagePlus size={13} /> تغییر تصویر
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage('')}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-500/95 hover:bg-red-600 backdrop-blur px-3 py-1.5 text-xs font-semibold text-white shadow"
                >
                  <X size={13} /> حذف
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full aspect-[16/7] flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-orange-50/60 via-amber-50/40 to-white border-b border-gray-100 hover:bg-gray-50 transition disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={28} className="text-gray-400 animate-spin" />
              ) : (
                <>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600">
                    <ImagePlus size={20} />
                  </span>
                  <p className="text-sm font-semibold text-gray-700">افزودن تصویر کاور</p>
                  <p className="text-[11px] text-gray-500">PNG / JPG / WebP — حداکثر ۵ مگابایت</p>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = '';
            }}
          />
          <div className="px-4 py-3 border-t border-gray-100">
            <label className="block text-[11px] font-semibold text-gray-500 mb-1">یا لینک مستقیم تصویر</label>
            <input
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://..."
              dir="ltr"
              className="w-full bg-gray-50 hover:bg-white focus:bg-white focus:border-gray-400 border border-gray-200 rounded-xl px-3 py-2 text-xs text-right outline-none transition"
            />
          </div>
        </div>

        {/* Title + excerpt */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">عنوان مقاله</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="یه عنوان جذاب بنویس..."
              className="w-full text-2xl font-black text-gray-900 bg-transparent border-0 outline-none placeholder:text-gray-300 focus:placeholder:text-gray-400"
            />
          </div>
          <div className="border-t border-gray-100 pt-4">
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">خلاصه (Excerpt)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={320}
              placeholder="در یک یا دو جمله موضوع مقاله رو معرفی کن..."
              className="w-full text-sm text-gray-800 leading-7 border border-gray-200 rounded-xl px-3 py-2.5 h-24 resize-none bg-gray-50 hover:bg-white focus:bg-white focus:border-gray-400 outline-none transition"
            />
            <div className="text-[10px] text-gray-400 text-left mt-1">
              {excerpt.length} / 320
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[11px] font-semibold text-gray-500">متن کامل مقاله</label>
            <span className="text-[10px] text-gray-400">
              {estimateReadMinutes(content)} دقیقه مطالعه
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="هر پاراگراف رو با خط جدید جدا کن..."
            className="w-full text-sm text-gray-800 leading-8 border border-gray-200 rounded-xl px-4 py-3 min-h-[420px] bg-gray-50 hover:bg-white focus:bg-white focus:border-gray-400 outline-none transition font-vazir resize-y"
          />
        </div>
      </div>

      {/* SIDEBAR */}
      <aside className="space-y-4">
        {/* Action card */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 space-y-3 lg:sticky lg:top-20">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <Sparkles size={14} className="text-orange-500" />
            انتشار
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">وضعیت</label>
            <SmartSelect
              value={status}
              onChange={(v) => setStatus(v as 'draft' | 'published')}
              options={STATUS_OPTIONS}
              placeholder="انتخاب وضعیت"
              clearable={false}
            />
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
            <Switch
              checked={isHot}
              onChange={setIsHot}
              label={
                <span className="inline-flex items-center gap-1">
                  🔥 خبر داغ
                </span>
              }
              hint="در صفحه اول و بالای لیست برجسته می‌شود"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="col-span-2 inline-flex items-center justify-center gap-2 h-11 rounded-xl bg-gradient-to-l from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-sm font-bold shadow-md shadow-orange-500/20 disabled:opacity-60 transition"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {isEdit ? 'ذخیره تغییرات' : 'انتشار مقاله'}
            </button>

            {isEdit && initial?.slug && (
              <a
                href={`/news/${encodeURIComponent(initial.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-700 transition"
              >
                <Eye size={13} /> پیش‌نمایش
              </a>
            )}

            {isEdit && allowDelete && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-1.5 h-10 rounded-xl border border-red-200 hover:bg-red-50 text-xs font-semibold text-red-600 transition disabled:opacity-60"
              >
                {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                حذف
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
            <TagIcon size={14} className="text-orange-500" />
            برچسب‌ها
          </div>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="مهاجرت, ایتالیا, اقامت"
            className="w-full bg-gray-50 hover:bg-white focus:bg-white focus:border-gray-400 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none transition"
          />
          <p className="text-[10px] text-gray-400">با کاما جدا کن</p>
          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tagList.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-100"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
