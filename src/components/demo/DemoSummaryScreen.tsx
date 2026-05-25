/* ──── Phase 1: Final Summary Screen — "Your Home Water Plan" ────
   Shows a clean recap of everything covered in the presentation:
   scores, concerns, solution, benefits, and next step.
   Designed to sit before the decision page / QR handoff in the larger flow.
   ──── */

import { CheckCircle, Droplets, Shield, Sparkles, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { contaminantName } from "@/lib/supabase";
import { ScoreGauge } from "./ScoreGauge";

interface Props {
  report: any;
  company?: any;
  /** Initial score from local data */
  initialScore?: number;
  /** Score after live test verification */
  verifiedScore?: number;
  /** Projected score with recommended system */
  projectedScore?: number;
  /** Contaminant array for deriving top concerns */
  contaminants?: any[];
  /** Whether the boost/optional upgrade was applied */
  boostApplied?: boolean;
  /** Company primary color */
  companyColor?: string;
  onNext: () => void;
}

/* ──── Derive top concern labels from contaminants ──── */
function deriveTopConcerns(contaminants: any[]): string[] {
  const categories = new Map<string, number>();

  for (const c of contaminants) {
    const name = contaminantName(c).toLowerCase();
    let cat = "";

    if (name.includes("chlorine") || name.includes("chloramine"))
      cat = "Chlorine";
    else if (name.includes("trihalomethane") || name.includes("tthm") || name.includes("haloacetic"))
      cat = "Disinfection byproducts";
    else if (name.includes("hardness") || name.includes("calcium") || name.includes("magnesium"))
      cat = "Hardness";
    else if (name.includes("lead") || name.includes("chromium") || name.includes("arsenic"))
      cat = "Heavy metals";
    else if (name.includes("radium") || name.includes("uranium") || name.includes("radon"))
      cat = "Radioactive elements";
    else if (name.includes("nitrate") || name.includes("nitrite"))
      cat = "Nitrates";
    else if (c.over_legal) cat = "Legal violations";
    else if (c.over_health) cat = "Health concerns";

    if (cat) {
      categories.set(cat, (categories.get(cat) || 0) + 1);
    }
  }

  return Array.from(categories.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([cat]) => cat);
}

/* ──── Score Journey Mini ──── */
function ScoreJourneyMini({
  initial,
  verified,
  projected,
}: {
  initial?: number;
  verified?: number;
  projected?: number;
}) {
  const steps = [
    initial != null ? { label: "Starting", score: initial } : null,
    verified != null ? { label: "Verified", score: verified } : null,
    projected != null ? { label: "Projected", score: projected } : null,
  ].filter(Boolean) as { label: string; score: number }[];

  if (steps.length < 2) return null;

  return (
    <div className="flex items-center justify-center gap-3">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              {step.label}
            </p>
            <p
              className="text-2xl font-black tabular-nums mt-1"
              style={{
                color:
                  step.score >= 80
                    ? "#f59e0b"
                    : step.score >= 60
                      ? "#94a3b8"
                      : step.score >= 40
                        ? "#f97316"
                        : "#ef4444",
              }}
            >
              {step.score}
            </p>
          </div>
          {i < steps.length - 1 && (
            <TrendingUp className="size-4 text-white/20 mt-3" />
          )}
        </div>
      ))}
    </div>
  );
}

export function DemoSummaryScreen({
  report,
  company,
  initialScore,
  verifiedScore,
  projectedScore,
  contaminants = [],
  boostApplied = false,
  companyColor = "#2563eb",
  onNext,
}: Props) {
  const firstName = report?.customerName?.split(" ")[0] || "your home";
  const companyName = report?.companyName || company?.name || "";
  const displayScore = projectedScore ?? verifiedScore ?? initialScore ?? 0;
  const topConcerns = useMemo(() => deriveTopConcerns(contaminants), [contaminants]);

  const benefits = [
    { icon: Droplets, text: "Cleaner drinking water", color: "#3b82f6" },
    { icon: Shield, text: "Appliance & plumbing protection", color: "#10b981" },
    { icon: Sparkles, text: "Better showers & skin comfort", color: "#06b6d4" },
    { icon: CheckCircle, text: "Reduced bottled water dependence", color: "#8b5cf6" },
  ];

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70">
          YOUR PLAN
        </span>
        <h2 className="text-2xl font-black mt-3">Here's Where We Stand</h2>
        <p className="text-sm text-white/40 mt-1.5">
          Everything we covered for {firstName}
        </p>
      </div>

      {/* Projected Score — hero element */}
      <div className="flex flex-col items-center py-2">
        <ScoreGauge score={displayScore} size={160} animate={true} animationDuration={1500} />
        <p className="text-sm text-white/40 mt-2">
          {projectedScore != null ? "Projected AquaScore" : "Current AquaScore"}
        </p>
      </div>

      {/* Score Journey (if we have multiple data points) */}
      {(initialScore != null || verifiedScore != null) && projectedScore != null && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-4 text-center">
            Score Journey
          </p>
          <ScoreJourneyMini
            initial={initialScore}
            verified={verifiedScore}
            projected={projectedScore}
          />
        </div>
      )}

      {/* Plan details grid */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        {/* Main Concerns */}
        {topConcerns.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
              Main Concerns
            </p>
            <div className="flex flex-wrap gap-2">
              {topConcerns.map((concern) => (
                <span
                  key={concern}
                  className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-400"
                >
                  {concern}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Solution */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
            Recommended Solution
          </p>
          <p className="text-sm text-white/70">
            Whole-home filtration {boostApplied ? "+ softening + premium protection" : "+ softening"}
          </p>
        </div>

        {/* Primary Benefits */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
            Primary Benefits
          </p>
          <div className="space-y-2.5">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="size-7 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: `${b.color}15` }}
                >
                  <b.icon className="size-3.5" style={{ color: b.color }} />
                </div>
                <span className="text-sm text-white/60">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Step */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/60 mb-2">
          Next Step
        </p>
        <p className="text-sm text-white/70">
          Review your options with your water specialist
        </p>
        {companyName && (
          <p className="text-xs text-white/30 mt-1">
            {companyName} — Your water quality partner
          </p>
        )}
      </div>

      {/* Continue button */}
      <button
        onClick={onNext}
        className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${companyColor}, #10b981)`,
          boxShadow: `0 4px 24px ${companyColor}30`,
        }}
      >
        Continue →
      </button>
    </div>
  );
}
