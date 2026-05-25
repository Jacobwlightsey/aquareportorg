/* ──── Phase 2: Customer Concerns — "What Matters Most To You?" ────
   Customer-facing concern selection screen.
   Stores selections in wizard state for conditional display
   and future Phase 4 AI personalization.
   ──── */

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";
import { playTapSound, haptic } from "@/lib/demoSounds";

/** Customer concern key — stored in wizard state */
export type CustomerConcernKey =
  | "drinking_water"
  | "family_health"
  | "skin_and_hair"
  | "appliances_plumbing"
  | "taste_or_smell"
  | "stains_buildup"
  | "bottled_water_costs";

export interface CustomerConcernState {
  /** Selected concern keys */
  selected: CustomerConcernKey[];
  /** Derived emphasis for flow ordering */
  emphasis: "family" | "home_expenses" | "drinking" | "general";
}

interface Props {
  /** Previously selected concerns (for back-navigation) */
  initial?: CustomerConcernState | null;
  companyColor?: string;
  onNext: (state: CustomerConcernState) => void;
}

const CONCERN_OPTIONS: {
  key: CustomerConcernKey;
  label: string;
  description: string;
  icon: string;
  color: string;
}[] = [
  {
    key: "drinking_water",
    label: "Drinking Water",
    description: "Safe, clean water from every tap",
    icon: "💧",
    color: "#3b82f6",
  },
  {
    key: "family_health",
    label: "Family Health & Peace of Mind",
    description: "Protect everyone in your home",
    icon: "❤️",
    color: "#ef4444",
  },
  {
    key: "skin_and_hair",
    label: "Skin & Hair",
    description: "Softer skin, healthier hair",
    icon: "✨",
    color: "#ec4899",
  },
  {
    key: "appliances_plumbing",
    label: "Appliances & Plumbing",
    description: "Protect your home investment",
    icon: "🔧",
    color: "#f59e0b",
  },
  {
    key: "taste_or_smell",
    label: "Taste or Smell",
    description: "No more chlorine taste or odors",
    icon: "👃",
    color: "#8b5cf6",
  },
  {
    key: "stains_buildup",
    label: "Stains or Buildup",
    description: "Eliminate hard water deposits",
    icon: "🪨",
    color: "#92400e",
  },
  {
    key: "bottled_water_costs",
    label: "Bottled Water Costs",
    description: "Stop buying bottled water",
    icon: "💰",
    color: "#10b981",
  },
];

function deriveEmphasis(selected: CustomerConcernKey[]): CustomerConcernState["emphasis"] {
  const s = new Set(selected);
  if (s.has("family_health")) return "family";
  if (s.has("appliances_plumbing") || s.has("stains_buildup") || s.has("bottled_water_costs"))
    return "home_expenses";
  if (s.has("taste_or_smell") || s.has("drinking_water")) return "drinking";
  return "general";
}

export function DemoCustomerConcerns({ initial, companyColor = "#2563eb", onNext }: Props) {
  const [selected, setSelected] = useState<CustomerConcernKey[]>(
    initial?.selected ?? []
  );

  const toggle = (key: CustomerConcernKey) => {
    playTapSound();
    haptic("light");
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleContinue = () => {
    playTapSound();
    onNext({
      selected,
      emphasis: deriveEmphasis(selected),
    });
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400/70">
          YOUR PRIORITIES
        </span>
        <h2 className="text-2xl font-black mt-3 leading-tight">
          What Matters Most to You?
        </h2>
        <p className="text-sm text-white/40 mt-1.5">
          Select any that apply — we'll tailor the rest to your family
        </p>
      </div>

      {/* Concern options */}
      <div className="space-y-2.5">
        {CONCERN_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-white/20 bg-white/[0.06]"
                  : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div
                className="size-11 shrink-0 rounded-xl flex items-center justify-center text-xl"
                style={{
                  background: isSelected ? `${opt.color}20` : "rgba(255,255,255,0.04)",
                }}
              >
                {opt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-bold ${isSelected ? "text-white" : "text-white/70"}`}
                >
                  {opt.label}
                </p>
                <p className="text-xs text-white/40 mt-0.5">{opt.description}</p>
              </div>
              <div
                className={`size-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected
                    ? "border-emerald-400 bg-emerald-400"
                    : "border-white/20"
                }`}
              >
                {isSelected && <Check className="size-3.5 text-black" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={selected.length === 0}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer disabled:opacity-40 disabled:scale-100"
        style={{
          background:
            selected.length > 0
              ? `linear-gradient(135deg, ${companyColor}, #8b5cf6)`
              : "rgba(255,255,255,0.06)",
          boxShadow:
            selected.length > 0 ? `0 4px 24px ${companyColor}30` : "none",
        }}
      >
        {selected.length === 0 ? "Select at least one" : "Continue"}
        {selected.length > 0 && <ArrowRight className="size-5" />}
      </button>
    </div>
  );
}
