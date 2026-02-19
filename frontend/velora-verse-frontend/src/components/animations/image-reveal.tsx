"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { EASE } from "@/lib/animation";

interface ImageRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
}

const clipPaths: Record<string, { from: string; to: string }> = {
  up: { from: "inset(100% 0 0 0)", to: "inset(0 0 0 0)" },
  down: { from: "inset(0 0 100% 0)", to: "inset(0 0 0 0)" },
  left: { from: "inset(0 100% 0 0)", to: "inset(0 0 0 0)" },
  right: { from: "inset(0 0 0 100%)", to: "inset(0 0 0 0)" },
};

export function ImageReveal({
  children,
  className,
  direction = "up",
  delay = 0,
  duration = 0.9,
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const shouldReduce = useReducedMotion();

  const { from, to } = clipPaths[direction];

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      className={`h-full ${className ?? ""}`}
      initial={{ clipPath: from, opacity: 0 }}
      animate={
        isInView
          ? { clipPath: to, opacity: 1 }
          : { clipPath: from, opacity: 0 }
      }
      transition={{
        clipPath: { duration, delay, ease: EASE.dramatic },
        opacity: { duration: duration * 0.5, delay },
      }}
    >
      {children}
    </motion.div>
  );
}
