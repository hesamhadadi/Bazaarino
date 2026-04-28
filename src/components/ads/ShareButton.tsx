'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Copy, Mail, Link2, Share2, Check } from 'lucide-react';

interface ShareButtonProps {
  title: string;
  text?: string;
  /**
   * Optional canonical URL to share. When omitted we fall back to the
   * current page URL — useful so this component "just works" on both
   * server-rendered and client-rendered pages without prop plumbing.
   */
  url?: string;
  className?: string;
}

/**
 * Brand-coloured social share menu.
 *
 * Why one button + popover (instead of inline social icons):
 *   - keeps the page header tidy on mobile
 *   - works the same on ad detail and article pages
 *   - we still expose `navigator.share` for native OS sheets on mobile
 *     because that's where users actually share to private chats /
 *     non-listed apps (Signal, Threema, …).
 *
 * SVG icons are inlined for the brand-specific networks (lucide doesn't
 * ship trademarked logos) but kept tiny (single path) to avoid bloat.
 */
export default function ShareButton({ title, text, url, className }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resolve the URL we're sharing. We fall back to the current page so the
  // component works even when the parent didn't pass a URL.
  const resolvedUrl =
    url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareText = text || title;

  // Close the popover when clicking outside or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const enc = (s: string) => encodeURIComponent(s);

  const networks = [
    {
      name: 'واتساپ',
      bg: 'bg-[#25D366] hover:bg-[#1DAE52]',
      href: `https://wa.me/?text=${enc(`${title}\n${resolvedUrl}`)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.077 4.487.71.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.005a9.87 9.87 0 0 1-5.031-1.378l-.36-.214-3.741.982.999-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.886 9.884zm8.413-18.298A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      ),
    },
    {
      name: 'تلگرام',
      bg: 'bg-[#0088cc] hover:bg-[#006699]',
      href: `https://t.me/share/url?url=${enc(resolvedUrl)}&text=${enc(title)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z" />
        </svg>
      ),
    },
    {
      name: 'X / توییتر',
      bg: 'bg-black hover:bg-gray-800',
      href: `https://twitter.com/intent/tweet?url=${enc(resolvedUrl)}&text=${enc(title)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
    },
    {
      name: 'فیسبوک',
      bg: 'bg-[#1877F2] hover:bg-[#125dc7]',
      href: `https://www.facebook.com/sharer/sharer.php?u=${enc(resolvedUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M22.675 0H1.325C.593 0 0 .593 0 1.325v21.351C0 23.407.593 24 1.325 24H12.82V14.706h-3.13v-3.622h3.13V8.413c0-3.1 1.894-4.788 4.66-4.788 1.325 0 2.464.099 2.795.143v3.24l-1.918.001c-1.504 0-1.795.715-1.795 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116c.73 0 1.323-.593 1.323-1.325V1.325C24 .593 23.407 0 22.675 0z" />
        </svg>
      ),
    },
    {
      name: 'لینکدین',
      bg: 'bg-[#0A66C2] hover:bg-[#084d92]',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(resolvedUrl)}`,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.226.792 24 1.771 24h20.451C23.2 24 24 23.226 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ];

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(resolvedUrl);
      setCopied(true);
      toast.success('لینک کپی شد');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('کپی نشد');
    }
  };

  const onNativeShare = async () => {
    if (typeof navigator === 'undefined' || !('share' in navigator)) return;
    try {
      await navigator.share({ title, text: shareText, url: resolvedUrl });
      setOpen(false);
    } catch {
      // User cancelled — fine.
    }
  };

  const hasNativeShare =
    typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <div className={`relative ${className || ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="اشتراک‌گذاری"
        aria-expanded={open}
        className="w-9 h-9 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition"
      >
        <Share2 size={16} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute z-30 mt-2 right-0 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-3 origin-top-right animate-in fade-in slide-in-from-top-1"
        >
          <p className="text-xs font-semibold text-gray-500 mb-2 px-1">
            اشتراک‌گذاری در:
          </p>

          <div className="grid grid-cols-5 gap-2 mb-3">
            {networks.map((n) => (
              <a
                key={n.name}
                href={n.href}
                target="_blank"
                rel="noopener noreferrer"
                title={n.name}
                aria-label={n.name}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-center w-10 h-10 rounded-full text-white transition ${n.bg}`}
              >
                {n.icon}
              </a>
            ))}
          </div>

          <a
            href={`mailto:?subject=${enc(title)}&body=${enc(`${shareText}\n\n${resolvedUrl}`)}`}
            onClick={() => setOpen(false)}
            className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            <Mail size={16} className="text-gray-500" />
            ارسال با ایمیل
          </a>

          <button
            type="button"
            onClick={onCopy}
            className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            {copied ? (
              <>
                <Check size={16} className="text-emerald-500" />
                کپی شد
              </>
            ) : (
              <>
                <Copy size={16} className="text-gray-500" />
                کپی لینک
              </>
            )}
          </button>

          {hasNativeShare && (
            <button
              type="button"
              onClick={onNativeShare}
              className="w-full inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition"
            >
              <Link2 size={16} className="text-gray-500" />
              سایر اپلیکیشن‌ها…
            </button>
          )}
        </div>
      )}
    </div>
  );
}
