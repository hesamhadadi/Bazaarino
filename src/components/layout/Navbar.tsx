'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';
import { Menu, X, Plus, User, LogOut, Settings, FileText, ChevronDown, Heart, Newspaper, MessageCircle, Bell } from 'lucide-react';
import NotificationBell from '@/components/notifications/NotificationBell';

export default function Navbar() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo-eu.svg" alt="bazaarino" width={28} height={28} />
            <span className="text-xl font-bold text-gray-800">بازارینو</span>
          </Link>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/news" className="text-gray-600 hover:text-gray-800 text-sm font-medium px-2 py-2">
              اخبار
            </Link>
            {session && (
              <Link href="/messages" className="text-gray-600 hover:text-gray-800 text-sm font-medium px-2 py-2">
                گفتگوها
              </Link>
            )}
            {session ? (
              <>
                <NotificationBell />
                <Link
                  href="/ads/new"
                  className="flex items-center gap-2 bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl font-medium transition-colors text-sm"
                >
                  <Plus size={16} />
                  آگهی رایگان
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-xl transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-brand-100">
                      <Image src={session.user.image || '/default-avatar.svg'} alt={session.user.name || 'avatar'} width={28} height={28} className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm font-medium">{session.user.name}</span>
                    <ChevronDown size={14} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User size={14} />
                        پروفایل من
                      </Link>
                      <Link
                        href="/profile/ads"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <FileText size={14} />
                        آگهی‌های من
                      </Link>
                      <Link
                        href="/messages"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <MessageCircle size={14} />
                        گفتگوها
                      </Link>
                      <Link
                        href="/notifications"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Bell size={14} />
                        اعلان‌ها
                      </Link>
                      <Link
                        href="/favorites"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Heart size={14} />
                        علاقه‌مندی‌ها
                      </Link>
                      <Link
                        href="/news"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <Newspaper size={14} />
                        اخبار و مقالات
                      </Link>
                      {session.user.role === 'admin' && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings size={14} />
                          پنل مدیریت
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={() => { signOut(); setUserMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={14} />
                        خروج
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-2"
                >
                  ورود
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                >
                  ثبت‌نام
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-600 p-2"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {session ? (
              <>
                <Link href="/ads/new" className="flex items-center gap-2 text-brand-600 font-medium px-2 py-2.5" onClick={() => setMenuOpen(false)}>
                  <Plus size={16} /> ثبت آگهی رایگان
                </Link>
                <Link href="/profile" className="flex items-center gap-2 text-gray-700 px-2 py-2.5" onClick={() => setMenuOpen(false)}>
                  <User size={16} /> پروفایل من
                </Link>
                <Link href="/profile/ads" className="flex items-center gap-2 text-gray-700 px-2 py-2.5" onClick={() => setMenuOpen(false)}>
                  <FileText size={16} /> آگهی‌های من
                </Link>
                <Link href="/favorites" className="flex items-center gap-2 text-gray-700 px-2 py-2.5" onClick={() => setMenuOpen(false)}>
                  <Heart size={16} /> علاقه‌مندی‌ها
                </Link>
                <Link href="/notifications" className="flex items-center gap-2 text-gray-700 px-2 py-2.5" onClick={() => setMenuOpen(false)}>
                  <Bell size={16} /> اعلان‌ها
                </Link>
                <Link href="/messages" className="flex items-center gap-2 text-gray-700 px-2 py-2.5" onClick={() => setMenuOpen(false)}>
                  <MessageCircle size={16} /> گفتگوها
                </Link>
                <Link href="/news" className="flex items-center gap-2 text-gray-700 px-2 py-2.5" onClick={() => setMenuOpen(false)}>
                  <Newspaper size={16} /> اخبار و مقالات
                </Link>
                {session.user.role === 'admin' && (
                  <Link href="/admin" className="flex items-center gap-2 text-orange-600 px-2 py-2.5" onClick={() => setMenuOpen(false)}>
                    <Settings size={16} /> پنل مدیریت
                  </Link>
                )}
                <button onClick={() => signOut()} className="flex items-center gap-2 text-red-600 px-2 py-2.5 w-full">
                  <LogOut size={16} /> خروج
                </button>
              </>
            ) : (
              <>
                <Link href="/news" className="block text-gray-700 px-2 py-2.5" onClick={() => setMenuOpen(false)}>اخبار و مقالات</Link>
                <Link href="/auth/login" className="block text-gray-700 px-2 py-2.5" onClick={() => setMenuOpen(false)}>ورود</Link>
                <Link href="/auth/register" className="block text-brand-600 font-medium px-2 py-2.5" onClick={() => setMenuOpen(false)}>ثبت‌نام</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
