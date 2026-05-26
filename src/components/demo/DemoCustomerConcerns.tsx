/* ──── Customer Concerns — Apple-clean grid ────
   Vertical cards, selected = cyan border + check.
   Responsive: 2-col mobile, 3 tablet, 4 desktop.
   ──── */

import { Check, Droplets, Heart, Sparkles, Home, Wind, Banknote, Layers, Shield, HelpCircle } from "lucide-react";
import { useState } from "react";
import { playTapSound, haptic } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";
import type { LucideIcon } from "lucide-react";

export type CustomerConcernKey =
  | "drinking_water"
  | "family_health"
  | "skin_and_hair"
  | "appliances_plumbing"
  | "taste_or_smell"
  | "stains_buildup"
  | "bottled_water_costs"
  | "peace_of_mind"
  | "other";

export interface CustomerConcernState {
  selected: CustomerConcernKey[];
  emphasis: "family" | "home_expenses" | "drinking" | "general";
}

interface Props {
  initial?: CustomerConcernState | null;
  companyColor?: string;
  company?: any;
  onNext: (state: CustomerConcernState) => void;
}

const CONCERN_OPTIONS: {
  key: CustomerConcernKey;
  label: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  { key: "drinking_water", label: "Drinking Water", description: "Safe, clean water from every tap", Icon: Droplets },
  { key: "family_health", label: "Family Health", description: "Keep my family safe and healthy", Icon: Heart },
  { key: "skin_and_hair", label: "Skin & Hair", description: "Better skin, hair and fewer irritations", Icon: Sparkles },
  { key: "appliances_plumbing", label: "Appliances", description: "Protect my home and appliances", Icon: Home },
  { key: "taste_or_smell", label: "Taste & Odor", description: "Better tasting, fresher water", Icon: Wind },
  { key: "bottled_water_costs", label: "Bottled Water Costs", description: "Stop spending on bottled water", Icon: Banknote },
  { key: "stains_buildup", label: "Hard Water Scale", description: "Reduce scale and extend lifespan", Icon: Layers },
  { key: "peace_of_mind", label: "Peace of Mind", description: "Know my water is truly clean", Icon: Shield },
  { key: "other", label: "Other", description: "Something else on my mind", Icon: HelpCircle },
];

function deriveEmphasis(selected: CustomerConcernKey[]): CustomerConcernState["emphasis"] {
  const s = new Set(selected);
  if (s.has("family_health")) return "family";
  if (s.has("appliances_plumbing") || s.has("stains_buildup") || s.has("bottled_water_costs")) return "home_expenses";
  if (s.has("taste_or_smell") || s.has("drinking_water") || s.has("peace_of_mind")) return "drinking";
  return "general";
}

export function DemoCustomerConcerns({ initial, companyColor = colors.primary, company, onNext }: Props) {
  const configConcerns = company?.demoConfig?.concernOptions;
  const displayOptions = configConcerns?.length
    ? CONCERN_OPTIONS.map((opt) => {
        const override = configConcerns.find((c: any) => c.key === opt.key);
        return override ? { ...opt, label: override.label, description: override.description } : opt;
      })
    : CONCERN_OPTIONS;
  const [selected, setSelected] = useState<CustomerConcernKey[]>(initial?.selected ?? []);

  const toggle = (key: CustomerConcernKey) => {
    playTapSound();
    haptic("light");
    setSelected((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);
  };

  const handleContinue = () => {
    playTapSound();
    onNext({ selected, emphasis: deriveEmphasis(selected) });
  };

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      <div className="mb-6">
        <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight" style={{ color: colors.textPrimary }}>
          What Concerns Matter Most to You?
        </h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          Select what's most important for your home and family.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
        {displayOptions.map((opt) => {
          const isSelected = selected.includes(opt.key);
          const OptIcon = opt.Icon;
          return (
            <button
              key={opt.key}
              onClick={() => toggle(opt.key)}
              className="relative flex flex-col items-center text-center rounded-2xl p-5 transition-all cursor-pointer active:scale-[0.97]"
              style={{
                background: colors.surface,
                border: isSelected ? `1px solid ${colors.primary}50` : `1px solid ${colors.border}`,
              }}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 size-5 rounded-full flex items-center justify-center" style={{ background: colors.primary }}>
                  <Check className="size-3 text-black" strokeWidth={3} />
                </div>
              )}
              <div className="size-12 rounded-xl flex items-center justify-center mb-3" style={{ background: isSelected ? `${colors.primary}12` : `rgba(255,255,255,0.04)` }}>
                <OptIcon className="size-6" style={{ color: isSelected ? colors.primary : colors.textSecondary }} strokeWidth={1.5} />
              </div>
              <p className="text-[14px] font-semibold mb-1" style={{ color: isSelected ? colors.textPrimary : colors.textSecondary }}>{opt.label}</p>
              <p className="text-[11px] leading-snug" style={{ color: colors.textMuted }}>{opt.description}</p>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] flex items-center gap-1.5" style={{ color: colors.textFaint }}>ℹ️ You can change these anytime</p>
        <button
          onClick={handleContinue}
          disabled={selected.length === 0}
          className="rounded-2xl px-8 py-3 text-[15px] font-semibold active:scale-[0.97] transition-all cursor-pointer disabled:opacity-30"
          style={{
            background: selected.length > 0 ? `linear-gradient(135deg, ${companyColor}, ${colors.primary})` : colors.surface,
            color: "#fff",
          }}
        >
          {selected.length === 0 ? "Select at least one" : "Continue →"}
        </button>
      </div>
    </div>
  );
}
