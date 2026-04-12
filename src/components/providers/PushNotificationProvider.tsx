'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useSession } from 'next-auth/react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function registerPushSubscription() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return false;
  }

  const keyRes = await fetch('/api/notifications/push', { cache: 'no-store' });
  const keyData = await keyRes.json();
  const publicKey = String(keyData?.publicKey || '');
  if (!keyRes.ok || !publicKey) return false;

  const registration = await navigator.serviceWorker.register('/sw.js');
  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ||
    await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });

  const res = await fetch('/api/notifications/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });

  return res.ok;
}

export default function PushNotificationProvider() {
  const { status } = useSession();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') {
      setVisible(false);
      return;
    }

    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      registerPushSubscription().catch(() => undefined);
      return;
    }

    if (Notification.permission !== 'default') return;

    const dismissedAt = Number(localStorage.getItem('bazaarino.pushPromptDismissedAt') || 0);
    const oneDay = 24 * 60 * 60 * 1000;
    if (dismissedAt && Date.now() - dismissedAt < oneDay) return;

    const timer = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, [status]);

  const enableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await registerPushSubscription();
      }
    } finally {
      setVisible(false);
    }
  };

  const dismiss = () => {
    localStorage.setItem('bazaarino.pushPromptDismissedAt', String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 inset-x-4 z-[70]">
      <div className="max-w-xl mx-auto rounded-lg border border-emerald-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.14)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Bell size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900 font-semibold">نوتیفیکیشن‌های بازارینو را فعال کنید.</p>
            <p className="text-xs text-gray-500 mt-0.5">تأیید یا رد آگهی و پیام‌های جدید را همان لحظه دریافت می‌کنید.</p>
          </div>
          <button
            onClick={enableNotifications}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
          >
            فعال‌سازی
          </button>
          <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 p-1 rounded-md" aria-label="بستن">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
