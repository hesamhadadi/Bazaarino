import { formatFaNumber, toFaDigits } from '@/lib/locale';

interface MarketPriceBadgeProps {
  price?: number;
  marketPrice?: {
    referencePrice: number;
    sampleSize: number;
  };
  compact?: boolean;
}

const levelUi = {
  below: {
    label: 'پایین‌تر از عرف',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    barClass: 'bg-emerald-500',
  },
  fair: {
    label: 'نزدیک به عرف بازار',
    className: 'bg-sky-50 text-sky-700 border-sky-200',
    barClass: 'bg-sky-500',
  },
  above: {
    label: 'بالاتر از عرف',
    className: 'bg-rose-50 text-rose-700 border-rose-200',
    barClass: 'bg-rose-500',
  },
} as const;

function toPercent(current: number, reference: number) {
  if (!reference || reference <= 0) return 50;
  const raw = (current / reference) * 50;
  return Math.max(6, Math.min(94, raw));
}

function classifyMarketPrice(price?: number, referencePrice?: number): 'below' | 'fair' | 'above' | null {
  if (!price || !referencePrice || referencePrice <= 0) return null;
  const ratio = price / referencePrice;
  if (ratio < 0.9) return 'below';
  if (ratio > 1.1) return 'above';
  return 'fair';
}

export default function MarketPriceBadge({ price, marketPrice, compact = false }: MarketPriceBadgeProps) {
  const reference = marketPrice?.referencePrice;
  const sampleSize = marketPrice?.sampleSize;
  const level = classifyMarketPrice(price, reference);

  if (!price || !reference || !sampleSize || !level) return null;

  const ui = levelUi[level];
  const marker = toPercent(price, reference);

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border ${ui.className}`}>
        <span>{ui.label}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-3 bg-white">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className={`text-xs px-2 py-1 rounded-full border ${ui.className}`}>{ui.label}</span>
        <span className="text-[11px] text-gray-500">نمونه: {toFaDigits(sampleSize)} آگهی</span>
      </div>
      <div className="relative h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
        <div className={`absolute inset-y-0 start-0 w-1/2 ${ui.barClass} opacity-30`} />
        <div className="absolute inset-y-0 w-[2px] bg-gray-500/70" style={{ left: '50%' }} />
        <div className={`absolute inset-y-0 w-[2px] ${ui.barClass}`} style={{ left: `${marker}%` }} />
      </div>
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span>عرف: €{formatFaNumber(reference)}</span>
        <span>قیمت آگهی: €{formatFaNumber(price)}</span>
      </div>
    </div>
  );
}
