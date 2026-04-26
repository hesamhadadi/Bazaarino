'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { toFaDigits } from '@/lib/locale';
import toast from 'react-hot-toast';

type Stats = { avg: number; count: number; userScore: number | null };

export default function ArticleRating({
  slug,
  initialAvg = 0,
  initialCount = 0,
}: {
  slug: string;
  initialAvg?: number;
  initialCount?: number;
}) {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  const [stats, setStats] = useState<Stats>({
    avg: initialAvg,
    count: initialCount,
    userScore: null,
  });
  const [hover, setHover] = useState<number>(0);
  const [busy, setBusy] = useState(false);

  // Fetch the user's existing score (and refresh stats) once we know they're logged in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/rating`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setStats({
            avg: Number(data.avg) || 0,
            count: Number(data.count) || 0,
            userScore: data.userScore ?? null,
          });
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function submit(score: number) {
    if (!isAuthed) {
      toast.error('برای امتیاز دادن وارد حساب کاربری شوید');
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/articles/${encodeURIComponent(slug)}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ score }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'خطا');
      setStats({
        avg: Number(data.avg) || 0,
        count: Number(data.count) || 0,
        userScore: data.userScore ?? null,
      });
      toast.success('امتیازت ثبت شد');
    } catch (e: any) {
      toast.error(e?.message || 'خطا در ثبت امتیاز');
    } finally {
      setBusy(false);
    }
  }

  const display = hover || stats.userScore || Math.round(stats.avg);

  return (
    <section
      className="mt-8 rounded-3xl border border-amber-100 bg-gradient-to-l from-amber-50/70 to-white p-5"
      aria-label="امتیاز به این مقاله"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((n) => {
              const filled = n <= display;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={busy}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => submit(n)}
                  aria-label={`امتیاز ${n} از ۵`}
                  className="p-1 disabled:opacity-50 transition"
                >
                  <Star
                    size={28}
                    className={
                      filled
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                        : 'text-gray-300'
                    }
                  />
                </button>
              );
            })}
          </div>
          <div className="text-sm">
            <p className="font-bold text-gray-900">
              {stats.count > 0
                ? `${toFaDigits(stats.avg.toFixed(1))} از ۵`
                : 'هنوز امتیازی ثبت نشده'}
            </p>
            <p className="text-xs text-gray-500">
              {stats.count > 0
                ? `${toFaDigits(String(stats.count))} امتیاز`
                : 'اولین نفری باش که امتیاز می‌دی'}
            </p>
          </div>
        </div>

        {!isAuthed ? (
          <Link
            href="/login"
            className="text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            ورود برای امتیاز دادن
          </Link>
        ) : stats.userScore ? (
          <p className="text-xs text-emerald-700">
            امتیاز تو: {toFaDigits(String(stats.userScore))} ★
          </p>
        ) : (
          <p className="text-xs text-gray-500">روی ستاره‌ها کلیک کن</p>
        )}
      </div>
    </section>
  );
}
