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
import { parseReservationToken } from '@/lib/reservation';
import { io, Socket } from 'socket.io-client';

const CONVERSATION_SOCKET_FALLBACK_MS = 7000;
const TYPING_INDICATOR_MS = 2000;
const MESSAGE_PAGE_LIMIT = 30;

type Conversation = {
  _id: string;
  ad?: { _id: string; title?: string; images?: string[] };
  otherUser?: { name?: string; avatar?: string; isOnline?: boolean; lastSeenAt?: string };
};

type MessageItem = {
  _id: string;
  senderId?: { _id?: string; name?: string; avatar?: string } | string;
  type?: 'text' | 'image';
  content?: string;
  imageUrl?: string;
  createdAt?: string;
};

type ReservationItem = {
  _id: string;
  buyerId: string;
  sellerId: string;
  startDate: string;
  endDate: string;
  nights: number;
  nightlyPrice: number;
  totalPrice: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
};

function formatReservationDate(value?: string) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toISOString().slice(0, 10);
}

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [content, setContent] = useState('');
  const [typing, setTyping] = useState(false);
  const [reservationMap, setReservationMap] = useState<Record<string, ReservationItem | null>>({});
  const [reservationLoadingMap, setReservationLoadingMap] = useState<Record<string, boolean>>({});
  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<any>(null);
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

  const fetchMessages = async (before?: string, appendTop = false) => {
    const qs = new URLSearchParams();
    if (before) qs.set('before', before);
    qs.set('limit', String(MESSAGE_PAGE_LIMIT));
    const res = await fetch(`/api/conversations/${params.id}/messages?${qs.toString()}`, { cache: 'no-store' });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'خطا در دریافت پیام‌ها');
    const incoming = data.messages || [];
    setNextCursor(data.nextCursor || null);
    if (appendTop) {
      setMessages((prev) => [...incoming, ...prev]);
    } else {
      setMessages(incoming);
    }
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
    const fallback = setInterval(() => {
      if (!socketRef.current || !socketRef.current.connected) {
        fetchMessages().then(markAsRead).catch(() => undefined);
      }
    }, CONVERSATION_SOCKET_FALLBACK_MS);

    const connectSocket = async () => {
      await fetch('/api/socket', { cache: 'no-store' });
      const socket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        auth: { userId: session?.user?.id },
      });
      socketRef.current = socket;
      socket.emit('join_conversation', params.id);
      socket.on('new_message', (payload) => {
        if (payload?.conversationId !== params.id) return;
        setMessages((prev) => [...prev, payload.message]);
        markAsRead();
      });
      socket.on('message_read', () => {
        markAsRead();
      });
      socket.on('presence_changed', (payload) => {
        if (!payload?.userId) return;
        setConversation((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            otherUser: {
              ...prev.otherUser,
              isOnline: payload.isOnline,
              lastSeenAt: payload.lastSeenAt,
            },
          };
        });
      });
      socket.on('user_typing', (payload) => {
        if (!payload?.conversationId || payload.conversationId !== params.id) return;
        setTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setTyping(false), TYPING_INDICATOR_MS);
      });
    };

    connectSocket().catch(() => undefined);

    return () => {
      clearInterval(fallback);
      socketRef.current?.emit('leave_conversation', params.id);
      socketRef.current?.disconnect();
      socketRef.current = null;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [session, params.id]);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    const ids = Array.from(
      new Set(messages.map((message) => parseReservationToken(message.content)).filter(Boolean))
    ) as string[];

    const missingIds = ids.filter((id) => !(id in reservationMap) && !reservationLoadingMap[id]);
    if (missingIds.length === 0) return;

    const load = async () => {
      setReservationLoadingMap((prev) => {
        const next = { ...prev };
        missingIds.forEach((id) => { next[id] = true; });
        return next;
      });

      await Promise.all(
        missingIds.map(async (id) => {
          try {
            const res = await fetch(`/api/reservations/${id}`, { cache: 'no-store' });
            const data = await res.json();
            if (res.ok && data?.reservation) {
              setReservationMap((prev) => ({ ...prev, [id]: data.reservation }));
            }
          } catch {
            setReservationMap((prev) => ({ ...prev, [id]: null }));
          } finally {
            setReservationLoadingMap((prev) => ({ ...prev, [id]: false }));
          }
        })
      );
    };

    load();
  }, [messages, reservationMap, reservationLoadingMap]);

  const updateReservationStatus = async (reservationId: string, status: 'approved' | 'rejected') => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'خطا در تغییر وضعیت رزرو');
      toast.success(data?.message || 'وضعیت رزرو بروزرسانی شد');

      const detailRes = await fetch(`/api/reservations/${reservationId}`, { cache: 'no-store' });
      const detailData = await detailRes.json();
      if (detailRes.ok && detailData?.reservation) {
        setReservationMap((prev) => ({ ...prev, [reservationId]: detailData.reservation }));
      }
      await fetchMessages();
    } catch (error: any) {
      toast.error(error?.message || 'خطا در تغییر وضعیت رزرو');
    }
  };

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

      setContent('');
    } catch (error: any) {
      toast.error(error?.message || 'ارسال پیام ناموفق بود');
    } finally {
      setSending(false);
    }
  };

  const onType = (value: string) => {
    setContent(value);
    socketRef.current?.emit('typing', { conversationId: params.id, userId: currentUserId });
  };

  const onUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch('/api/upload/chat-image', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.url) throw new Error(uploadData?.message || 'آپلود تصویر ناموفق بود');

      const sendRes = await fetch(`/api/conversations/${params.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'image', imageUrl: uploadData.url }),
      });
      const sendData = await sendRes.json();
      if (!sendRes.ok) throw new Error(sendData?.message || 'ارسال تصویر ناموفق بود');
      toast.success('تصویر ارسال شد');
    } catch (error: any) {
      toast.error(error?.message || 'ارسال تصویر ناموفق بود');
    } finally {
      setUploadingImage(false);
      e.currentTarget.value = '';
    }
  };

  const loadOlderMessages = async () => {
    if (!nextCursor || loadingOlder) return;
    try {
      setLoadingOlder(true);
      await fetchMessages(nextCursor, true);
    } catch {
      toast.error('دریافت پیام‌های قدیمی ناموفق بود');
    } finally {
      setLoadingOlder(false);
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
            <p className="text-xs text-gray-500 truncate">
              {conversation.otherUser?.isOnline
                ? 'آنلاین'
                : conversation.otherUser?.lastSeenAt
                  ? `آخرین بازدید: ${new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'numeric' }).format(new Date(conversation.otherUser.lastSeenAt))}`
                  : title}
            </p>
          </div>
          {conversation.ad?._id && (
            <Link href={`/ads/${conversation.ad._id}`} className="text-xs text-brand-600 font-medium">مشاهده آگهی</Link>
          )}
        </div>

        <div ref={listRef} className="bg-white border border-gray-100 rounded-2xl p-3 h-[55vh] overflow-y-auto space-y-2">
          {nextCursor && (
            <div className="text-center">
              <button onClick={loadOlderMessages} disabled={loadingOlder} className="text-xs text-brand-600 disabled:opacity-60">
                {loadingOlder ? 'در حال بارگذاری...' : 'نمایش پیام‌های قدیمی‌تر'}
              </button>
            </div>
          )}
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">اولین پیام را ارسال کنید</div>
          ) : (
            messages.map((message) => {
              const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId?._id;
              const mine = senderId === currentUserId;

              return (
                <div key={message._id} className={`flex ${mine ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${mine ? 'bg-brand-500 text-white rounded-br-md' : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}>
                    {message.type === 'image' && message.imageUrl ? (
                      <a href={message.imageUrl} target="_blank" rel="noreferrer">
                        <Image src={message.imageUrl} alt="chat-image" width={280} height={200} className="rounded-xl object-cover max-h-64 w-auto" />
                      </a>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                    )}
                    {parseReservationToken(message.content) && (
                      <div className={`mt-2 rounded-xl px-2.5 py-2 text-xs ${mine ? 'bg-white/20 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
                        {(() => {
                          const reservationId = parseReservationToken(message.content)!;
                          const reservation = reservationMap[reservationId];
                          if (reservation === null) return <p>خطا در دریافت اطلاعات رزرو</p>;
                          if (!reservation) return <p>در حال دریافت اطلاعات رزرو...</p>;
                          const canManage = currentUserId && reservation.sellerId === currentUserId && reservation.status === 'pending';
                          return (
                            <div className="space-y-1.5">
                              <p>تاریخ: {formatReservationDate(reservation.startDate)} تا {formatReservationDate(reservation.endDate)}</p>
                              <p>مدت: {reservation.nights} شب</p>
                              <p>مجموع: €{reservation.totalPrice}</p>
                              <p>وضعیت: {reservation.status === 'pending' ? 'در انتظار تایید' : reservation.status === 'approved' ? 'تایید شده' : 'رد شده'}</p>
                              {canManage && (
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => updateReservationStatus(reservationId, 'approved')}
                                    aria-label="تایید درخواست رزرو"
                                    className="px-2 py-1 rounded-md bg-emerald-600 text-white"
                                  >
                                    تایید
                                  </button>
                                  <button
                                    onClick={() => updateReservationStatus(reservationId, 'rejected')}
                                    aria-label="رد درخواست رزرو"
                                    className="px-2 py-1 rounded-md bg-red-600 text-white"
                                  >
                                    رد
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    <p className={`text-[11px] mt-1 ${mine ? 'text-white/80' : 'text-gray-400'}`}>{formatTime(message.createdAt)}</p>
                  </div>
                </div>
              );
            })
          )}
          {typing && <p className="text-xs text-gray-400">در حال نوشتن...</p>}
        </div>

        <form onSubmit={onSend} className="mt-3 bg-white border border-gray-100 rounded-2xl p-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={sending || !content.trim()}
            className="w-10 h-10 rounded-xl bg-brand-500 text-white flex items-center justify-center disabled:opacity-60"
          >
            <SendHorizontal size={16} />
          </button>
          <label className="text-xs text-gray-500 cursor-pointer px-2">
            {uploadingImage ? 'در حال آپلود...' : '📷'}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onUploadImage} disabled={uploadingImage || sending} />
          </label>
          <input
            value={content}
            onChange={(e) => onType(e.target.value)}
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
