'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!token) {
      toast.error('لینک معتبر نیست');
      return;
    }
    if (!password || password.length < 6) {
      toast.error('رمز عبور باید حداقل ۶ کاراکتر باشد');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('تکرار رمز عبور مطابقت ندارد');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'خطا در تغییر رمز');
        return;
      }
      toast.success('رمز عبور تغییر کرد');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-brand-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-6">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="w-2.5 h-8 bg-green-600 rounded-sm"></span>
              <span className="w-2.5 h-8 bg-gray-200 rounded-sm"></span>
              <span className="w-2.5 h-8 bg-red-600 rounded-sm"></span>
            </div>
            <span className="text-2xl font-bold text-gray-800">بازارینو</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">تنظیم رمز عبور جدید</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رمز عبور جدید</label>
            <div className="relative">
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={show ? 'text' : 'password'}
                placeholder="حداقل ۶ کاراکتر"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <Lock size={16} className="absolute right-3 top-3.5 text-gray-400" />
              <button type="button" onClick={() => setShow(!show)} className="absolute left-3 top-3.5 text-gray-400">
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">تکرار رمز عبور</label>
            <div className="relative">
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                placeholder="تکرار رمز عبور"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              />
              <Lock size={16} className="absolute right-3 top-3.5 text-gray-400" />
            </div>
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition-colors"
          >
            {loading ? 'در حال ثبت...' : 'ثبت رمز جدید'}
          </button>
        </div>
      </div>
    </div>
  );
}
