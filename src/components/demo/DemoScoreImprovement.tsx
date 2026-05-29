/* ──── Score Improvement + Before/After — "THE TRANSFORMATION" ────
   Shows current score with a reveal button. On tap → animates to
   projected score AND shows contaminants being removed/addressed.
   Combines the old "Score Improvement" and "Before & After" pages.
   ──── */

import { ArrowRight, Check, Skull, AlertTriangle, FlaskConical, Sparkles, TrendingUp, Zap } from "lucide-react";
import { useState } from "react";
import { playRevealSound, haptic } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";
import { tierInfo } from "./DemoScoreReveal";
import { contaminantName } from "@/lib/supabase";
import { colors, scoreColor } from "@/lib/designTokens";

interface Props {
  currentScore: number;
  projectedScore: number;
  contaminants?: any[];
  onNext: () => void;
}

function SeverityDot({ c }: { c: any }) {
  if (c.over_legal) return <Skull className="size-3.5 shrink-0" style={{ color: colors.critical }} />;
  if (c.over_health) return <AlertTriangle className="size-3.5 shrink-0" style={{ color: colors.warning }} />;
  return <FlaskConical className="size-3.5 shrink-0" style={{ color: colors.textFaint }} />;
}

export function DemoScoreImprovement({ currentScore, projectedScore, contaminants = [], onNext }: Props) {
  const [phase, setPhase] = useState<"waiting" | "animating" | "revealed">("waiting");
  const displayScore = phase === "waiting" ? currentScore : projectedScore;
  const info = tierInfo(displayScore);
  const currentInfo = tierInfo(currentScore);
  const delta = projectedScore - currentScore;

  /* Sort contaminants by severity */
  const sorted = [...contaminants].sort((a, b) => {
    if (a.over_legal !== b.over_legal) return a.over_legal ? -1 : 1;
    if (a.over_health !== b.over_health) return a.over_health ? -1 : 1;
    return (b.times_above_ewg ?? 0) - (a.times_above_ewg ?? 0);
  });
  const top = sorted.slice(0, 8);
  const hasContaminants = top.length > 0;

  const handleReveal = () => {
    if (phase !== "waiting") return;
    setPhase("animating");
    haptic("medium");
    setTimeout(() => {
      setPhase("revealed");
      playRevealSound();
      haptic("heavy");
    }, 1800);
  };

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
          {phase === "revealed" ? "Your New Water Score" : "How We Improve Your Score"}
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          {phase === "revealed"
            ? "This is what proper water treatment does for your home."
            : "See what proper water treatment does for your home."}
        </p>
      </div>

      {/* Main layout: score gauge + contaminant panel */}
      <div className={`flex ${hasContaminants ? "gap-8" : "flex-col items-center"} mb-8`}>
        {/* Score gauge */}
        <div className={`flex flex-col items-center ${hasContaminants ? "shrink-0" : ""}`}>
          <div className="relative">
            <ScoreGauge
              score={displayScore}
              size={hasContaminants ? 180 : 220}
              animate={true}
              animationDuration={phase === "animating" ? 1800 : 800}
            />
            {/* Glow effect on reveal */}
            {phase === "revealed" && (
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
            style={{
              background: phase === "revealed" ? info.bg : currentInfo.bg,
              border: `1px solid ${phase === "revealed" ? info.border : currentInfo.border}`,
            }}
          >
            {phase === "revealed"
              ? <info.icon className="size-4" style={{ color: info.color }} />
              : <currentInfo.icon className="size-4" style={{ color: currentInfo.color }} />
            }
            <span
              className="text-[14px] font-bold"
              style={{ color: phase === "revealed" ? info.color : currentInfo.color }}
            >
              {phase === "revealed" ? info.tier : currentInfo.tier}
            </span>
          </div>

          {/* Delta indicator — only after reveal */}
          {phase === "revealed" && delta > 0 && (
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

        {/* Contaminant removal panel — only when we have contaminant data */}
        {hasContaminants && (
          <div className="flex-1 min-w-0">
            <div
              className="rounded-2xl p-5"
              style={{
                background: phase === "revealed" ? `${colors.success}04` : colors.surface,
                border: `1px solid ${phase === "revealed" ? `${colors.success}15` : colors.border}`,
              }}
            >
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-4"
                style={{ color: phase === "revealed" ? colors.success : colors.textFaint }}
              >
                {phase === "revealed" ? "CONTAMINANTS ADDRESSED" : "CONTAMINANTS DETECTED"}
              </p>

              <div className="space-y-2">
                {top.map((c, i) => (
                  <div
                    key={c.contaminant_id || i}
                    className="flex items-center gap-2 py-1.5"
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      opacity: phase === "revealed" ? 1 : 1,
                      textDecoration: phase === "revealed" ? "line-through" : "none",
                      transition: "all 0.7s ease",
                      transitionDelay: phase === "revealed" ? `${i * 100}ms` : "0ms",
                    }}
                  >
                    {phase === "revealed" ? (
                      <Check
                        className="size-3.5 shrink-0 animate-in fade-in"
                        style={{ color: colors.success, animationDelay: `${i * 100}ms` }}
                      />
                    ) : (
                      <SeverityDot c={c} />
                    )}
                    <span
                      className="text-[13px] truncate flex-1"
                      style={{
                        color: phase === "revealed" ? colors.textFaint : colors.textSecondary,
                        transition: "color 0.7s ease",
                        transitionDelay: phase === "revealed" ? `${i * 100}ms` : "0ms",
                      }}
                    >
                      {contaminantName(c)}
                    </span>
                    {phase === "revealed" ? (
                      <span
                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md shrink-0 animate-in fade-in"
                        style={{
                          background: `${colors.success}12`,
                          color: colors.success,
                          animationDelay: `${i * 100}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        {c.over_legal ? "REMOVED" : c.over_health ? "SAFE" : "CLEAR"}
                      </span>
                    ) : (
                      <span
                        className="text-[12px] font-semibold shrink-0"
                        style={{
                          color: c.over_legal ? colors.critical : c.over_health ? colors.warning : colors.textFaint,
                        }}
                      >
                        {c.detected_level} {c.unit}
                      </span>
                    )}
                  </div>
                ))}
                {sorted.length > 8 && (
                  <p className="text-[11px] pt-1" style={{ color: colors.textFaint }}>
                    {phase === "revealed"
                      ? `All ${sorted.length} contaminants addressed`
                      : `+${sorted.length - 8} more contaminants`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── REVEAL BUTTON — shown before reveal ── */}
      {phase === "waiting" && (
        <button
          onClick={handleReveal}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-3 rounded-2xl py-5 text-[18px] font-bold active:scale-[0.97] transition-transform cursor-pointer mb-8"
          style={{
            background: `linear-gradient(135deg, ${colors.success}, ${colors.primary})`,
            boxShadow: `0 8px 32px ${colors.success}30`,
          }}
        >
          <Zap className="size-5" />
          Reveal Your Transformation
        </button>
      )}

      {/* Score delta summary — only after reveal */}
      {phase === "revealed" && (
        <div
          className="max-w-md mx-auto rounded-2xl p-5 text-center mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500"
          style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}
        >
          <p className="text-[14px] font-medium" style={{ color: colors.textMuted }}>
            Score improvement
          </p>
          <p className="text-[32px] font-black mt-1" style={{ color: colors.success }}>
            {currentScore} → {projectedScore}
          </p>
          <p className="text-[13px] mt-2" style={{ color: colors.textMuted }}>
            +{delta} points · Every contaminant addressed
          </p>
        </div>
      )}

      {/* Continue button — only after reveal */}
      {phase === "revealed" && (
        <button
          onClick={onNext}
          className="w-full max-w-md mx-auto flex items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer animate-in fade-in duration-500"
          style={{
            background: `linear-gradient(135deg, ${colors.success}, ${colors.primary})`,
            boxShadow: `0 4px 24px ${colors.success}20`,
          }}
        >
          Continue <ArrowRight className="size-5" />
        </button>
      )}
    </div>
  );
}
