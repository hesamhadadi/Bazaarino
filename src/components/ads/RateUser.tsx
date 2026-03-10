'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RateUser({ targetUserId, initialScore }: { targetUserId: string; initialScore?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (value: number) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, score: value }),
      });
      if (res.ok) {
        setScore(value);
        toast.success('امتیاز ثبت شد');
      } else {
        const data = await res.json();
        toast.error(data.message || 'خطا در ثبت امتیاز');
      }
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setSubmitting(false);
    }
  };

  const active = hover ?? score ?? initialScore ?? 0;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => {
        const value = i + 1;
        return (
          <button
            key={value}
            type="button"
            disabled={submitting}
            onMouseEnter={() => setHover(value)}
            onMouseLeave={() => setHover(null)}
            onClick={() => submit(value)}
            className="p-0.5"
          >
            <Star size={16} className={value <= active ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
          </button>
        );
      })}
    </div>
  );
}
