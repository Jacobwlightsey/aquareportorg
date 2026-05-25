/* ──── Impact / Personalized — Sidebar tabs + info cards per concern ────
   Left sidebar tabs (vertical). Right content: personalized impact cards
   (not just chemical lists). Each tab shows what this concern means
   for the customer's daily life, with relevant contaminant data.
   ──── */

import { Droplets, Home, Shield, ShieldAlert, Sparkles, Heart, Banknote, Layers } from "lucide-react";
import { useMemo, useState } from "react";
import { playTapSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";
import type { CustomerConcernKey } from "./DemoCustomerConcerns";

interface Props {
  contaminants?: any[];
  onNext: () => void;
  onBack: () => void;
  customerConcerns?: { selected: CustomerConcernKey[] } | null;
  liveReadings?: Record<string, any>;
  report?: any;
}

/* ── Severity badge styles ── */
const SEVERITY = {
  HIGH: { bg: `${colors.critical}20`, color: colors.critical, label: "HIGH" },
  ELEVATED: { bg: `${colors.warning}20`, color: colors.warning, label: "ELEVATED" },
  MODERATE: { bg: `${colors.primary}20`, color: colors.primary, label: "MODERATE" },
};

function getSeverity(c: any) {
  if (c.over_legal) return SEVERITY.HIGH;
  if (c.over_health) return SEVERITY.ELEVATED;
  return SEVERITY.MODERATE;
}

/* ── Tab definitions ── */
const CATEGORY_TABS = [
  { key: "family_health", label: "Family Health", icon: ShieldAlert },
  { key: "skin_and_hair", label: "Skin & Hair", icon: Sparkles },
  { key: "appliances_plumbing", label: "Appliances", icon: Home },
  { key: "taste_or_smell", label: "Taste & Odor", icon: Droplets },
  { key: "bottled_water_costs", label: "Bottled Water", icon: Banknote },
  { key: "stains_buildup", label: "Hard Water", icon: Layers },
  { key: "peace_of_mind", label: "Peace of Mind", icon: Shield },
];

/* ── Map contaminant names to categories ── */
const TAB_CONTAMINANT_MAPPING: Record<string, string[]> = {
  family_health: ["lead", "nitrate", "nitrite", "arsenic", "chromium", "radium", "uranium", "pfas", "pfoa", "pfos"],
  skin_and_hair: ["chlorine", "chloramine", "hardness", "calcium", "magnesium"],
  appliances_plumbing: ["hardness", "calcium", "magnesium", "iron", "manganese", "tds"],
  taste_or_smell: ["chlorine", "chloramine", "tds", "sulfate", "iron", "manganese"],
  bottled_water_costs: ["tds", "chlorine", "lead", "pfas", "trihalomethane", "haloacetic"],
  stains_buildup: ["hardness", "calcium", "magnesium", "iron"],
  peace_of_mind: [], // Show ALL contaminants above health guidelines
};

/* ── Personalized impact info per tab ── */
interface ImpactInfo {
  title: string;
  subtitle: string;
  cards: { emoji: string; heading: string; body: string }[];
}

const TAB_INFO: Record<string, ImpactInfo> = {
  family_health: {
    title: "Family Safety",
    subtitle: "How your water affects the people you love.",
    cards: [
      { emoji: "👶", heading: "Children & Development", body: "Kids absorb contaminants faster than adults. Lead, nitrates, and PFAS are linked to developmental issues, learning delays, and immune system disruption in children." },
      { emoji: "🤰", heading: "Pregnancy & Fertility", body: "Many contaminants found in your water — including nitrates, arsenic, and disinfection byproducts — are associated with complications during pregnancy." },
      { emoji: "🧬", heading: "Long-Term Exposure", body: "Contaminants accumulate over time. Even low levels of heavy metals and PFAS can contribute to chronic health conditions with daily exposure." },
    ],
  },
  skin_and_hair: {
    title: "Skin & Hair",
    subtitle: "What every shower is doing to you.",
    cards: [
      { emoji: "🚿", heading: "Chlorine in Your Shower", body: "You absorb more chlorine through a 10-minute hot shower than drinking 8 glasses of water. Steam opens pores and allows chemicals directly into your bloodstream." },
      { emoji: "💇", heading: "Dry Hair & Breakage", body: "Hard water minerals coat hair strands, making them brittle, dull, and resistant to color treatments. Chlorine strips natural oils." },
      { emoji: "🧴", heading: "Skin Irritation", body: "Eczema, dry skin, and unexplained rashes are commonly linked to chlorine and hard water. Children and sensitive skin are especially affected." },
    ],
  },
  appliances_plumbing: {
    title: "Home & Appliances",
    subtitle: "The hidden damage hard water does to your home.",
    cards: [
      { emoji: "🔧", heading: "Plumbing Scale", body: "Hard water deposits build up inside pipes, reducing flow and water pressure over time. Eventually this leads to expensive re-piping." },
      { emoji: "🫧", heading: "Water Heater Efficiency", body: "Just ¼ inch of scale on heating elements reduces efficiency by 25%. Your water heater works harder and costs more every month." },
      { emoji: "🧺", heading: "Appliance Lifespan", body: "Dishwashers, washing machines, and coffee makers last 30-50% longer with treated water. Scale is the #1 cause of appliance failure." },
    ],
  },
  taste_or_smell: {
    title: "Taste & Quality",
    subtitle: "What you're actually tasting and smelling.",
    cards: [
      { emoji: "🥤", heading: "Chlorine Taste", body: "That pool-water taste comes from chlorine and chloramine disinfectants. It affects drinking water, coffee, tea, ice cubes, and cooking." },
      { emoji: "🍳", heading: "Cooking Quality", body: "Contaminants in your water affect the taste of everything you cook — pasta, soups, rice, and even baked goods." },
      { emoji: "🧊", heading: "Ice & Beverages", body: "Cloudy ice cubes, off-tasting drinks, and mineral deposits in your coffee maker are all signs of water quality issues." },
    ],
  },
  bottled_water_costs: {
    title: "Bottled Water",
    subtitle: "What you're already spending to avoid your tap.",
    cards: [
      { emoji: "💰", heading: "Monthly Costs", body: "The average family spends $50-80/month on bottled water. That's $600-960/year — often more than a whole-home filtration system costs monthly." },
      { emoji: "🌍", heading: "Environmental Impact", body: "A family of four uses ~1,000 plastic bottles per year. 80% end up in landfills. Each takes 450 years to decompose." },
      { emoji: "⚠️", heading: "Not Actually Better", body: "25% of bottled water is just repackaged tap water. FDA standards for bottled water are actually less strict than EPA tap water standards." },
    ],
  },
  stains_buildup: {
    title: "Hard Water",
    subtitle: "The silent damage happening right now.",
    cards: [
      { emoji: "🪞", heading: "Fixtures & Glass", body: "White crusty deposits on faucets, showerheads, and glass doors are calcium and magnesium scale. They get worse over time and are increasingly hard to remove." },
      { emoji: "👕", heading: "Laundry", body: "Hard water makes clothes fade faster, feel stiff, and look dingy. You end up using 50% more detergent and still get worse results." },
      { emoji: "🚰", heading: "Pipe Buildup", body: "Scale narrows pipes from the inside. A home with 15+ gpg hardness can lose 75% of pipe diameter within 10 years." },
    ],
  },
  peace_of_mind: {
    title: "Peace of Mind",
    subtitle: "Every contaminant above safe levels in your water.",
    cards: [
      { emoji: "🛡️", heading: "Know What's In Your Water", body: "Most families never test their water. You now have real data — and the ability to act on it. That's already a step most people never take." },
      { emoji: "📊", heading: "Continuous Protection", body: "A whole-home system doesn't just filter once — it protects every drop from every faucet, shower, and appliance 24/7." },
      { emoji: "✅", heading: "Nothing to Worry About", body: "Once treated, you won't need to think about water quality again. No more bottles, no more guessing, no more concern." },
    ],
  },
};

function getContaminantName(c: any): string {
  return c.contaminantName || c.name || c.contaminant || "Unknown";
}

function matchesCategory(c: any, categoryKey: string): boolean {
  const names = TAB_CONTAMINANT_MAPPING[categoryKey];
  if (!names || names.length === 0) {
    return c.over_legal || c.over_health;
  }
  const cName = getContaminantName(c).toLowerCase();
  return names.some(n => cName.includes(n));
}

function bestStartingTab(selected?: CustomerConcernKey[]): number {
  if (!selected?.length) return 0;
  const s = new Set(selected);
  const idx = CATEGORY_TABS.findIndex(t => s.has(t.key as CustomerConcernKey));
  return idx >= 0 ? idx : 0;
}

export function DemoImpact({ contaminants = [], onNext, onBack, customerConcerns, liveReadings, report }: Props) {
  const startTab = useMemo(() => bestStartingTab(customerConcerns?.selected), [customerConcerns]);
  const [activeIdx, setActiveIdx] = useState(startTab);
  const tab = CATEGORY_TABS[activeIdx];
  const info = TAB_INFO[tab.key] || { title: "Impact", subtitle: "How this affects your daily life.", cards: [] };

  /* Filter contaminants for this category, sorted by severity */
  const filtered = useMemo(() => {
    const matched = contaminants.filter(c => matchesCategory(c, tab.key));
    return matched.sort((a, b) => {
      const aSev = a.over_legal ? 3 : a.over_health ? 2 : 1;
      const bSev = b.over_legal ? 3 : b.over_health ? 2 : 1;
      return bSev - aSev;
    }).slice(0, 6);
  }, [contaminants, tab.key]);

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* 2-column: sidebar left, content right */}
      <div className="flex gap-8" style={{ minHeight: "420px" }}>
        {/* Left sidebar — vertical tabs */}
        <div className="shrink-0 w-[140px] space-y-1 pt-1 rounded-2xl p-3" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          {CATEGORY_TABS.map((t, i) => {
            const TabIcon = t.icon;
            const isActive = i === activeIdx;
            return (
              <button
                key={t.key}
                onClick={() => { playTapSound(); setActiveIdx(i); }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer"
                style={{
                  background: isActive ? colors.primary : "transparent",
                  color: isActive ? "#000" : colors.textMuted,
                }}
              >
                <TabIcon className="size-4 shrink-0" />
                <span className="text-[13px] font-medium leading-tight">{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <div className="mb-6">
            <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {info.title}
            </h2>
            <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
              {info.subtitle}
            </p>
          </div>

          {/* Personalized impact info cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {info.cards.map((card, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 space-y-2"
                style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <span className="text-2xl">{card.emoji}</span>
                <h4 className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>
                  {card.heading}
                </h4>
                <p className="text-[12px] leading-relaxed" style={{ color: colors.textMuted }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>

          {/* Personalized data callout — based on live readings and report */}
          {liveReadings && Object.keys(liveReadings).length > 0 && (
            <div className="rounded-2xl p-4 space-y-2" style={{ background: `${colors.warning}06`, border: `1px solid ${colors.warning}15` }}>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.warning}90` }}>
                📊 YOUR LIVE READINGS
              </p>
              {tab.key === "skin_and_hair" && liveReadings.chlorine != null && (
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  Your chlorine tested at <strong style={{ color: colors.critical }}>{liveReadings.chlorine} ppm</strong>
                  {parseFloat(String(liveReadings.chlorine)) > 0.2 ? " — that's above the recommended level. Every shower is exposing your skin and hair to this chemical." : "."}
                </p>
              )}
              {tab.key === "skin_and_hair" && liveReadings.hardness != null && (
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  Water hardness at <strong style={{ color: colors.warning }}>{liveReadings.hardness} gpg</strong>
                  {parseFloat(String(liveReadings.hardness)) > 3.5 ? " — hard enough to dry out skin and leave hair brittle." : "."}
                </p>
              )}
              {tab.key === "appliances_plumbing" && liveReadings.hardness != null && (
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  At <strong style={{ color: colors.warning }}>{liveReadings.hardness} gpg hardness</strong>, scale is actively building in your pipes and water heater right now.
                </p>
              )}
              {tab.key === "appliances_plumbing" && liveReadings.tds != null && (
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  TDS at <strong>{liveReadings.tds} ppm</strong> means dissolved solids are flowing through every appliance.
                </p>
              )}
              {tab.key === "taste_or_smell" && liveReadings.chlorine != null && (
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  Chlorine at <strong style={{ color: colors.critical }}>{liveReadings.chlorine} ppm</strong> — that's what you're tasting in your water, coffee, and everything you cook.
                </p>
              )}
              {tab.key === "family_health" && (
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  {filtered.length > 0
                    ? `${filtered.length} contaminant${filtered.length > 1 ? "s" : ""} found in your water above health guidelines. Your family is exposed every day through drinking, cooking, and bathing.`
                    : "Based on your utility data and live test results."}
                </p>
              )}
              {tab.key === "stains_buildup" && liveReadings.hardness != null && (
                <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>
                  At <strong style={{ color: colors.warning }}>{liveReadings.hardness} gpg</strong>, you're likely seeing white buildup on fixtures and spots on glassware.
                </p>
              )}
            </div>
          )}

          {/* Footer */}
          <p className="text-[13px] mt-4" style={{ color: colors.textFaint }}>
            Based on your water report{liveReadings && Object.keys(liveReadings).length > 0 ? " and live test results" : ""}.
          </p>
        </div>
      </div>
    </div>
  );
}
