"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  format?: (n: number) => string;
}

/** Counts up from 0 to `value` on mount and whenever `value` changes (800ms, ease-out cubic). */
export function AnimatedCounter({
  value,
  format = (n) => n.toLocaleString(),
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = null;
    const duration = 800;

    function step(now: number) {
      if (startRef.current === null) startRef.current = now;
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    }

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value]);

  return <>{format(display)}</>;
}
