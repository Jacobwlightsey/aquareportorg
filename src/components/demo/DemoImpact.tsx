/* ──── Impact — "How This Affects Your Home" ────
   Sidebar-style tabs on tablet, horizontal pills on mobile.
   Surface cards, designTokens, mockup layout.
   ──── */

import { Droplets, Home, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { playTapSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";
import type { CustomerConcernKey } from "./DemoCustomerConcerns";

interface Props {
  onNext: () => void;
  onBack: () => void;
  customerConcerns?: { selected: CustomerConcernKey[] } | null;
}

const IMPACT_TABS = [
  {
    key: "skin",
    label: "Skin & Hair",
    icon: Sparkles,
    color: colors.primary,
    title: "Every shower is stripping your skin.",
    highlight: "Chlorine and dissolved minerals remove the natural oils your skin and hair need — every single day.",
    body: "Most families blame their shampoo or moisturizer. The real culprit is the water itself. During a 10-minute hot shower, you're exposed to more chlorine than drinking 8 glasses of tap water.",
    without: ["Chlorine steam with every shower", "Dry, irritated skin & brittle hair", "Skin absorbs chemicals through pores"],
    withF: ["Clean, chemical-free steam", "Softer skin & healthier hair", "No airborne disinfectant exposure"],
  },
  {
    key: "family",
    label: "Family Safety",
    icon: ShieldAlert,
    color: colors.critical,
    title: "Your family deserves better than \"legal.\"",
    highlight: null,
    body: `Legal limits haven't been meaningfully updated in over 20 years. Children, pregnant women, and the elderly are most vulnerable to contaminants that are technically "within limits" but far exceed health-protective guidelines.`,
    without: ["Lead impacts developing brains", "Nitrates endanger infants under 6mo", "Contaminants accumulate silently over years"],
    withF: ["Safe water for every age", "Contaminants removed at source", "Long-term health confidence"],
  },
  {
    key: "home",
    label: "Home & Appliances",
    icon: Home,
    color: colors.warning,
    stat: "40%",
    statLabel: "reduction in appliance\nlifespan from hard water",
    title: "Hard water is silently destroying your home.",
    highlight: null,
    body: "Scale buildup coats the inside of water heaters, dishwashers, and washing machines — forcing them to work harder, use more energy, and fail sooner. The average homeowner spends $300–$500 more per year on energy and repairs.",
    without: ["Scale buildup in pipes & heaters", "Shorter appliance lifespans", "Higher energy bills every month"],
    withF: ["Clean pipes, no mineral buildup", "Appliances last years longer", "Lower energy costs"],
  },
  {
    key: "taste",
    label: "Taste & Drinking",
    icon: Droplets,
    color: colors.primary,
    stat: "$1,200",
    statLabel: "average family spends\nper year on bottled water",
    title: "Clean water should taste like nothing.",
    highlight: "That metallic taste, chlorine smell, or earthy odor is your water telling you something.",
    body: "Chlorine byproducts, minerals, and dissolved organics create the distinctive taste most families simply accept as normal. When it tastes better, families drink more of it.",
    without: ["Chlorine taste & chemical odor", "Buying bottled water constantly", "Unpleasant cooking water"],
    withF: ["Pure, clean taste at every tap", "No more bottled water expense", "Better tasting coffee, tea & food"],
  },
];

function bestStartingTab(selected?: CustomerConcernKey[]): number {
  if (!selected?.length) return 0;
  const s = new Set(selected);
  if (s.has("family_health")) return 1;
  if (s.has("skin_and_hair")) return 0;
  if (s.has("appliances_plumbing") || s.has("stains_buildup")) return 2;
  if (s.has("taste_or_smell") || s.has("drinking_water") || s.has("bottled_water_costs")) return 3;
  return 0;
}

export function DemoImpact({ onNext, onBack, customerConcerns }: Props) {
  const startTab = useMemo(() => bestStartingTab(customerConcerns?.selected), [customerConcerns]);
  const [activeIdx, setActiveIdx] = useState(startTab);
  const tab = IMPACT_TABS[activeIdx];
  const Icon = tab.icon;

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.critical}b0` }}>
          DAILY IMPACT
        </p>
        <h2 className="text-[28px] font-bold mt-3 leading-tight tracking-tight">
          How This Affects Your Home
        </h2>
      </div>

      {/* Tab pills — sidebar style on wider, horizontal on narrow */}
      <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible pb-1 sm:pb-0">
        {IMPACT_TABS.map((t, i) => {
          const TabIcon = t.icon;
          const isActive = i === activeIdx;
          return (
            <button
              key={t.key}
              onClick={() => { playTapSound(); setActiveIdx(i); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap shrink-0"
              style={{
                background: isActive ? `${t.color}12` : colors.surface,
                border: isActive ? `1px solid ${t.color}30` : `1px solid transparent`,
              }}
            >
              <TabIcon className="size-4" style={{ color: isActive ? t.color : colors.textFaint }} />
              <span
                className="text-[14px] font-medium"
                style={{ color: isActive ? t.color : colors.textMuted }}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface }}>
        <div className="p-6 space-y-5">
          {/* Stat (if present) */}
          {"stat" in tab && tab.stat && (
            <div className="flex items-center gap-4">
              <div
                className="size-14 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${tab.color}12` }}
              >
                <p className="text-[20px] font-bold" style={{ color: tab.color }}>{tab.stat}</p>
              </div>
              <p className="text-[13px] whitespace-pre-line" style={{ color: colors.textMuted }}>{tab.statLabel}</p>
            </div>
          )}

          {/* Title */}
          <h3 className="text-[20px] font-bold leading-snug" style={{ color: colors.textPrimary }}>{tab.title}</h3>

          {/* Highlight */}
          {tab.highlight && (
            <p className="text-[15px] font-medium leading-relaxed" style={{ color: tab.color }}>{tab.highlight}</p>
          )}

          {/* Body */}
          <p className="text-[15px] leading-relaxed" style={{ color: colors.textMuted }}>{tab.body}</p>

          {/* Without / With */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: `${colors.critical}90` }}>Without Filtration</p>
              {tab.without.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="size-1.5 rounded-full mt-2 shrink-0" style={{ background: `${colors.critical}80` }} />
                  <span className="text-[13px]" style={{ color: colors.textMuted }}>{item}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2.5">
              <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: `${colors.success}90` }}>With Filtration</p>
              {tab.withF.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="size-1.5 rounded-full mt-2 shrink-0" style={{ background: `${colors.success}80` }} />
                  <span className="text-[13px]" style={{ color: colors.textMuted }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex gap-3">
        <button onClick={onBack} className="flex-1 rounded-2xl py-3 text-[14px] font-medium cursor-pointer" style={{ background: colors.surface, color: colors.textMuted }}>
          ← Back
        </button>
        <button onClick={onNext} className="flex-1 rounded-2xl py-3 text-[14px] font-semibold cursor-pointer" style={{ background: `${colors.primary}15`, color: colors.primary }}>
          Continue →
        </button>
      </div>
    </div>
  );
}
