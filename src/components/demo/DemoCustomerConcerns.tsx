/* ──── Customer Concerns — Apple Onboarding Selection ────
   "What Matters Most to You?"
   Larger cards. More spacing. Fewer words.
   Icon + short emotional phrase. Tactile press feedback.
   Selected state should feel satisfying — not checkbox UI.
   ──── */

import { Check } from "lucide-react";
import { useState } from "react";
import { playTapSound, haptic } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";

export type CustomerConcernKey =
  | "drinking_water"
  | "family_health"
  | "skin_and_hair"
  | "appliances_plumbing"
  | "taste_or_smell"
  | "stains_buildup"
  | "bottled_water_costs";

export interface CustomerConcernState {
  selected: CustomerConcernKey[];
  emphasis: "family" | "home_expenses" | "drinking" | "general";
}

interface Props {
  initial?: CustomerConcernState | null;
  companyColor?: string;
  onNext: (state: CustomerConcernState) => void;
}

const CONCERN_OPTIONS: {
  key: CustomerConcernKey;
  label: string;
  description: string;
  icon: string;
}[] = [
  { key: "drinking_water", label: "Drinking Water", description: "Safe, clean water from every tap", icon: "💧" },
  { key: "family_health", label: "Family Health", description: "Protect everyone in your home", icon: "❤️" },
  { key: "skin_and_hair", label: "Skin & Hair", description: "Softer skin, healthier hair", icon: "✨" },
  { key: "appliances_plumbing", label: "Appliances & Plumbing", description: "Protect your home investment", icon: "🔧" },
  { key: "taste_or_smell", label: "Taste or Smell", description: "No more chlorine taste or odors", icon: "👃" },
  { key: "stains_buildup", label: "Stains or Buildup", description: "Eliminate hard water deposits", icon: "🪨" },
  { key: "bottled_water_costs", label: "Bottled Water Costs", description: "Stop buying bottled water", icon: "💰" },
];

function deriveEmphasis(selected: CustomerConcernKey[]): CustomerConcernState["emphasis"] {
  const s = new Set(selected);
  if (s.has("family_health")) return "family";
  if (s.has("appliances_plumbing") || s.has("stains_buildup") || s.has("bottled_water_costs"))
    return "home_expenses";
  if (s.has("taste_or_smell") || s.has("drinking_water")) return "drinking";
  return "general";
}

export function DemoCustomerConcerns({ initial, companyColor = colors.primary, onNext }: Props) {
  const [selected, setSelected] = useState<CustomerConcernKey[]>(initial?.selected ?? []);

  const toggle = (key: CustomerConcernKey) => {
    playTapSound();
    haptic("light");
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleContinue = () => {
    playTapSound();
    onNext({ selected, emphasis: deriveEmphasis(selected) });
  };

  return (
    <div className="mx-auto max-w-lg pt-6">
      {/* Header — breathe */}
      <div className="text-center mb-10">
        <p className="text-[13px] font-medium tracking-wide uppercase" style={{ color: `${colors.primary}90` }}>
          Your Priorities
        </p>
        <h2 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight mt-3">
          What Matters Most?
        </h2>
        <p className="text-[15px] mt-3" style={{ color: colors.textMuted }}>
          Select any that apply
        </p>
      </div>

      {/* Concern cards — Apple onboarding style */}
      <div className="space-y-3 mb-10">
        {CONCERN_OPTIONS.map((opt) => {
          const isSelected = selected.includes(opt.key);
          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className="w-full flex items-center gap-5 rounded-2xl p-5 text-left transition-all cursor-pointer active:scale-[0.98]"
              style={{
                background: isSelected ? colors.elevated : colors.surface,
                border: `1px solid ${isSelected ? `${colors.primary}30` : colors.border}`,
                boxShadow: isSelected ? `0 0 20px ${colors.primary}10` : "none",
              }}
            >
              {/* Icon — large, centered */}
              <div
                className="size-12 shrink-0 rounded-xl flex items-center justify-center text-2xl transition-all"
                style={{
                  background: isSelected ? `${colors.primary}15` : "rgba(255,255,255,0.03)",
                }}
              >
                {opt.icon}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className="text-[16px] font-semibold transition-colors"
                  style={{ color: isSelected ? colors.textPrimary : colors.textSecondary }}
                >
                  {opt.label}
                </p>
                <p className="text-[13px] mt-0.5" style={{ color: colors.textMuted }}>
                  {opt.description}
                </p>
              </div>

              {/* Check indicator — satisfying selection */}
              <div
                className="size-7 shrink-0 rounded-full flex items-center justify-center transition-all"
                style={{
                  background: isSelected ? colors.success : "transparent",
                  border: `2px solid ${isSelected ? colors.success : "rgba(255,255,255,0.12)"}`,
                }}
              >
                {isSelected && <Check className="size-4 text-black" strokeWidth={3} />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Continue */}
      <button
        onClick={handleContinue}
        disabled={selected.length === 0}
        className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-all cursor-pointer disabled:opacity-30"
        style={{
          background: selected.length > 0
            ? `linear-gradient(135deg, ${companyColor}, ${colors.primary})`
            : colors.surface,
          boxShadow: selected.length > 0 ? `0 4px 24px ${companyColor}20` : "none",
        }}
      >
        {selected.length === 0 ? "Select at least one" : "Continue"}
      </button>
    </div>
  );
}
