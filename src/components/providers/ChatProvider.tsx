'use client';

import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';

const HEARTBEAT_INTERVAL_MS = 45000;
const SOCKET_FALLBACK_POLL_MS = 12000;

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
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const hasSocketRef = useRef(false);
  const socketRef = useRef<Socket | null>(null);

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

    const heartbeat = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    const connectSocket = async () => {
      await fetch('/api/socket', { cache: 'no-store' });
      const userId = session?.user?.id;
      const socket = io({
        path: '/api/socket',
        transports: ['websocket', 'polling'],
        auth: { userId },
      });
      socketRef.current = socket;
      hasSocketRef.current = true;

      socket.on('unread_changed', (payload) => {
        setUnreadCount(Number(payload?.unreadCount || 0));
      });
      socket.on('conversation_updated', () => {
        refreshUnreadCount();
      });
      socket.on('disconnect', () => {
        hasSocketRef.current = false;
      });
    };

    connectSocket().catch(() => {
      console.error('Chat socket connection failed');
      hasSocketRef.current = false;
    });

    const fallbackPoll = setInterval(() => {
      if (!hasSocketRef.current) {
        connectSocket().catch(() => {
          console.error('Chat socket reconnect failed');
          hasSocketRef.current = false;
        });
        refreshUnreadCount();
      }
    }, SOCKET_FALLBACK_POLL_MS);

    return () => {
      clearInterval(heartbeat);
      clearInterval(fallbackPoll);
      socketRef.current?.disconnect();
      socketRef.current = null;
      hasSocketRef.current = false;
    };
  }, [status, session?.user?.id]);

  const value = useMemo(
    () => ({
      unreadCount,
      refreshUnreadCount,
    }),
    [unreadCount]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
