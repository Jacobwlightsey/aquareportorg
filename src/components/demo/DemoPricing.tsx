/* ──── Pricing — Investment Overview (Page 1 of 2) ────
   Emotional reveal moment: current spending vs new investment.
   Single-focus. Clean comparison. Hero monthly price.
   ──── */

import { AlertTriangle, Check, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { playTapSound } from "@/lib/demoSounds";
import { useViewMode } from "@/hooks/useViewMode";
import { colors } from "@/lib/designTokens";

export interface PricingState {
  programPrice: number;
  revealedPrice: number;
  currentPrice: number;
  discountsApplied: string[];
  monthlyPayment: number;
}

interface Props {
  company: any;
  onNext: () => void;
  onBack: () => void;
  onPricingChange: (state: PricingState) => void;
  initialState?: PricingState | null;
  monthlyExpenses?: number;
}

const PLACEHOLDER_PROGRAM_PRICE = 12995;
const PLACEHOLDER_REVEAL_PRICE = 9995;
const PLACEHOLDER_MONTHLY = 149;

const FEATURES = [
  "Installed Whole Home System",
  "Professional Installation",
  "Premium Components",
  "Lifetime Warranty",
  "Ongoing Support",
];

export function DemoPricing({ company, onNext, onBack, onPricingChange, initialState, monthlyExpenses = 0 }: Props) {
  const cfg = company?.demoConfig;
  const savedProgramPrice = cfg?.programPrice || PLACEHOLDER_PROGRAM_PRICE;
  const revealPrice = cfg?.revealPrice || PLACEHOLDER_REVEAL_PRICE;
  const systemCostMonthly = cfg?.systemCostMonthly || PLACEHOLDER_MONTHLY;
  const { viewMode } = useViewMode();
  const isRepView = viewMode === "rep";

  const isUsingPlaceholders = useMemo(() => !cfg?.programPrice && !cfg?.revealPrice, [cfg]);

  // Sync pricing state up
  useEffect(() => {
    onPricingChange({
      programPrice: savedProgramPrice,
      revealedPrice: revealPrice,
      currentPrice: revealPrice,
      discountsApplied: initialState?.discountsApplied ?? [],
      monthlyPayment: systemCostMonthly,
    });
  }, [savedProgramPrice, revealPrice, systemCostMonthly]);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* Dealer placeholder warning */}
      {isRepView && isUsingPlaceholders && (
        <div className="rounded-2xl p-4 flex items-start gap-3 mb-6" style={{ background: `${colors.warning}10`, border: `1px solid ${colors.warning}18` }}>
          <AlertTriangle className="size-4 shrink-0 mt-0.5" style={{ color: colors.warning }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: colors.warning }}>Using placeholder pricing</p>
            <p className="text-[12px] mt-1" style={{ color: `${colors.warning}80` }}>Set your real pricing in Settings → Demo Config.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-10">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.success}b0` }}>
          THE SOLUTION
        </p>
        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mt-3" style={{ color: colors.textPrimary }}>
          Your Investment in{" "}
          <span style={{ color: colors.success }}>Better Water</span>
        </h2>
      </div>

      {/* Comparison: Current spending vs Investment */}
      {monthlyExpenses > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-10">
          {/* Current spending */}
          <div className="rounded-2xl p-6 text-center" style={{ background: `${colors.critical}06`, border: `1px solid ${colors.critical}15` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.critical }}>
              CURRENTLY WASTING
            </p>
            <p className="text-[36px] font-bold line-through decoration-2" style={{ color: colors.critical, textDecorationColor: `${colors.critical}60` }}>
              ${monthlyExpenses}
            </p>
            <p className="text-[13px] mt-1" style={{ color: colors.textMuted }}>per month on band-aids</p>
          </div>
          {/* New investment */}
          <div className="rounded-2xl p-6 text-center" style={{ background: `${colors.success}06`, border: `1px solid ${colors.success}15` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.success }}>
              NEW INVESTMENT
            </p>
            <p className="text-[36px] font-bold" style={{ color: colors.success }}>
              ${systemCostMonthly}
            </p>
            <p className="text-[13px] mt-1" style={{ color: colors.textMuted }}>per month for everything</p>
          </div>
        </div>
      )}

      {/* Hero price (shown when no expenses comparison) */}
      {monthlyExpenses === 0 && (
        <div className="text-center mb-10">
          <div className="inline-flex items-baseline">
            <span className="text-[64px] font-black leading-none tracking-tight" style={{ color: colors.textPrimary }}>
              ${systemCostMonthly}
            </span>
            <span className="text-[22px] font-medium ml-2" style={{ color: colors.textMuted }}>/mo</span>
          </div>
          <p className="text-[15px] mt-3" style={{ color: colors.textMuted }}>
            As low as ${systemCostMonthly}/month with approved financing
          </p>
        </div>
      )}

      {/* Features list */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: colors.textFaint }}>
          EVERYTHING INCLUDED
        </p>
        <div className="grid grid-cols-2 gap-3">
          {FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div className="size-5 shrink-0 rounded-full flex items-center justify-center" style={{ background: `${colors.success}15` }}>
                <Check className="size-3" style={{ color: colors.success }} strokeWidth={2.5} />
              </div>
              <span className="text-[14px]" style={{ color: colors.textSecondary }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Savings highlight */}
      {monthlyExpenses > systemCostMonthly && (
        <div className="rounded-2xl p-5 text-center mb-4" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
          <Sparkles className="size-5 mx-auto mb-2" style={{ color: colors.success }} />
          <p className="text-[18px] font-bold" style={{ color: colors.success }}>
            Save ${monthlyExpenses - systemCostMonthly}/month
          </p>
          <p className="text-[13px] mt-1" style={{ color: colors.textMuted }}>
            That's ${(monthlyExpenses - systemCostMonthly) * 12}/year back in your pocket
          </p>
        </div>
      )}

      {/* Guarantee note */}
      <div className="flex items-center justify-center gap-2 py-4 mt-2">
        <Check className="size-4" style={{ color: colors.success }} />
        <span className="text-[13px]" style={{ color: colors.textMuted }}>30-Day Satisfaction Guarantee</span>
      </div>
    </div>
  );
}
