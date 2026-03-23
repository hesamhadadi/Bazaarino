import { formatFaNumber, toFaDigits } from '@/lib/locale';

interface MarketPriceBadgeProps {
  price?: number;
  marketPrice?: {
    referencePrice: number;
    sampleSize: number;
    aiRegression?: {
      model: 'regression';
      trend: 'up' | 'down' | 'fair';
      trendPercent: number;
      confidence: number;
      chart: number[];
      dataSources: string[];
    };
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
  const aiRegression = marketPrice?.aiRegression;
  const level = classifyMarketPrice(price, reference);

  if (!price || !reference || !sampleSize || !level) return null;

  const ui = levelUi[level];
  const marker = toPercent(price, reference);
  const chartValues = aiRegression?.chart || [];
  const chartMin = chartValues.length > 0 ? Math.min(...chartValues) : 0;
  const chartMax = chartValues.length > 0 ? Math.max(...chartValues) : 0;
  const chartRange = chartMax - chartMin || 1;
  const chartPath = chartValues
    .map((value, index) => {
      const x = (index / Math.max(1, chartValues.length - 1)) * 100;
      const y = 100 - (((value - chartMin) / chartRange) * 100);
      return `${x},${Math.max(4, Math.min(96, y))}`;
    })
    .join(' ');
  const aiTrendLabel = aiRegression?.trend === 'up'
    ? 'رو به بالا'
    : aiRegression?.trend === 'down'
      ? 'رو به پایین'
      : 'نزدیک عرف بازار';
  const aiTrendClass = aiRegression?.trend === 'up'
    ? 'text-rose-700'
    : aiRegression?.trend === 'down'
      ? 'text-emerald-700'
      : 'text-sky-700';

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
      {aiRegression && (
        <div className="mt-3 rounded-lg border border-gray-100 bg-gray-50 p-2">
          <div className="flex items-center justify-between gap-2 mb-2 text-[11px]">
            <span className="font-semibold text-gray-700">هوش مصنوعی (Regression)</span>
            <span className={aiTrendClass}>
              {aiTrendLabel} ({toFaDigits(aiRegression.trendPercent)}٪)
            </span>
          </div>
          {chartValues.length > 1 && (
            <svg viewBox="0 0 100 100" className="w-full h-12">
              <line x1="0" y1="50" x2="100" y2="50" stroke="#cbd5e1" strokeDasharray="3 3" strokeWidth="1.5" />
              <polyline points={chartPath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
          <div className="mt-1 text-[10px] text-gray-500 leading-5">
            <span>اعتماد مدل: {toFaDigits(aiRegression.confidence)}٪</span>
            {aiRegression.dataSources.length > 0 && (
              <span className="block">منابع: {aiRegression.dataSources.join(' + ')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
