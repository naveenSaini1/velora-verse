"use client";

import Image from "next/image";
import { useState } from "react";
import { resolveImageUrl } from "@/lib/utils/image-url";
import { cn } from "@/lib/utils";

interface FrappeImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  priority?: boolean;
  sizes?: string;
}

function Placeholder({
  className,
  fill,
  width,
  height,
}: Pick<FrappeImageProps, "className" | "fill" | "width" | "height">) {
  return (
    <div
      className={cn(
        "bg-muted flex items-center justify-center text-muted-foreground",
        className
      )}
      style={!fill ? { width, height } : undefined}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="opacity-50"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    </div>
  );
}

export function FrappeImage({
  src,
  alt,
  width,
  height,
  fill,
  className,
  priority,
  sizes,
}: FrappeImageProps) {
  const resolvedSrc = resolveImageUrl(src);
  const isPlaceholder = resolvedSrc === "/placeholder.svg";
  const [hasError, setHasError] = useState(false);

  if (isPlaceholder || hasError) {
    return (
      <Placeholder
        className={className}
        fill={fill}
        width={width}
        height={height}
      />
    );
  }

  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={fill ? undefined : (width ?? 400)}
      height={fill ? undefined : (height ?? 400)}
      fill={fill}
      className={className}
      priority={priority}
      sizes={sizes}
      onError={() => setHasError(true)}
    />
  );
}
