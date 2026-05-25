/* ──── Score Methodology Explainer ────
   Collapsible panel explaining how AquaScore works.
   Fix #13: normalized to designTokens colors
   ──── */

import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState } from "react";
import { colors } from "@/lib/designTokens";

interface ScoreRange {
  min: number;
  max: number;
  label: string;
  color: string;
}

const SCORE_RANGES: ScoreRange[] = [
  { min: 80, max: 100, label: "Gold",    color: colors.success },
  { min: 60, max: 79,  label: "Silver",  color: colors.primary },
  { min: 40, max: 59,  label: "Bronze",  color: colors.warning },
  { min: 0,  max: 39,  label: "At Risk", color: colors.critical },
];

interface Props {
  currentScore?: number;
  defaultExpanded?: boolean;
  compact?: boolean;
}

export function DemoScoreExplainer({ currentScore, defaultExpanded = false, compact = false }: Props) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const activeRange = currentScore != null
    ? SCORE_RANGES.find((r) => currentScore >= r.min && currentScore <= r.max)
    : null;

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      {/* Toggle header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center justify-between p-4 cursor-pointer transition-colors hover:opacity-80"
      >
        <div className="flex items-center gap-2">
          <Info className={`${compact ? "size-3.5" : "size-4"}`} style={{ color: colors.primary }} />
          <p className={`${compact ? "text-[12px]" : "text-[14px]"} font-semibold`} style={{ color: colors.textSecondary }}>
            How is this score calculated?
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="size-4" style={{ color: colors.textFaint }} />
        ) : (
          <ChevronDown className="size-4" style={{ color: colors.textFaint }} />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
          <p className={`${compact ? "text-[12px]" : "text-[13px]"} leading-relaxed`} style={{ color: colors.textMuted }}>
            Your Water Score is based on local utility data, contaminants detected,
            health guideline comparisons, hardness and mineral levels, disinfectant levels,
            and live in-home test results when available.
          </p>

          <div className="space-y-1.5">
            {SCORE_RANGES.map((range) => {
              const isActive = activeRange === range;
              return (
                <div
                  key={range.label}
                  className="flex items-center justify-between rounded-xl px-3 py-2 transition-all"
                  style={
                    isActive
                      ? { background: `${range.color}12`, border: `1px solid ${range.color}30` }
                      : { border: "1px solid transparent" }
                  }
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2.5 rounded-full shrink-0"
                      style={{ background: range.color }}
                    />
                    <span
                      className="text-[13px] font-medium"
                      style={{ color: isActive ? colors.textPrimary : colors.textMuted }}
                    >
                      {range.label}
                    </span>
                  </div>
                  <span
                    className="text-[13px] tabular-nums"
                    style={isActive ? { color: range.color, fontWeight: 700 } : { color: colors.textFaint }}
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
