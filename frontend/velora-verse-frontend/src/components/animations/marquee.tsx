"use client";

import { cn } from "@/lib/utils";

interface MarqueeProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: "left" | "right";
  pauseOnHover?: boolean;
}

export function Marquee({
  children,
  className,
  speed = 30,
  direction = "left",
  pauseOnHover = false,
}: MarqueeProps) {
  return (
    <div
      className={cn("overflow-hidden", className)}
      style={
        {
          "--marquee-speed": `${speed}s`,
        } as React.CSSProperties
      }
    >
      <div
        className={cn(
          "flex w-max gap-8",
          direction === "left" ? "animate-marquee-left" : "animate-marquee-right",
          pauseOnHover && "hover:[animation-play-state:paused]"
        )}
      >
        {children}
        {children}
      </div>
    </div>
  );
}
