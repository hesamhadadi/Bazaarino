'use client';

import { useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatFaNumber, toFaDigits } from '@/lib/locale';

type Props = {
  adId: string;
  nightlyPrice?: number;
  reservable: boolean;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function calculateNights(start?: string, end?: string) {
  if (!start || !end) return 0;
  const from = new Date(`${start}T00:00:00.000Z`);
  const to = new Date(`${end}T00:00:00.000Z`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  const nights = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  return nights > 0 ? nights : 0;
}

export default function ReservationRequestForm({ adId, nightlyPrice = 0, reservable }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const nights = useMemo(() => calculateNights(startDate, endDate), [startDate, endDate]);
  const totalPrice = nights > 0 ? nights * nightlyPrice : 0;

  const onSubmit = async () => {
    if (!reservable) return;

    if (!session) {
      const callback = encodeURIComponent(pathname || `/ads/${adId}`);
      router.push(`/auth/login?callbackUrl=${callback}`);
      return;
    }

    if (!startDate || !endDate || nights < 1) {
      toast.error('بازه تاریخ رزرو را درست انتخاب کنید');
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

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 mt-4">
      <h3 className="font-semibold text-indigo-800 mb-2">رزرو خونه</h3>
      <p className="text-xs text-indigo-700 mb-3">بازه تاریخ را انتخاب کن، مجموع قیمت را ببین و درخواست رزرو را برای صاحب آگهی بفرست.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border border-indigo-200 rounded-xl px-3 py-2 text-sm" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border border-indigo-200 rounded-xl px-3 py-2 text-sm" />
      </div>
      <div className="text-xs text-indigo-900 mb-3 space-y-1">
        <p>تعداد شب: <span className="font-semibold">{toFaDigits(nights)}</span></p>
        <p>
          مجموع قیمت:{' '}
          <span className="font-semibold">
            {nightlyPrice > 0 ? `€${formatFaNumber(totalPrice)}` : 'توافقی'}
          </span>
        </p>
      </div>
      <button
        onClick={onSubmit}
        disabled={loading || !reservable}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-60"
      >
        {!reservable ? 'این آگهی قابل رزرو نیست' : loading ? 'در حال ارسال...' : 'ارسال درخواست رزرو'}
      </button>
    </div>
  );
}
