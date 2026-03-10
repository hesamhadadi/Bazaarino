import { Star } from 'lucide-react';
import clsx from 'clsx';

type StarRatingProps = {
  value: number;
  count?: number;
  size?: number;
  className?: string;
};

export function StarRating({ value, count, size = 14, className }: StarRatingProps) {
  const fullStars = Math.floor(value);
  const hasHalf = value - fullStars >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    const isFull = i < fullStars;
    const isHalf = i === fullStars && hasHalf;
    return { isFull, isHalf };
  });

  return (
    <div className={clsx('inline-flex items-center gap-1', className)}>
      {stars.map((s, i) => (
        <Star
          key={i}
          size={size}
          className={clsx(
            'text-yellow-400',
            s.isFull ? 'fill-yellow-400' : s.isHalf ? 'fill-yellow-400/40' : 'fill-transparent'
          )}
        />
      ))}
      <span className="text-xs text-gray-500">{value.toFixed(1)}</span>
      {typeof count === 'number' && (
        <span className="text-xs text-gray-400">({count})</span>
      )}
    </div>
  );
}
