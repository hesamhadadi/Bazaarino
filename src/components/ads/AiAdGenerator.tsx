'use client';

import { useState } from 'react';
import { Sparkles, Loader2, X, Check, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  /** Current form values used as context for the AI. */
  context: {
    category?: string;
    subcategory?: string;
    city?: string;
    listingMode?: 'offer' | 'request';
    priceType?: string;
    imageUrls?: string[];
  };
  /** Called when the user accepts a generated suggestion. */
  onAccept: (result: {
    title: string;
    description: string;
    suggestedPrice?: number | null;
  }) => void;
  /** Disable the button while another async op is in flight. */
  disabled?: boolean;
}

interface AiResult {
  title: string;
  description: string;
  suggestedPrice?: number | null;
  tags?: string[];
  imagesUsed?: number;
}

/**
 * Floating "Generate with AI" button + preview modal. Sits next to the
 * title field and lets the user describe their item with a free-form
 * hint, then turns the uploaded photos + category into a polished
 * Persian title and description via Gemini.
 *
 * The generated text is *never* applied automatically — the user has to
 * accept it explicitly so they always feel in control.
 */
export default function AiAdGenerator({ context, onAccept, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [hints, setHints] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiResult | null>(null);

  const canGenerate =
    Boolean(context.category) &&
    Boolean(context.subcategory) &&
    Boolean(context.city);

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error('اول دسته‌بندی، زیر دسته و شهر را انتخاب کن.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/ai/generate-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...context, hints: hints.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'failed');
      setResult(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'خطا در تولید با هوش مصنوعی';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (!result) return;
    onAccept({
      title: result.title,
      description: result.description,
      suggestedPrice: result.suggestedPrice ?? null,
    });
    toast.success('متن آگهی جایگزین شد');
    setOpen(false);
    setResult(null);
    setHints('');
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-lg hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
        title="ساخت خودکار عنوان و توضیحات با هوش مصنوعی"
      >
        <Sparkles size={14} className="animate-pulse" />
        ساخت با هوش مصنوعی
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !loading) setOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 size={20} />
                <h3 className="font-bold text-lg">ساخت آگهی با هوش مصنوعی</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                disabled={loading}
                className="p-1 hover:bg-white/20 rounded-lg transition disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 overflow-y-auto">
              {!result && (
                <>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    بازارینو با کمک{' '}
                    <span className="font-bold text-purple-600">Gemini</span> از
                    عکس‌ها و اطلاعات شما یک عنوان و توضیحات حرفه‌ای می‌سازد.
                  </p>

                  {/* Context summary */}
                  <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-700 mb-4 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold">دسته:</span>
                      <span>{context.category || '—'}</span>
                      {context.subcategory && (
                        <>
                          <span className="text-gray-300">/</span>
                          <span>{context.subcategory}</span>
                        </>
                      )}
                    </div>
                    <div>
                      <span className="font-semibold">شهر:</span>{' '}
                      <span>{context.city || '—'}</span>
                    </div>
                    <div>
                      <span className="font-semibold">عکس‌ها:</span>{' '}
                      <span>
                        {(context.imageUrls?.length || 0) > 0
                          ? `${context.imageUrls!.length} عکس آپلود شده`
                          : 'بدون عکس (نتیجه ضعیف‌تر می‌شود)'}
                      </span>
                    </div>
                  </div>

                  {!canGenerate && (
                    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
                      ⚠️ لطفاً اول <b>دسته‌بندی</b>، <b>زیر دسته</b> و{' '}
                      <b>شهر</b> را پر کن.
                    </div>
                  )}

                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    یادداشت اختیاری (مدل، برند، وضعیت، ویژگی خاص...)
                  </label>
                  <textarea
                    value={hints}
                    onChange={(e) => setHints(e.target.value)}
                    placeholder="مثال: آیفون ۱۳ پرو ۲۵۶ گیگ، سفید، باطری ۹۸٪، با گارانتی"
                    maxLength={400}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:border-purple-400 focus:ring-1 focus:ring-purple-200 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 text-left">
                    {hints.length}/400
                  </p>

                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={loading || !canGenerate}
                    className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-indigo-500 text-white font-bold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        در حال ساخت... (۵-۱۵ ثانیه)
                      </>
                    ) : (
                      <>
                        <Sparkles size={18} />
                        بساز
                      </>
                    )}
                  </button>
                </>
              )}

              {result && (
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      عنوان پیشنهادی
                    </label>
                    <p className="mt-1 text-base font-bold text-gray-900 bg-purple-50 border border-purple-100 rounded-xl p-3 leading-relaxed">
                      {result.title}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                      توضیحات پیشنهادی
                    </label>
                    <p className="mt-1 text-sm text-gray-800 bg-purple-50/50 border border-purple-100 rounded-xl p-3 whitespace-pre-line leading-7 max-h-64 overflow-y-auto">
                      {result.description}
                    </p>
                  </div>

                  {result.suggestedPrice ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
                      <span className="font-bold text-emerald-700">
                        💰 قیمت پیشنهادی:
                      </span>{' '}
                      <span className="font-bold text-emerald-900">
                        €{result.suggestedPrice}
                      </span>
                      <span className="text-xs text-emerald-700 mr-2">
                        (تخمین بازار، خودت می‌تونی تغییر بدی)
                      </span>
                    </div>
                  ) : null}

                  {result.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResult(null);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition text-sm"
                    >
                      دوباره بساز
                    </button>
                    <button
                      type="button"
                      onClick={handleAccept}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-md hover:shadow-lg transition text-sm"
                    >
                      <Check size={16} />
                      استفاده از این متن
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
