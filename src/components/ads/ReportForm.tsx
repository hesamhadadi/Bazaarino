'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, SendHorizonal, X } from 'lucide-react';

export default function ReportForm({ adId }: { adId: string }) {
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const uploadImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append('images', file));

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.urls?.length) {
        setImages((prev) => [...prev, ...data.urls]);
        toast.success('تصاویر اضافه شد');
      } else {
        toast.error(data.message || 'خطا در آپلود');
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    if (!message.trim()) {
      toast.error('متن گزارش را وارد کنید');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, message, images }),
      });
      if (res.ok) {
        toast.success('گزارش ثبت شد');
        setMessage('');
        setImages([]);
      } else {
        const data = await res.json();
        toast.error(data.message || 'خطا در ثبت گزارش');
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100">
      <h3 className="font-semibold text-gray-800 mb-2">گزارش کلاه‌برداری</h3>
      <p className="text-xs text-gray-500 mb-3">اگر مشکلی در این آگهی می‌بینید، گزارش بدهید.</p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="توضیحات گزارش..."
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm h-24"
      />
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((url) => (
            <div key={url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="report" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((i) => i !== url))}
                className="absolute top-1 right-1 bg-white/80 rounded-full p-1"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <ImagePlus size={16} />
          افزودن تصویر
          <input type="file" multiple className="hidden" onChange={(e) => uploadImages(e.target.files)} />
        </label>
        <button
          onClick={submit}
          disabled={submitting || uploading}
          className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm"
        >
          <SendHorizonal size={14} />
          ارسال گزارش
        </button>
      </div>
    </div>
  );
}
