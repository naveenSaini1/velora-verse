"use client";

import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { FrappeImage } from "@/components/shared/frappe-image";
import { cn } from "@/lib/utils";
import type { ProductImage } from "@/types/product";

interface ImageLightboxProps {
  images: ProductImage[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({
  images,
  initialIndex,
  open,
  onClose,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  // Sync index when opened with a new initialIndex
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex);
      setZoomed(false);
    }
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    if (!zoomed) setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length, zoomed]);

  const goPrev = useCallback(() => {
    if (!zoomed)
      setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length, zoomed]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, goNext, goPrev]);

  // Touch swipe support
  function handleTouchStart(e: React.TouchEvent) {
    setDragStart(e.touches[0].clientX);
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (dragStart === null) return;
    const diff = e.changedTouches[0].clientX - dragStart;
    if (Math.abs(diff) > 60) {
      if (diff > 0) goPrev();
      else goNext();
    }
    setDragStart(null);
  }

  if (!open || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
    >
      {/* Top controls */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4">
        <span className="text-sm text-white/70 font-medium">
          {currentIndex + 1} / {images.length}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoomed((z) => !z)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label={zoomed ? "Zoom out" : "Zoom in"}
          >
            {zoomed ? (
              <ZoomOut className="h-5 w-5" />
            ) : (
              <ZoomIn className="h-5 w-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Close lightbox"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Navigation arrows */}
      {images.length > 1 && !zoomed && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-6"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-3 top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-6"
            aria-label="Next image"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {/* Main image */}
      <div
        className={cn(
          "relative h-[70vh] w-[90vw] max-w-4xl transition-transform duration-300",
          zoomed && "scale-150 cursor-zoom-out",
          !zoomed && "cursor-zoom-in"
        )}
        onClick={() => setZoomed((z) => !z)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <FrappeImage
          src={current.image}
          alt={current.alt_text ?? `Product image ${currentIndex + 1}`}
          fill
          className="object-contain"
          sizes="90vw"
          priority
        />
      </div>

      {/* Thumbnail strip at bottom */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2 rounded-full bg-black/50 px-3 py-2">
          {images.map((img, index) => (
            <button
              key={img.name || `lightbox-${index}`}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setZoomed(false);
              }}
              className={cn(
                "relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border-2 transition-all",
                index === currentIndex
                  ? "border-white opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              )}
              aria-label={`View image ${index + 1}`}
            >
              <FrappeImage
                src={img.image}
                alt=""
                fill
                className="object-cover"
                sizes="40px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
