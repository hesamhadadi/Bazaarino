'use client';

import { useEffect, useState } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface FavoriteButtonProps {
  adId: string;
  className?: string;
}

export default function FavoriteButton({ adId, className = '' }: FavoriteButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/favorites?adId=${adId}`)
      .then((res) => res.json())
      .then((data) => setFavorited(Boolean(data.favorited)))
      .catch(() => undefined);
  }, [adId, session]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session) {
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId }),
      });
      const data = await res.json();
      if (res.ok) setFavorited(Boolean(data.favorited));
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`inline-flex items-center justify-center rounded-full transition-colors ${
        favorited ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-500 hover:text-rose-500'
      } ${className}`}
      aria-label="favorite"
      title={favorited ? 'حذف از علاقه‌مندی' : 'افزودن به علاقه‌مندی'}
    >
      <Heart size={16} fill={favorited ? 'currentColor' : 'none'} />
    </button>
  );
}
