'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import BottomNav from '@/components/layout/BottomNav';
import { ChevronRight, SendHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

type Conversation = {
  _id: string;
  ad?: { _id: string; title?: string; images?: string[] };
  otherUser?: { name?: string; avatar?: string };
};

type MessageItem = {
  _id: string;
  senderId?: { _id?: string; name?: string; avatar?: string } | string;
  content?: string;
  createdAt?: string;
};

function formatTime(value?: string) {
  if (!value) return '';
  return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}

export default function ConversationPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const currentUserId = session?.user?.id;

  const markAsRead = async () => {
    try {
      await fetch(`/api/conversations/${params.id}/read`, { method: 'PATCH' });
    } catch {
      // ignore
    }
  };

  const fetchConversation = async () => {
    const res = await fetch(`/api/conversations/${params.id}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'خطا در دریافت گفتگو');
    setConversation(data.conversation);
  };

  const fetchMessages = async () => {
    const res = await fetch(`/api/conversations/${params.id}/messages`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'خطا در دریافت پیام‌ها');
    setMessages(data.messages || []);
  };

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (!session) return;

    const load = async () => {
      try {
        await Promise.all([fetchConversation(), fetchMessages(), markAsRead()]);
      } catch (error: any) {
        toast.error(error?.message || 'خطا در بارگذاری گفتگو');
      } finally {
        setLoading(false);
      }
    };

    load();

    const interval = setInterval(() => {
      fetchMessages().then(markAsRead).catch(() => undefined);
    }, 5000);

    return () => clearInterval(interval);
  }, [session, params.id]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const onSend = async (e: FormEvent) => {
    e.preventDefault();

    const text = content.trim();
    if (!text) return;

    try {
      setSending(true);
      const res = await fetch(`/api/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'ارسال پیام ناموفق بود');

      setMessages((prev) => [...prev, data.message]);
      setContent('');
    } catch (error: any) {
      toast.error(error?.message || 'ارسال پیام ناموفق بود');
    } finally {
      setSending(false);
    }
  };

  const title = useMemo(() => conversation?.ad?.title || 'گفتگو', [conversation?.ad?.title]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-300 border-t-brand-500 rounded-full animate-spin" /></div>;
  }

  if (!session || !conversation) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-4 pb-24 md:pb-10">
        <div className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3 mb-3">
          <Link href="/messages" className="p-2 rounded-lg hover:bg-gray-100">
            <ChevronRight size={18} className="text-gray-500" />
          </Link>
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
            <Image src={conversation.otherUser?.avatar || '/default-avatar.svg'} alt={conversation.otherUser?.name || 'user'} width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 truncate">{conversation.otherUser?.name || 'کاربر'}</p>
            <p className="text-xs text-gray-500 truncate">{title}</p>
          </div>
          {conversation.ad?._id && (
            <Link href={`/ads/${conversation.ad._id}`} className="text-xs text-brand-600 font-medium">مشاهده آگهی</Link>
          )}
        </div>

        <div ref={listRef} className="bg-white border border-gray-100 rounded-2xl p-3 h-[55vh] overflow-y-auto space-y-2">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">اولین پیام را ارسال کنید</div>
          ) : (
            messages.map((message) => {
              const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
              const mine = senderId === currentUserId;

              return (
                <div key={message._id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? 'bg-brand-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    <p className={`text-[11px] mt-1 ${mine ? 'text-white/80' : 'text-gray-400'}`}>{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form onSubmit={onSend} className="mt-3 bg-white border border-gray-100 rounded-2xl p-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center disabled:opacity-60"
          >
            <SendHorizontal size={16} />
          </button>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="پیام خود را بنویسید..."
            maxLength={1000}
            className="flex-1 bg-transparent outline-none text-sm px-2"
          />
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
