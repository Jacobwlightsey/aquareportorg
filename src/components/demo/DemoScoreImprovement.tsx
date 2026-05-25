/* ──── Score Improvement — "How We Improve Your Score" ────
   Transition step between Impact and System. Shows current score
   transforming to projected (e.g. 94). Emotional payoff moment.
   ──── */

import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import { playRevealSound, haptic } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";
import { tierInfo } from "./DemoScoreReveal";
import { colors } from "@/lib/designTokens";

interface Props {
  currentScore: number;
  projectedScore: number;
  onNext: () => void;
}

const IMPROVEMENTS = [
  { label: "Remove Chlorine & Chemicals", emoji: "🧪", delay: 0 },
  { label: "Eliminate Hard Water Scale", emoji: "💎", delay: 150 },
  { label: "Filter Heavy Metals", emoji: "⚙️", delay: 300 },
  { label: "Reduce Disinfection Byproducts", emoji: "🛡️", delay: 450 },
];

export function DemoScoreImprovement({ currentScore, projectedScore, onNext }: Props) {
  const [phase, setPhase] = useState<"before" | "animating" | "after">("before");
  const displayScore = phase === "before" ? currentScore : projectedScore;
  const info = tierInfo(displayScore);
  const delta = projectedScore - currentScore;

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("animating"), 1200);
    const t2 = setTimeout(() => {
      setPhase("after");
      playRevealSound();
      haptic("medium");
    }, 2800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-8">
      {/* Header */}
      <div className="text-center mb-10">
        <p
          className="text-[10px] font-bold uppercase tracking-widest"
          style={{ color: `${colors.success}b0` }}
        >
          THE TRANSFORMATION
        </p>
        <h2
          className="text-[28px] sm:text-[32px] font-bold tracking-tight mt-3"
          style={{ color: colors.textPrimary }}
        >
          How We Improve Your Score
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          See what proper water treatment does for your home.
        </p>
      </div>

      {/* Score gauge — centered, animates from current → projected */}
      <div className="flex flex-col items-center mb-10">
        <div className="relative">
          <ScoreGauge
            score={displayScore}
            size={220}
            animate={true}
            animationDuration={phase === "animating" ? 1600 : 800}
          />
          {/* Glow effect on reveal */}
          {phase === "after" && (
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle, ${info.color}15 0%, transparent 70%)`,
              }}
            />
          )}
        </div>
        <p
          className="text-[12px] font-medium uppercase tracking-wide mt-3"
          style={{ color: colors.textMuted }}
        >
          OUT OF 100
        </p>

        {/* Tier badge */}
        <div
          className="mt-4 rounded-full px-5 py-2 flex items-center gap-2 transition-all duration-700"
          style={{ background: info.bg, border: `1px solid ${info.border}` }}
        >
          <info.icon className="size-4" style={{ color: info.color }} />
          <span className="text-[14px] font-bold" style={{ color: info.color }}>
            {info.tier}
          </span>
        </div>

        {/* Delta indicator */}
        {phase === "after" && delta > 0 && (
          <div
            className="mt-4 flex items-center gap-2 rounded-full px-4 py-2 animate-in fade-in slide-in-from-bottom-3 duration-500"
            style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}20` }}
          >
            <TrendingUp className="size-4" style={{ color: colors.success }} />
            <span className="text-[14px] font-bold" style={{ color: colors.success }}>
              +{delta} points
            </span>
          </div>
        )}
      </div>

      {/* What changes — animated list */}
      <div
        className="max-w-lg mx-auto rounded-2xl p-5 mb-8 space-y-3"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-widest mb-3"
          style={{ color: colors.textFaint }}
        >
          WHAT WE ADDRESS
        </p>
        {IMPROVEMENTS.map((item, i) => (
          <div
            key={item.label}
            className="flex items-center gap-3 animate-in fade-in slide-in-from-left-3"
            style={{ animationDelay: `${item.delay}ms`, animationFillMode: "both" }}
          >
            <span className="text-lg shrink-0">{item.emoji}</span>
            <span className="text-[14px]" style={{ color: colors.textSecondary }}>
              {item.label}
            </span>
            {phase === "after" && (
              <Sparkles
                className="size-3.5 ml-auto shrink-0 animate-in fade-in"
                style={{ color: colors.success, animationDelay: `${item.delay + 400}ms` }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Continue button */}
      <button
        onClick={onNext}
        className="w-full max-w-lg mx-auto block flex items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${colors.success}, ${colors.primary})`,
          boxShadow: `0 4px 24px ${colors.success}20`,
        }}
      >
        See How It Works <ArrowRight className="size-5" />
      </button>
    </div>
  );
}
