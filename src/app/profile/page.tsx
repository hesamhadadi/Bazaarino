'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Plus, Settings, LogOut, User, Heart } from 'lucide-react';

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
        <div className="bg-gradient-to-bl from-brand-500 to-orange-400 rounded-3xl p-6 text-white mb-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl overflow-hidden">
              <Image
                src={session.user.image || '/default-avatar.svg'}
                alt={session.user.name || 'avatar'}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">{session.user.name}</h1>
              <p className="text-white/70 text-sm">{session.user.email}</p>
              {session.user.role === 'admin' && (
                <span className="inline-block bg-white/20 text-xs px-2 py-0.5 rounded-full mt-1">مدیر سیستم</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <Link
            href="/ads/new"
            className="bg-brand-500 text-white rounded-2xl p-4 flex items-center gap-3"
          >
            <Plus size={20} />
            <span className="font-medium">آگهی جدید</span>
          </Link>
          <Link
            href="/profile/ads"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 text-gray-700"
          >
            <FileText size={20} className="text-brand-500" />
            <span className="font-medium">آگهی‌های من</span>
          </Link>
          <Link
            href="/favorites"
            className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 text-gray-700"
          >
            <Heart size={20} className="text-rose-500" />
            <span className="font-medium">علاقه‌مندی‌ها</span>
          </Link>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <Link href="/profile/edit" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
            <User size={18} className="text-gray-400" />
            <span className="text-gray-700">ویرایش پروفایل</span>
          </Link>
          <Link href="/profile/ads" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
            <FileText size={18} className="text-gray-400" />
            <span className="text-gray-700">مدیریت آگهی‌ها</span>
          </Link>
          <Link href="/favorites" className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 border-b border-gray-50 transition-colors">
            <Heart size={18} className="text-rose-400" />
            <span className="text-gray-700">علاقه‌مندی‌ها</span>
          </Link>
          {session.user.role === 'admin' && (
            <Link href="/admin" className="flex items-center gap-3 px-5 py-4 hover:bg-orange-50 border-b border-gray-50 transition-colors">
              <Settings size={18} className="text-orange-500" />
              <span className="text-orange-600 font-medium">پنل مدیریت</span>
            </Link>
          )}
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="flex items-center gap-3 px-5 py-4 hover:bg-red-50 w-full text-right transition-colors"
          >
            <LogOut size={18} className="text-red-400" />
            <span className="text-red-600">خروج از حساب</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
