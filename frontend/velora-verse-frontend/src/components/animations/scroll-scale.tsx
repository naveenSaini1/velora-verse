"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface ScrollScaleProps {
  children: React.ReactNode;
  className?: string;
  scaleFrom?: number;
}

export function ScrollScale({
  children,
  className,
  scaleFrom = 0.92,
}: ScrollScaleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start 0.6"],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [scaleFrom, 1]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div ref={ref} className={className}>
      <motion.div style={{ scale, opacity, willChange: "transform, opacity" }}>
        {children}
      </motion.div>
    </div>
  );
}
