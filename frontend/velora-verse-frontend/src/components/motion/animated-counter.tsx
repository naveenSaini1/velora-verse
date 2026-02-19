"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";

interface AnimatedCounterProps {
  /** The target value to count to */
  value: number;
  /** Duration in seconds */
  duration?: number;
  /** Format function applied to the animated number */
  formatFn?: (n: number) => string;
  /** CSS class for the wrapper span */
  className?: string;
}

/**
 * Animated number counter that triggers when scrolled into view.
 * Counts from 0 to `value` with optional formatting.
 */
export function AnimatedCounter({
  value,
  duration = 1.2,
  formatFn = (n) => Math.round(n).toLocaleString("en-IN"),
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-40px 0px" });
  const [display, setDisplay] = useState(formatFn(0));

  useEffect(() => {
    if (!isInView) return;

    const controls = animate(0, value, {
      duration,
      ease: [0.25, 0.1, 0.25, 1],
      onUpdate(latest) {
        setDisplay(formatFn(latest));
      },
    });

    return () => controls.stop();
  }, [isInView, value, duration, formatFn]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
