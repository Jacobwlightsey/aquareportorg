/* ──── Summary Screen — Premium Recommendation ────
   "Your Home Water Plan"
   Should feel like receiving a personalized recommendation.
   NOT a feature recap. NOT a checklist.
   Lots of whitespace. Simplified sections. Vertical rhythm.
   ──── */

import { CheckCircle, Droplets, Shield, Sparkles } from "lucide-react";
import { useMemo } from "react";
import { contaminantName } from "@/lib/supabase";
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

function deriveTopConcerns(contaminants: any[]): string[] {
  const categories = new Map<string, number>();
  for (const c of contaminants) {
    const name = contaminantName(c).toLowerCase();
    let cat = "";
    if (name.includes("chlorine") || name.includes("chloramine")) cat = "Chlorine";
    else if (name.includes("trihalomethane") || name.includes("tthm") || name.includes("haloacetic")) cat = "Disinfection byproducts";
    else if (name.includes("hardness") || name.includes("calcium") || name.includes("magnesium")) cat = "Hardness";
    else if (name.includes("lead") || name.includes("chromium") || name.includes("arsenic")) cat = "Heavy metals";
    else if (name.includes("radium") || name.includes("uranium") || name.includes("radon")) cat = "Radioactive elements";
    else if (name.includes("nitrate") || name.includes("nitrite")) cat = "Nitrates";
    else if (c.over_legal) cat = "Legal violations";
    else if (c.over_health) cat = "Health concerns";
    if (cat) categories.set(cat, (categories.get(cat) || 0) + 1);
  }
  return Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
}

const CONCERN_LABELS: Record<string, string> = {
  drinking_water: "Drinking Water",
  family_health: "Family Health",
  skin_and_hair: "Skin & Hair",
  appliances_plumbing: "Home & Appliances",
  taste_or_smell: "Taste & Smell",
  stains_buildup: "Stains & Buildup",
  bottled_water_costs: "Bottled Water Costs",
};

function prioritizedBenefits(emphasis?: string) {
  const all = [
    { icon: Droplets, text: "Cleaner drinking water", color: colors.primary },
    { icon: Shield, text: "Appliance & plumbing protection", color: colors.success },
    { icon: Sparkles, text: "Better showers & skin comfort", color: colors.primary },
    { icon: CheckCircle, text: "Reduced bottled water spending", color: colors.success },
  ];
  if (!emphasis || emphasis === "general") return all;
  const idx = all.findIndex((_, i) =>
    (emphasis === "drinking" && i === 0) ||
    (emphasis === "home_expenses" && i === 1) ||
    (emphasis === "family" && i === 0)
  );
  if (idx > 0) {
    const [item] = all.splice(idx, 1);
    all.unshift(item);
  }
  return all;
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
  const firstName = report?.customerName?.split(" ")[0] || "your home";
  const companyName = report?.companyName || company?.name || "";
  const displayScore = projectedScore ?? verifiedScore ?? initialScore ?? 0;
  const topConcerns = useMemo(() => deriveTopConcerns(contaminants), [contaminants]);
  const benefits = prioritizedBenefits(customerConcerns?.emphasis);

  // Score journey data
  const journeySteps = [
    initialScore != null ? { label: "Starting", score: initialScore } : null,
    verifiedScore != null ? { label: "Verified", score: verifiedScore } : null,
    projectedScore != null ? { label: "Projected", score: projectedScore } : null,
  ].filter(Boolean) as { label: string; score: number }[];

  return (
    <div className="mx-auto max-w-lg pt-6">
      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[13px] font-medium tracking-wide uppercase" style={{ color: `${colors.success}90` }}>
          Your Plan
        </p>
        <h2 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight mt-3">
          Here's Where We Stand
        </h2>
        <p className="text-[15px] mt-3" style={{ color: colors.textMuted }}>
          Everything we covered for {firstName}
        </p>
      </div>

      {/* Score — hero gauge */}
      <div className="flex flex-col items-center mb-10">
        <ScoreGauge score={displayScore} size={180} animate animationDuration={1800} />
        <p className="text-[13px] mt-4" style={{ color: colors.textMuted }}>
          {projectedScore != null ? "Projected AquaScore" : "Current AquaScore"}
        </p>
      </div>

      {/* Score Journey — if multiple data points */}
      {journeySteps.length >= 2 && (
        <div className="rounded-2xl p-6 mb-8" style={{ background: colors.surface }}>
          <p className="text-[12px] font-medium tracking-wide uppercase mb-5 text-center" style={{ color: colors.textMuted }}>
            Score Journey
          </p>
          <div className="flex items-baseline justify-center gap-6">
            {journeySteps.map((step, i) => (
              <div key={step.label} className="flex items-baseline gap-6">
                <div className="text-center">
                  <p
                    className={`tabular-nums font-bold ${i === journeySteps.length - 1 ? "text-[36px]" : "text-[22px]"}`}
                    style={{ color: i === journeySteps.length - 1 ? colors.success : `${scoreColor(step.score)}70` }}
                  >
                    {step.score}
                  </p>
                  <p className="text-[11px] mt-1" style={{ color: colors.textFaint }}>
                    {step.label}
                  </p>
                </div>
                {i < journeySteps.length - 1 && (
                  <span className="text-[16px]" style={{ color: colors.textFaint }}>→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Priorities — from customer selections */}
      {customerConcerns && customerConcerns.selected.length > 0 && (
        <div className="mb-8">
          <p className="text-[12px] font-medium tracking-wide uppercase mb-4" style={{ color: colors.textMuted }}>
            Your Priorities
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

      {/* Key Findings — from contaminant data */}
      {topConcerns.length > 0 && (
        <div className="mb-8">
          <p className="text-[12px] font-medium tracking-wide uppercase mb-4" style={{ color: colors.textMuted }}>
            Key Findings
          </p>
          <div className="flex flex-wrap gap-2">
            {topConcerns.map((concern) => (
              <span
                key={concern}
                className="rounded-full px-4 py-1.5 text-[13px] font-medium"
                style={{ background: `${colors.warning}15`, color: `${colors.warning}cc` }}
              >
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Solution */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: colors.surface }}>
        <p className="text-[12px] font-medium tracking-wide uppercase mb-3" style={{ color: colors.textMuted }}>
          Recommended Solution
        </p>
        <p className="text-[16px] font-medium" style={{ color: colors.textPrimary }}>
          Whole-home filtration {boostApplied ? "+ softening + premium protection" : "+ softening"}
        </p>
      </div>

      {/* Benefits — clean list */}
      <div className="mb-8">
        <p className="text-[12px] font-medium tracking-wide uppercase mb-4" style={{ color: colors.textMuted }}>
          Primary Benefits
        </p>
        <div className="space-y-4">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-4">
              <div
                className="size-9 shrink-0 rounded-xl flex items-center justify-center"
                style={{ background: `${b.color}12` }}
              >
                <b.icon className="size-4" style={{ color: b.color }} />
              </div>
              <span className="text-[15px]" style={{ color: colors.textSecondary }}>
                {b.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next step */}
      <div className="rounded-2xl p-6 text-center mb-8" style={{ background: `${colors.success}08` }}>
        <p className="text-[15px] font-medium" style={{ color: colors.textSecondary }}>
          Review your options with your water specialist
        </p>
        {companyName && (
          <p className="text-[13px] mt-2" style={{ color: colors.textFaint }}>
            {companyName}
          </p>
        )}
      </div>

      {/* Continue */}
      <button
        onClick={onNext}
        className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer mb-4"
        style={{
          background: `linear-gradient(135deg, ${companyColor}, ${colors.success})`,
          boxShadow: `0 4px 24px ${companyColor}20`,
        }}
      >
        Continue
      </button>
    </div>
  );
}
