/* ──── Summary Screen — Mockup-faithful 2-column layout ────
   Left: "Your Home Water Plan" + bullet benefits + download button.
   Right: Score Journey card (3 mini gauges) + Top Priorities pills + "Thank you!".
   ──── */

// Download import removed — button not wired yet
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
  liveReadings?: Record<string, any>;
  concerns?: any;
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


export function DemoSummaryScreen({
  report: _report,
  company,
  initialScore,
  verifiedScore,
  projectedScore,
  contaminants = [],
  boostApplied: _boostApplied = false,
  companyColor = colors.primary,
  customerConcerns,
  onNext,
  liveReadings: _liveReadings,
  concerns,
}: Props) {
  const journeySteps = [
    initialScore != null ? { label: "TODAY", score: initialScore, size: 44 } : null,
    verifiedScore != null && verifiedScore !== initialScore ? { label: "VERIFIED", score: verifiedScore, size: 44 } : null,
    projectedScore != null ? { label: "WITH SYSTEM", score: projectedScore, size: 52 } : null,
  ].filter(Boolean) as { label: string; score: number; size: number }[];

  const totalContaminants = contaminants.length;
  const legalViolations = contaminants.filter((c: any) => c.over_legal).length;
  const householdSize = concerns?.people ?? null;
  const hasKids = concerns?.kids ?? false;
  const hasPets = concerns?.pets ?? false;

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
            Based on everything we've discussed today.
          </p>

          {/* Personalized recap */}
          <div className="space-y-3 mb-8">
            {totalContaminants > 0 && (
              <div className="flex items-start gap-3">
                <span className="text-[14px] shrink-0 mt-0.5">🧪</span>
                <span className="text-[14px]" style={{ color: colors.textSecondary }}>
                  <strong style={{ color: colors.textPrimary }}>{totalContaminants} contaminants</strong> detected
                  {legalViolations > 0 && <span style={{ color: colors.critical }}> ({legalViolations} above legal limits)</span>}
                  {" — all addressed by the system."}
                </span>
              </div>
            )}
            {householdSize && (
              <div className="flex items-start gap-3">
                <span className="text-[14px] shrink-0 mt-0.5">👨‍👩‍👧‍👦</span>
                <span className="text-[14px]" style={{ color: colors.textSecondary }}>
                  Whole-home protection for your household of <strong style={{ color: colors.textPrimary }}>{householdSize}</strong>
                  {hasKids ? ", including your children" : ""}
                  {hasPets ? " and pets" : ""}.
                </span>
              </div>
            )}
            {projectedScore != null && initialScore != null && (
              <div className="flex items-start gap-3">
                <span className="text-[14px] shrink-0 mt-0.5">📈</span>
                <span className="text-[14px]" style={{ color: colors.textSecondary }}>
                  Score improvement: <strong style={{ color: colors.critical }}>{initialScore}</strong> → <strong style={{ color: colors.success }}>{projectedScore}</strong>
                  {" (+"}
                  {projectedScore - initialScore} points).
                </span>
              </div>
            )}
            {(company?.demoConfig?.summaryBenefits?.length ? company.demoConfig.summaryBenefits : BENEFITS).map((b: string) => (
              <div key={b} className="flex items-start gap-3">
                <span className="text-[14px] shrink-0 mt-0.5">✅</span>
                <span className="text-[14px]" style={{ color: colors.textSecondary }}>{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="w-80 shrink-0">
          {/* Score Journey card — 3 mini gauges */}
          {journeySteps.length >= 2 && (
            <div className="rounded-2xl p-5 mb-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <p className="text-[10px] font-bold tracking-widest uppercase mb-4" style={{ color: colors.textMuted }}>
                Your Score Journey
              </p>
              <div className="flex items-end justify-center gap-5">
                {journeySteps.map((step, i) => (
                  <div key={step.label} className="flex flex-col items-center min-w-[70px]">
                    <ScoreGauge score={step.score} size={step.size} animationDuration={1200 + i * 400} />
                    <p className="text-[18px] font-bold mt-1 tabular-nums" style={{ color: scoreColor(step.score) }}>
                      {step.score}
                    </p>
                    <p className="text-[8px] font-bold tracking-wider uppercase text-center" style={{ color: colors.textFaint }}>
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
