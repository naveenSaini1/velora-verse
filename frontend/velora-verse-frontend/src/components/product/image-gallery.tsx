"use client";

import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { ZoomIn } from "lucide-react";
import { FrappeImage } from "@/components/shared/frappe-image";
import { cn } from "@/lib/utils";

const ImageLightbox = dynamic(
  () => import("@/components/product/image-lightbox").then((m) => m.ImageLightbox),
  { ssr: false }
);
import type { ProductImage } from "@/types/product";

interface ImageGalleryProps {
  images: ProductImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const sortedImages = [...images].sort(
    (a, b) => a.display_order - b.display_order
  );

  const primaryIndex = sortedImages.findIndex((img) => img.is_primary);
  const initialIndex = primaryIndex >= 0 ? primaryIndex : 0;
  const [selectedIndex, setSelectedIndex] = useState(initialIndex);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [direction, setDirection] = useState(0);
  const swipedRef = useRef(false);

  const currentImage = sortedImages[selectedIndex] ?? sortedImages[0];
  const showThumbnails = sortedImages.length > 1;
  const multipleImages = sortedImages.length > 1;

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > selectedIndex ? 1 : -1);
      setSelectedIndex(index);
    },
    [selectedIndex]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const threshold = 50;
      if (info.offset.x < -threshold && selectedIndex < sortedImages.length - 1) {
        swipedRef.current = true;
        goTo(selectedIndex + 1);
      } else if (info.offset.x > threshold && selectedIndex > 0) {
        swipedRef.current = true;
        goTo(selectedIndex - 1);
      }
    },
    [selectedIndex, sortedImages.length, goTo]
  );

  const handleImageClick = () => {
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    setLightboxOpen(true);
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%", opacity: 0 }),
  };

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* Main image — swipeable on touch */}
        <div
          role="button"
          tabIndex={0}
          onClick={handleImageClick}
          onKeyDown={(e) => e.key === "Enter" && setLightboxOpen(true)}
          className="group relative aspect-square w-full overflow-hidden rounded-2xl border bg-secondary/30 cursor-zoom-in touch-pan-y"
          aria-label="Open image lightbox"
        >
          <AnimatePresence mode="wait" custom={direction}>
            {currentImage ? (
              <motion.div
                key={selectedIndex}
                custom={direction}
                variants={multipleImages ? slideVariants : undefined}
                initial={multipleImages ? "enter" : { opacity: 0 }}
                animate={multipleImages ? "center" : { opacity: 1 }}
                exit={multipleImages ? "exit" : { opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
                drag={multipleImages ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.15}
                onDragEnd={multipleImages ? handleDragEnd : undefined}
                className="absolute inset-0"
              >
                <FrappeImage
                  src={currentImage.image}
                  alt={currentImage.alt_text ?? "Product image"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105 pointer-events-none"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </motion.div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
              </div>
            )}
          </AnimatePresence>

          {/* Zoom hint on hover (desktop only) */}
          <div className="absolute inset-0 hidden md:flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/10 pointer-events-none">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-foreground opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
              <ZoomIn className="h-5 w-5" />
            </div>
          </div>

          {/* Dot indicators (mobile) */}
          {multipleImages && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 md:hidden">
              {sortedImages.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "block h-1.5 rounded-full transition-all duration-300",
                    i === selectedIndex
                      ? "w-4 bg-white shadow-sm"
                      : "w-1.5 bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Thumbnail strip (hidden on mobile, shown on md+) */}
        {showThumbnails && (
          <div className="hidden md:flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sortedImages.map((image, index) => (
              <button
                key={image.name || `img-${index}`}
                type="button"
                onClick={() => goTo(index)}
                className={cn(
                  "relative flex-shrink-0 size-16 sm:size-20 overflow-hidden rounded-xl border-2 transition-all duration-200",
                  index === selectedIndex
                    ? "border-primary ring-1 ring-primary/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
                aria-label={`View image ${index + 1}`}
              >
                <FrappeImage
                  src={image.image}
                  alt={image.alt_text ?? `Thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <ImageLightbox
        images={sortedImages}
        initialIndex={selectedIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
