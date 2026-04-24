'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signIn } from 'next-auth/react';
import toast from 'react-hot-toast';
import { Phone, KeyRound, ArrowLeft } from 'lucide-react';

export default function PhoneLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get('callbackUrl') || '/';

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [deliveryChannel, setDeliveryChannel] = useState<'telegram' | 'email' | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  async function sendCode() {
    if (!phone.trim()) return toast.error('شماره را وارد کنید');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        toast.error(data.message || 'ارسال کد ناموفق بود');
        return;
      }
      setDeliveryChannel(data.channel);
      setCooldown(data.cooldownSeconds || 60);
      setStep('code');
      toast.success(data.message || 'کد ارسال شد');
    } catch {
      toast.error('خطای شبکه');
    } finally {
      setLoading(false);
    }
  }

  async function submitCode() {
    if (!/^\d{6}$/.test(code.trim())) return toast.error('کد ۶ رقمی را وارد کنید');
    setLoading(true);
    try {
      const result = await signIn('phone-otp', {
        phone,
        code: code.trim(),
        redirect: false,
        callbackUrl,
      });
      if (!result) {
        toast.error('خطای سرور');
      } else if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('خوش اومدی!');
        router.push(callbackUrl);
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Image src="/logo-eu.svg" alt="bazaarino" width={32} height={32} />
          <span className="text-xl font-bold text-gray-800">بازارینو</span>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-1">ورود با شماره موبایل</h1>
        <p className="text-sm text-gray-500 mb-6 leading-7">
          {step === 'phone'
            ? 'شماره خود را وارد کنید. کد تأیید از طریق تلگرام یا ایمیل ارسال می‌شود.'
            : `کد ۶ رقمی ارسال‌شده را وارد کنید${deliveryChannel === 'telegram' ? ' (در چت @VerificationCodes تلگرام)' : deliveryChannel === 'email' ? ' (در ایمیل شما)' : ''}.`}
        </p>

        {step === 'phone' ? (
          <div className="space-y-3">
            <label className="block text-xs text-gray-600 mb-1">شماره موبایل (با کد کشور، مثلاً ‎+98 9121234567 یا ‎+39 3401234567)</label>
            <div className="relative">
              <Phone size={16} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+98 912 123 4567"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 pr-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
            </div>
            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 font-semibold text-sm"
            >
              {loading ? 'در حال ارسال...' : 'دریافت کد تأیید'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs text-gray-600 mb-1">کد ۶ رقمی</label>
            <div className="relative">
              <KeyRound size={16} className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                dir="ltr"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="------"
                className="w-full border border-gray-200 rounded-xl px-3 py-3 pr-9 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-300 tracking-[0.5em] text-center"
              />
            </div>
            <button
              onClick={submitCode}
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-xl py-3 font-semibold text-sm"
            >
              {loading ? 'در حال بررسی...' : 'ورود'}
            </button>

            <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="inline-flex items-center gap-1 hover:text-gray-700"
              >
                <ArrowLeft size={12} /> ویرایش شماره
              </button>
              <button
                type="button"
                onClick={sendCode}
                disabled={cooldown > 0 || loading}
                className="disabled:opacity-40 hover:text-brand-600"
              >
                {cooldown > 0 ? `ارسال مجدد (${cooldown})` : 'ارسال مجدد کد'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-gray-100 text-center text-xs text-gray-500">
          ترجیح می‌دهید با ایمیل وارد شوید؟{' '}
          <Link href="/auth/login" className="text-brand-600 font-semibold">ورود با ایمیل</Link>
        </div>
      </div>
    </div>
  );
}
