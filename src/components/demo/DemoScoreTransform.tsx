/* ──── Score Transform / Score Journey — 3 progressive gauges ────
   Mockup-faithful: "Your Score Journey" with 3 side-by-side gauges.
   No pre-screen / reveal button — gauges fill in sequence on mount.
   Quote card at bottom.
   ──── */

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { ScoreGauge } from "./ScoreGauge";
import { colors, scoreColor } from "@/lib/designTokens";

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
  const labels: Record<string, { label: string; unit: string }> = {
    chlorine: { label: "Chlorine", unit: "ppm" },
    ph: { label: "pH Level", unit: "" },
    hardness: { label: "Hardness", unit: "gpg" },
    tds: { label: "TDS", unit: "ppm" },
  };
  return Object.entries(current)
    .filter(([, v]) => v != null)
    .map(([key, val]) => ({
      key,
      label: labels[key]?.label ?? key,
      unit: labels[key]?.unit ?? "",
      before: Number(val),
      after: IDEAL_READINGS[key] ?? Number(val),
    }));
}

/* Estimate a "basic filtration" mid-score */
function midScore(current: number, projected: number): number {
  const mid = Math.round(current + (projected - current) * 0.4);
  return Math.max(current + 5, Math.min(projected - 10, mid));
}

export function DemoScoreTransform({ score, report, company, contaminants, liveReadings, projectedScore, onNext }: Props) {
  const companyColor = company?.primaryColor || report.companyColor || colors.primary;
  const basic = midScore(score, projectedScore);
  const rows = readingRows(liveReadings, report);
  const [showReadings, setShowReadings] = useState(false);

  const journeySteps = [
    { score: score, label: "BEFORE", sublabel: "Your Water Today", color: scoreColor(score), size: 100 },
    { score: basic, label: "WITH BASIC FILTRATION", sublabel: "Carbon Filter System", color: scoreColor(basic), size: 100 },
    { score: projectedScore, label: "WITH AQUAREPORT SYSTEM", sublabel: "Whole Home Protection", color: scoreColor(projectedScore), size: 120 },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* Title */}
      <div className="text-center mb-12">
        <h2 style={{ fontSize: "clamp(28px, 4vw, 32px)", fontWeight: 700, letterSpacing: "-0.02em" }}>
          <span style={{ color: colors.textPrimary }}>Your Score </span>
          <span style={{ color: colors.primary }}>Journey</span>
        </h2>
        <p className="text-[15px] mt-3" style={{ color: colors.textMuted }}>
          See the transformation proper water treatment can make.
        </p>
      </div>

      {/* 3 gauges side by side — staggered animation */}
      <div className="flex items-end justify-center gap-6 lg:gap-10 mb-12">
        {journeySteps.map((step, i) => (
          <div key={step.label} className="flex flex-col items-center">
            <ScoreGauge
              score={step.score}
              size={step.size}
              animationDuration={1200 + i * 800}
            />
            <p
              className="text-[10px] font-bold tracking-widest uppercase mt-4 text-center"
              style={{ color: `${step.color}b0` }}
            >
              {step.label}
            </p>
            <p className="text-[12px] mt-1 text-center" style={{ color: colors.textMuted }}>
              {step.sublabel}
            </p>
          </div>
        ))}
      </div>

      {/* Quote card */}
      <div
        className="max-w-xl mx-auto rounded-2xl p-5 flex items-start gap-4 mb-8"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <span className="text-xl shrink-0 mt-0.5">💬</span>
        <p className="text-[15px] leading-relaxed" style={{ color: colors.textSecondary }}>
          From concerning to exceptional.{" "}
          <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
            That's the power of proper water treatment.
          </span>
        </p>
      </div>

      {/* What Changes — collapsed by default */}
      {rows.length > 0 && (
        <div className="max-w-xl mx-auto mb-8">
          <button
            onClick={() => setShowReadings(!showReadings)}
            className="text-[12px] font-medium tracking-wide uppercase cursor-pointer"
            style={{ color: colors.textFaint }}
          >
            {showReadings ? "Hide" : "Show"} Reading Changes ▾
          </button>
          {showReadings && (
            <div className="rounded-2xl p-5 space-y-3 mt-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              {rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between">
                  <span className="text-[14px]" style={{ color: colors.textSecondary }}>{r.label}</span>
                  <div className="flex items-center gap-3 text-[14px]">
                    <span className="line-through" style={{ color: colors.textFaint }}>
                      {r.before} {r.unit}
                    </span>
                    <ArrowRight className="size-3" style={{ color: colors.textFaint }} />
                    <span className="font-semibold" style={{ color: colors.success }}>
                      {r.after} {r.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Continue */}
      <button
        onClick={onNext}
        className="w-full max-w-xl mx-auto block rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})`,
          boxShadow: `0 4px 24px ${companyColor}20`,
        }}
      >
        Continue
      </button>
    </div>
  );
}
