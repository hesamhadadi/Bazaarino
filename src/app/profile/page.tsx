'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Plus, Settings, LogOut, User, Heart, ChevronLeft, Shield, Calendar } from 'lucide-react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" />
    </div>
  );

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-10">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-bl from-brand-500 via-orange-500 to-amber-400 rounded-3xl p-6 text-white mb-5 overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-10 -translate-y-10"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/10 rounded-full translate-x-6 translate-y-6"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full"></div>

          <div className="relative flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white/30 shadow-lg">
              <Image
                src={session.user.image || '/default-avatar.svg'}
                alt={session.user.name || 'avatar'}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{session.user.name}</h1>
                {session.user.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm text-xs px-2.5 py-1 rounded-full">
                    <Shield size={12} />
                    مدیر
                  </span>
                )}
              </div>
              <p className="text-white/70 text-sm mt-0.5">{session.user.email}</p>
              <div className="flex items-center gap-1 text-white/50 text-xs mt-2">
                <Calendar size={12} />
                <span>عضو بازارینو</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <Link
            href="/ads/new"
            className="bg-gradient-to-b from-brand-500 to-brand-600 text-white rounded-2xl p-4 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Plus size={20} />
            </div>
            <span className="font-medium text-sm">آگهی جدید</span>
          </Link>
          <Link
            href="/profile/ads"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 text-center text-gray-700 hover:border-brand-200 transition-colors"
          >
            <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
              <FileText size={20} className="text-brand-500" />
            </div>
            <span className="font-medium text-sm">آگهی‌های من</span>
          </Link>
          <Link
            href="/favorites"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-2 text-center text-gray-700 hover:border-rose-200 transition-colors"
          >
            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
              <Heart size={20} className="text-rose-500" />
            </div>
            <span className="font-medium text-sm">علاقه‌مندی‌ها</span>
          </Link>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <Link href="/profile/edit" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-100/50 transition-colors">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <User size={16} className="text-blue-500" />
            </div>
            <span className="text-gray-700 flex-1">ویرایش پروفایل</span>
            <ChevronLeft size={16} className="text-gray-300" />
          </Link>
          <Link href="/profile/ads" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-100/50 transition-colors">
            <div className="w-8 h-8 bg-brand-50 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-brand-500" />
            </div>
            <span className="text-gray-700 flex-1">مدیریت آگهی‌ها</span>
            <ChevronLeft size={16} className="text-gray-300" />
          </Link>
          <Link href="/favorites" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-100/50 transition-colors">
            <div className="w-8 h-8 bg-rose-50 rounded-lg flex items-center justify-center">
              <Heart size={16} className="text-rose-400" />
            </div>
            <span className="text-gray-700 flex-1">علاقه‌مندی‌ها</span>
            <ChevronLeft size={16} className="text-gray-300" />
          </Link>
          {session.user.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-5 py-4 hover:bg-orange-50 border-b border-gray-100/50 transition-colors">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Settings size={16} className="text-orange-500" />
              </div>
              <span className="text-orange-600 font-medium flex-1">پنل مدیریت</span>
              <ChevronLeft size={16} className="text-orange-300" />
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-5 py-4 hover:bg-red-50 w-full text-right transition-colors"
          >
            <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
              <LogOut size={16} className="text-red-400" />
            </div>
            <span className="text-red-600 flex-1">خروج از حساب</span>
          </button>
        </div>

        {/* Branding note */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400">بازارینو — نیازمندی‌های ایرانیان اروپا <span aria-label="ایتالیا، آلمان، و انگلستان">🇮🇹🇩🇪🇬🇧</span></p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
