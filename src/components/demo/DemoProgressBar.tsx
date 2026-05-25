/* ──── Grouped Section Progress Bar ────
   Minimal, clean. designTokens colors.
   ──── */

import { Check } from "lucide-react";
import { colors } from "@/lib/designTokens";

export interface StepDef {
  key: string;
  label: string;
  color: string;
}

export interface SectionGroup {
  label: string;
  color: string;
  keys: string[];
}

export const SECTION_GROUPS: SectionGroup[] = [
  { label: "Home",         color: "#3b82f6", keys: ["intake", "welcome", "homeProfile", "customerConcerns"] },
  { label: "Diagnose",     color: colors.warning, keys: ["topConcerns", "contaminants", "score", "test", "verifiedScore"] },
  { label: "Impact",       color: colors.critical, keys: ["impact"] },
  { label: "Solution",     color: "#8b5cf6", keys: ["scoreImprovement", "system", "trust", "beforeAfter"] },
  { label: "Investment",   color: colors.success, keys: ["comparison", "pricing", "investmentBreakdown", "transform", "boost"] },
  { label: "Close",        color: "#22c55e", keys: ["summary", "decision", "customerClose", "dealerClose"] },
];

interface ProgressBarProps {
  currentStepKey: string;
  steps: StepDef[];
  isPresentationMode: boolean;
  grouped?: boolean;
}

export function DemoProgressBar({ currentStepKey, steps, isPresentationMode, grouped = true }: ProgressBarProps) {
  if (!grouped) {
    const stepIdx = steps.findIndex((s) => s.key === currentStepKey);
    return (
      <div className="flex gap-0.5">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 rounded-full transition-all duration-500 ${isPresentationMode ? "h-1.5" : "h-1"}`}
            style={{
              background: i < stepIdx ? s.color : i === stepIdx ? `${s.color}80` : `${colors.textFaint}15`,
            }}
          />
        ))}
      </div>
    );
  }

  const stepKeys = steps.map((s) => s.key);
  const currentIdx = stepKeys.indexOf(currentStepKey);

  const activeSections = SECTION_GROUPS.filter((sg) => sg.keys.some((k) => stepKeys.includes(k)));

  return (
    <div className="flex items-center gap-1 overflow-hidden">
      {activeSections.map((section) => {
        const sectionStepIndices = section.keys.map((k) => stepKeys.indexOf(k)).filter((i) => i >= 0);
        if (sectionStepIndices.length === 0) return null;

        const firstIdx = Math.min(...sectionStepIndices);
        const lastIdx = Math.max(...sectionStepIndices);

        const isComplete = currentIdx > lastIdx;
        const isCurrent = currentIdx >= firstIdx && currentIdx <= lastIdx;
        const isPending = currentIdx < firstIdx;

        const stepsInSection = sectionStepIndices.length;
        const stepsCompleted = sectionStepIndices.filter((i) => i < currentIdx).length;
        const subProgress = isCurrent ? Math.max(stepsCompleted / stepsInSection, 0.1) : isComplete ? 1 : 0;

        return (
          <div key={section.label} className="flex-1 min-w-0 flex flex-col items-center gap-1">
            <span
              className={`font-bold uppercase tracking-wider transition-all truncate max-w-full ${isPresentationMode ? "text-[10px]" : "text-[7px] landscape:text-[6px]"}`}
              style={{ color: isCurrent ? colors.textSecondary : isComplete ? colors.textFaint : `${colors.textFaint}50` }}
            >
              {isComplete ? (
                <span className="flex items-center gap-0.5">
                  <Check className="size-2.5" style={{ color: section.color }} />
                  {section.label}
                </span>
              ) : (
                section.label
              )}
            </span>
            <div
              className={`w-full rounded-full overflow-hidden ${isPresentationMode ? "h-1.5" : "h-1"}`}
              style={{ background: `${colors.textFaint}15` }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${subProgress * 100}%`,
                  background: isCurrent || isComplete ? section.color : "transparent",
                  opacity: isPending ? 0 : isCurrent ? 0.9 : 0.5,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
