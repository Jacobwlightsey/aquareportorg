/* ──── Cost Comparison — "The Numbers" ────
   Clean, calm comparison. NOT salesy.
   Surface cards, designTokens colors.
   ──── */

import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { playTapSound } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { colors } from "@/lib/designTokens";
import type { ConcernData } from "./DemoConcernIntake";

interface Props {
  company: any;
  report?: any;
  score?: number;
  concerns?: ConcernData | null;
  onNext: () => void;
  onBack: () => void;
}

interface CostItem {
  label: string;
  monthlyCost: number;
  color: string;
  description: string;
}

const DEFAULT_COSTS: CostItem[] = [
  { label: "Bottled Water", monthlyCost: 60, color: colors.critical, description: "Average family of 4" },
  { label: "Appliance Repairs", monthlyCost: 45, color: colors.warning, description: "Hard water damage to appliances" },
  { label: "Plumbing", monthlyCost: 25, color: "#f97316", description: "Scale buildup, pipe corrosion" },
  { label: "Cleaning Products", monthlyCost: 20, color: "#8b5cf6", description: "Extra products for hard water" },
  { label: "Energy Waste", monthlyCost: 15, color: colors.primary, description: "Scale reduces heater efficiency" },
];

export function DemoCostComparison({ company, report, score, concerns, onNext, onBack }: Props) {
  const [showYearly, setShowYearly] = useState(false);
  const costs = useMemo(() => {
    const cc = (company as any)?.demoConfig?.costComparison;
    if (cc?.items?.length) return cc.items as CostItem[];
    return DEFAULT_COSTS;
  }, [company]);

  const monthlyTotal = costs.reduce((s, c) => s + c.monthlyCost, 0);
  const yearlyTotal = monthlyTotal * 12;
  const displayTotal = showYearly ? yearlyTotal : monthlyTotal;

  const animatedTotal = useCountUp(displayTotal, 1200, 200);

  // Bar chart max
  const maxCost = Math.max(...costs.map((c) => (showYearly ? c.monthlyCost * 12 : c.monthlyCost)));

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.critical}b0` }}>
          THE REAL COST
        </p>
        <h2 className="text-[28px] font-bold mt-3 leading-tight tracking-tight">
          What Unfiltered Water<br />
          <span style={{ color: colors.critical }}>Actually Costs You</span>
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          Hidden costs most families don't realize they're paying
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: colors.surface }}>
          <button
            onClick={() => { playTapSound(); setShowYearly(false); }}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
            style={{
              background: !showYearly ? colors.elevated : "transparent",
              color: !showYearly ? colors.textPrimary : colors.textFaint,
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => { playTapSound(); setShowYearly(true); }}
            className="px-4 py-2 rounded-lg text-[13px] font-medium transition-all cursor-pointer"
            style={{
              background: showYearly ? colors.elevated : "transparent",
              color: showYearly ? colors.textPrimary : colors.textFaint,
            }}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Total */}
      <div className="rounded-2xl p-6 text-center" style={{ background: `${colors.critical}08`, border: `1px solid ${colors.critical}18` }}>
        <TrendingDown className="size-6 mx-auto mb-2" style={{ color: colors.critical }} />
        <p className="text-[40px] font-bold" style={{ color: colors.critical }}>
          ${animatedTotal.toLocaleString()}
        </p>
        <p className="text-[14px]" style={{ color: colors.textMuted }}>
          wasted {showYearly ? "every year" : "every month"} on unfiltered water
        </p>
      </div>

      {/* Cost breakdown */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: colors.surface }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>
          COST BREAKDOWN
        </p>
        {costs.map((cost) => {
          const value = showYearly ? cost.monthlyCost * 12 : cost.monthlyCost;
          const barWidth = maxCost > 0 ? (value / maxCost) * 100 : 0;
          return (
            <div key={cost.label} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{cost.label}</span>
                  <span className="text-[12px] ml-2" style={{ color: colors.textFaint }}>{cost.description}</span>
                </div>
                <span className="text-[15px] font-bold tabular-nums" style={{ color: cost.color }}>
                  ${value.toLocaleString()}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: `${colors.textFaint}10` }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barWidth}%`, background: cost.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparison message */}
      <div className="rounded-2xl p-5 text-center space-y-2" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
        <TrendingUp className="size-5 mx-auto" style={{ color: colors.success }} />
        <p className="text-[15px] font-semibold" style={{ color: colors.success }}>
          A whole-home system pays for itself
        </p>
        <p className="text-[13px]" style={{ color: colors.textMuted }}>
          ${yearlyTotal.toLocaleString()}/year in hidden costs vs. a fixed monthly payment for clean, protected water everywhere.
        </p>
      </div>

      {/* Nav */}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-2xl py-3 text-[14px] font-medium cursor-pointer" style={{ background: colors.surface, color: colors.textMuted }}>← Back</button>
        <button onClick={onNext} className="flex-1 rounded-2xl py-3 text-[14px] font-semibold cursor-pointer" style={{ background: `${colors.primary}15`, color: colors.primary }}>Continue →</button>
      </div>
    </div>
  );
}
