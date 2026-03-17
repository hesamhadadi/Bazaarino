'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { MessageCircle, ChevronLeft } from 'lucide-react';
import { toFaDigits } from '@/lib/locale';
import toast from 'react-hot-toast';

type ConversationItem = {
  _id: string;
  ad?: { _id: string; title?: string; images?: string[]; status?: string };
  otherUser?: { name?: string; avatar?: string };
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

export default function MessagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const fetchConversations = async () => {
      try {
        const res = await fetch('/api/conversations', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || 'خطا در دریافت گفتگوها');
        setConversations(data.conversations || []);
      } catch (error: any) {
        toast.error(error?.message || 'خطا در دریافت گفتگوها');
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
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

        {conversations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-5xl mb-3">💬</p>
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
                    <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm text-gray-800 truncate">{conversation.otherUser?.name || 'کاربر'}</p>
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
      </div>
      <BottomNav />
    </div>
  );
}
