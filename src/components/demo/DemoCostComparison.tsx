/* ──── Cost Comparison — "The Numbers" ────
   Expenses start at $0. Rep enters actual spending per category.
   Editable inputs with real-time total calculation.
   ──── */

import { DollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { playTapSound } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { colors } from "@/lib/designTokens";

interface Props {
  company: any;
  onNext: () => void;
  onBack: () => void;
  onExpensesChange?: (monthly: number) => void;
}

interface CostItem {
  id: string;
  label: string;
  placeholder: number;
  color: string;
  description: string;
}

const DEFAULT_COSTS: CostItem[] = [
  { id: "bottled_water", label: "Bottled Water", placeholder: 60, color: colors.critical, description: "Average family of 4" },
  { id: "appliance_repairs", label: "Appliance Repairs", placeholder: 45, color: colors.warning, description: "Hard water damage to appliances" },
  { id: "plumbing", label: "Plumbing", placeholder: 25, color: "#f97316", description: "Scale buildup, pipe corrosion" },
  { id: "cleaning", label: "Cleaning Products", placeholder: 20, color: "#8b5cf6", description: "Extra products for hard water" },
  { id: "energy", label: "Energy Waste", placeholder: 15, color: colors.primary, description: "Scale reduces heater efficiency" },
];

export function DemoCostComparison({ company, onNext, onBack, onExpensesChange }: Props) {
  const [showYearly, setShowYearly] = useState(false);
  const costs = useMemo(() => {
    const cc = (company as any)?.demoConfig?.costComparison;
    if (cc?.items?.length) return cc.items as CostItem[];
    return DEFAULT_COSTS;
  }, [company]);

  // All costs start at $0 — rep enters actual spending
  const [values, setValues] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    costs.forEach(c => { init[c.id] = 0; });
    return init;
  });

  const updateCost = (id: string, val: string) => {
    const num = Math.max(0, parseInt(val) || 0);
    setValues(prev => ({ ...prev, [id]: num }));
  };

  const monthlyTotal = Object.values(values).reduce((s, v) => s + v, 0);

  // Report expenses up to parent
  useEffect(() => { onExpensesChange?.(monthlyTotal); }, [monthlyTotal, onExpensesChange]);
  const yearlyTotal = monthlyTotal * 12;
  const displayTotal = showYearly ? yearlyTotal : monthlyTotal;

  const animatedTotal = useCountUp(displayTotal, 800, 100);

  // Bar chart max
  const maxCost = Math.max(1, ...costs.map((c) => (showYearly ? (values[c.id] || 0) * 12 : (values[c.id] || 0))));

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-5 pt-4">
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
          Enter the customer's actual monthly spending
        </p>
      </div>

      {/* Toggle */}
      <div className="flex justify-center">
        <div className="flex gap-1 rounded-xl p-1" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
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
        <TrendingDown className="size-6 mx-auto mb-2" style={{ color: monthlyTotal > 0 ? colors.critical : colors.textFaint }} />
        <p className="text-[40px] font-bold" style={{ color: monthlyTotal > 0 ? colors.critical : colors.textFaint }}>
          ${animatedTotal.toLocaleString()}
        </p>
        <p className="text-[14px]" style={{ color: colors.textMuted }}>
          {monthlyTotal > 0
            ? `wasted ${showYearly ? "every year" : "every month"} on unfiltered water`
            : "enter spending below to calculate"
          }
        </p>
      </div>

      {/* Cost breakdown — editable inputs */}
      <div className="rounded-2xl p-5 space-y-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>
          COST BREAKDOWN
        </p>
        {costs.map((cost) => {
          const value = values[cost.id] || 0;
          const displayValue = showYearly ? value * 12 : value;
          const barWidth = maxCost > 0 ? (displayValue / maxCost) * 100 : 0;
          return (
            <div key={cost.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[14px] font-medium" style={{ color: colors.textPrimary }}>{cost.label}</span>
                  <span className="text-[12px] ml-2" style={{ color: colors.textFaint }}>{cost.description}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[14px]" style={{ color: colors.textFaint }}>$</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={value || ""}
                    placeholder={String(cost.placeholder)}
                    onChange={(e) => updateCost(cost.id, e.target.value)}
                    className="w-16 rounded-lg px-2 py-1 text-[15px] font-bold text-right text-white outline-none tabular-nums"
                    style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}
                  />
                  <span className="text-[11px]" style={{ color: colors.textFaint }}>/mo</span>
                </div>
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
      {monthlyTotal > 0 && (
        <div className="rounded-2xl p-5 text-center space-y-2" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
          <TrendingUp className="size-5 mx-auto" style={{ color: colors.success }} />
          <p className="text-[15px] font-semibold" style={{ color: colors.success }}>
            A whole-home system pays for itself
          </p>
          <p className="text-[13px]" style={{ color: colors.textMuted }}>
            ${yearlyTotal.toLocaleString()}/year in hidden costs vs. a fixed monthly payment for clean, protected water everywhere.
          </p>
        </div>
      )}
    </div>
  );
}
