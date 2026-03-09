'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('ایمیل معتبر وارد کنید'),
  password: z.string().min(6, 'رمز عبور باید حداقل ۶ کاراکتر باشد'),
});

type LoginForm = z.infer<typeof loginSchema>;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('خوش اومدی! 👋');
        router.push('/');
        router.refresh();
      }
    } catch {
      toast.error('خطایی رخ داد');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch {
      toast.error('خطا در ورود با گوگل');
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-bl from-brand-50 to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex gap-0.5">
              <span className="w-2.5 h-8 bg-green-600 rounded-sm"></span>
              <span className="w-2.5 h-8 bg-gray-200 rounded-sm"></span>
              <span className="w-2.5 h-8 bg-red-600 rounded-sm"></span>
            </div>
            <span className="text-2xl font-bold text-gray-800">بازارینو</span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">ورود به حساب کاربری</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-xl font-medium transition-all text-sm mb-4 disabled:opacity-60"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            ورود با حساب گوگل
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-100"></div>
            <span className="text-xs text-gray-400">یا با ایمیل</span>
            <div className="flex-1 h-px bg-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ایمیل</label>
              <div className="relative">
                <input
                  {...register('email')}
                  type="email"
                  placeholder="example@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
                />
                <Mail size={16} className="absolute right-3 top-3.5 text-gray-400" />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">رمز عبور</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="رمز عبور خود را وارد کنید"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent"
                />
                <Lock size={16} className="absolute right-3 top-3.5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-3.5 text-gray-400"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>ورود</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              حساب کاربری ندارید؟{' '}
              <Link href="/auth/register" className="text-brand-600 font-medium hover:underline">
                ثبت‌نام کنید
              </Link>
            </p>
          </div>
        </div>

        <div className="text-center mt-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1">
            <ArrowRight size={14} />
            بازگشت به صفحه اصلی
          </Link>
        </div>
      </div>
    </div>
  );
}
