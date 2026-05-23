import { useEffect, useRef, useState } from "react";

function scoreColor(s: number) {
  return s >= 80 ? "#ffb000" : s >= 60 ? "#a8c7e8" : s >= 40 ? "#ff8a00" : "#ff4b5c";
}
function scoreLabel(s: number) {
  return s >= 80 ? "GOLD" : s >= 60 ? "SILVER" : s >= 40 ? "BRONZE" : "AT RISK";
}

interface Props {
  score: number;
  size?: number;
  animate?: boolean;
  animationDuration?: number;
  onAnimationComplete?: () => void;
}

export function ScoreGauge({
  score,
  size = 220,
  animate = true,
  animationDuration = 2000,
  onAnimationComplete,
}: Props) {
  const target = Math.max(0, Math.min(100, score));
  const [display, setDisplay] = useState(animate ? 0 : target);
  const currentRef = useRef(animate ? 0 : target);
  const rafRef = useRef(0);
  const startRef = useRef(0);
  const cbRef = useRef(onAnimationComplete);
  cbRef.current = onAnimationComplete;

  const radius = (size - 24) / 2;
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

    startRef.current = 0;
    const dur = animationDuration;

    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / dur, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
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
        cbRef.current?.();
      }
    };

    const timeout = setTimeout(() => {
      rafRef.current = requestAnimationFrame(tick);
    }, 200);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, animate, animationDuration]);

  const progress = display / 100;
  const adjustedProgress = progress >= 0.99 ? 1 : progress >= 0.97 ? progress + (1 - progress) * 0.5 : progress;
  const offset = circ - adjustedProgress * 0.75 * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-full transition-all duration-1000"
        style={{ boxShadow: `0 0 60px 10px ${color}30, 0 0 120px 30px ${color}15` }}
      />
      {/* Inner circle */}
      <div
        className="absolute rounded-full bg-[#0d1117] border border-white/5"
        style={{ width: size * 0.72, height: size * 0.72, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
      />
      {/* Tick marks */}
      <svg width={size} height={size} className="absolute" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => {
          const angle = ((-225 + i * (270 / 39)) * Math.PI) / 180;
          const r1 = size / 2 - 4;
          const r2 = size / 2 - 10;
          const active = i / 39 <= display / 100;
          return (
            <line
              key={i}
              x1={size / 2 + r1 * Math.cos(angle)}
              y1={size / 2 + r1 * Math.sin(angle)}
              x2={size / 2 + r2 * Math.cos(angle)}
              y2={size / 2 + r2 * Math.sin(angle)}
              stroke={active ? `${color}40` : "rgba(255,255,255,0.08)"}
              strokeWidth={1}
              className="transition-all duration-300"
            />
          );
        })}
      </svg>
      {/* Arc */}
      <svg
        width={size}
        height={size}
        className="relative"
        style={{ transform: "rotate(135deg)" }}
        role="img"
        aria-label={`AquaScore ${display} out of 100`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={12}
          strokeLinecap="round"
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
          strokeDashoffset={Math.max(0, offset)}
          style={{ filter: `drop-shadow(0 0 8px ${color})`, transition: "stroke 0.5s ease" }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-bold tabular-nums transition-colors duration-500"
          style={{ color, fontSize: size * 0.27 }}
        >
          {display}
        </span>
        <span className="text-gray-500" style={{ marginTop: -2, fontSize: size * 0.06 }}>
          / 100
        </span>
        <span
          className="font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full border transition-all duration-500"
          style={{ color, borderColor: `${color}40`, fontSize: size * 0.045 }}
        >
          {scoreLabel(display)}
        </span>
      </div>
    </div>
  );
}
