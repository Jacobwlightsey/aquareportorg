/* ──── Impact / Family Safety — Mockup-faithful sidebar + severity badges ────
   Left sidebar tabs (vertical). Right content: contaminant cards with severity.
   Active tab = filled primary background with white text.
   Contaminant-driven from actual report data.
   ──── */

import { Droplets, Home, Shield, ShieldAlert, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { playTapSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";
import type { CustomerConcernKey } from "./DemoCustomerConcerns";

interface Props {
  contaminants?: any[];
  onNext: () => void;
  onBack: () => void;
  customerConcerns?: { selected: CustomerConcernKey[] } | null;
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
  { key: "bottled_water_costs", label: "Bottled Water", icon: Droplets },
  { key: "stains_buildup", label: "Hard Water", icon: Home },
  { key: "drinking_water", label: "Peace of Mind", icon: Shield },
];

/* ── Map contaminant names to categories ── */
const TAB_CONTAMINANT_MAPPING: Record<string, string[]> = {
  family_health: ["lead", "nitrate", "nitrite", "arsenic", "chromium", "radium", "uranium", "pfas", "pfoa", "pfos"],
  skin_and_hair: ["chlorine", "chloramine", "hardness", "calcium", "magnesium"],
  appliances_plumbing: ["hardness", "calcium", "magnesium", "iron", "manganese", "tds"],
  taste_or_smell: ["chlorine", "chloramine", "tds", "sulfate", "iron", "manganese"],
  bottled_water_costs: ["tds", "chlorine", "lead", "pfas", "trihalomethane", "haloacetic"],
  stains_buildup: ["hardness", "calcium", "magnesium", "iron"],
  drinking_water: [], // Show ALL contaminants above health guidelines
};

/* ── Health impact descriptions ── */
const CONTAMINANT_IMPACTS: Record<string, string> = {
  lead: "Linked to developmental issues in children",
  nitrate: "Associated with blue baby syndrome",
  nitrite: "Dangerous for infants and pregnant women",
  arsenic: "Linked to cancer and cardiovascular disease",
  chromium: "Known carcinogen at elevated levels",
  radium: "Radioactive element linked to bone cancer",
  uranium: "Toxic to kidneys at elevated levels",
  pfas: "Linked to immune and hormone disruption",
  pfoa: "Linked to cancer and thyroid disease",
  pfos: "Persistent chemical linked to liver damage",
  chlorine: "Can irritate skin, eyes, and respiratory system",
  chloramine: "Causes dry skin and damages rubber seals",
  hardness: "Causes scale buildup and skin irritation",
  calcium: "Contributes to hard water scale",
  magnesium: "Contributes to hard water",
  iron: "Causes staining and metallic taste",
  manganese: "Causes black staining and bitter taste",
  tds: "High dissolved solids affect taste",
  sulfate: "Causes bitter taste and digestive issues",
  trihalomethane: "Disinfection byproduct linked to cancer",
  haloacetic: "Disinfection byproduct with health risks",
};

function getContaminantName(c: any): string {
  return c.contaminantName || c.name || c.contaminant || "Unknown";
}

function matchesCategory(c: any, categoryKey: string): boolean {
  const names = TAB_CONTAMINANT_MAPPING[categoryKey];
  if (!names || names.length === 0) {
    // Peace of Mind: show all contaminants above health guidelines
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

/* ── Section titles per tab ── */
const SECTION_TITLES: Record<string, { title: string; subtitle: string }> = {
  family_health: { title: "Family Safety", subtitle: "What's in your water matters." },
  skin_and_hair: { title: "Skin & Hair", subtitle: "What every shower does to you." },
  appliances_plumbing: { title: "Home & Appliances", subtitle: "What your water costs your home." },
  taste_or_smell: { title: "Taste & Quality", subtitle: "What you're actually drinking." },
  bottled_water_costs: { title: "Bottled Water", subtitle: "What you're already spending." },
  stains_buildup: { title: "Hard Water", subtitle: "The silent damage in your pipes." },
  drinking_water: { title: "Peace of Mind", subtitle: "Every contaminant above safe levels." },
};

export function DemoImpact({ contaminants = [], onNext, onBack, customerConcerns }: Props) {
  const startTab = useMemo(() => bestStartingTab(customerConcerns?.selected), [customerConcerns]);
  const [activeIdx, setActiveIdx] = useState(startTab);
  const tab = CATEGORY_TABS[activeIdx];
  const section = SECTION_TITLES[tab.key] || { title: "Impact", subtitle: "How this affects your daily life." };

  /* Filter contaminants for this category, sorted by severity */
  const filtered = useMemo(() => {
    const matched = contaminants.filter(c => matchesCategory(c, tab.key));
    return matched.sort((a, b) => {
      const aSev = a.over_legal ? 3 : a.over_health ? 2 : 1;
      const bSev = b.over_legal ? 3 : b.over_health ? 2 : 1;
      return bSev - aSev;
    }).slice(0, 8);
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
          <div className="mb-8">
            <h2 className="text-[28px] sm:text-[32px] font-bold tracking-tight" style={{ color: colors.textPrimary }}>
              {section.title}
            </h2>
            <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
              {section.subtitle}
            </p>
          </div>

          {/* Contaminant list with severity badges */}
          <div className="space-y-1 mb-8">
            {filtered.length > 0 ? filtered.map((c, i) => {
              const name = getContaminantName(c);
              const sev = getSeverity(c);
              const impact = CONTAMINANT_IMPACTS[name.toLowerCase()] || c.health_effects || "Found in your water supply";
              return (
                <div
                  key={i}
                  className="flex items-center justify-between py-3.5"
                  style={{ borderBottom: `1px solid ${colors.border}` }}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-base mt-0.5">⚠️</span>
                    <div>
                      <p className="text-[15px] font-semibold" style={{ color: colors.textPrimary }}>
                        {name}
                      </p>
                      <p className="text-[13px] mt-0.5" style={{ color: colors.textMuted }}>
                        {impact}
                      </p>
                    </div>
                  </div>
                  <span
                    className="shrink-0 ml-4 rounded-lg px-3 py-1 text-[11px] font-bold tracking-wider uppercase"
                    style={{ background: sev.bg, color: sev.color }}
                  >
                    {sev.label}
                  </span>
                </div>
              );
            }) : (
              <div className="py-8 text-center">
                <p className="text-[14px]" style={{ color: colors.textMuted }}>
                  No specific contaminants detected in this category.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <p className="text-[13px]" style={{ color: colors.textFaint }}>
            These results are from your lab report and local water data.
          </p>
        </div>
      </div>
    </div>
  );
}
