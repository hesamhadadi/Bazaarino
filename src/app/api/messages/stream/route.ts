import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { resolveSessionUserId } from '@/lib/session-user';
import { subscribeChatEvents } from '@/lib/chat-events';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ message: 'لطفاً وارد شوید' }, { status: 401 });

  const userId = await resolveSessionUserId(session.user);
  if (!userId) return NextResponse.json({ message: 'کاربر معتبر یافت نشد' }, { status: 401 });

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const write = (data: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      write({ type: 'connected' });
      const heartbeat = setInterval(() => write({ type: 'ping' }), 25000);

      const unsubscribe = subscribeChatEvents((event) => {
        if (!event.userIds.includes(userId)) return;
        write(event);
      });

      const close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // ignore close race
        }
      };

      // @ts-ignore runtime supported on platform
      controller.signal?.addEventListener?.('abort', close);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
