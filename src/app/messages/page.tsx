'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { MessageCircle, Package, ChevronLeft } from 'lucide-react';
import { toFaDigits } from '@/lib/locale';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

const CONVERSATIONS_SOCKET_FALLBACK_MS = 10000;

type ConversationItem = {
  _id: string;
  ad?: { _id: string; title?: string; images?: string[]; status?: string };
  otherUser?: { name?: string; avatar?: string; isOnline?: boolean; lastSeenAt?: string };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
};

function formatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  return new Intl.DateTimeFormat('fa-IR', {
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    day: 'numeric',
  }).format(date);
}

function PresenceStatus({ isOnline }: { isOnline?: boolean }) {
  if (!isOnline) return null;
  return <span className="text-emerald-600">• آنلاین</span>;
}

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'unread'>('recent');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const fetchConversations = async () => {
      try {
        const qs = new URLSearchParams();
        if (search.trim()) qs.set('q', search.trim());
        qs.set('sort', sort);
        qs.set('page', String(page));
        qs.set('limit', String(limit));
        const res = await fetch(`/api/conversations?${qs.toString()}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'خطا در دریافت گفتگوها');
        setConversations(data.conversations || []);
        setTotal(Number(data.total || 0));
      } catch (error: any) {
        toast.error(error?.message || 'خطا در دریافت گفتگوها');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [session, search, sort, page, refreshTick]);

  useEffect(() => {
    if (!session) return;
    let socket: Socket | null = null;
    let fallback: any = null;

    const connect = async () => {
      await fetch('/api/socket', { cache: 'no-store' });
      socket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        auth: { userId: session.user.id },
      });
      socket.on('conversation_updated', () => setRefreshTick((v) => v + 1));
      socket.on('unread_changed', () => setRefreshTick((v) => v + 1));
      socket.on('presence_changed', () => setRefreshTick((v) => v + 1));
    };

    connect().catch(() => undefined);
    fallback = setInterval(() => {
      if (!socket || !socket.connected) setRefreshTick((v) => v + 1);
    }, CONVERSATIONS_SOCKET_FALLBACK_MS);

    return () => {
      if (fallback) clearInterval(fallback);
      socket?.disconnect();
    };
  }, [session]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" /></div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-10">
        <div className="flex items-center gap-2 mb-5">
          <MessageCircle size={18} className="text-brand-500" />
          <h1 className="text-xl font-bold text-gray-800">گفتگوهای من</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-3 mb-3 space-y-2">
          <input
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="جستجو در نام کاربر، آگهی یا متن..."
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setPage(1);
                setSort('recent');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs ${sort === 'recent' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              جدیدترین
            </button>
            <button
              onClick={() => {
                setPage(1);
                setSort('unread');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs ${sort === 'unread' ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              خوانده‌نشده
            </button>
          </div>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-500">
              <MessageCircle size={26} />
            </div>
            <p className="text-gray-500">هنوز گفتگویی شروع نشده است</p>
          </div>
        ) : (
          <div className="space-y-3">
            {conversations.map((conversation) => (
              <Link key={conversation._id} href={`/messages/${conversation._id}`} className="bg-white rounded-2xl border border-gray-100 p-3 flex gap-3 items-center">
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  {conversation.ad?.images?.[0] ? (
                    <Image src={conversation.ad.images[0]} alt={conversation.ad?.title || 'ad'} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={20} /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">
                      {conversation.otherUser?.name || 'کاربر'} <PresenceStatus isOnline={conversation.otherUser?.isOnline} />
                    </p>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTime(conversation.lastMessageAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-1">{conversation.ad?.title || 'آگهی'}</p>
                  <p className="text-xs text-gray-600 truncate mt-1">{conversation.lastMessage || 'هنوز پیامی ارسال نشده'}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {Number(conversation.unreadCount || 0) > 0 && (
                    <span className="min-w-5 h-5 px-1 rounded-full bg-brand-500 text-white text-[11px] flex items-center justify-center">
                      {toFaDigits(conversation.unreadCount || 0)}
                    </span>
                  )}
                  <ChevronLeft size={16} className="text-gray-300" />
                </div>
              </Link>
            ))}
          </div>
        )}
        {total > limit && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs disabled:opacity-60"
            >
              قبلی
            </button>
            <span className="text-xs text-gray-500">{toFaDigits(page)}</span>
            <button
              onClick={() => setPage((p) => (p * limit < total ? p + 1 : p))}
              disabled={page * limit >= total}
              className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs disabled:opacity-60"
            >
              بعدی
            </button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
