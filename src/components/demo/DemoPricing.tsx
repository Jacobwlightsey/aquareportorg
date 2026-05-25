/* ──── Pricing — Investment Overview (Page 1 of 2) ────
   Emotional reveal moment: current spending vs new investment.
   Interactive expense deductions — rep taps items the homeowner
   currently spends on, and the effective monthly cost drops in real-time.
   ──── */

import { AlertTriangle, Check, ChevronDown, ChevronUp, Minus, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { playTapSound, playToggleSound } from "@/lib/demoSounds";
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
  concerns?: { householdSize?: number; bathrooms?: number; hasKids?: boolean; hasPets?: boolean; currentSolution?: string } | null;
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

/* ── Expense items homeowner is currently paying for ── */
const EXPENSE_ITEMS = [
  { id: "bottled_water", label: "Bottled Water", icon: "🧴", monthlyBase: 45, perPerson: 15 },
  { id: "pitcher_filter", label: "Pitcher / Fridge Filters", icon: "🫗", monthlyBase: 12, perPerson: 0 },
  { id: "plumbing", label: "Plumbing Repairs (Scale)", icon: "🔧", monthlyBase: 25, perPerson: 0 },
  { id: "water_heater", label: "Water Heater Inefficiency", icon: "🔥", monthlyBase: 18, perPerson: 0 },
  { id: "cleaning", label: "Hard Water Cleaning Products", icon: "🧹", monthlyBase: 15, perPerson: 0 },
  { id: "skin_products", label: "Skin / Hair Products", icon: "🧴", monthlyBase: 20, perPerson: 5 },
  { id: "appliance_wear", label: "Appliance Wear & Replacement", icon: "🫧", monthlyBase: 30, perPerson: 0 },
];

/* ── Animated number ── */
function useAnimatedNum(target: number, duration = 600) {
  const [val, setVal] = useState(target);
  useEffect(() => {
    const from = val;
    if (from === target) return;
    let start = 0;
    let raf = 0;
    const tick = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(from + (target - from) * ease));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

export function DemoPricing({ company, onNext, onBack, onPricingChange, initialState, monthlyExpenses = 0, concerns }: Props) {
  const cfg = company?.demoConfig;
  const savedProgramPrice = cfg?.programPrice || PLACEHOLDER_PROGRAM_PRICE;
  const revealPrice = cfg?.revealPrice || PLACEHOLDER_REVEAL_PRICE;
  const systemCostMonthly = cfg?.systemCostMonthly || PLACEHOLDER_MONTHLY;
  const { viewMode } = useViewMode();
  const isRepView = viewMode === "rep";

  const isUsingPlaceholders = useMemo(() => !cfg?.programPrice && !cfg?.revealPrice, [cfg]);

  // Expense deduction state
  const [deducted, setDeducted] = useState<Set<string>>(new Set());
  const [showExpenses, setShowExpenses] = useState(false);

  const householdSize = concerns?.householdSize ?? 2;

  // Calculate per-item costs based on household size
  const itemCost = (item: typeof EXPENSE_ITEMS[0]) => item.monthlyBase + item.perPerson * Math.max(0, householdSize - 1);

  const totalDeducted = EXPENSE_ITEMS.filter(e => deducted.has(e.id)).reduce((sum, e) => sum + itemCost(e), 0);
  const effectiveMonthly = Math.max(0, systemCostMonthly - totalDeducted);
  const animatedEffective = useAnimatedNum(effectiveMonthly);
  const animatedDeducted = useAnimatedNum(totalDeducted);

  const toggleExpense = (id: string) => {
    playToggleSound();
    setDeducted(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
      <div className="text-center mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.success}b0` }}>
          THE INVESTMENT
        </p>
        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight mt-3" style={{ color: colors.textPrimary }}>
          Cost Per Month
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          For a household of {householdSize}{concerns?.hasKids ? " with children" : ""}{concerns?.hasPets ? " & pets" : ""}.
        </p>
      </div>

      {/* Hero price — updates in real-time */}
      <div className="text-center mb-8">
        <div className="inline-flex items-baseline">
          <span
            className="text-[64px] font-black leading-none tracking-tight transition-colors duration-300"
            style={{ color: totalDeducted > 0 ? colors.success : colors.textPrimary }}
          >
            ${animatedEffective}
          </span>
          <span className="text-[22px] font-medium ml-2" style={{ color: colors.textMuted }}>/mo</span>
        </div>
        {totalDeducted > 0 && (
          <div className="mt-2 animate-in fade-in duration-300">
            <span className="text-[14px] line-through mr-2" style={{ color: colors.textFaint }}>${systemCostMonthly}/mo</span>
            <span className="text-[14px] font-bold" style={{ color: colors.success }}>
              after ${animatedDeducted}/mo in savings
            </span>
          </div>
        )}
        <p className="text-[13px] mt-2" style={{ color: colors.textMuted }}>
          {totalDeducted === 0 ? "Remove expenses you'll no longer need ↓" : `Effectively costs $${effectiveMonthly}/mo when you stop spending on what you no longer need.`}
        </p>
      </div>

      {/* Expense deduction dropdown */}
      <div className="rounded-2xl overflow-hidden mb-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <button
          onClick={() => { playTapSound(); setShowExpenses(!showExpenses); }}
          className="w-full flex items-center justify-between p-4 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Minus className="size-4" style={{ color: colors.primary }} />
            <p className="text-[14px] font-medium" style={{ color: colors.textSecondary }}>
              Remove Current Expenses
            </p>
            {deducted.size > 0 && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${colors.success}15`, color: colors.success }}>
                −${totalDeducted}/mo
              </span>
            )}
          </div>
          {showExpenses
            ? <ChevronUp className="size-4" style={{ color: colors.textMuted }} />
            : <ChevronDown className="size-4" style={{ color: colors.textMuted }} />
          }
        </button>
        {showExpenses && (
          <div className="px-4 pb-4 space-y-2" style={{ borderTop: `1px solid ${colors.border}` }}>
            <p className="text-[12px] pt-3 pb-1" style={{ color: colors.textMuted }}>
              What are you currently spending on that you won't need with the system?
            </p>
            {EXPENSE_ITEMS.map((item) => {
              const active = deducted.has(item.id);
              const cost = itemCost(item);
              return (
                <button
                  key={item.id}
                  onClick={() => toggleExpense(item.id)}
                  className="w-full flex items-center gap-3 rounded-xl p-3 transition-all cursor-pointer active:scale-[0.98]"
                  style={{
                    background: active ? `${colors.success}08` : "transparent",
                    border: `1px solid ${active ? `${colors.success}20` : colors.border}`,
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="flex-1 text-left text-[14px] font-medium" style={{ color: active ? colors.textPrimary : colors.textSecondary }}>
                    {item.label}
                  </span>
                  <span className="text-[14px] font-semibold" style={{ color: active ? colors.success : colors.textMuted }}>
                    −${cost}/mo
                  </span>
                  <div
                    className="size-5 rounded-full flex items-center justify-center"
                    style={{
                      background: active ? colors.success : "transparent",
                      border: `2px solid ${active ? colors.success : "rgba(255,255,255,0.12)"}`,
                    }}
                  >
                    {active && <Check className="size-3 text-black" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Features list */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
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

      {/* Net savings callout */}
      {totalDeducted > 0 && totalDeducted >= systemCostMonthly && (
        <div className="rounded-2xl p-5 text-center mb-4 animate-in fade-in duration-500" style={{ background: `${colors.success}08`, border: `1px solid ${colors.success}18` }}>
          <Sparkles className="size-5 mx-auto mb-2" style={{ color: colors.success }} />
          <p className="text-[18px] font-bold" style={{ color: colors.success }}>
            The system pays for itself
          </p>
          <p className="text-[13px] mt-1" style={{ color: colors.textMuted }}>
            You're already spending more than the system costs every month.
          </p>
        </div>
      )}

      {/* Guarantee note */}
      <div className="flex items-center justify-center gap-2 py-4">
        <Check className="size-4" style={{ color: colors.success }} />
        <span className="text-[13px]" style={{ color: colors.textMuted }}>30-Day Satisfaction Guarantee</span>
      </div>
    </div>
  );
}
