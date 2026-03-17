'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Props = {
  adId: string;
  sellerId: string;
};

export default function StartChatButton({ adId, sellerId }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);

  const isOwner = session?.user?.id === sellerId;

  const onStartChat = async () => {
    if (isOwner) return;

    if (!session) {
      const callback = encodeURIComponent(pathname || `/ads/${adId}`);
      router.push(`/auth/login?callbackUrl=${callback}`);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'خطا در ایجاد گفتگو');
      }

      router.push(`/messages/${data.conversationId}`);
    } catch (error: any) {
      toast.error(error?.message || 'خطا در شروع چت');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onStartChat}
      disabled={loading || isOwner}
      className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-brand-500 to-orange-500 text-white py-3 rounded-2xl font-semibold text-sm shadow-sm disabled:opacity-60"
    >
      <MessageCircle size={16} />
      {isOwner ? 'این آگهی متعلق به شماست' : loading ? 'در حال ایجاد گفتگو...' : 'چت با صاحب آگهی'}
    </button>
  );
}
