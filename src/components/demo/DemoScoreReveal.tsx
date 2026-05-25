import { AlertTriangle, Award, Check, Shield, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { playRevealSound, playProcessingSound, haptic } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { ScoreGauge } from "./ScoreGauge";

interface Props {
  score?: number;
  contaminants: any[];
  report: any;
  onNext: () => void;
  onBack: () => void;
  skipScoreAnimation?: boolean;
}

/* ──── Score tier labels (standardized across dealer + consumer platforms) ──── */
export function tierInfo(score: number) {
  if (score >= 80)
    return {
      tier: "Gold Tier",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.12)",
      border: "rgba(245,158,11,0.3)",
      icon: Award,
      desc: "Your water meets or exceeds all health guidelines. Outstanding quality.",
      emoji: "🏆",
    };
  if (score >= 60)
    return {
      tier: "Silver Tier",
      color: "#94a3b8",
      bg: "rgba(148,163,184,0.12)",
      border: "rgba(148,163,184,0.3)",
      icon: Shield,
      desc: "Your water is mostly clean with a few areas worth monitoring.",
      emoji: "🥈",
    };
  if (score >= 40)
    return {
      tier: "Bronze Tier",
      color: "#f97316",
      bg: "rgba(249,115,22,0.12)",
      border: "rgba(249,115,22,0.3)",
      icon: AlertTriangle,
      desc: "Your water has some contaminants above recommended health levels.",
      emoji: "⚠️",
    };
  return {
    tier: "At Risk",
    color: "#ef4444",
    bg: "rgba(239,68,68,0.12)",
    border: "rgba(239,68,68,0.3)",
    icon: TrendingDown,
    desc: "Your water has significant quality concerns that should be addressed immediately.",
    emoji: "🚨",
  };
}

/* ──── Sprint 1B: 4-phase cinematic reveal ──── */
type RevealPhase = 0 | 1 | 2 | 3;

const PHASE_DATA = [
  {
    label: "Analyzing your water data…",
    icon: "🔬",
    style: "animate-pulse",
  },
  {
    label: "Checking EPA & health guidelines…",
    icon: "✅",
    style: "",
  },
  {
    label: "Calculating your AquaScore…",
    icon: "🧮",
    style: "",
  },
  {
    label: "",
    icon: "",
    style: "",
  },
];

const PHASE_DURATION = 2000; // 2s per phase

export function DemoScoreReveal({
  score,
  contaminants,
  report,
  onNext: _onNext,
  onBack: _onBack,
  skipScoreAnimation = false,
}: Props) {
  const s = score ?? 0;
  const info = tierInfo(s);
  const overLegal = contaminants.filter((c: any) => c.over_legal).length;
  const overHealth = contaminants.filter((c: any) => c.over_health && !c.over_legal).length;

  // Phase state: null = pre-start, 0-2 = processing, 3 = revealed
  const [phase, setPhase] = useState<RevealPhase | null>(
    skipScoreAnimation ? 3 : null,
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Number scramble for phase 2
  const [scrambleNum, setScrambleNum] = useState(0);
  const scrambleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanBarStyles = useRef(
    Array.from({ length: 12 }, () => ({
      height: `${20 + Math.random() * 40}px`,
      opacity: 0.3 + Math.random() * 0.5,
    })),
  ).current;

  // Count-up for stats (only when phase 3)
  const detected = useCountUp(contaminants.length, 1000, 300, phase === 3);
  const healthCount = useCountUp(overHealth, 1000, 500, phase === 3);
  const legalCount = useCountUp(overLegal, 1000, 700, phase === 3);

  // Auto-advance through phases
  useEffect(() => {
    if (phase === null || phase >= 3) return;

    playProcessingSound();

    // Phase 2: start number scramble
    if (phase === 2) {
      scrambleRef.current = setInterval(() => {
        setScrambleNum(Math.floor(Math.random() * 100));
      }, 60);
    }

    timerRef.current = setTimeout(() => {
      const next = (phase + 1) as RevealPhase;
      setPhase(next);
      if (next === 3) {
        // Clean up scramble
        if (scrambleRef.current) clearInterval(scrambleRef.current);
        playRevealSound();
        haptic("medium");
      }
    }, PHASE_DURATION);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phase]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (scrambleRef.current) clearInterval(scrambleRef.current);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Skip to phase 3 on tap anywhere
  const skipToReveal = useCallback(() => {
    if (phase !== null && phase < 3) {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (scrambleRef.current) clearInterval(scrambleRef.current);
      setPhase(3);
      playRevealSound();
      haptic("medium");
    }
  }, [phase]);

  // Start the sequence
  const handleStart = () => {
    if (skipScoreAnimation) {
      setPhase(3);
      playRevealSound();
      haptic("medium");
    } else {
      setPhase(0);
    }
  };

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-4" onClick={skipToReveal}>
      {/* Pre-start: show blurred preview + reveal button */}
      {phase === null && (
        <div className="text-center space-y-6">
          <div className="space-y-2">
            <Sparkles className="mx-auto size-8 text-amber-400 animate-pulse" />
            <h2 className="text-2xl font-black">Your AquaScore</h2>
            <p className="text-sm text-white/50">
              Based on {contaminants.length} detected contaminants from{" "}
              {report.utilityName}
            </p>
          </div>

          {/* Blurred preview */}
          <div className="relative flex justify-center">
            <div className="blur-xl opacity-40">
              <ScoreGauge score={s} size={200} animate={false} />
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
            className="mx-auto flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`,
              boxShadow: `0 4px 24px ${info.color}40`,
            }}
          >
            <Sparkles className="size-5" />
            Reveal Your Score
          </button>
        </div>
      )}

      {/* Phases 0-2: processing animation */}
      {phase !== null && phase < 3 && (
        <div className="text-center space-y-8 py-8">
          {/* Phase icon */}
          <div className="text-5xl animate-bounce">{PHASE_DATA[phase].icon}</div>

          {/* Phase label */}
          <div>
            <p className="text-lg font-bold text-white/90 animate-pulse">
              {PHASE_DATA[phase].label}
            </p>
            <p className="text-xs text-white/30 mt-2">Tap anywhere to skip</p>
          </div>

          {/* Phase 2: number scramble */}
          {phase === 2 && (
            <div className="flex justify-center">
              <div className="text-6xl font-black tabular-nums text-white/20">
                {scrambleNum}
              </div>
            </div>
          )}

          {/* Phases 0-1: scanning bars */}
          {phase < 2 && (
            <div className="flex justify-center gap-1">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 rounded-full bg-gradient-to-t from-cyan-500 to-blue-500"
                  style={{
                    height: scanBarStyles[i].height,
                    animation: `pulse 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                    opacity: scanBarStyles[i].opacity,
                  }}
                />
              ))}
            </div>
          )}

          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map((p) => (
              <div
                key={p}
                className={`size-2 rounded-full transition-all duration-300 ${
                  p === phase
                    ? "bg-cyan-400 scale-125"
                    : p < phase
                      ? "bg-cyan-400/50"
                      : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Phase 3: revealed */}
      {phase === 3 && (
        <>
          {/* Animated Score Gauge */}
          <div className="flex flex-col items-center pt-2">
            <ScoreGauge score={s} size={220} animate={true} animationDuration={2000} />
          </div>

          {/* Tier Explanation */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: info.bg,
              border: `1px solid ${info.border}`,
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <info.icon className="size-6" style={{ color: info.color }} />
              <div>
                <p className="font-bold" style={{ color: info.color }}>
                  {info.emoji} {info.tier}
                </p>
                <p className="text-xs text-white/50">AquaScore {s}/100</p>
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{info.desc}</p>
          </div>

          {/* Quick Stats — with count-up animation (Sprint 1C) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
              <p className="text-2xl font-black">{detected}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                Detected
              </p>
            </div>
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
              <p className="text-2xl font-black text-amber-400">{healthCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/60">
                Health
              </p>
            </div>
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
              <p className="text-2xl font-black text-red-400">{legalCount}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-red-400/60">
                Legal
              </p>
            </div>
          </div>

          {/* What this means */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
              What This Means for Your Family
            </p>
            <div className="space-y-2.5 text-sm text-white/70">
              {overLegal > 0 && (
                <p>
                  🚨{" "}
                  <strong className="text-red-400">
                    {overLegal} contaminant{overLegal > 1 ? "s" : ""}
                  </strong>{" "}
                  exceed{overLegal === 1 ? "s" : ""} federal legal limits — this
                  is above what the EPA considers safe.
                </p>
              )}
              {overHealth > 0 && (
                <p>
                  ⚠️{" "}
                  <strong className="text-amber-400">
                    {overHealth} contaminant{overHealth > 1 ? "s" : ""}
                  </strong>{" "}
                  exceed{overHealth === 1 ? "s" : ""} health guidelines — linked
                  to long-term health effects.
                </p>
              )}
              <p>
                💧 Your water is being consumed by everyone in your household —
                every glass, every shower, every meal.
              </p>
              <p>
                ✅ The good news:{" "}
                <strong className="text-emerald-400">this is fixable</strong>{" "}
                with the right filtration system.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
