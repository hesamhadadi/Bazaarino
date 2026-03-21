'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, Search, Plus, User, Newspaper } from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'خانه' },
  { href: '/search', icon: Search, label: 'جستجو' },
  { href: '/ads/new', icon: Plus, label: 'افزودن آگهی', special: true },
  { href: '/news', icon: Newspaper, label: 'اخبار' },
  { href: '/profile', icon: User, label: '' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!pathname || pathname.startsWith('/admin')) return null;

  return (
    <nav className="bottom-nav md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(({ href, icon: Icon, label, special }) => {
          const isActive = pathname === href;
          const isProfile = href === '/profile';

          if (special) {
            return (
              <Link key={href} href={session ? href : '/auth/login'} className="flex flex-col items-center">
                <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center shadow-lg -mt-5">
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-xs text-gray-500 mt-1">{label}</span>
              </Link>
            );
          }

          if (isProfile) {
            return (
              <Link key={href} href={session ? href : '/auth/login'} className="flex flex-col items-center gap-0.5 px-3 py-1">
                {session?.user?.image ? (
                  <span className={`w-6 h-6 rounded-full overflow-hidden border ${isActive ? 'border-orange-500' : 'border-gray-200'}`}>
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'profile'}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                    />
                  </span>
                ) : (
                  <Icon size={22} className={isActive ? 'text-orange-500' : 'text-gray-400'} />
                )}
              </Link>
            );
          }

          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 px-3 py-1">
              <Icon size={22} className={isActive ? 'text-orange-500' : 'text-gray-400'} />
              <span className={`text-xs ${isActive ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
