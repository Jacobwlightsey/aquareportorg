/* ──── Summary Screen — Mockup-faithful 2-column layout ────
   Left: "Your Home Water Plan" + bullet benefits + download button.
   Right: Score Journey card (3 mini gauges) + Top Priorities pills + "Thank you!".
   ──── */

import { Download } from "lucide-react";
import { ScoreGauge } from "./ScoreGauge";
import { colors, scoreColor } from "@/lib/designTokens";
import type { CustomerConcernState } from "./DemoCustomerConcerns";

interface Props {
  report: any;
  company?: any;
  initialScore?: number;
  verifiedScore?: number;
  projectedScore?: number;
  contaminants?: any[];
  boostApplied?: boolean;
  companyColor?: string;
  customerConcerns?: CustomerConcernState | null;
  onNext: () => void;
}

const CONCERN_LABELS: Record<string, string> = {
  drinking_water: "Drinking Water",
  family_health: "Family Health",
  skin_and_hair: "Skin & Hair",
  appliances_plumbing: "Appliances",
  taste_or_smell: "Taste & Odor",
  stains_buildup: "Hard Water",
  bottled_water_costs: "Bottled Water Costs",
  peace_of_mind: "Peace of Mind",
};

const BENEFITS = [
  "Protect Your Family",
  "Improve Your Water",
  "Reduce Costs",
  "Enjoy Peace of Mind",
];

function midScore(current: number, projected: number): number {
  const mid = Math.round(current + (projected - current) * 0.4);
  return Math.max(current + 5, Math.min(projected - 10, mid));
}

export function DemoSummaryScreen({
  report,
  company,
  initialScore,
  verifiedScore,
  projectedScore,
  contaminants = [],
  boostApplied = false,
  companyColor = colors.primary,
  customerConcerns,
  onNext,
}: Props) {
  const baseScore = initialScore ?? 0;
  const basic = midScore(baseScore, projectedScore ?? baseScore);

  const journeySteps = [
    initialScore != null ? { label: "BEFORE", score: initialScore, size: 60 } : null,
    initialScore != null && projectedScore != null ? { label: "BASIC FILTRATION", score: basic, size: 60 } : null,
    projectedScore != null ? { label: "AQUAREPORT SYSTEM", score: projectedScore, size: 70 } : null,
  ].filter(Boolean) as { label: string; score: number; size: number }[];

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* 2-column layout */}
      <div className="flex gap-10 items-start" style={{ minHeight: "400px" }}>
        {/* Left column */}
        <div className="flex-1">
          <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight leading-tight" style={{ color: colors.textPrimary }}>
            Your Home<br />Water Plan
          </h2>
          <p className="text-[15px] mt-3 mb-8" style={{ color: colors.textMuted }}>
            Your personalized plan for healthier, better water.
          </p>

          {/* Benefits — bullet dots, not icon boxes */}
          <div className="space-y-4 mb-8">
            {BENEFITS.map((b) => (
              <div key={b} className="flex items-center gap-3">
                <div className="size-1.5 rounded-full shrink-0" style={{ background: colors.textSecondary }} />
                <span className="text-[15px]" style={{ color: colors.textSecondary }}>{b}</span>
              </div>
            ))}
          </div>

          {/* Download button — outline style */}
          <button
            className="flex items-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-medium cursor-pointer active:scale-[0.97] transition-transform"
            style={{ border: `1px solid ${colors.primary}30`, color: colors.primary }}
          >
            <Download className="size-4" />
            Download Your Plan
          </button>
        </div>

        {/* Right column */}
        <div className="w-80 shrink-0">
          {/* Score Journey card — 3 mini gauges */}
          {journeySteps.length >= 2 && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: colors.textMuted }}>
                Your Score Journey
              </p>
              <div className="flex items-end justify-center gap-4">
                {journeySteps.map((step, i) => (
                  <div key={step.label} className="flex flex-col items-center">
                    <ScoreGauge score={step.score} size={step.size} animationDuration={1200 + i * 400} />
                    <p className="text-[9px] font-bold tracking-wider uppercase mt-2 text-center max-w-[70px]" style={{ color: scoreColor(step.score) }}>
                      {step.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Priorities pills */}
          {customerConcerns && customerConcerns.selected.length > 0 && (
            <div className="mb-5">
              <p className="text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color: colors.textMuted }}>
                Your Top Priorities
              </p>
              <div className="flex flex-wrap gap-2">
                {customerConcerns.selected.map((key) => (
                  <span
                    key={key}
                    className="rounded-full px-4 py-1.5 text-[13px] font-medium"
                    style={{ background: `${colors.primary}15`, color: `${colors.primary}cc` }}
                  >
                    {CONCERN_LABELS[key] || key}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Closing message */}
          <div className="mt-6">
            <p className="text-[15px] leading-relaxed" style={{ color: colors.textMuted }}>
              You're one step away from<br />better water for your home.
            </p>
            <p
              className="mt-4"
              style={{
                fontFamily: "'Georgia', 'Times New Roman', serif",
                fontStyle: "italic",
                fontSize: "28px",
                color: colors.success,
              }}
            >
              Thank you!
            </p>
          </div>
        </div>
      </div>

      {/* Continue */}
      <div className="mt-8">
        <button
          onClick={onNext}
          className="w-full max-w-sm mx-auto block rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
          style={{
            background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})`,
            boxShadow: `0 4px 24px ${companyColor}20`,
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
