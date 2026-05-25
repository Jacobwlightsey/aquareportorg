/* ──── Phase 3: Score Transform — The Signature Moment ────
   This is the emotional climax of the presentation.
   Problem → Proof → Resolution. The visual hero's journey.
   Bigger, calmer, more cinematic. Not more data — more breathing room.
   ──── */

import { ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import { useState } from "react";
import { playRevealSound, playCelebrationSound } from "@/lib/demoSounds";
import { ScoreGauge } from "./ScoreGauge";

interface Props {
  score: number;
  report: any;
  company: any;
  contaminants: any[];
  liveReadings: Record<string, any>;
  projectedScore: number;
  onNext: () => void;
}

const IDEAL_READINGS: Record<string, number> = { chlorine: 0.02, ph: 7, hardness: 0.3, tds: 25 };

function readingRows(readings: Record<string, any>, report: any) {
  const current = {
    chlorine: readings.chlorine ?? report.chlorine,
    hardness: readings.hardness ?? report.hardness,
    tds: readings.tds ?? report.tds,
    ph: readings.ph ?? report.ph,
  };
  const labels: Record<string, { label: string; unit: string; icon: string }> = {
    chlorine: { label: "Chlorine", unit: "ppm", icon: "🧪" },
    ph: { label: "pH Level", unit: "", icon: "⚗️" },
    hardness: { label: "Hardness", unit: "gpg", icon: "💎" },
    tds: { label: "TDS", unit: "ppm", icon: "💧" },
  };
  return Object.entries(current)
    .filter(([, v]) => v != null)
    .map(([key, val]) => ({
      key,
      label: labels[key]?.label ?? key,
      icon: labels[key]?.icon ?? "💧",
      unit: labels[key]?.unit ?? "",
      before: Number(val),
      after: IDEAL_READINGS[key] ?? Number(val),
    }));
}

export function DemoScoreTransform({ score, report, company, contaminants, liveReadings, projectedScore, onNext }: Props) {
  const [transformed, setTransformed] = useState(false);
  const companyColor = company?.primaryColor || report.companyColor || "#2563eb";
  const displayScore = transformed ? projectedScore : score;
  const rows = readingRows(liveReadings, report);
  const improvement = projectedScore - score;

  const handleTransform = () => {
    setTransformed(true);
    playRevealSound();
    setTimeout(() => playCelebrationSound(), 2200);
  };

  return (
    <div className="mx-auto max-w-lg pt-4">
      {/* ── Pre-transform: cinematic anticipation ── */}
      {!transformed && (
        <div className="flex flex-col items-center text-center space-y-8">
          <div className="space-y-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70">
              Your Water, Transformed
            </span>
            <h2 className="text-3xl font-black leading-tight">
              Ready to See<br />the Difference?
            </h2>
          </div>

          {/* Current score — smaller, muted */}
          <div className="opacity-60">
            <ScoreGauge score={score} size={160} animate={false} />
            <p className="text-xs text-white/30 mt-2">Current Score</p>
          </div>

          {/* The big button — the moment of transformation */}
          <button
            onClick={handleTransform}
            className="flex items-center gap-3 rounded-2xl px-10 py-5 text-lg font-bold active:scale-[0.97] transition-all cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${companyColor}, #8b5cf6)`,
              boxShadow: `0 8px 40px ${companyColor}40`,
            }}
          >
            <Sparkles className="size-5" />
            Transform Your Water
          </button>
        </div>
      )}

      {/* ── Post-transform: the hero reveal ── */}
      {transformed && (
        <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in duration-700">
          {/* Score Journey: the narrative arc */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">
              Score Journey
            </span>
            <div className="flex items-center justify-center gap-6">
              <div>
                <p className="text-3xl font-black tabular-nums text-red-400/60">{score}</p>
                <p className="text-[10px] text-white/30 mt-1">Before</p>
              </div>
              <div className="flex flex-col items-center">
                <TrendingUp className="size-5 text-white/20" />
              </div>
              <div>
                <p className="text-5xl font-black tabular-nums text-emerald-400">{projectedScore}</p>
                <p className="text-[10px] text-emerald-400/60 mt-1">After</p>
              </div>
            </div>
          </div>

          {/* The gauge — large, proud, center stage */}
          <div className="py-2">
            <ScoreGauge score={projectedScore} size={240} animationDuration={2500} />
          </div>

          {/* Improvement badge */}
          <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-5 py-2.5">
            <TrendingUp className="size-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400">+{improvement} point improvement</span>
          </div>

          {/* Reading comparison — clean, quiet */}
          {rows.length > 0 && (
            <div className="w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                What Changes
              </p>
              {rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between">
                  <span className="text-sm text-white/50">
                    {r.icon} {r.label}
                  </span>
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className="text-white/25 line-through">
                      {r.before} {r.unit}
                    </span>
                    <ArrowRight className="size-3 text-white/15" />
                    <span className="text-emerald-400 font-semibold">
                      {r.after} {r.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue — understated, let the moment breathe */}
          <button
            onClick={onNext}
            className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${companyColor}, #06b6d4)`,
              boxShadow: `0 4px 24px ${companyColor}25`,
            }}
          >
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}
