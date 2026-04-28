'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package, Tag, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import type { IAdProduct } from '@/models/Ad';

/**
 * Renders a catalog of products on the ad detail page. Each card shows:
 * - A small image carousel (per-product images, falling back to ad images)
 * - Title, description (collapsible), discount badge with strike-through
 * - Specs table when provided
 * - Out-of-stock overlay when relevant
 *
 * Designed to be embedded *below* the ad's main hero block so the page still
 * makes sense for both single-item and multi-product ads.
 */
export default function ProductsList({
  products,
  fallbackImages,
}: {
  products: IAdProduct[];
  fallbackImages?: string[];
}) {
  if (!products || products.length === 0) return null;

  return (
    <section className="bg-white rounded-2xl border border-gray-100 p-4 md:p-5">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="font-black text-gray-900 inline-flex items-center gap-2">
          <Package size={16} className="text-orange-500" />
          محصولات این آگهی
          <span className="text-xs font-bold text-gray-400 mr-1">
            ({products.length})
          </span>
        </h2>
        <p className="text-[11px] text-gray-500">
          برای جزئیات هر مورد روی کارت بزنید
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {products.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            fallbackImages={fallbackImages}
          />
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- */

function ProductCard({
  product: p,
  fallbackImages,
}: {
  product: IAdProduct;
  fallbackImages?: string[];
}) {
  const imgs =
    p.images && p.images.length > 0
      ? p.images
      : fallbackImages && fallbackImages.length > 0
      ? fallbackImages.slice(0, 1)
      : [];
  const [imgIdx, setImgIdx] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const hasDiscount =
    p.originalPrice != null && p.originalPrice > p.price && p.price > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - p.price / (p.originalPrice as number)) * 100)
    : 0;
  const outOfStock = p.inStock === false;

  return (
    <article className="rounded-2xl border border-gray-100 bg-white overflow-hidden hover:shadow-md transition group flex flex-col">
      {/* Image area with carousel arrows */}
      <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
        {imgs.length > 0 ? (
          <>
            <Image
              src={imgs[imgIdx]}
              alt={p.title}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={`object-cover transition group-hover:scale-105 ${
                outOfStock ? 'grayscale opacity-70' : ''
              }`}
            />
            {imgs.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setImgIdx((i) => (i - 1 + imgs.length) % imgs.length)
                  }
                  className="absolute top-1/2 right-1.5 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white shadow"
                  aria-label="قبلی"
                >
                  <ChevronRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setImgIdx((i) => (i + 1) % imgs.length)
                  }
                  className="absolute top-1/2 left-1.5 -translate-y-1/2 w-7 h-7 rounded-full bg-white/85 backdrop-blur-sm flex items-center justify-center text-gray-700 hover:bg-white shadow"
                  aria-label="بعدی"
                >
                  <ChevronLeft size={14} />
                </button>
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
                  {imgs.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition ${
                        i === imgIdx ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <Package size={36} />
          </div>
        )}

        {hasDiscount && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black shadow">
            ٪{discountPct}-
          </span>
        )}
        {outOfStock && (
          <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-center text-[11px] font-bold py-1.5">
            ناموجود
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-3.5 flex-1 flex flex-col">
        <h3 className="text-sm font-black text-gray-900 leading-snug line-clamp-2 min-h-[2.5em]">
          {p.title}
        </h3>

        {/* Price block */}
        <div className="mt-2 flex items-baseline gap-2 flex-wrap">
          <span className="text-lg font-black text-gray-900 inline-flex items-center gap-0.5">
            <Tag size={11} className="text-gray-400" />€{p.price.toLocaleString('fa-IR')}
          </span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              €{(p.originalPrice as number).toLocaleString('fa-IR')}
            </span>
          )}
        </div>

        {/* Description */}
        {p.description && (
          <div className="mt-2">
            <p
              className={`text-xs text-gray-600 leading-6 ${
                expanded ? '' : 'line-clamp-2'
              }`}
            >
              {p.description}
            </p>
            {p.description.length > 90 && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="text-[10px] text-orange-600 font-bold mt-1 hover:underline"
              >
                {expanded ? 'بستن' : 'بیشتر'}
              </button>
            )}
          </div>
        )}

        {/* Specs table */}
        {p.specs && p.specs.length > 0 && (
          <dl className="mt-3 grid grid-cols-1 gap-1 text-[11px]">
            {p.specs.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 py-1 border-b border-dashed border-gray-100 last:border-b-0"
              >
                <dt className="text-gray-500 font-medium">{s.label}</dt>
                <dd className="text-gray-900 font-bold text-end truncate max-w-[60%]">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center gap-2">
          {p.sku && (
            <span className="text-[10px] text-gray-400 font-mono" dir="ltr">
              SKU: {p.sku}
            </span>
          )}
          {!outOfStock && (
            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <ShoppingCart size={11} />
              موجود
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
