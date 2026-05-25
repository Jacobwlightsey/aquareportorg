/* ──── ScoreGauge — The Signature Visual ────
   Apple Health ring meets cinematic reveal.
   Thick arc, soft glow, spring animation, ambient pulse.
   The center number DOMINATES. Everything else whispers.
   ──── */

import { useEffect, useRef, useState } from "react";
import { scoreColor, scoreLabel } from "@/lib/designTokens";

interface Props {
  score: number;
  size?: number;
  animate?: boolean;
  animationDuration?: number;
  onAnimationComplete?: () => void;
  /** Muted appearance for secondary/background gauges */
  muted?: boolean;
}

export function ScoreGauge({
  score,
  size = 220,
  animate = true,
  animationDuration = 2800,
  onAnimationComplete,
  muted = false,
}: Props) {
  const target = Math.max(0, Math.min(100, score));
  const [display, setDisplay] = useState(animate ? 0 : target);
  const [pulseActive, setPulseActive] = useState(false);
  const currentRef = useRef(animate ? 0 : target);
  const rafRef = useRef(0);
  const cbRef = useRef(onAnimationComplete);
  cbRef.current = onAnimationComplete;

  const strokeWidth = Math.max(14, size * 0.065);
  const radius = (size - strokeWidth * 2 - 8) / 2;
  const circ = 2 * Math.PI * radius;
  const color = scoreColor(display);

  useEffect(() => {
    if (!animate) {
      setDisplay(target);
      currentRef.current = target;
      return;
    }
    const from = currentRef.current;
    if (from === target) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    let start = 0;
    const dur = animationDuration;

    const tick = (ts: number) => {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / dur, 1);
      // Spring-like easing: fast start, gentle overshoot, settle
      const ease = 1 - Math.pow(1 - progress, 4);
      const val = Math.round(from + (target - from) * ease);
      const clamped = target > from ? Math.min(val, target) : Math.max(val, target);
      setDisplay(clamped);
      currentRef.current = clamped;
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
        currentRef.current = target;
        rafRef.current = 0;
        // Ambient pulse after completion
        setPulseActive(true);
        cbRef.current?.();
      }
    };

    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 300);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, animate, animationDuration]);

  const progress = display / 100;
  const arcFraction = 0.75; // 270° arc
  const offset = circ - progress * arcFraction * circ;
  const opacity = muted ? 0.4 : 1;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size, opacity }}
    >
      {/* Ambient glow */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-1000"
        style={{
          boxShadow: pulseActive
            ? `0 0 ${size * 0.3}px ${size * 0.05}px ${color}25, 0 0 ${size * 0.6}px ${size * 0.15}px ${color}10`
            : `0 0 ${size * 0.2}px ${size * 0.03}px ${color}15`,
          animation: pulseActive ? "gaugeBreath 3s ease-in-out infinite" : "none",
        }}
      />

      {/* SVG ring */}
      <svg
        width={size}
        height={size}
        className="relative"
        style={{ transform: "rotate(135deg)" }}
        role="img"
        aria-label={`AquaScore ${display} out of 100`}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.04)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circ * arcFraction} ${circ * (1 - arcFraction)}`}
        />
        {/* Filled arc with gradient feel */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circ * arcFraction} ${circ * (1 - arcFraction)}`}
          strokeDashoffset={Math.max(0, offset)}
          style={{
            filter: `drop-shadow(0 0 ${strokeWidth}px ${color}80)`,
            transition: "stroke 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>

      {/* Center content — the number dominates */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-black tabular-nums tracking-tight transition-colors duration-800"
          style={{
            color,
            fontSize: size * 0.3,
            lineHeight: 1,
          }}
        >
          {display}
        </span>
        <span
          className="font-medium tracking-widest uppercase mt-2 transition-colors duration-800"
          style={{
            color: `${color}90`,
            fontSize: size * 0.055,
          }}
        >
          {scoreLabel(display)}
        </span>
      </div>

      {/* CSS for ambient pulse animation */}
      <style>{`
        @keyframes gaugeBreath {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}
