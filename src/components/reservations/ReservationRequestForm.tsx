'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  CalendarDays,
  Moon,
  Send,
  Sparkles,
  ShieldCheck,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { formatFaNumber, toFaDigits } from '@/lib/locale';
import {
  calculateNights,
  getTodayLocalDateOnly,
  parseDateOnlyInput,
} from '@/lib/reservation';
import ReservationDateRangePicker from '@/components/reservations/ReservationDateRangePicker';

type Props = {
  adId: string;
  /** Per-night price in EUR. 0 means "negotiable / no fixed price". */
  nightlyPrice?: number;
};

/**
 * Polished reservation request widget shown on housing ad detail pages.
 * The parent gates rendering, so this component assumes the ad is reservable
 * (no "not reservable" branch needed). Highlights:
 *
 *  - gradient header with icon + helper copy
 *  - date range picker with quick-pick chips (3/5/7 nights)
 *  - live calculation card: nights, nightly, total, with per-night chip
 *  - clear CTA + secure-payment trust line
 *  - optimistic UX: button shows spinner while POSTing
 */
export default function ReservationRequestForm({
  adId,
  nightlyPrice = 0,
}: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const today = useMemo(() => getTodayLocalDateOnly(), []);

  const nights = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const from = parseDateOnlyInput(startDate);
    const to = parseDateOnlyInput(endDate);
    if (!from || !to) return 0;
    return Math.max(0, calculateNights(from, to));
  }, [startDate, endDate]);

  const totalPrice = nights > 0 ? nights * nightlyPrice : 0;

  /** Add `n` calendar days to startDate (or today) and set as endDate. */
  const quickPick = (n: number) => {
    const base = startDate ? parseDateOnlyInput(startDate) : new Date();
    if (!base) return;
    const start = startDate || formatYmd(base);
    const end = new Date(base);
    end.setDate(end.getDate() + n);
    setStartDate(start);
    setEndDate(formatYmd(end));
  };

  const onSubmit = async () => {
    if (!session) {
      const callback = encodeURIComponent(pathname || `/ads/${adId}`);
      router.push(`/auth/login?callbackUrl=${callback}`);
      return;
    }

    if (!startDate || !endDate || nights < 1) {
      toast.error('بازه‌ی تاریخ رزرو را درست انتخاب کنید');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, startDate, endDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'ثبت درخواست رزرو ناموفق بود');

      toast.success('درخواست رزرو ارسال شد');
      if (data?.reservation?.conversationId) {
        router.push(`/messages/${data.reservation.conversationId}`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'ثبت درخواست رزرو ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  const ready = nights > 0;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 shadow-sm">
      {/* Decorative blob — adds depth without an image. */}
      <div
        aria-hidden
        className="absolute -top-16 -left-16 w-56 h-56 rounded-full bg-gradient-to-br from-indigo-200/60 to-transparent blur-3xl pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -bottom-20 -right-12 w-56 h-56 rounded-full bg-gradient-to-tl from-fuchsia-200/50 to-transparent blur-3xl pointer-events-none"
      />

      {/* Header */}
      <div className="relative px-4 pt-4 pb-3">
        <div className="flex items-start gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white inline-flex items-center justify-center shadow-md flex-shrink-0">
            <CalendarDays size={16} />
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-black text-indigo-950 text-base inline-flex items-center gap-1.5">
              رزرو خانه
              <Sparkles
                size={12}
                className="text-amber-500 animate-pulse"
              />
            </h3>
            <p className="text-[11px] text-indigo-700/80 leading-5 mt-0.5">
              تاریخ ورود و خروج رو انتخاب کن، قیمت کل رو ببین و درخواست رو
              برای میزبان بفرست.
            </p>
          </div>
        </div>
      </div>

      <div className="relative p-4 pt-2 space-y-3">
        {/* Date picker */}
        <div className="bg-white/85 backdrop-blur-sm rounded-2xl p-3 ring-1 ring-indigo-100">
          <ReservationDateRangePicker
            startDate={startDate}
            endDate={endDate}
            minStartDate={today}
            minEndDate={startDate || today}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />

          {/* Quick-pick chips — speeds up the most common short-stay patterns. */}
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-indigo-700/80 ml-1">
              پیشنهاد سریع:
            </span>
            {[2, 3, 5, 7].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => quickPick(n)}
                className="px-2.5 py-1 rounded-full bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 text-[11px] font-bold transition"
              >
                {toFaDigits(n)} شب
              </button>
            ))}
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="ml-auto px-2 py-1 text-[10px] font-bold text-rose-600 hover:bg-rose-50 rounded-full"
              >
                پاک‌کردن
              </button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-2xl bg-white/85 backdrop-blur-sm ring-1 ring-indigo-100 p-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat
              label="شب"
              value={ready ? toFaDigits(nights) : '—'}
              icon={<Moon size={12} />}
              accent="bg-indigo-50 text-indigo-700"
            />
            <Stat
              label="هر شب"
              value={
                nightlyPrice > 0
                  ? `€${formatFaNumber(nightlyPrice)}`
                  : 'توافقی'
              }
              accent="bg-violet-50 text-violet-700"
            />
            <Stat
              label="مجموع"
              value={
                ready && nightlyPrice > 0
                  ? `€${formatFaNumber(totalPrice)}`
                  : ready
                    ? 'توافقی'
                    : '—'
              }
              accent="bg-fuchsia-50 text-fuchsia-700 font-black"
              emphasized
            />
          </div>
          {ready && nightlyPrice > 0 && (
            <p className="text-[10px] text-gray-500 text-center mt-2">
              {toFaDigits(nights)} × €{formatFaNumber(nightlyPrice)} ={' '}
              <span className="font-bold text-gray-800">
                €{formatFaNumber(totalPrice)}
              </span>
            </p>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={onSubmit}
          disabled={loading || !ready}
          className="group w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-2xl text-sm font-black transition"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              در حال ارسال…
            </>
          ) : (
            <>
              <Send size={15} />
              ارسال درخواست رزرو
              <ArrowLeft
                size={14}
                className="opacity-70 group-hover:-translate-x-1 transition"
              />
            </>
          )}
        </button>

        {/* Trust line */}
        <p className="text-[10px] text-indigo-700/80 text-center inline-flex items-center justify-center gap-1.5 w-full">
          <ShieldCheck size={11} />
          درخواست شما تا تأیید میزبان به‌صورت محرمانه باقی می‌ماند.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */

function Stat({
  label,
  value,
  icon,
  accent,
  emphasized,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-xl ${accent} px-2 py-2 flex flex-col items-center justify-center`}
    >
      <span className="text-[10px] font-bold opacity-80 inline-flex items-center gap-1">
        {icon}
        {label}
      </span>
      <span
        className={`mt-0.5 ${
          emphasized ? 'text-base' : 'text-sm'
        } font-black text-gray-900`}
      >
        {value}
      </span>
    </div>
  );
}

/** YYYY-MM-DD in local time (avoids the off-by-one timezone bug from toISOString). */
function formatYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
