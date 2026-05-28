"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { gameGradient } from "@/lib/game-visuals";

interface ProductGalleryProps {
  title: string;
  images: string[];
  fallbackId: string;
}

export function ProductGallery({ title, images, fallbackId }: ProductGalleryProps) {
  const slides = images.length > 0 ? images : [];
  const [index, setIndex] = useState(0);

  const hasSlides = slides.length > 0;
  const current = hasSlides ? slides[index] : null;

  function prev() {
    if (!hasSlides) return;
    setIndex((value) => (value - 1 + slides.length) % slides.length);
  }

  function next() {
    if (!hasSlides) return;
    setIndex((value) => (value + 1) % slides.length);
  }

  return (
    <div className="card overflow-hidden">
      <div
        className="relative aspect-[16/10] overflow-hidden"
        style={!current ? { background: gameGradient(fallbackId) } : undefined}
      >
        {current ? (
          <Image
            src={current}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 60vw"
            unoptimized
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Превью
              </p>
              <p className="mt-2 font-display text-3xl font-bold uppercase">{title}</p>
            </div>
          </div>
        )}

        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--color-border)] bg-[rgba(3,3,4,0.72)] p-2 backdrop-blur hover:border-[rgba(232,185,35,0.35)]"
              aria-label="Предыдущее фото"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-[var(--color-border)] bg-[rgba(3,3,4,0.72)] p-2 backdrop-blur hover:border-[rgba(232,185,35,0.35)]"
              aria-label="Следующее фото"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </>
        )}
      </div>

      {slides.length > 1 && (
        <div className="grid grid-cols-5 gap-2 border-t border-[var(--color-border)] p-3">
          {slides.map((src, slideIndex) => (
            <button
              key={src}
              type="button"
              onClick={() => setIndex(slideIndex)}
              className={[
                "relative aspect-video overflow-hidden rounded-lg border",
                slideIndex === index
                  ? "border-[rgba(232,185,35,0.45)]"
                  : "border-[var(--color-border)] opacity-70 hover:opacity-100",
              ].join(" ")}
              aria-label={`Фото ${slideIndex + 1}`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="120px" unoptimized />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
