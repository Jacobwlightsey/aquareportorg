/* ──── Before / After Chemicals — side-by-side reveal ────
   Shows contaminants "before" with the current score, then
   a reveal button shows the "after" with projected score.
   Placed between System and Trust in the flow.
   ──── */

import { ArrowRight, Check, Skull, AlertTriangle, FlaskConical, Zap } from "lucide-react";
import { useState } from "react";
import { playRevealSound, haptic } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";
import { contaminantName } from "@/lib/supabase";
import { colors, scoreColor } from "@/lib/designTokens";

interface Props {
  score: number;
  projectedScore: number;
  contaminants: any[];
  onNext: () => void;
}

function SeverityDot({ c }: { c: any }) {
  if (c.over_legal) return <Skull className="size-3.5 shrink-0" style={{ color: colors.critical }} />;
  if (c.over_health) return <AlertTriangle className="size-3.5 shrink-0" style={{ color: colors.warning }} />;
  return <FlaskConical className="size-3.5 shrink-0" style={{ color: colors.textFaint }} />;
}

export function DemoBeforeAfter({ score, projectedScore, contaminants, onNext }: Props) {
  const [revealed, setRevealed] = useState(false);

  const sorted = [...contaminants].sort((a, b) => {
    if (a.over_legal !== b.over_legal) return a.over_legal ? -1 : 1;
    if (a.over_health !== b.over_health) return a.over_health ? -1 : 1;
    return (b.times_above_ewg ?? 0) - (a.times_above_ewg ?? 0);
  });

  const top = sorted.slice(0, 8);

  const handleReveal = () => {
    setRevealed(true);
    playRevealSound();
    haptic("heavy");
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.primary}b0` }}>
          THE DIFFERENCE
        </p>
        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mt-3" style={{ color: colors.textPrimary }}>
          Before &amp; After Treatment
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          See what changes when you install the system.
        </p>
      </div>

      {/* Side by side panels */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* ── BEFORE panel ── */}
        <div
          className="rounded-2xl p-5 flex flex-col"
          style={{ background: `${colors.critical}04`, border: `1px solid ${colors.critical}15` }}
        >
          {/* Score */}
          <div className="flex flex-col items-center mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.critical }}>
              YOUR WATER TODAY
            </p>
            <ScoreGauge score={score} size={120} animationDuration={1200} />
            <p className="text-[28px] font-black mt-2" style={{ color: scoreColor(score) }}>{score}</p>
          </div>

          {/* Contaminant list */}
          <div className="space-y-2 flex-1">
            {top.map((c, i) => (
              <div
                key={c.contaminant_id || i}
                className="flex items-center gap-2 py-1.5 transition-all duration-700"
                style={{
                  borderBottom: `1px solid ${colors.border}`,
                  opacity: revealed ? 0.35 : 1,
                  textDecoration: revealed ? "line-through" : "none",
                  transitionDelay: revealed ? `${i * 100}ms` : "0ms",
                }}
              >
                <SeverityDot c={c} />
                <span className="text-[13px] truncate flex-1" style={{ color: colors.textSecondary }}>
                  {contaminantName(c)}
                </span>
                <span className="text-[12px] font-semibold shrink-0" style={{
                  color: c.over_legal ? colors.critical : c.over_health ? colors.warning : colors.textFaint,
                }}>
                  {revealed ? "0.00" : c.detected_level} {c.unit}
                </span>
              </div>
            ))}
            {sorted.length > 8 && (
              <p className="text-[11px] pt-1" style={{ color: colors.textFaint }}>
                +{sorted.length - 8} more contaminants
              </p>
            )}
          </div>
        </div>

        {/* ── AFTER panel ── */}
        <div
          className="rounded-2xl p-5 flex flex-col relative overflow-hidden"
          style={{
            background: revealed ? `${colors.success}04` : colors.surface,
            border: `1px solid ${revealed ? `${colors.success}15` : colors.border}`,
          }}
        >
          {/* Blur overlay before reveal */}
          {!revealed && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-10 backdrop-blur-sm"
              style={{ background: `${colors.bg}90` }}
            >
              <p className="text-[14px] font-medium mb-4" style={{ color: colors.textMuted }}>
                Ready to see the difference?
              </p>
              <button
                onClick={handleReveal}
                className="flex items-center gap-2 rounded-2xl px-8 py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
                style={{
                  background: `linear-gradient(135deg, ${colors.success}, ${colors.primary})`,
                  boxShadow: `0 8px 32px ${colors.success}30`,
                }}
              >
                <Zap className="size-5" />
                Reveal Results
              </button>
            </div>
          )}

          {/* Score */}
          <div className="flex flex-col items-center mb-5">
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.success }}>
              WITH THE SYSTEM
            </p>
            <ScoreGauge score={revealed ? projectedScore : 0} size={120} animationDuration={1600} />
            <p className="text-[28px] font-black mt-2" style={{ color: revealed ? scoreColor(projectedScore) : colors.textFaint }}>
              {revealed ? projectedScore : "??"}
            </p>
          </div>

          {/* After contaminant list — all reduced/removed */}
          <div className="space-y-2 flex-1">
            {top.map((c, i) => (
              <div
                key={c.contaminant_id || i}
                className={`flex items-center gap-2 py-1.5 ${revealed ? "animate-in fade-in" : ""}`}
                style={{
                  borderBottom: `1px solid ${colors.border}`,
                  animationDelay: revealed ? `${i * 80}ms` : undefined,
                  animationFillMode: "both",
                }}
              >
                <Check className="size-3.5 shrink-0" style={{ color: colors.success }} />
                <span className="text-[13px] truncate flex-1" style={{ color: colors.textSecondary }}>
                  {contaminantName(c)}
                </span>
                <span
                  className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-md shrink-0"
                  style={{ background: `${colors.success}12`, color: colors.success }}
                >
                  {c.over_legal ? "REMOVED" : c.over_health ? "SAFE" : "CLEAR"}
                </span>
              </div>
            ))}
            {sorted.length > 8 && (
              <p className="text-[11px] pt-1" style={{ color: colors.textFaint }}>
                All {sorted.length} contaminants addressed
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Delta summary — after reveal */}
      {revealed && (
        <div
          className="max-w-md mx-auto rounded-2xl p-5 text-center mb-8 animate-in fade-in slide-in-from-bottom-3 duration-500"
          style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}
        >
          <p className="text-[14px] font-medium" style={{ color: colors.textMuted }}>
            Score improvement
          </p>
          <p className="text-[32px] font-black mt-1" style={{ color: colors.success }}>
            {score} → {projectedScore}
          </p>
          <p className="text-[13px] mt-2" style={{ color: colors.textMuted }}>
            +{projectedScore - score} points · Every contaminant addressed
          </p>
        </div>
      )}

      {/* Continue — only after reveal */}
      {revealed && (
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
