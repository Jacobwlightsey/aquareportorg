import { DollarSign } from "lucide-react";
import { useState } from "react";
import { playToggleSound } from "@/lib/demoSounds";

interface Props {
  company?: any;
  monthlyPayment?: number;
  onNext: () => void;
  onBack: () => void;
}

interface ExpenseItem {
  name: string;
  monthly: number;
  icon: string;
  color: string;
  enabled?: boolean;
}

const DEFAULT_ICONS = ["🧴", "🚰", "🫗", "🔧", "🧴", "🔩", "💧", "🏠"];
const DEFAULT_COLORS = ["#3b82f6", "#06b6d4", "#8b5cf6", "#f59e0b", "#ec4899", "#ef4444", "#10b981", "#6366f1"];

const FALLBACK_EXPENSES: ExpenseItem[] = [
  { name: "Bottled Water", monthly: 120, icon: "🧴", color: "#3b82f6" },
  { name: "Water Delivery", monthly: 60, icon: "🚰", color: "#06b6d4" },
  { name: "Pitcher Filters", monthly: 25, icon: "🫗", color: "#8b5cf6" },
  { name: "Appliance Repairs", monthly: 40, icon: "🔧", color: "#f59e0b" },
  { name: "Skin/Hair Products", monthly: 35, icon: "🧴", color: "#ec4899" },
  { name: "Plumbing Maintenance", monthly: 30, icon: "🔩", color: "#ef4444" },
];

export function DemoCostComparison({ company, monthlyPayment, onNext: _onNext, onBack: _onBack }: Props) {
  const cfg = company?.demoConfig;

  // Pull cost items from company settings, falling back to hardcoded defaults
  const configCostItems: ExpenseItem[] = cfg?.costItems?.length
    ? cfg.costItems
        .filter((c: any) => c.label && c.monthlyCost > 0)
        .map((c: any, i: number) => ({
          name: c.label,
          monthly: c.monthlyCost ?? 0,
          icon: DEFAULT_ICONS[i % DEFAULT_ICONS.length],
          color: DEFAULT_COLORS[i % DEFAULT_COLORS.length],
          enabled: c.enabled !== false,
        }))
    : FALLBACK_EXPENSES;

  // Filtration monthly: from pricing step → company settings → fallback
  const filtrationMonthly = monthlyPayment ?? cfg?.systemCostMonthly ?? 39;

  const [expenses, setExpenses] = useState(
    configCostItems.map((e) => ({ ...e, enabled: e.enabled !== false }))
  );

  const totalMonthly = expenses
    .filter((e) => e.enabled)
    .reduce((sum, e) => sum + e.monthly, 0);
  const totalYearly = totalMonthly * 12;
  const savingsMonthly = Math.max(0, totalMonthly - filtrationMonthly);
  const savingsYearly = savingsMonthly * 12;

  const maxBar = Math.max(totalMonthly, filtrationMonthly, 1);

  const updateExpense = (idx: number, monthly: number) => {
    const next = [...expenses];
    next[idx] = { ...next[idx], monthly };
    setExpenses(next);
  };

  const toggleExpense = (idx: number) => {
    playToggleSound();
    const next = [...expenses];
    next[idx] = { ...next[idx], enabled: !next[idx].enabled };
    setExpenses(next);
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-pink-400/70">
          CURRENT EXPENSES
        </span>
        <h2 className="text-2xl font-black mt-3">What You're Spending Now</h2>
        <p className="text-sm text-white/40 mt-1.5">
          Most families don't realize the true cost of unfiltered water
        </p>
      </div>

      {/* Visual Comparison Bars */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
        {/* Current Spending */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white/60">Current Monthly Cost</span>
            <span className="text-lg font-black text-red-400">${totalMonthly}</span>
          </div>
          <div className="h-8 w-full rounded-lg bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-lg bg-gradient-to-r from-red-500 to-rose-400 transition-all duration-500 flex items-center px-3"
              style={{ width: `${Math.max(5, (totalMonthly / maxBar) * 100)}%` }}
            >
              <span className="text-[10px] font-bold">${totalMonthly}/mo</span>
            </div>
          </div>
        </div>

        {/* Filtration Cost */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-white/60">Whole-Home Filtration</span>
            <span className="text-lg font-black text-emerald-400">${filtrationMonthly}</span>
          </div>
          <div className="h-8 w-full rounded-lg bg-white/[0.06] overflow-hidden">
            <div
              className="h-full rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 flex items-center px-3"
              style={{
                width: `${Math.max(5, (filtrationMonthly / maxBar) * 100)}%`,
              }}
            >
              <span className="text-[10px] font-bold">${filtrationMonthly}/mo</span>
            </div>
          </div>
        </div>

        {/* Savings */}
        {savingsMonthly > 0 && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
            <span className="text-sm font-bold text-emerald-400">
              Save ${savingsMonthly}/month · ${savingsYearly}/year
            </span>
          </div>
        )}
      </div>

      {/* Expense Breakdown */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <p className="text-xs font-bold uppercase tracking-wider text-white/40">
            Your Monthly Expenses
          </p>
          <p className="text-[11px] text-white/30 mt-0.5">
            Tap to toggle · adjust amounts to match your household
          </p>
        </div>
        <div className="divide-y divide-white/5">
          {expenses.map((e, i) => (
            <div
              key={e.name}
              className={`flex items-center gap-3 p-4 transition-opacity ${
                !e.enabled ? "opacity-40" : ""
              }`}
            >
              <button
                onClick={() => toggleExpense(i)}
                className="shrink-0 text-lg"
              >
                {e.icon}
              </button>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${!e.enabled ? "line-through" : ""}`}
                >
                  {e.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white/30 text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  value={e.monthly}
                  onChange={(ev) =>
                    updateExpense(i, Math.max(0, parseInt(ev.target.value) || 0))
                  }
                  disabled={!e.enabled}
                  className="w-14 h-8 rounded-lg bg-white/[0.06] border border-white/10 text-center text-sm font-bold text-white outline-none focus:border-white/30 disabled:opacity-40"
                />
                <span className="text-[10px] text-white/30">/mo</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Yearly Projection */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-red-400/70">
            Current Yearly
          </p>
          <p className="text-2xl font-black text-red-400 mt-1">
            ${totalYearly.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/70">
            Filtration Yearly
          </p>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            ${(filtrationMonthly * 12).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Hidden costs */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/40 mb-3">
          Hidden Costs of Unfiltered Water
        </p>
        <div className="space-y-2.5 text-sm text-white/60">
          <p>
            💰 <strong>Water heater lifespan</strong> — Hard water can reduce
            it by 25-40%, costing $800-2,000 to replace early
          </p>
          <p>
            🔧 <strong>Appliance damage</strong> — Scale buildup affects
            dishwashers, washing machines, and ice makers
          </p>
          <p>
            🧼 <strong>Soap & detergent</strong> — Hard water requires 50-75%
            more soap to clean effectively
          </p>
          <p>
            👕 <strong>Clothing wear</strong> — Hard water minerals break down
            fabric fibers faster
          </p>
        </div>
      </div>
    </div>
  );
}
