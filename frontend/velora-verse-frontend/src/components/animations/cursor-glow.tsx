"use client";

import { useMotionValue, useSpring, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

interface CursorGlowProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
  size?: number;
  opacity?: number;
}

export function CursorGlow({
  children,
  className,
  color = "var(--primary)",
  size = 400,
  opacity = 0.12,
}: CursorGlowProps) {
  const shouldReduce = useReducedMotion();
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const mouseX = useMotionValue(-size);
  const mouseY = useMotionValue(-size);
  const springX = useSpring(mouseX, { stiffness: 200, damping: 40 });
  const springY = useSpring(mouseY, { stiffness: 200, damping: 40 });

  useEffect(() => {
    setIsTouchDevice(
      "ontouchstart" in window || navigator.maxTouchPoints > 0
    );
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [mouseX, mouseY]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(-size);
    mouseY.set(-size);
  }, [mouseX, mouseY, size]);

  if (shouldReduce || isTouchDevice) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`relative ${className ?? ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden
      >
        <GlowDot
          springX={springX}
          springY={springY}
          size={size}
          color={color}
          opacity={opacity}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function GlowDot({
  springX,
  springY,
  size,
  color,
  opacity,
}: {
  springX: ReturnType<typeof useSpring>;
  springY: ReturnType<typeof useSpring>;
  size: number;
  color: string;
  opacity: number;
}) {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const unsubX = springX.on("change", () => update());
    const unsubY = springY.on("change", () => update());

    function update() {
      setStyle({
        background: `radial-gradient(circle ${size / 2}px at ${springX.get()}px ${springY.get()}px, ${color} 0%, transparent 100%)`,
        opacity,
      });
    }

    return () => {
      unsubX();
      unsubY();
    };
  }, [springX, springY, size, color, opacity]);

  return <div className="absolute inset-0" style={style} />;
}
