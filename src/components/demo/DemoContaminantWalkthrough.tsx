/* ──── Contaminant Walkthrough — Full Breakdown ────
   Mockup-style severity badges (HIGH / ELEVATED / MODERATE).
   Categorized accordion. Surface cards, designTokens colors.
   ──── */

import { AlertTriangle, ArrowRight, ChevronDown, ChevronUp, FlaskConical, Shield, Skull, X } from "lucide-react";
import { useState } from "react";
import { contaminantName } from "@/lib/supabase";
import { playTapSound } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { getCountryText } from "@/lib/i18n";
import { colors } from "@/lib/designTokens";

interface Props {
  contaminants: any[];
  onNext: () => void;
  onBack: () => void;
  country?: string;
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("trihalomethane") || n.includes("tthm") || n.includes("haloacetic") || n.includes("bromate") || n.includes("chloroform") || n.includes("dichloroacetic") || n.includes("trichloroacetic") || n.includes("dibromochloromethane") || n.includes("bromodichloromethane"))
    return "Disinfection Byproducts";
  if (n.includes("radium") || n.includes("uranium") || n.includes("radon") || n.includes("gross alpha") || n.includes("gross beta") || n.includes("combined radium"))
    return "Radioactive Elements";
  if (n.includes("lead") || n.includes("chromium") || n.includes("mercury") || n.includes("arsenic") || n.includes("cadmium") || n.includes("barium") || n.includes("molybdenum") || n.includes("strontium") || n.includes("vanadium") || n.includes("manganese") || n.includes("copper") || n.includes("selenium") || n.includes("antimony") || n.includes("thallium") || n.includes("beryllium") || n.includes("nickel"))
    return "Heavy Metals";
  if (n.includes("nitrate") || n.includes("nitrite"))
    return "Fertilizer & Runoff";
  if (n.includes("fluoride"))
    return "Water Additives";
  if (n.includes("turbidity") || n.includes("total coliform"))
    return "Physical & Microbial";
  return "Other Chemicals";
}

function SeverityBadge({ c }: { c: any }) {
  if (c.over_legal) {
    return (
      <span
        className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: `${colors.critical}20`, color: colors.critical }}
      >
        HIGH
      </span>
    );
  }
  if (c.over_health) {
    return (
      <span
        className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={{ background: `${colors.warning}20`, color: colors.warning }}
      >
        ELEVATED
      </span>
    );
  }
  return (
    <span
      className="shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: `${colors.textFaint}15`, color: colors.textFaint }}
    >
      MODERATE
    </span>
  );
}

function SeverityIcon({ c }: { c: any }) {
  if (c.over_legal) return <Skull className="size-4 shrink-0" style={{ color: colors.critical }} />;
  if (c.over_health) return <AlertTriangle className="size-4 shrink-0" style={{ color: colors.warning }} />;
  return <FlaskConical className="size-4 shrink-0" style={{ color: colors.textFaint }} />;
}

function SeverityBar({ ratio }: { ratio: number }) {
  const width = Math.min(100, Math.max(5, ratio * 100));
  const color = ratio >= 1 ? colors.critical : ratio >= 0.5 ? colors.warning : colors.success;
  return (
    <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: `${colors.textFaint}15` }}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

/* ── Contaminant detail info — health & home effects ── */
interface ContaminantInfo {
  what: string;
  health: string;
  home: string;
}

function getContaminantInfo(name: string): ContaminantInfo | null {
  const n = name.toLowerCase();
  if (n.includes("lead")) return { what: "A toxic heavy metal that leaches from old pipes, solder, and fixtures.", health: "Damages the brain and nervous system, especially in children. Linked to developmental delays, learning difficulties, and behavioral problems.", home: "Corrodes plumbing fixtures and can cause blue-green staining on sinks and tubs." };
  if (n.includes("chlorine") || n.includes("chloramine")) return { what: "A disinfectant added to municipal water to kill bacteria.", health: "Absorbed through skin during showers. Strips natural oils, causes dry skin and hair. Linked to respiratory issues when inhaled as steam.", home: "Degrades rubber seals in appliances, fades laundry, and affects the taste of drinking water and cooking." };
  if (n.includes("arsenic")) return { what: "A naturally occurring toxic element found in groundwater.", health: "Long-term exposure linked to skin, lung, and bladder cancer. Can cause skin lesions, numbness, and cardiovascular disease.", home: "No visible home effects, but accumulates in the body over time through drinking and cooking." };
  if (n.includes("chromium")) return { what: "A metallic element; hexavalent chromium (Chromium-6) is a known carcinogen.", health: "Linked to stomach cancer, liver damage, and reproductive problems. The health guideline is far stricter than the legal limit.", home: "Can cause yellow-green staining of fixtures at high concentrations." };
  if (n.includes("fluoride")) return { what: "A mineral added to water to prevent tooth decay.", health: "At high levels linked to dental fluorosis (white spots on teeth), skeletal problems, and thyroid disruption.", home: "No direct home damage, but builds up in the body with daily consumption." };
  if (n.includes("nitrate") || n.includes("nitrite")) return { what: "Agricultural runoff from fertilizers and animal waste.", health: "Dangerous for infants — causes 'blue baby syndrome.' Linked to thyroid problems and increased cancer risk in adults.", home: "No visible home effects, but indicates agricultural contamination of your water source." };
  if (n.includes("radium") || n.includes("uranium") || n.includes("gross alpha") || n.includes("gross beta")) return { what: "Naturally occurring radioactive elements dissolved from rock formations.", health: "Increases cancer risk, especially bone and kidney cancer. Even low levels accumulate over years of exposure.", home: "No visible home effects, but continuous exposure through drinking, cooking, and bathing." };
  if (n.includes("trihalomethane") || n.includes("tthm") || n.includes("haloacetic") || n.includes("haa5") || n.includes("haa9")) return { what: "Chemical byproducts created when chlorine reacts with organic matter in water.", health: "Linked to bladder cancer, liver and kidney damage. Absorbed through skin and lungs during hot showers.", home: "Can create a chemical smell. You're exposed every time you shower, bathe, or use hot water." };
  if (n.includes("pfas") || n.includes("pfoa") || n.includes("pfos")) return { what: "\"Forever chemicals\" — synthetic compounds that never break down in the environment.", health: "Linked to cancer, thyroid disease, immune system damage, and reproductive issues. Accumulates in the body.", home: "Present in every glass of water, every ice cube, every cooked meal. Cannot be removed by boiling." };
  if (n.includes("copper")) return { what: "Leaches from copper plumbing, especially with acidic or soft water.", health: "High levels cause nausea, liver and kidney damage. Children are more sensitive.", home: "Causes blue-green staining on sinks, tubs, and laundry. Indicates pipe corrosion." };
  if (n.includes("mercury")) return { what: "A highly toxic heavy metal from industrial pollution and natural deposits.", health: "Damages the nervous system, kidneys, and developing fetuses. Effects are cumulative.", home: "No visible home effects, but enters the body through drinking and cooking." };
  if (n.includes("manganese")) return { what: "A naturally occurring mineral in groundwater.", health: "High levels linked to neurological effects in children, similar to lead exposure.", home: "Causes brown/black staining on laundry, fixtures, and dishes. Clogs pipes." };
  if (n.includes("iron")) return { what: "A common mineral dissolved from soil and rock into groundwater.", health: "Generally not a direct health risk, but indicates other contaminants may be present.", home: "Causes rust-colored staining on everything — sinks, toilets, laundry, and appliances." };
  if (n.includes("barium")) return { what: "A naturally occurring element found in drilling waste and industrial discharge.", health: "Can cause high blood pressure, difficulty breathing, and gastrointestinal issues.", home: "No visible home effects at typical concentrations." };
  if (n.includes("hardness") || n.includes("calcium") || n.includes("magnesium")) return { what: "Dissolved minerals — primarily calcium and magnesium — from groundwater.", health: "Not directly harmful to drink, but causes dry skin, brittle hair, and eczema flare-ups.", home: "White scale buildup on fixtures, cloudy glassware, stiff laundry, reduced appliance lifespan, and clogged showerheads." };
  return null;
}

/** Generate fallback info for contaminants without specific data */
function getFallbackInfo(c: any, agency = "EPA", healthSource = "EWG"): ContaminantInfo {
  const name = contaminantName(c);
  if (c.over_legal) {
    return {
      what: `${name} was detected in your water above ${agency} legal limits.`,
      health: "Exceeding the legal limit means your water utility is in violation. Prolonged exposure to levels this high may pose health risks including organ damage and increased cancer risk.",
      home: "At these concentrations, contaminants can affect your plumbing, appliances, and everyday water use.",
    };
  }
  if (c.over_health) {
    return {
      what: `${name} was detected in your water above health guidelines set by ${healthSource}.`,
      health: "While technically within legal limits, health guidelines are based on the latest science and are often much stricter. Long-term exposure at these levels may still pose health risks.",
      home: "Even at legal levels, some contaminants contribute to buildup, taste issues, or equipment wear over time.",
    };
  }
  return {
    what: `${name} was detected in your water at measurable levels.`,
    health: "While currently within guidelines, any presence of contaminants means your water is not pure. Combined exposure to multiple chemicals compounds the risk.",
    home: "Trace contaminants can contribute to off-tastes, odors, and reduced water quality throughout your home.",
  };
}

function ContaminantDetailModal({ c, onClose, agency, healthSource }: { c: any; onClose: () => void; agency?: string; healthSource?: string }) {
  const ratio = c.health_guideline && c.health_guideline > 0 ? c.detected_level / c.health_guideline : c.detected_level > 0 ? 1 : 0;
  const info = getContaminantInfo(contaminantName(c)) ?? getFallbackInfo(c, agency, healthSource);

  return (
    /* ── Modal overlay ── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl animate-in fade-in zoom-in-95 duration-200"
        style={{ background: colors.elevated, border: `1px solid ${colors.border}` }}
      >
        {/* Header */}
        <div
          className="p-5 pb-4 flex items-start justify-between sticky top-0 z-10"
          style={{
            background: c.over_legal ? `${colors.critical}08` : c.over_health ? `${colors.warning}08` : `${colors.textFaint}05`,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <div className="flex items-center gap-3">
            <SeverityIcon c={c} />
            <div>
              <h3 className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>{contaminantName(c)}</h3>
              <div className="flex gap-2 mt-1">
                <SeverityBadge c={c} />
                {c.times_above_ewg != null && c.times_above_ewg > 1 && (
                  <span className="text-[11px] font-semibold" style={{ color: `${colors.warning}b0` }}>{c.times_above_ewg}× {t.healthSource} guideline</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:opacity-70 cursor-pointer" style={{ background: `${colors.textFaint}15` }}>
            <X className="size-5" style={{ color: colors.textMuted }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Detection bar */}
          <div>
            <div className="flex items-end justify-between mb-2">
              <span className="text-[28px] font-bold" style={{ color: colors.textPrimary }}>
                {c.detected_level} <span className="text-[14px] font-normal" style={{ color: colors.textFaint }}>{c.unit}</span>
              </span>
            </div>
            <SeverityBar ratio={ratio} />
            <div className="flex justify-between mt-1.5">
              <span className="text-[11px]" style={{ color: colors.textFaint }}>0</span>
              {c.health_guideline != null && <span className="text-[11px]" style={{ color: colors.textFaint }}>Health: {c.health_guideline} {c.unit}</span>}
              {c.legal_limit != null && <span className="text-[11px]" style={{ color: colors.textFaint }}>Legal: {c.legal_limit} {c.unit}</span>}
            </div>
          </div>

          {/* What is this contaminant */}
          <div className="rounded-xl p-4 space-y-1.5" style={{ background: `${colors.textFaint}08` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>What Is It</p>
            <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{info.what}</p>
          </div>

          {/* Health effects */}
          <div className="rounded-xl p-4 space-y-1.5" style={{ background: `${colors.critical}06` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.critical}90` }}>❤️ Health Effects</p>
            <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{info.health}</p>
          </div>

          {/* Home effects */}
          <div className="rounded-xl p-4 space-y-1.5" style={{ background: `${colors.warning}06` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.warning}90` }}>🏠 Home Effects</p>
            <p className="text-[13px] leading-relaxed" style={{ color: colors.textSecondary }}>{info.home}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DemoContaminantWalkthrough({ contaminants, onNext, onBack: _onBack, country }: Props) {
  const t = getCountryText(country);
  const [expandedDetail, setExpandedDetail] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const sorted = [...contaminants].sort((a, b) => {
    if (a.over_legal !== b.over_legal) return a.over_legal ? -1 : 1;
    if (a.over_health !== b.over_health) return a.over_health ? -1 : 1;
    return (b.times_above_ewg ?? 0) - (a.times_above_ewg ?? 0);
  });

  const grouped: Record<string, any[]> = {};
  for (const c of sorted) {
    const cat = guessCategory(contaminantName(c));
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  }

  const categories = Object.keys(grouped).sort((a, b) => {
    const aLegal = grouped[a].filter((c) => c.over_legal).length;
    const bLegal = grouped[b].filter((c) => c.over_legal).length;
    if (aLegal !== bLegal) return bLegal - aLegal;
    const aHealth = grouped[a].filter((c) => c.over_health).length;
    const bHealth = grouped[b].filter((c) => c.over_health).length;
    return bHealth - aHealth;
  });

  const legalCountRaw = sorted.filter((c) => c.over_legal).length;
  const healthCountRaw = sorted.filter((c) => c.over_health && !c.over_legal).length;

  const legalCount = useCountUp(legalCountRaw, 800, 200);
  const healthCount = useCountUp(healthCountRaw, 800, 400);
  const totalCount = useCountUp(sorted.length, 800, 0);

  const toggleCategory = (cat: string) => {
    playTapSound();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  if (!sorted.length) {
    return (
      <div className="mx-auto w-full max-w-5xl px-8 pt-8 text-center">
        <FlaskConical className="mx-auto size-12 mb-4" style={{ color: colors.textFaint }} />
        <p style={{ color: colors.textMuted }}>No contaminant data available</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-5 pt-4">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.warning}b0` }}>
          FULL BREAKDOWN
        </p>
        <h2 className="text-[28px] font-bold mt-3 tracking-tight">{totalCount} Contaminants Detected</h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          Tap any contaminant for details
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl p-4 text-center" style={{ background: `${colors.critical}08` }}>
          <Skull className="size-5 mx-auto mb-1" style={{ color: colors.critical }} />
          <p className="text-[22px] font-bold" style={{ color: colors.critical }}>{legalCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: `${colors.critical}90` }}>Legal Violations</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: `${colors.warning}08` }}>
          <AlertTriangle className="size-5 mx-auto mb-1" style={{ color: colors.warning }} />
          <p className="text-[22px] font-bold" style={{ color: colors.warning }}>{healthCount}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: `${colors.warning}90` }}>Health Risks</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <Shield className="size-5 mx-auto mb-1" style={{ color: colors.textMuted }} />
          <p className="text-[22px] font-bold" style={{ color: colors.textPrimary }}>{sorted.length}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.textFaint }}>Total Found</p>
        </div>
      </div>

      {/* Detail modal */}
      {expandedDetail !== null && sorted[expandedDetail] && (
        <ContaminantDetailModal c={sorted[expandedDetail]} onClose={() => setExpandedDetail(null)} agency={t.agency} healthSource={t.healthSource} />
      )}

      {/* Categorized list */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const items = grouped[cat];
          const catLegal = items.filter((c) => c.over_legal).length;
          const catHealth = items.filter((c) => c.over_health).length;
          const isExpanded = expandedCategories.has(cat);

          return (
            <div key={cat} className="rounded-xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between p-3 text-left cursor-pointer transition-colors hover:opacity-80"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[14px] font-semibold truncate" style={{ color: colors.textPrimary }}>{cat}</span>
                  <span className="text-[12px] font-medium shrink-0" style={{ color: colors.textFaint }}>({items.length})</span>
                  {catLegal > 0 && (
                    <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${colors.critical}15`, color: colors.critical }}>
                      {catLegal} HIGH
                    </span>
                  )}
                  {catHealth > 0 && (
                    <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold" style={{ background: `${colors.warning}15`, color: colors.warning }}>
                      {catHealth} ELEVATED
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="size-4 shrink-0" style={{ color: colors.textFaint }} />
                ) : (
                  <ChevronDown className="size-4 shrink-0" style={{ color: colors.textFaint }} />
                )}
              </button>

              {isExpanded && (
                <div style={{ borderTop: `1px solid ${colors.border}` }}>
                  {items.map((c, i) => {
                    const globalIdx = sorted.indexOf(c);
                    return (
                      <button
                        key={c.contaminant_id || c.contaminant || i}
                        onClick={() => { playTapSound(); setExpandedDetail(expandedDetail === globalIdx ? null : globalIdx); }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors cursor-pointer hover:opacity-80`}
                        style={{
                          background: expandedDetail === globalIdx ? `${colors.primary}10` : "transparent",
                          borderBottom: i < items.length - 1 ? `1px solid ${colors.border}` : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SeverityIcon c={c} />
                          <span className="text-[14px] truncate" style={{ color: colors.textSecondary }}>{contaminantName(c)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {c.detected_level != null && (
                            <span className="text-[13px]" style={{ color: colors.textMuted }}>{c.detected_level} {c.unit}</span>
                          )}
                          {c.times_above_ewg != null && c.times_above_ewg > 1 && (
                            <span className="text-[11px] font-semibold" style={{ color: `${colors.warning}90` }}>{c.times_above_ewg}×</span>
                          )}
                          <SeverityBadge c={c} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Next button */}
      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${colors.warning}, #f97316)`,
          boxShadow: `0 4px 24px ${colors.warning}20`,
        }}
      >
        Continue to Your Score <ArrowRight className="size-5" />
      </button>
    </div>
  );
}
