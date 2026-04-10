export function formatPrice(price?: number, priceType?: string, currency?: string) {
  if (priceType === 'free') return 'رایگان';
  if (priceType === 'negotiable') return 'توافقی';
  if (priceType === 'exchange') return 'معاوضه';
  if (price === undefined || price === null) return 'نامشخص';

  const formatted = new Intl.NumberFormat('fa-IR').format(price);
  return `${formatted} ${currency || 'EUR'}`;
}

export function formatDate(value?: string) {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
