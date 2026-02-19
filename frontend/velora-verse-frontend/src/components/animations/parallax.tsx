"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  scale?: [number, number];
  opacityRange?: [number, number];
  offset?: [string, string];
  disabled?: boolean;
}

export function Parallax({
  children,
  className,
  speed = 0.3,
  scale,
  opacityRange,
  offset = ["start end", "end start"],
  disabled = false,
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: offset as ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [speed * -100, speed * 100]);
  const scaleValue = useTransform(
    scrollYProgress,
    [0, 1],
    scale ?? [1, 1]
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.3, 0.7, 1],
    opacityRange
      ? [opacityRange[0], 1, 1, opacityRange[1]]
      : [1, 1, 1, 1]
  );

  if (disabled || shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div
        className="h-full"
        style={{
          y,
          scale: scaleValue,
          opacity,
          willChange: "transform",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
