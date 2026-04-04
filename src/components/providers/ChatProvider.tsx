'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';

type ChatContextValue = {
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
};

const ChatContext = createContext<ChatContextValue>({
  unreadCount: 0,
  refreshUnreadCount: async () => undefined,
});

export function useChat() {
  return useContext(ChatContext);
}

export default function ChatProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const hasSseRef = useRef(false);

  const refreshUnreadCount = async () => {
    if (status !== 'authenticated') {
      setUnreadCount(0);
      return;
    }
    try {
      const res = await fetch('/api/messages/unread-count', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) setUnreadCount(Number(data?.unreadCount || 0));
    } catch {
      // ignore
    }
  };

  const sendHeartbeat = async () => {
    if (status !== 'authenticated') return;
    try {
      await fetch('/api/presence/heartbeat', { method: 'POST' });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (status !== 'authenticated') {
      setUnreadCount(0);
      return;
    }

    refreshUnreadCount();
    sendHeartbeat();

    const heartbeat = setInterval(sendHeartbeat, 45000);

    const connectSSE = () => {
      const source = new EventSource('/api/messages/stream');
      hasSseRef.current = true;

      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data || '{}');
          if (parsed?.type === 'unread:changed') {
            setUnreadCount(Number(parsed?.payload?.unreadCount || 0));
            return;
          }
          if (parsed?.type === 'message:new' || parsed?.type === 'message:read' || parsed?.type === 'conversation:updated') {
            refreshUnreadCount();
          }
        } catch {
          // ignore parse errors
        }
      };

      source.onerror = () => {
        hasSseRef.current = false;
        source.close();
      };

      return source;
    };

    let source = connectSSE();
    const fallbackPoll = setInterval(() => {
      if (!hasSseRef.current) {
        source = connectSSE();
        refreshUnreadCount();
      }
    }, 12000);

    return () => {
      clearInterval(heartbeat);
      clearInterval(fallbackPoll);
      source?.close();
      hasSseRef.current = false;
    };
  }, [status]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
    }),
    [unreadCount]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
