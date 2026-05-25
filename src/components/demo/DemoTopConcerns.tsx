/* ──── Phase 1: Top 3 Water Concerns Summary ────
   Shows the top 3 most important water concerns in plain English
   before the full contaminant table. Reusable — works with any
   contaminant array from the pipeline.
   ──── */

import { AlertTriangle, ChevronDown, Eye, Shield, Skull } from "lucide-react";
import { useMemo, useState } from "react";
import { contaminantName } from "@/lib/supabase";
import { playTapSound } from "@/lib/demoSounds";

interface Props {
  contaminants: any[];
  /** Called when user clicks "View Full Breakdown" */
  onViewFull?: () => void;
  /** Show the inline full breakdown instead of calling onViewFull */
  showFullInline?: boolean;
}

/* ──── Concern definitions ──── */
interface ConcernDef {
  id: string;
  title: string;
  description: string;
  icon: typeof Skull;
  color: string;
  bg: string;
  border: string;
  /** Returns true if a contaminant matches this concern */
  match: (name: string, c: any) => boolean;
  /** Priority for sorting (lower = more important) */
  priority: number;
}

const CONCERN_DEFS: ConcernDef[] = [
  {
    id: "legal_violations",
    title: "Legal Limit Violations",
    description: "Contaminants exceeding federal legal limits — above what the EPA considers safe for any level of exposure.",
    icon: Skull,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    match: (_name, c) => !!c.over_legal,
    priority: 0,
  },
  {
    id: "disinfection_byproducts",
    title: "Disinfection Byproducts",
    description: "Potential concern related to chlorine treatment. These form when disinfectants react with organic matter in water and are linked to long-term health effects.",
    icon: AlertTriangle,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    match: (name) => {
      const n = name.toLowerCase();
      return n.includes("trihalomethane") || n.includes("tthm") || n.includes("haloacetic") ||
        n.includes("bromate") || n.includes("chloroform") || n.includes("dichloroacetic") ||
        n.includes("trichloroacetic") || n.includes("dibromochloromethane") || n.includes("bromodichloromethane");
    },
    priority: 1,
  },
  {
    id: "heavy_metals",
    title: "Heavy Metals",
    description: "Metals like lead, chromium, and arsenic can accumulate in the body over time. Even low levels may pose health risks with prolonged exposure.",
    icon: AlertTriangle,
    color: "#f97316",
    bg: "rgba(249,115,22,0.08)",
    border: "rgba(249,115,22,0.25)",
    match: (name) => {
      const n = name.toLowerCase();
      return n.includes("lead") || n.includes("chromium") || n.includes("arsenic") ||
        n.includes("mercury") || n.includes("cadmium") || n.includes("barium") ||
        n.includes("manganese") || n.includes("copper") || n.includes("selenium") ||
        n.includes("nickel") || n.includes("antimony") || n.includes("thallium");
    },
    priority: 2,
  },
  {
    id: "hardness_minerals",
    title: "Hardness / Minerals",
    description: "Can contribute to buildup on fixtures, appliances, and plumbing. May also affect skin, hair, and laundry over time.",
    icon: Shield,
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    match: (name) => {
      const n = name.toLowerCase();
      return n.includes("hardness") || n.includes("calcium") || n.includes("magnesium") ||
        n.includes("strontium") || n.includes("mineral");
    },
    priority: 3,
  },
  {
    id: "chlorine_taste",
    title: "Chlorine / Taste / Odor",
    description: "Can affect drinking water, cooking, showers, and daily comfort. Chlorine and related compounds are the most common cause of water taste and smell issues.",
    icon: Shield,
    color: "#06b6d4",
    bg: "rgba(6,182,212,0.08)",
    border: "rgba(6,182,212,0.25)",
    match: (name) => {
      const n = name.toLowerCase();
      return n.includes("chlorine") || n.includes("chloramine") || n.includes("taste") || n.includes("odor");
    },
    priority: 4,
  },
  {
    id: "radioactive",
    title: "Radioactive Elements",
    description: "Naturally occurring radioactive materials can be present in groundwater. Elevated levels are linked to increased long-term health risks.",
    icon: Skull,
    color: "#ef4444",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    match: (name) => {
      const n = name.toLowerCase();
      return n.includes("radium") || n.includes("uranium") || n.includes("radon") ||
        n.includes("gross alpha") || n.includes("gross beta");
    },
    priority: 1,
  },
  {
    id: "health_guidelines",
    title: "Health Guideline Exceedances",
    description: "Contaminants present above recommended health guidelines. While not necessarily illegal, they exceed levels associated with increased health risk.",
    icon: AlertTriangle,
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    match: (_name, c) => !!c.over_health && !c.over_legal,
    priority: 1,
  },
];

interface MatchedConcern {
  def: ConcernDef;
  count: number;
  contaminants: string[];
}

function matchConcerns(contaminants: any[]): MatchedConcern[] {
  const matched = new Map<string, MatchedConcern>();

  for (const c of contaminants) {
    const name = contaminantName(c);
    for (const def of CONCERN_DEFS) {
      if (def.match(name, c)) {
        const existing = matched.get(def.id);
        if (existing) {
          existing.count++;
          if (!existing.contaminants.includes(name)) {
            existing.contaminants.push(name);
          }
        } else {
          matched.set(def.id, { def, count: 1, contaminants: [name] });
        }
      }
    }
  }

  // Sort by priority, then by count (more matches = more relevant)
  return Array.from(matched.values())
    .sort((a, b) => a.def.priority - b.def.priority || b.count - a.count)
    .slice(0, 3);
}

export function DemoTopConcerns({ contaminants, onViewFull, showFullInline = false }: Props) {
  const [showFull, setShowFull] = useState(false);
  const concerns = useMemo(() => matchConcerns(contaminants), [contaminants]);

  if (concerns.length === 0) return null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Header */}
      <div className="text-center">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 border border-amber-500/30 rounded-full px-3 py-1">
          WATER ANALYSIS
        </span>
        <h2 className="text-2xl font-black mt-3">
          Your Top Water Concerns
        </h2>
        <p className="text-sm text-white/50 mt-1">
          Based on {contaminants.length} contaminants detected in your area
        </p>
      </div>

      {/* Top 3 concern cards */}
      <div className="space-y-3">
        {concerns.map((concern, i) => {
          const Icon = concern.def.icon;
          return (
            <div
              key={concern.def.id}
              className="rounded-2xl border p-4 animate-in fade-in slide-in-from-bottom-3 duration-500"
              style={{
                background: concern.def.bg,
                borderColor: concern.def.border,
                animationDelay: `${i * 150}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="size-9 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ background: `${concern.def.color}20` }}
                >
                  <Icon className="size-4" style={{ color: concern.def.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold" style={{ color: concern.def.color }}>
                      {concern.def.title}
                    </h3>
                    {concern.count > 1 && (
                      <span
                        className="text-[9px] font-bold rounded-full px-1.5 py-0.5"
                        style={{ background: `${concern.def.color}20`, color: concern.def.color }}
                      >
                        {concern.count} found
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed mt-1">
                    {concern.def.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Full Breakdown button */}
      <button
        onClick={() => {
          playTapSound();
          if (onViewFull) {
            onViewFull();
          } else if (showFullInline) {
            setShowFull((s) => !s);
          }
        }}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3 text-sm font-semibold text-white/60 hover:bg-white/[0.06] active:bg-white/[0.08] transition-colors cursor-pointer"
      >
        <Eye className="size-4" />
        {showFull ? "Hide Full Breakdown" : "View Full Contaminant Breakdown"}
        {!showFull ? <ChevronDown className="size-3.5" /> : <ChevronDown className="size-3.5 rotate-180" />}
      </button>
    </div>
  );
}
