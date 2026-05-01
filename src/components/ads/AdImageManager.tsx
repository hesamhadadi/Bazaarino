'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import {
  Upload,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  /** Current ordered image URLs (first = cover). */
  value: string[];
  /** Callback fired with the new ordered URL array. */
  onChange: (next: string[]) => void;
  /** Hard cap on number of images. Default 8. */
  max?: number;
}

/**
 * Reusable image manager for the ad create/edit forms.
 *
 * Features:
 *  - Drag-and-drop or click-to-upload
 *  - Live thumbnail grid with cover badge on the first slot
 *  - Per-thumbnail toolbar: set-as-cover, move left/right (RTL: previous/next),
 *    delete — visible always so the affordances are obvious
 *  - Counter chip (used / max), inline upload spinner, error toasts
 *  - Hard validation: only image/* mime types, max-size 8 MB per file,
 *    enforced cap so the API never has to reject an oversized payload
 */
export default function AdImageManager({ value, onChange, max = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, max - value.length);

  const upload = async (files: File[]) => {
    if (!files.length) return;

    // Pre-flight client-side validation prevents wasted upload bandwidth.
    const valid: File[] = [];
    for (const f of files) {
      if (!f.type.startsWith('image/')) {
        toast.error(`${f.name}: فقط فایل تصویری`);
        continue;
      }
      if (f.size > 8 * 1024 * 1024) {
        toast.error(`${f.name}: حجم بیشتر از ۸ مگابایت`);
        continue;
      }
      valid.push(f);
    }
    if (valid.length === 0) return;

    if (value.length + valid.length > max) {
      toast.error(`حداکثر ${max} تصویر مجاز است`);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      valid.forEach((f) => form.append('images', f));
      const res = await fetch('/api/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'خطا در آپلود');
      const next = [...value, ...(data.urls || [])].slice(0, max);
      onChange(next);
      toast.success(`${valid.length} تصویر اضافه شد`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'خطا در آپلود');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    upload(Array.from(e.target.files || []));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    upload(Array.from(e.dataTransfer.files || []));
  };

  const removeAt = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  const setCover = (i: number) => {
    if (i === 0) return;
    const copy = [...value];
    const [pic] = copy.splice(i, 1);
    copy.unshift(pic);
    onChange(copy);
  };

  /** Move helper. RTL display: "previous" goes to a smaller index visually. */
  const move = (i: number, delta: -1 | 1) => {
    const j = i + delta;
    if (j < 0 || j >= value.length) return;
    const copy = [...value];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  };

  return (
    <div className="space-y-3">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 rounded-full px-2.5 py-1">
            <ImagePlus size={12} />
            {value.length}/{max} تصویر
          </span>
          {value.length === 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
              <AlertCircle size={11} />
              حداقل یک تصویر اضافه کن
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-500 hidden sm:block">
          اولین تصویر، کاور آگهی است. می‌توانی ترتیب را عوض کنی.
        </p>
      </div>

      {/* Thumbnail grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {value.map((url, i) => {
            const isCover = i === 0;
            return (
              <div
                key={url + i}
                className={`group relative aspect-square rounded-2xl overflow-hidden border-2 transition ${
                  isCover
                    ? 'border-orange-400 ring-2 ring-orange-100 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Image
                  src={url}
                  alt={`تصویر ${i + 1}`}
                  fill
                  sizes="(max-width: 640px) 33vw, 20vw"
                  className="object-cover"
                />

                {/* Cover badge */}
                {isCover && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500 text-white text-[10px] font-black shadow">
                    <Star size={10} />
                    کاور
                  </span>
                )}

                {/* Position number */}
                <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/55 text-white text-[10px] font-black flex items-center justify-center backdrop-blur-sm">
                  {i + 1}
                </span>

                {/* Delete (always visible — primary destructive action) */}
                <button
                  type="button"
                  onClick={() => removeAt(i)}
                  aria-label="حذف تصویر"
                  className="absolute bottom-1.5 left-1.5 w-7 h-7 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-md flex items-center justify-center transition opacity-90 group-hover:opacity-100"
                >
                  <X size={12} />
                </button>

                {/* Toolbar: cover + reorder */}
                <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1">
                  {!isCover && (
                    <button
                      type="button"
                      onClick={() => setCover(i)}
                      aria-label="انتخاب به‌عنوان کاور"
                      title="انتخاب به‌عنوان کاور"
                      className="w-7 h-7 rounded-full bg-white/95 hover:bg-amber-50 text-amber-600 border border-amber-200 shadow flex items-center justify-center"
                    >
                      <Star size={12} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="جابه‌جایی به قبل"
                    title="قبلی"
                    className="w-7 h-7 rounded-full bg-white/95 hover:bg-gray-100 text-gray-700 shadow flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === value.length - 1}
                    aria-label="جابه‌جایی به بعد"
                    title="بعدی"
                    className="w-7 h-7 rounded-full bg-white/95 hover:bg-gray-100 text-gray-700 shadow flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft size={12} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Inline add slot */}
          {remaining > 0 && (
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="aspect-square rounded-2xl border-2 border-dashed border-gray-300 hover:border-orange-400 hover:bg-orange-50/40 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-orange-600 transition disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 size={20} className="animate-spin text-orange-500" />
              ) : (
                <>
                  <ImagePlus size={20} />
                  <span className="text-[10px] font-bold">افزودن</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Empty / drop-zone state — bigger when there are no images yet */}
      {value.length === 0 && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={`w-full rounded-3xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-2 transition ${
            dragOver
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/40'
          } disabled:opacity-60`}
        >
          {uploading ? (
            <Loader2 size={32} className="animate-spin text-orange-500" />
          ) : (
            <>
              <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md">
                <Upload size={20} />
              </span>
              <p className="text-sm font-bold text-gray-800">
                تصویر آپلود کن
              </p>
              <p className="text-[11px] text-gray-500">
                کلیک کن یا تصویر را بکش و اینجا رها کن — حداکثر {max} تصویر،
                هر کدام تا ۸ مگابایت
              </p>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
        disabled={uploading}
      />
    </div>
  );
}
