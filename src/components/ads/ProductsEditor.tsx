'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Upload,
  X,
  Tag,
  Package,
  ListChecks,
  Percent,
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { IAdProduct } from '@/models/Ad';

/** Local form-friendly shape — `price`/`originalPrice` are strings while
 * the user is typing so we don't have to fight controlled-number quirks. */
export interface ProductDraft {
  id: string;
  title: string;
  description?: string;
  price: string;
  originalPrice?: string;
  images?: string[];
  specs?: Array<{ label: string; value: string }>;
  inStock?: boolean;
  sku?: string;
}

/** Convert the wire shape (numbers) into the form draft (strings). */
export function productsToDrafts(items?: IAdProduct[] | null): ProductDraft[] {
  if (!items || items.length === 0) return [];
  return items.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    price: String(p.price ?? ''),
    originalPrice: p.originalPrice != null ? String(p.originalPrice) : '',
    images: p.images || [],
    specs: p.specs || [],
    inStock: p.inStock !== false,
    sku: p.sku || '',
  }));
}

/** Convert form drafts back into the API/wire shape. Drops invalid rows. */
export function draftsToProducts(drafts: ProductDraft[]): IAdProduct[] {
  const out: IAdProduct[] = [];
  for (const d of drafts) {
    const price = Number(d.price);
    const original = d.originalPrice ? Number(d.originalPrice) : NaN;
    if (!d.title.trim() || !Number.isFinite(price) || price < 0) continue;
    const cleanSpecs = (d.specs || []).filter((s) => s.label || s.value);
    out.push({
      id: d.id,
      title: d.title.trim(),
      description: d.description?.trim() || undefined,
      price,
      originalPrice:
        Number.isFinite(original) && original > price ? original : undefined,
      currency: 'EUR',
      images: d.images && d.images.length > 0 ? d.images : undefined,
      specs: cleanSpecs.length > 0 ? cleanSpecs : undefined,
      inStock: d.inStock !== false,
      sku: d.sku?.trim() || undefined,
    });
  }
  return out;
}

const newId = () =>
  `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Manages the list of products in catalog ads. Each product is a collapsible
 * card with: title, optional description, sale price, optional original price
 * (auto-renders a percentage badge when valid), product-specific images,
 * key/value specs and an in-stock toggle. The component is fully controlled
 * — the parent owns the array.
 */
export default function ProductsEditor({
  products,
  onChange,
}: {
  products: ProductDraft[];
  onChange: (next: ProductDraft[]) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(products[0]?.id || null);

  const update = (id: string, patch: Partial<ProductDraft>) => {
    onChange(products.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const add = () => {
    const fresh: ProductDraft = {
      id: newId(),
      title: '',
      price: '',
      inStock: true,
    };
    onChange([...products, fresh]);
    setOpenId(fresh.id);
  };

  const remove = (id: string) => {
    onChange(products.filter((p) => p.id !== id));
  };

  const move = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= products.length) return;
    const next = [...products];
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {products.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
          <Package size={28} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm font-bold text-gray-700 mb-1">
            هنوز محصولی اضافه نکرده‌اید
          </p>
          <p className="text-xs text-gray-500 mb-4">
            هر محصول عنوان، قیمت و توضیحات مستقل دارد. می‌توانی برای هرکدام
            تخفیف هم تعیین کنی.
          </p>
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition"
          >
            <Plus size={14} />
            افزودن اولین محصول
          </button>
        </div>
      ) : (
        <>
          {products.map((p, idx) => (
            <ProductCard
              key={p.id}
              product={p}
              idx={idx}
              total={products.length}
              isOpen={openId === p.id}
              onToggle={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
              onUpdate={(patch) => update(p.id, patch)}
              onRemove={() => remove(p.id)}
              onMoveUp={() => move(idx, -1)}
              onMoveDown={() => move(idx, 1)}
            />
          ))}
          <button
            type="button"
            onClick={add}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-700 text-sm font-bold hover:border-gray-900 hover:bg-gray-50 transition"
          >
            <Plus size={14} />
            افزودن محصول دیگر
          </button>
        </>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function ProductCard({
  product: p,
  idx,
  total,
  isOpen,
  onToggle,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  product: ProductDraft;
  idx: number;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<ProductDraft>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const [uploading, setUploading] = useState(false);

  const priceN = Number(p.price);
  const origN = p.originalPrice ? Number(p.originalPrice) : NaN;
  const hasDiscount =
    Number.isFinite(priceN) &&
    Number.isFinite(origN) &&
    origN > priceN &&
    priceN > 0;
  const discountPct = hasDiscount
    ? Math.round((1 - priceN / origN) * 100)
    : 0;

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if ((p.images?.length || 0) + files.length > 6) {
      toast.error('حداکثر ۶ تصویر برای هر محصول');
      return;
    }
    setUploading(true);
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok && Array.isArray(data.urls)) {
        onUpdate({ images: [...(p.images || []), ...data.urls] });
      } else {
        toast.error(data.message || 'خطا در آپلود');
      }
    } catch {
      toast.error('خطای شبکه در آپلود');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) => {
    onUpdate({ images: (p.images || []).filter((_, n) => n !== i) });
  };

  const setSpec = (i: number, patch: Partial<{ label: string; value: string }>) => {
    const specs = [...(p.specs || [])];
    specs[i] = { ...specs[i], ...patch };
    onUpdate({ specs });
  };

  return (
    <div
      className={`rounded-2xl border-2 transition overflow-hidden ${
        isOpen ? 'border-gray-900 bg-white' : 'border-gray-100 bg-white hover:border-gray-300'
      }`}
    >
      {/* Header — collapsible */}
      <div className="flex items-center gap-2 px-3 py-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 text-orange-700 flex items-center justify-center font-black text-sm flex-shrink-0">
          {idx + 1}
        </div>
        <button
          type="button"
          onClick={onToggle}
          className="flex-1 min-w-0 text-right"
        >
          <p className="text-sm font-bold text-gray-900 truncate">
            {p.title || <span className="text-gray-400">محصول بدون عنوان</span>}
          </p>
          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
            {p.price ? (
              <>
                <span className="font-bold text-gray-700">€{p.price}</span>
                {hasDiscount && (
                  <>
                    <span className="line-through text-gray-400">
                      €{p.originalPrice}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-100">
                      ٪{discountPct}-
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className="text-gray-400">قیمت تعیین نشده</span>
            )}
            {p.inStock === false && (
              <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold">
                ناموجود
              </span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={idx === 0}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="بالا"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={idx === total - 1}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="پایین"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
            title="حذف"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Body */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100">
          <div>
            <Label>عنوان محصول *</Label>
            <input
              value={p.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="مثلاً: کفش ورزشی نایکی سایز ۴۲"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label hint="قیمتی که خریدار می‌پردازد">
                <Tag size={11} className="inline mr-1" />
                قیمت فروش (€) *
              </Label>
              <input
                value={p.price}
                onChange={(e) => onUpdate({ price: e.target.value })}
                placeholder="0"
                type="number"
                min={0}
                step="0.01"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <Label hint="در صورت پر بودن، قیمت اصلی روی محصول خط‌دار نمایش داده می‌شود">
                <Percent size={11} className="inline mr-1" />
                قیمت اصلی پیش از تخفیف (€)
              </Label>
              <input
                value={p.originalPrice || ''}
                onChange={(e) => onUpdate({ originalPrice: e.target.value })}
                placeholder="0"
                type="number"
                min={0}
                step="0.01"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none"
                dir="ltr"
              />
              {hasDiscount && (
                <p className="text-[10px] text-rose-600 mt-1 font-bold">
                  ٪{discountPct} تخفیف نمایش داده می‌شود ✓
                </p>
              )}
              {p.originalPrice && !hasDiscount && (
                <p className="text-[10px] text-amber-600 mt-1">
                  قیمت اصلی باید بیشتر از قیمت فروش باشد
                </p>
              )}
            </div>
          </div>

          <div>
            <Label>توضیحات (اختیاری)</Label>
            <textarea
              value={p.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              rows={3}
              placeholder="مشخصات و جزئیات محصول..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none resize-none"
            />
          </div>

          {/* Images */}
          <div>
            <Label hint="حداکثر ۶ تصویر برای این محصول. اگر خالی بود، تصاویر اصلی آگهی استفاده می‌شود.">
              تصاویر مخصوص این محصول
            </Label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {(p.images || []).map((url, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 group"
                >
                  <Image src={url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 left-1 w-6 h-6 bg-red-500/90 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
              {(p.images?.length || 0) < 6 && (
                <label className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-gray-900 hover:bg-gray-50 transition">
                  {uploading ? (
                    <Upload size={16} className="text-gray-400 animate-pulse" />
                  ) : (
                    <>
                      <Upload size={16} className="text-gray-400" />
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        افزودن
                      </span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={upload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Specs */}
          <div>
            <Label hint="مثلاً: سایز=M، رنگ=مشکی. روی صفحه آگهی به صورت جدول نشان داده می‌شود.">
              <ListChecks size={11} className="inline mr-1" />
              مشخصات (اختیاری)
            </Label>
            <div className="space-y-2">
              {(p.specs || []).map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={s.label}
                    onChange={(e) => setSpec(i, { label: e.target.value })}
                    placeholder="عنوان (مثلاً: رنگ)"
                    className="w-1/3 border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:border-gray-900 outline-none"
                  />
                  <input
                    value={s.value}
                    onChange={(e) => setSpec(i, { value: e.target.value })}
                    placeholder="مقدار (مثلاً: مشکی)"
                    className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs focus:border-gray-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate({
                        specs: (p.specs || []).filter((_, n) => n !== i),
                      })
                    }
                    className="p-2 text-gray-400 hover:text-red-600 transition"
                    title="حذف"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  onUpdate({
                    specs: [...(p.specs || []), { label: '', value: '' }],
                  })
                }
                className="text-xs text-gray-700 hover:text-gray-900 font-bold inline-flex items-center gap-1"
              >
                <Plus size={11} />
                افزودن مشخصه
              </button>
            </div>
          </div>

          {/* Stock + SKU */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={p.inStock !== false}
                onChange={(e) => onUpdate({ inStock: e.target.checked })}
                className="accent-gray-900"
              />
              <span>موجود است</span>
            </label>
            <div className="flex-1 min-w-[140px]">
              <input
                value={p.sku || ''}
                onChange={(e) => onUpdate({ sku: e.target.value })}
                placeholder="کد محصول/SKU (اختیاری)"
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:border-gray-900 outline-none"
                dir="ltr"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Label({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <span className="text-xs font-bold text-gray-700 block">{children}</span>
      {hint && <span className="text-[10px] text-gray-400 block mt-0.5">{hint}</span>}
    </div>
  );
}
