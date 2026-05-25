import { AlertTriangle, ChevronDown, ChevronUp, FlaskConical, Skull, Shield, X } from "lucide-react";
import { useState } from "react";
import { contaminantName } from "@/lib/supabase";
import { playTapSound } from "@/lib/demoSounds";
import { useCountUp } from "@/hooks/useCountUp";

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
      <span className="shrink-0 rounded-full bg-red-500/20 border border-red-500/30 px-2 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">
        Legal
      </span>
    );
  }
  if (c.over_health) {
    return (
      <span className="shrink-0 rounded-full bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
        Health
      </span>
    );
  }
  return (
    <span className="shrink-0 rounded-full bg-white/10 border border-white/20 px-2 py-0.5 text-[9px] font-bold text-white/40 uppercase tracking-wider">
      Detected
    </span>
  );
}

function SeverityIcon({ c }: { c: any }) {
  if (c.over_legal) return <Skull className="size-4 text-red-400 shrink-0" />;
  if (c.over_health) return <AlertTriangle className="size-4 text-amber-400 shrink-0" />;
  return <FlaskConical className="size-4 text-white/30 shrink-0" />;
}

function SeverityBar({ ratio }: { ratio: number }) {
  const width = Math.min(100, Math.max(5, ratio * 100));
  const color =
    ratio >= 1
      ? "bg-gradient-to-r from-red-500 to-red-400"
      : ratio >= 0.5
        ? "bg-gradient-to-r from-amber-500 to-amber-400"
        : "bg-gradient-to-r from-emerald-500 to-emerald-400";
  return (
    <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${width}%` }} />
    </div>
  );
}

function ContaminantDetail({ c, onClose }: { c: any; onClose: () => void }) {
  const ratio =
    c.health_guideline && c.health_guideline > 0
      ? c.detected_level / c.health_guideline
      : c.detected_level > 0
        ? 1
        : 0;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300">
      {/* Header */}
      <div
        className="p-4 pb-3 flex items-start justify-between"
        style={{
          background: c.over_legal
            ? "linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))"
            : c.over_health
              ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))"
              : "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
        }}
      >
        <div className="flex items-center gap-3">
          <SeverityIcon c={c} />
          <div>
            <h3 className="text-base font-bold">{contaminantName(c)}</h3>
            <div className="flex gap-2 mt-1">
              <SeverityBadge c={c} />
              {c.times_above_ewg != null && c.times_above_ewg > 1 && (
                <span className="text-[9px] font-bold text-amber-400/80">{c.times_above_ewg}× EWG guideline</span>
              )}
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10">
          <X className="size-4 text-white/40" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Level bar */}
        <div>
          <div className="flex items-end justify-between mb-1.5">
            <span className="text-2xl font-black">{c.detected_level} <span className="text-xs text-white/40 font-medium">{c.unit}</span></span>
          </div>
          <SeverityBar ratio={ratio} />
          <div className="flex justify-between mt-1 text-[10px] text-white/40">
            <span>0</span>
            {c.health_guideline != null && <span>Health: {c.health_guideline} {c.unit}</span>}
            {c.legal_limit != null && <span>Legal: {c.legal_limit} {c.unit}</span>}
          </div>
        </div>

        {/* Health effect */}
        {c.effect && (
          <p className="text-xs text-white/60 leading-relaxed bg-white/5 rounded-lg p-3">{c.effect}</p>
        )}
      </div>
    </div>
  );
}

export function DemoContaminantWalkthrough({ contaminants, onNext: _onNext, onBack: _onBack }: Props) {
  const [expandedDetail, setExpandedDetail] = useState<number | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Sort by severity
  const sorted = [...contaminants].sort((a, b) => {
    if (a.over_legal !== b.over_legal) return a.over_legal ? -1 : 1;
    if (a.over_health !== b.over_health) return a.over_health ? -1 : 1;
    return (b.times_above_ewg ?? 0) - (a.times_above_ewg ?? 0);
  });

  // Group by category
  const grouped: Record<string, any[]> = {};
  for (const c of sorted) {
    const cat = guessCategory(contaminantName(c));
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(c);
  }

  // Sort categories: ones with legal/health violations first
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

  // Sprint 1C — count-up animation
  const legalCount = useCountUp(legalCountRaw, 800, 200);
  const healthCount = useCountUp(healthCountRaw, 800, 400);
  const totalCount = useCountUp(sorted.length, 800, 0);

  const toggleCategory = (cat: string) => {
    playTapSound();
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (!sorted.length) {
    return (
      <div className="mx-auto max-w-lg pt-8 text-center">
        <FlaskConical className="mx-auto size-12 text-white/20 mb-4" />
        <p className="text-white/60">No contaminant data available</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 pt-2">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/70">
          FULL BREAKDOWN
        </span>
        <h2 className="text-2xl font-black mt-3">
          {totalCount} Contaminants Detected
        </h2>
        <p className="text-sm text-white/40 mt-1.5">
          Tap any contaminant for details
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-center">
          <Skull className="size-5 text-red-400 mx-auto mb-1" />
          <p className="text-xl font-black text-red-400">{legalCount}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-red-400/60">Legal Violations</p>
        </div>
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center">
          <AlertTriangle className="size-5 text-amber-400 mx-auto mb-1" />
          <p className="text-xl font-black text-amber-400">{healthCount}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-amber-400/60">Health Risks</p>
        </div>
        <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-center">
          <Shield className="size-5 text-white/40 mx-auto mb-1" />
          <p className="text-xl font-black">{sorted.length}</p>
          <p className="text-[9px] font-bold uppercase tracking-wider text-white/40">Total Found</p>
        </div>
      </div>

      {/* Detail card (shown when a contaminant is tapped) */}
      {expandedDetail !== null && sorted[expandedDetail] && (
        <ContaminantDetail
          c={sorted[expandedDetail]}
          onClose={() => setExpandedDetail(null)}
        />
      )}

      {/* Categorized contaminant list */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const items = grouped[cat];
          const catLegal = items.filter((c) => c.over_legal).length;
          const catHealth = items.filter((c) => c.over_health).length;
          const isExpanded = expandedCategories.has(cat);

          return (
            <div key={cat} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
              {/* Category header — always visible */}
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center justify-between p-3 text-left active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold truncate">{cat}</span>
                  <span className="text-[10px] text-white/40 font-medium shrink-0">({items.length})</span>
                  {catLegal > 0 && (
                    <span className="shrink-0 rounded-full bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 text-[8px] font-bold text-red-400">
                      {catLegal} LEGAL
                    </span>
                  )}
                  {catHealth > 0 && (
                    <span className="shrink-0 rounded-full bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">
                      {catHealth} HEALTH
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronUp className="size-4 text-white/40 shrink-0" />
                ) : (
                  <ChevronDown className="size-4 text-white/40 shrink-0" />
                )}
              </button>

              {/* Expanded items */}
              {isExpanded && (
                <div className="border-t border-white/5">
                  {items.map((c, i) => {
                    const globalIdx = sorted.indexOf(c);
                    return (
                      <button
                        key={c.contaminant_id || c.contaminant || i}
                        onClick={() => {
                          playTapSound();
                          setExpandedDetail(expandedDetail === globalIdx ? null : globalIdx);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                          expandedDetail === globalIdx ? "bg-white/10" : "active:bg-white/5"
                        } ${i < items.length - 1 ? "border-b border-white/5" : ""}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SeverityIcon c={c} />
                          <span className="text-sm truncate">{contaminantName(c)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          {c.detected_level != null && (
                            <span className="text-xs text-white/50">
                              {c.detected_level} {c.unit}
                            </span>
                          )}
                          {c.times_above_ewg != null && c.times_above_ewg > 1 && (
                            <span className="text-[10px] font-bold text-amber-400/70">
                              {c.times_above_ewg}×
                            </span>
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
