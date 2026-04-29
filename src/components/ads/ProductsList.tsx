'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import {
  Package,
  Tag,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
  Sparkles,
  CheckCircle2,
  Hash,
  Info,
} from 'lucide-react';
import type { IAdProduct } from '@/models/Ad';
import { toFaDigits } from '@/lib/locale';

/**
 * Catalog of products on the ad detail page.
 *
 * UX:
 *  - Each card is a button — tapping/clicking opens a full-detail modal
 *    with a real image gallery, full description and the specs table.
 *  - Cards stay information-dense but uncluttered: title, price block
 *    with strike-through original, discount ribbon, stock chip.
 *  - Modal is keyboard-friendly (ESC closes), locks body scroll, and is
 *    a true RTL layout with arrow controls reversed for Persian.
 */
export default function ProductsList({
  products,
  fallbackImages,
}: {
  products: IAdProduct[];
  fallbackImages?: string[];
}) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  if (!products || products.length === 0) return null;

  const active = activeIdx != null ? products[activeIdx] : null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-orange-100/70 bg-gradient-to-br from-white via-orange-50/30 to-amber-50/30 p-4 md:p-6 shadow-sm">
      {/* decorative blob */}
      <div
        aria-hidden
        className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-gradient-to-br from-orange-200/40 to-transparent blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -right-16 w-64 h-64 rounded-full bg-gradient-to-tl from-rose-200/40 to-transparent blur-3xl pointer-events-none"
      />

      <header className="relative flex items-end justify-between mb-5 flex-wrap gap-2">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-orange-600 mb-1">
            <Sparkles size={11} />
            کاتالوگ
          </p>
          <h2 className="text-lg md:text-xl font-black text-gray-900 inline-flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 text-white inline-flex items-center justify-center shadow-md">
              <Package size={14} />
            </span>
            محصولات این آگهی
            <span className="text-xs font-bold text-orange-600 bg-orange-100 rounded-full px-2 py-0.5 mr-1">
              {toFaDigits(products.length)}
            </span>
          </h2>
        </div>
        <p className="hidden sm:inline-flex items-center gap-1 text-[11px] text-gray-500">
          <Info size={11} />
          روی هر کارت برای جزئیات کامل کلیک کن
        </p>
      </header>

      <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            fallbackImages={fallbackImages}
            onOpen={() => setActiveIdx(i)}
          />
        ))}
      </div>

      {active && (
        <ProductModal
          product={active}
          fallbackImages={fallbackImages}
          onClose={() => setActiveIdx(null)}
          onPrev={
            products.length > 1
              ? () =>
                  setActiveIdx(
                    (idx) => ((idx ?? 0) - 1 + products.length) % products.length,
                  )
              : undefined
          }
          onNext={
            products.length > 1
              ? () =>
                  setActiveIdx((idx) => ((idx ?? 0) + 1) % products.length)
              : undefined
          }
        />
      )}
    </section>
  );
}

/* ----------------------------------------------------------------------- */
/*  Card                                                                    */
/* ----------------------------------------------------------------------- */

function ProductCard({
  product: p,
  fallbackImages,
  onOpen,
}: {
  product: IAdProduct;
  fallbackImages?: string[];
  onOpen: () => void;
}) {
  const imgs = useMemo(
    () =>
      p.images && p.images.length > 0
        ? p.images
        : fallbackImages && fallbackImages.length > 0
          ? fallbackImages.slice(0, 1)
          : [],
    [p.images, fallbackImages],
  );

  const hasDiscount =
    p.originalPrice != null && p.originalPrice > p.price && p.price > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - p.price / (p.originalPrice as number)) * 100)
    : 0;
  const outOfStock = p.inStock === false;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative text-right rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-xl hover:border-orange-200 hover:-translate-y-0.5 transition-all duration-300 flex flex-col focus:outline-none focus:ring-2 focus:ring-orange-300"
      aria-label={`نمایش جزئیات ${p.title}`}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {imgs.length > 0 ? (
          <Image
            src={imgs[0]}
            alt={p.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`object-cover transition duration-500 group-hover:scale-110 ${
              outOfStock ? 'grayscale opacity-70' : ''
            }`}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <Package size={36} />
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition" />
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-gray-900 text-[11px] font-bold shadow-lg">
          <Eye size={12} />
          مشاهده
        </div>

        {/* Discount ribbon — diagonal */}
        {hasDiscount && (
          <div className="absolute top-0 right-0 overflow-hidden w-20 h-20 pointer-events-none">
            <span className="absolute top-2 -right-7 rotate-45 bg-gradient-to-r from-rose-500 to-red-600 text-white text-[10px] font-black px-7 py-0.5 shadow-md">
              ٪{toFaDigits(discountPct)}-
            </span>
          </div>
        )}

        {/* Image-count badge */}
        {imgs.length > 1 && (
          <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[10px] font-bold">
            <Eye size={10} />
            {toFaDigits(imgs.length)}
          </span>
        )}

        {/* OOS overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/55 backdrop-blur-[1px]">
            <span className="px-3 py-1 rounded-full bg-white/90 text-gray-900 text-[11px] font-black">
              ناموجود
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm font-black text-gray-900 leading-snug line-clamp-2 min-h-[2.5em]">
          {p.title}
        </h3>

        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-base md:text-lg font-black text-gray-900 inline-flex items-center gap-0.5">
            €{toFaDigits(p.price.toLocaleString('en-US'))}
            <Tag size={11} className="text-gray-400" />
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-gray-400 line-through">
              €{toFaDigits((p.originalPrice as number).toLocaleString('en-US'))}
            </span>
          )}
        </div>

        <div className="mt-2 flex items-center gap-2">
          {!outOfStock ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <CheckCircle2 size={10} />
              موجود
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
              ناموجود
            </span>
          )}
          {p.specs && p.specs.length > 0 && (
            <span className="text-[10px] text-gray-500 inline-flex items-center gap-1">
              <Hash size={10} />
              {toFaDigits(p.specs.length)} مشخصه
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ----------------------------------------------------------------------- */
/*  Modal                                                                   */
/* ----------------------------------------------------------------------- */

function ProductModal({
  product: p,
  fallbackImages,
  onClose,
  onPrev,
  onNext,
}: {
  product: IAdProduct;
  fallbackImages?: string[];
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const imgs = useMemo(
    () =>
      p.images && p.images.length > 0
        ? p.images
        : fallbackImages && fallbackImages.length > 0
          ? fallbackImages
          : [],
    [p.images, fallbackImages],
  );
  const [imgIdx, setImgIdx] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset image cursor whenever the active product changes.
  useEffect(() => {
    setImgIdx(0);
  }, [p.id]);

  // ESC + body-scroll lock + ←/→ for product nav.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      // RTL: ArrowLeft visually moves "next", ArrowRight moves "prev".
      if (e.key === 'ArrowLeft' && onNext) onNext();
      if (e.key === 'ArrowRight' && onPrev) onPrev();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, onPrev, onNext]);

  const hasDiscount =
    p.originalPrice != null && p.originalPrice > p.price && p.price > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - p.price / (p.originalPrice as number)) * 100)
    : 0;
  const outOfStock = p.inStock === false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* dialog */}
      <div
        ref={dialogRef}
        className="relative bg-white w-full md:max-w-3xl md:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="absolute top-3 left-3 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-gray-700 shadow-md flex items-center justify-center"
        >
          <X size={18} />
        </button>

        {/* product nav */}
        {(onPrev || onNext) && (
          <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
            {onPrev && (
              <button
                type="button"
                onClick={onPrev}
                aria-label="محصول قبلی"
                className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-gray-700 shadow-md flex items-center justify-center"
              >
                <ChevronRight size={18} />
              </button>
            )}
            {onNext && (
              <button
                type="button"
                onClick={onNext}
                aria-label="محصول بعدی"
                className="w-9 h-9 rounded-full bg-white/95 hover:bg-white text-gray-700 shadow-md flex items-center justify-center"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>
        )}

        <div className="grid md:grid-cols-2 overflow-y-auto">
          {/* Gallery */}
          <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[24rem] bg-gray-100">
            {imgs.length > 0 ? (
              <>
                <Image
                  src={imgs[imgIdx]}
                  alt={p.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={`object-cover ${outOfStock ? 'grayscale opacity-70' : ''}`}
                  priority
                />
                {imgs.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setImgIdx((i) => (i - 1 + imgs.length) % imgs.length)
                      }
                      aria-label="تصویر قبلی"
                      className="absolute top-1/2 right-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-gray-700 shadow flex items-center justify-center"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setImgIdx((i) => (i + 1) % imgs.length)
                      }
                      aria-label="تصویر بعدی"
                      className="absolute top-1/2 left-2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/85 hover:bg-white text-gray-700 shadow flex items-center justify-center"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    {/* thumbnail strip */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-black/45 backdrop-blur-sm">
                      {imgs.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setImgIdx(i)}
                          aria-label={`تصویر ${i + 1}`}
                          className={`relative w-7 h-7 rounded-md overflow-hidden ring-2 transition ${
                            i === imgIdx ? 'ring-white scale-110' : 'ring-transparent opacity-70 hover:opacity-100'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {hasDiscount && (
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-gradient-to-r from-rose-500 to-red-600 text-white text-[11px] font-black shadow">
                    ٪{toFaDigits(discountPct)}- تخفیف
                  </span>
                )}
                {outOfStock && (
                  <div className="absolute inset-x-0 bottom-0 bg-black/65 text-white text-center text-xs font-bold py-2">
                    این محصول در حال حاضر موجود نیست
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                <Package size={64} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5 md:p-6 flex flex-col gap-4 overflow-y-auto">
            <div>
              <h3 className="text-xl md:text-2xl font-black text-gray-900 leading-snug">
                {p.title}
              </h3>
              {p.sku && (
                <p
                  className="mt-1 text-[11px] font-mono text-gray-400"
                  dir="ltr"
                >
                  SKU: {p.sku}
                </p>
              )}
            </div>

            {/* Price block */}
            <div className="rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 border border-orange-100 p-4">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-2xl md:text-3xl font-black text-gray-900">
                  €{toFaDigits(p.price.toLocaleString('en-US'))}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-sm text-gray-400 line-through">
                      €{toFaDigits((p.originalPrice as number).toLocaleString('en-US'))}
                    </span>
                    <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[11px] font-black">
                      ٪{toFaDigits(discountPct)}-
                    </span>
                  </>
                )}
              </div>
              <div className="mt-2 flex items-center gap-2">
                {!outOfStock ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-white px-2.5 py-1 rounded-full">
                    <ShoppingCart size={12} />
                    موجود
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-white px-2.5 py-1 rounded-full">
                    ناموجود
                  </span>
                )}
                {hasDiscount && (
                  <span className="text-[11px] text-gray-600">
                    صرفه‌جویی{' '}
                    <span className="font-bold text-emerald-700">
                      €{toFaDigits(((p.originalPrice as number) - p.price).toLocaleString('en-US'))}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            {p.description && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 mb-1.5 inline-flex items-center gap-1.5">
                  <Info size={12} />
                  توضیحات
                </h4>
                <p className="text-sm text-gray-700 leading-7 whitespace-pre-line">
                  {p.description}
                </p>
              </div>
            )}

            {/* Specs */}
            {p.specs && p.specs.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-gray-500 mb-1.5 inline-flex items-center gap-1.5">
                  <Hash size={12} />
                  مشخصات
                </h4>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs rounded-xl bg-gray-50 border border-gray-100 p-3">
                  {p.specs.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 py-1.5 border-b border-dashed border-gray-200 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0"
                    >
                      <dt className="text-gray-500 font-medium">{s.label}</dt>
                      <dd className="text-gray-900 font-bold text-end truncate max-w-[60%]">
                        {s.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* footer hint */}
        <div className="border-t border-gray-100 bg-gray-50 px-4 py-2.5 text-[11px] text-gray-500 inline-flex items-center justify-center gap-2">
          <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono text-[10px]">ESC</kbd>
          برای بستن
          {(onPrev || onNext) && (
            <>
              <span className="mx-1 text-gray-300">·</span>
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-gray-200 font-mono text-[10px]">←/→</kbd>
              جابه‌جایی بین محصولات
            </>
          )}
        </div>
      </div>
    </div>
  );
}
