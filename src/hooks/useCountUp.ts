import { useEffect, useRef, useState } from "react";

/**
 * Sprint 1C — Animate a number from 0 to `target` with ease-out timing.
 * Returns the current displayed value (integer).
 */
export function useCountUp(
  target: number,
  duration = 1200,
  delay = 0,
  enabled = true,
): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target <= 0) {
      setValue(target);
      return;
    }

    const timeout = setTimeout(() => {
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(eased * target));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, delay, enabled]);

  return value;
}
