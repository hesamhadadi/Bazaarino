type ChatEventType = 'message:new' | 'message:read' | 'conversation:updated' | 'presence:changed' | 'unread:changed';

type ChatEvent = {
  type: ChatEventType;
  userIds: string[];
  payload?: Record<string, any>;
};

type Listener = (event: ChatEvent) => void;

const listeners = new Set<Listener>();

export function publishChatEvent(event: ChatEvent) {
  for (const listener of Array.from(listeners)) {
    try {
      listener(event);
    } catch {
      // ignore listener errors
    }
  }
}

export function subscribeChatEvents(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
