/* ──── Score Transform — The Cinematic Climax ────
   Problem → Proof → Resolution.
   ONE dominant gauge that morphs between states.
   Massive whitespace. Slower motion. Stronger typography.
   This is the emotional peak of the entire presentation.
   ──── */

import { ArrowRight, Sparkles } from "lucide-react";
import { useState } from "react";
import { playRevealSound, playCelebrationSound } from "@/lib/demoSounds";
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

export function DemoScoreTransform({ score, report, company, contaminants, liveReadings, projectedScore, onNext }: Props) {
  const [transformed, setTransformed] = useState(false);
  const companyColor = company?.primaryColor || report.companyColor || colors.primary;
  const rows = readingRows(liveReadings, report);
  const improvement = projectedScore - score;

  const handleTransform = () => {
    setTransformed(true);
    playRevealSound();
    setTimeout(() => playCelebrationSound(), 2800);
  };

  return (
    <div className="mx-auto max-w-lg pt-6">
      {/* ── Pre-transform: one question, one gauge, one button ── */}
      {!transformed && (
        <div className="flex flex-col items-center text-center space-y-12">
          {/* Headline */}
          <div className="space-y-3 px-4">
            <p className="text-[13px] font-medium tracking-wide uppercase" style={{ color: `${colors.primary}90` }}>
              Your Water, Transformed
            </p>
            <h2 className="text-[32px] sm:text-[36px] font-bold leading-tight tracking-tight">
              Ready to See<br />the Difference?
            </h2>
          </div>

          {/* Current score — smaller, quieter, muted */}
          <div className="flex flex-col items-center">
            <ScoreGauge score={score} size={140} animate={false} muted />
            <p className="text-[13px] mt-4" style={{ color: colors.textMuted }}>Current Score</p>
          </div>

          {/* The transform button */}
          <button
            onClick={handleTransform}
            className="flex items-center gap-3 rounded-2xl px-10 py-5 text-lg font-bold active:scale-[0.97] transition-all cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})`,
              boxShadow: `0 8px 40px ${companyColor}30`,
            }}
          >
            <Sparkles className="size-5" />
            See Your Results
          </button>
        </div>
      )}

      {/* ── Post-transform: the hero reveal ── */}
      {transformed && (
        <div className="flex flex-col items-center text-center">
          {/* Score Journey — large, cinematic progression */}
          <div className="space-y-2 mb-10">
            <p className="text-[13px] font-medium tracking-wide uppercase" style={{ color: `${colors.success}90` }}>
              Score Journey
            </p>
            {/* Progression numbers: before → after */}
            <div className="flex items-baseline justify-center gap-4">
              <span
                className="text-[28px] font-bold tabular-nums line-through decoration-2"
                style={{ color: `${scoreColor(score)}50`, textDecorationColor: `${scoreColor(score)}30` }}
              >
                {score}
              </span>
              <ArrowRight className="size-5" style={{ color: colors.textFaint }} />
              <span
                className="text-[48px] sm:text-[56px] font-black tabular-nums tracking-tight"
                style={{ color: colors.success }}
              >
                {projectedScore}
              </span>
            </div>
          </div>

          {/* THE gauge — hero element, large, breathing */}
          <div className="py-4 mb-10">
            <ScoreGauge score={projectedScore} size={260} animationDuration={2800} />
          </div>

          {/* Improvement — quiet, confident */}
          <p className="text-[15px] font-semibold mb-10" style={{ color: colors.success }}>
            +{improvement} point improvement
          </p>

          {/* Reading changes — minimal, clean */}
          {rows.length > 0 && (
            <div
              className="w-full rounded-2xl p-6 space-y-4 mb-10"
              style={{ background: colors.surface }}
            >
              <p className="text-[12px] font-medium tracking-wide uppercase text-left" style={{ color: colors.textMuted }}>
                What Changes
              </p>
              {rows.map((r) => (
                <div key={r.key} className="flex items-center justify-between">
                  <span className="text-[15px]" style={{ color: colors.textSecondary }}>
                    {r.label}
                  </span>
                  <div className="flex items-center gap-3 text-[15px]">
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

          {/* Continue — understated */}
          <button
            onClick={onNext}
            className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
            style={{
              background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})`,
              boxShadow: `0 4px 24px ${companyColor}20`,
            }}
          >
            Continue
          </button>
        </div>
      )}
    </div>
  );
}
