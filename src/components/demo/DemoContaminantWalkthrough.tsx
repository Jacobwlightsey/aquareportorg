/* ──── Contaminant Walkthrough — Full Breakdown ────
   Mockup-style severity badges (HIGH / ELEVATED / MODERATE).
   Categorized accordion. Surface cards, designTokens colors.
   ──── */

import { AlertTriangle, ChevronDown, ChevronUp, FlaskConical, Shield, Skull, X } from "lucide-react";
import { useState } from "react";
import { contaminantName } from "@/lib/supabase";
import { playTapSound } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";
import { colors } from "@/lib/designTokens";

interface Props {
  contaminants: any[];
  onNext: () => void;
  onBack: () => void;
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

function ContaminantDetail({ c, onClose }: { c: any; onClose: () => void }) {
  const ratio = c.health_guideline && c.health_guideline > 0 ? c.detected_level / c.health_guideline : c.detected_level > 0 ? 1 : 0;

  return (
    <div className="rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300" style={{ background: colors.surface }}>
      <div
        className="p-4 pb-3 flex items-start justify-between"
        style={{
          background: c.over_legal ? `${colors.critical}08` : c.over_health ? `${colors.warning}08` : `${colors.textFaint}05`,
        }}
      >
        <div className="flex items-center gap-3">
          <SeverityIcon c={c} />
          <div>
            <h3 className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>{contaminantName(c)}</h3>
            <div className="flex gap-2 mt-1">
              <SeverityBadge c={c} />
              {c.times_above_ewg != null && c.times_above_ewg > 1 && (
                <span className="text-[11px] font-semibold" style={{ color: `${colors.warning}b0` }}>{c.times_above_ewg}× EWG guideline</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 cursor-pointer">
          <X className="size-4" style={{ color: colors.textFaint }} />
        </button>
      </div>

      <div className="p-4 space-y-3">
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-[24px] font-bold" style={{ color: colors.textPrimary }}>
              {c.detected_level} <span className="text-[13px] font-normal" style={{ color: colors.textFaint }}>{c.unit}</span>
            </span>
          </div>
          <SeverityBar ratio={ratio} />
          <div className="flex justify-between mt-1">
            <span className="text-[11px]" style={{ color: colors.textFaint }}>0</span>
            {c.health_guideline != null && <span className="text-[11px]" style={{ color: colors.textFaint }}>Health: {c.health_guideline} {c.unit}</span>}
            {c.legal_limit != null && <span className="text-[11px]" style={{ color: colors.textFaint }}>Legal: {c.legal_limit} {c.unit}</span>}
          </div>
        </div>

        {c.effect && (
          <p className="text-[13px] leading-relaxed rounded-lg p-3" style={{ color: colors.textSecondary, background: `${colors.textFaint}08` }}>
            {c.effect}
          </p>
        )}
      </div>
    </div>
  );
}

export function DemoContaminantWalkthrough({ contaminants, onNext: _onNext, onBack: _onBack }: Props) {
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
      <div className="mx-auto max-w-lg pt-8 text-center">
        <FlaskConical className="mx-auto size-12 mb-4" style={{ color: colors.textFaint }} />
        <p style={{ color: colors.textMuted }}>No contaminant data available</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-4">
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
        <div className="rounded-xl p-4 text-center" style={{ background: colors.surface }}>
          <Shield className="size-5 mx-auto mb-1" style={{ color: colors.textMuted }} />
          <p className="text-[22px] font-bold" style={{ color: colors.textPrimary }}>{sorted.length}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.textFaint }}>Total Found</p>
        </div>
      </div>

      {/* Detail card */}
      {expandedDetail !== null && sorted[expandedDetail] && (
        <ContaminantDetail c={sorted[expandedDetail]} onClose={() => setExpandedDetail(null)} />
      )}

      {/* Categorized list */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const items = grouped[cat];
          const catLegal = items.filter((c) => c.over_legal).length;
          const catHealth = items.filter((c) => c.over_health).length;
          const isExpanded = expandedCategories.has(cat);

          return (
            <div key={cat} className="rounded-xl overflow-hidden" style={{ background: colors.surface }}>
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
    </div>
  );
}
