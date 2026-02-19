"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  endDate: string;
  className?: string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(endDate: string): TimeLeft | null {
  const diff = new Date(endDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function CountdownTimer({ endDate, className }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(
    calculateTimeLeft(endDate)
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const tl = calculateTimeLeft(endDate);
      setTimeLeft(tl);
      if (!tl) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endDate]);

  if (!timeLeft) {
    return <span className={cn("text-sm text-muted-foreground", className)}>Ended</span>;
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className={cn("flex items-center gap-1 text-sm font-mono", className)}>
      <span className="text-xs text-muted-foreground mr-1">Ends in</span>
      {timeLeft.days > 0 && (
        <>
          <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-semibold">
            {timeLeft.days}d
          </span>
          <span>:</span>
        </>
      )}
      <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-semibold">
        {pad(timeLeft.hours)}h
      </span>
      <span>:</span>
      <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-semibold">
        {pad(timeLeft.minutes)}m
      </span>
      <span>:</span>
      <span className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-semibold">
        {pad(timeLeft.seconds)}s
      </span>
    </div>
  );
}
