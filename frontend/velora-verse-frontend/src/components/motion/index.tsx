"use client";

import { type ReactNode, type HTMLAttributes } from "react";
import {
  motion,
  type Variants,
  type HTMLMotionProps,
} from "framer-motion";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------
   Shared viewport trigger – animate once when 20% visible
   ------------------------------------------------------------------ */
const VIEWPORT = { once: true, margin: "-60px 0px" } as const;

/* ------------------------------------------------------------------
   FadeIn – fades up with configurable delay / distance
   ------------------------------------------------------------------ */
interface FadeInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.5,
  y = 24,
  className,
  ...rest
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...(rest as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
   SlideIn – slides from left or right
   ------------------------------------------------------------------ */
interface SlideInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  direction?: "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = "left",
  delay = 0,
  duration = 0.6,
  className,
  ...rest
}: SlideInProps) {
  const x = direction === "left" ? -40 : 40;
  return (
    <motion.div
      initial={{ opacity: 0, x }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...(rest as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
   ScaleIn – scales up from center
   ------------------------------------------------------------------ */
interface ScaleInProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = 0.5,
  className,
  ...rest
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={VIEWPORT}
      transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
      {...(rest as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------
   StaggerChildren – staggers children with configurable gap
   ------------------------------------------------------------------ */
const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

interface StaggerChildrenProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function StaggerChildren({
  children,
  className,
  staggerDelay = 0.08,
  ...rest
}: StaggerChildrenProps) {
  const container: Variants = {
    ...staggerContainer,
    visible: {
      transition: { staggerChildren: staggerDelay },
    },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className={className}
      {...(rest as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}

/* Export the stagger item variant for children to consume */
export { staggerItem };

/* Re-export motion for inline use */
export { motion };

/* ------------------------------------------------------------------
   SectionReveal – wraps a full section with fade-in-up on scroll
   ------------------------------------------------------------------ */
interface SectionRevealProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

export function SectionReveal({
  children,
  className,
  ...rest
}: SectionRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(className)}
      {...(rest as HTMLMotionProps<"div">)}
    >
      {children}
    </motion.div>
  );
}
