'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface AdImageGalleryProps {
  images: string[];
  videos?: string[];
  title: string;
}

export default function AdImageGallery({ images, videos = [], title }: AdImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const mediaItems = [
    ...images.map((url) => ({ type: 'image' as const, url })),
    ...videos.map((url) => ({ type: 'video' as const, url })),
  ];

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!mediaItems.length) return null;

  const next = () => setActiveIndex((prev) => (prev + 1) % mediaItems.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  const activeItem = mediaItems[activeIndex];

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative aspect-[4/3] w-full block"
        >
          {activeItem.type === 'image' ? (
            <Image src={activeItem.url} alt={title} fill className="object-cover" priority />
          ) : (
            <video src={activeItem.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
          )}
        </button>

        {mediaItems.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto">
            {mediaItems.map((item, i) => (
              <button
                key={`${item.url}-${i}`}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 ${
                  i === activeIndex ? 'border-brand-500' : 'border-gray-200'
                }`}
              >
                {item.type === 'image' ? (
                  <Image src={item.url} alt={`تصویر ${i + 1}`} fill className="object-cover" />
                ) : (
                  <video src={item.url} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[80] bg-black/90 p-3 md:p-8"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 text-white/90 hover:text-white bg-black/40 rounded-full p-3"
          >
            <X size={18} />
          </button>

          {mediaItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute top-1/2 -translate-y-1/2 right-3 md:right-8 text-white bg-black/40 rounded-full p-2"
              >
                <ChevronRight size={20} />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute top-1/2 -translate-y-1/2 left-3 md:left-8 text-white bg-black/40 rounded-full p-2"
              >
                <ChevronLeft size={20} />
              </button>
            </>
          )}

          <div className="relative w-full h-full max-w-6xl mx-auto" onClick={(e) => e.stopPropagation()}>
            {activeItem.type === 'image' ? (
              <Image src={activeItem.url} alt={title} fill className="object-contain" />
            ) : (
              <video src={activeItem.url} className="w-full h-full object-contain" controls autoPlay />
            )}
          </div>
        </div>
      )}
    </>
  );
}
