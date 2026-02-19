import type { Transition } from "framer-motion";

// -- Easing presets --
export const EASE = {
  /** Default smooth ease — replaces [0.25, 0.1, 0.25, 1] used across sections */
  smooth: [0.25, 0.1, 0.25, 1] as [number, number, number, number],
  /** Dramatic entrance — heavy decelerate for hero/major reveals */
  dramatic: [0.16, 1, 0.3, 1] as [number, number, number, number],
  /** Ultra-smooth premium cubic */
  premium: [0.76, 0, 0.24, 1] as [number, number, number, number],
  /** Smooth out for exits */
  out: [0.33, 0, 0.67, 0] as [number, number, number, number],
} as const;

// -- Viewport trigger configs --
export const VIEWPORT = {
  default: { once: true, margin: "-80px 0px" } as const,
  eager: { once: true, margin: "-40px 0px" } as const,
  lazy: { once: true, margin: "-120px 0px" } as const,
} as const;

// -- Spring presets --
export const SPRING = {
  gentle: { type: "spring", stiffness: 120, damping: 14 } as Transition,
  snappy: { type: "spring", stiffness: 300, damping: 30 } as Transition,
  bouncy: { type: "spring", stiffness: 400, damping: 10 } as Transition,
  magnetic: { type: "spring", stiffness: 150, damping: 15, mass: 0.1 } as Transition,
} as const;

// -- Duration presets --
export const DURATION = {
  fast: 0.3,
  normal: 0.6,
  slow: 0.9,
  hero: 1.2,
} as const;
