// High-quality Unsplash images per category id.
// Using stable photo IDs with explicit dimensions / quality.
const PARAMS = '?auto=format&fit=crop&w=600&q=70';

export const CATEGORY_IMAGES: Record<string, string> = {
  'real-estate': `https://images.unsplash.com/photo-1568605114967-8130f3a36994${PARAMS}`,
  'vehicles': `https://images.unsplash.com/photo-1503376780353-7e6692767b70${PARAMS}`,
  'electronics': `https://images.unsplash.com/photo-1518770660439-4636190af475${PARAMS}`,
  'home-appliances': `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136${PARAMS}`,
  'jobs': `https://images.unsplash.com/photo-1521737604893-d14cc237f11d${PARAMS}`,
  'services': `https://images.unsplash.com/photo-1521791136064-7986c2920216${PARAMS}`,
  'clothing': `https://images.unsplash.com/photo-1483985988355-763728e1935b${PARAMS}`,
  'food': `https://images.unsplash.com/photo-1504674900247-0877df9cc836${PARAMS}`,
  'kids': `https://images.unsplash.com/photo-1503944583220-79d8926ad5e2${PARAMS}`,
  'requests': `https://images.unsplash.com/photo-1450101499163-c8848c66ca85${PARAMS}`,
  'other': `https://images.unsplash.com/photo-1513151233558-d860c5398176${PARAMS}`,
};

export function getCategoryImage(id: string): string {
  return CATEGORY_IMAGES[id] || CATEGORY_IMAGES['other'];
}
