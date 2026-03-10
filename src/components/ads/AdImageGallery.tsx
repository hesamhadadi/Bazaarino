'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface AdImageGalleryProps {
  images: string[];
  title: string;
}

export default function AdImageGallery({ images, title }: AdImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  if (!images.length) return null;

  const next = () => setActiveIndex((prev) => (prev + 1) % images.length);
  const prev = () => setActiveIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <>
      <div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative aspect-[4/3] w-full block"
        >
          <Image src={images[activeIndex]} alt={title} fill className="object-cover" priority />
        </button>

        {images.length > 1 && (
          <div className="flex gap-2 p-2 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setActiveIndex(i)}
                className={`relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden border-2 ${
                  i === activeIndex ? 'border-brand-500' : 'border-gray-200'
                }`}
              >
                <Image src={img} alt={`تصویر ${i + 1}`} fill className="object-cover" />
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

          {images.length > 1 && (
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
            <Image src={images[activeIndex]} alt={title} fill className="object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
