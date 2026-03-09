'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setStandalone(inStandalone);
    if (!inStandalone) setVisible(true);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const isInstallable = useMemo(() => Boolean(deferredPrompt), [deferredPrompt]);

  const installApp = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  if (!visible || standalone) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-[60]">
      <div className="max-w-xl mx-auto rounded-2xl border border-orange-200 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
            <Download size={17} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 font-semibold">برای تجربه کاربری بهتر، بازارینو را نصب کنید.</p>
            {!isInstallable && (
              <p className="text-xs text-gray-500 mt-0.5">اگر دکمه نصب را نمی‌بینید، از منوی مرورگر گزینه Add to Home Screen را بزنید.</p>
            )}
          </div>
          {isInstallable && (
            <button
              onClick={installApp}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
            >
              نصب
            </button>
          )}
          <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-md">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
