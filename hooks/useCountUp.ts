import { useEffect, useRef, useState } from "react";

function cubicEaseOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Animates a number from its previous value to `target` using cubic ease-out.
 * Works for both integers and floats — the caller handles formatting.
 */
export function useCountUp(target: number, duration = 420): number {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  const startValRef = useRef(target);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === prevRef.current) return;

    const from = prevRef.current;
    prevRef.current = target;
    startValRef.current = from;
    startTimeRef.current = null;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const tick = (time: number) => {
      if (startTimeRef.current === null) startTimeRef.current = time;
      const elapsed = time - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const value = startValRef.current + (target - startValRef.current) * cubicEaseOut(progress);
      setDisplay(value);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}
