"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

interface TextRevealProps {
  children: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  splitBy?: "word" | "char";
  staggerDelay?: number;
}

export function TextReveal({
  children,
  className,
  delay = 0,
  as: Tag = "h1",
  splitBy = "word",
  staggerDelay = 0.04,
}: TextRevealProps) {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <Tag className={className}>{children}</Tag>;
  }

  const units =
    splitBy === "word"
      ? children.split(" ")
      : children.split("");

  return (
    <Tag
      className={className}
      ref={ref as React.RefObject<HTMLHeadingElement & HTMLParagraphElement & HTMLSpanElement>}
    >
      <span className="sr-only">{children}</span>
      <span aria-hidden className="inline" style={{ perspective: "600px" }}>
        {units.map((unit, i) => (
          <motion.span
            key={i}
            className="inline-block origin-bottom"
            initial={{ opacity: 0, y: "40%", rotateX: -50 }}
            animate={
              isInView
                ? { opacity: 1, y: "0%", rotateX: 0 }
                : { opacity: 0, y: "40%", rotateX: -50 }
            }
            transition={{
              duration: 0.7,
              delay: delay + i * staggerDelay,
              ease: [0.33, 1, 0.68, 1],
            }}
          >
            {unit}
            {splitBy === "word" && i < units.length - 1 ? "\u00A0" : ""}
          </motion.span>
        ))}
      </span>
    </Tag>
  );
}
