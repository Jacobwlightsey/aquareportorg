/* ──── Top 3 Water Concerns Summary ────
   Shows top 3 most important concerns before the full breakdown.
   Fix #8: empty state fallback.
   ──── */

import { AlertTriangle, ChevronDown, Eye, Shield, Skull } from "lucide-react";
import { useMemo, useState } from "react";
import { contaminantName } from "@/lib/supabase";
import { playTapSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";

interface Props {
  contaminants: any[];
  onViewFull?: () => void;
  showFullInline?: boolean;
}

interface ConcernDef {
  id: string;
  title: string;
  description: string;
  icon: typeof Skull;
  color: string;
  match: (name: string, c: any) => boolean;
  priority: number;
}

const CONCERN_DEFS: ConcernDef[] = [
  {
    id: "legal_violations",
    title: "Legal Limit Violations",
    description: "Contaminants exceeding federal legal limits — above what the EPA considers safe for any level of exposure.",
    icon: Skull,
    color: colors.critical,
    match: (_name, c) => !!c.over_legal,
    priority: 0,
  },
  {
    id: "disinfection_byproducts",
    title: "Disinfection Byproducts",
    description: "Potential concern related to chlorine treatment. These form when disinfectants react with organic matter and are linked to long-term health effects.",
    icon: AlertTriangle,
    color: colors.warning,
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
    color: colors.primary,
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
    color: colors.critical,
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
    color: colors.warning,
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
          if (!existing.contaminants.includes(name)) existing.contaminants.push(name);
        } else {
          matched.set(def.id, { def, count: 1, contaminants: [name] });
        }
      }
    }
  }

  return Array.from(matched.values())
    .sort((a, b) => a.def.priority - b.def.priority || b.count - a.count)
    .slice(0, 3);
}

export function DemoTopConcerns({ contaminants, onViewFull, showFullInline = false }: Props) {
  const [showFull, setShowFull] = useState(false);
  const concerns = useMemo(() => matchConcerns(contaminants), [contaminants]);

  // Fix #8: empty state
  if (concerns.length === 0) {
    return (
      <div className="mx-auto w-full max-w-5xl px-8 text-center space-y-4 pt-12">
        <div className="text-4xl">✅</div>
        <h2 className="text-[22px] font-bold" style={{ color: colors.textPrimary }}>No Major Concerns Detected</h2>
        <p className="text-[15px]" style={{ color: colors.textMuted }}>
          Your water report didn't flag any high-priority contaminant categories.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-5">
      {/* Header */}
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.warning}b0` }}>
          KEY FINDINGS
        </p>
        <h2 className="text-[28px] font-bold mt-3 tracking-tight">Your Top Concerns</h2>
        <p className="text-[15px] mt-2" style={{ color: colors.textMuted }}>
          {contaminants.length} contaminants detected in your area
        </p>
      </div>

      {/* Top 3 cards */}
      <div className="space-y-3">
        {concerns.map((concern, i) => {
          const Icon = concern.def.icon;
          return (
            <div
              key={concern.def.id}
              className="rounded-2xl p-4 animate-in fade-in slide-in-from-bottom-3 duration-500"
              style={{
                background: `${concern.def.color}08`,
                border: `1px solid ${concern.def.color}20`,
                animationDelay: `${i * 150}ms`,
                animationFillMode: "backwards",
              }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="size-9 shrink-0 rounded-xl flex items-center justify-center mt-0.5"
                  style={{ background: `${concern.def.color}15` }}
                >
                  <Icon className="size-4" style={{ color: concern.def.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-semibold" style={{ color: concern.def.color }}>
                      {concern.def.title}
                    </h3>
                    {concern.count > 1 && (
                      <span
                        className="text-[10px] font-bold rounded-md px-1.5 py-0.5"
                        style={{ background: `${concern.def.color}15`, color: concern.def.color }}
                      >
                        {concern.count} found
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] leading-relaxed mt-1" style={{ color: colors.textMuted }}>
                    {concern.def.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* View Full Breakdown */}
      <button
        onClick={() => {
          playTapSound();
          if (onViewFull) onViewFull();
          else if (showFullInline) setShowFull((s) => !s);
        }}
        className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-semibold transition-colors cursor-pointer"
        style={{ background: colors.surface, color: colors.textSecondary }}
      >
        <Eye className="size-4" />
        {showFull ? "Hide Full Breakdown" : "View Full Contaminant Breakdown"}
        <ChevronDown className={`size-3.5 transition-transform ${showFull ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
