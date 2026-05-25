/* ──── Phase 1: Score Methodology Explainer ────
   Reusable component that explains how the AquaScore is calculated.
   Designed to drop into any screen that shows a score.
   ──── */

import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";

interface ScoreRange {
  min: number;
  max: number;
  label: string;
  color: string;
  bg: string;
}

const SCORE_RANGES: ScoreRange[] = [
  { min: 90, max: 100, label: "Excellent", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  { min: 70, max: 89,  label: "Good", color: "#94a3b8", bg: "rgba(148,163,184,0.12)" },
  { min: 50, max: 69,  label: "Needs Improvement", color: "#f97316", bg: "rgba(249,115,22,0.12)" },
  { min: 0,  max: 49,  label: "Needs Attention", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
];

interface Props {
  /** Optional current score to highlight the active range */
  currentScore?: number;
  /** Start expanded? Default false (collapsed) */
  defaultExpanded?: boolean;
  /** Compact mode for tight layouts */
  compact?: boolean;
}

export function DemoScoreExplainer({ currentScore, defaultExpanded = false, compact = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const activeRange = currentScore != null
    ? SCORE_RANGES.find((r) => currentScore >= r.min && currentScore <= r.max)
    : null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 cursor-pointer active:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Info className={`${compact ? "size-3.5" : "size-4"} text-cyan-400`} />
          <p className={`${compact ? "text-xs" : "text-sm"} font-bold text-white/70`}>
            How is this score calculated?
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="size-4 text-white/40" />
        ) : (
          <ChevronDown className="size-4 text-white/40" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/5 pt-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Methodology text */}
          <p className={`${compact ? "text-[11px]" : "text-xs"} text-white/50 leading-relaxed`}>
            Your Water Score is based on local utility data, contaminants detected,
            health guideline comparisons, hardness and mineral levels, disinfectant levels,
            and live in-home test results when available.
          </p>

          {/* Score range guide */}
          <div className="space-y-1.5">
            {SCORE_RANGES.map((range) => {
              const isActive = activeRange === range;
              return (
                <div
                  key={range.label}
                  className={`flex items-center justify-between rounded-xl px-3 py-2 transition-all ${
                    isActive
                      ? "border"
                      : "border border-transparent"
                  }`}
                  style={
                    isActive
                      ? { background: range.bg, borderColor: `${range.color}40` }
                      : {}
                  }
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{ background: range.color }}
                    />
                    <span
                      className={`text-xs font-semibold ${isActive ? "text-white" : "text-white/50"}`}
                    >
                      {range.label}
                    </span>
                  </div>
                  <span
                    className={`text-xs tabular-nums ${isActive ? "font-bold" : "text-white/30"}`}
                    style={isActive ? { color: range.color } : {}}
                  >
                    {range.min}–{range.max}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
