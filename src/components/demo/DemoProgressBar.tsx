/* ──── Sprint 1D: Grouped section progress bar ──── */

import { Check } from "lucide-react";

export interface StepDef {
  key: string;
  label: string;
  color: string;
}

/**
 * Group steps into logical sections for a cleaner progress visualization.
 * Each section has a label, color, and array of step keys it contains.
 */
export interface SectionGroup {
  label: string;
  color: string;
  keys: string[];
}

export const SECTION_GROUPS: SectionGroup[] = [
  { label: "Intro", color: "#3b82f6", keys: ["intake", "welcome"] },
  { label: "Analysis", color: "#f59e0b", keys: ["score", "contaminants", "impact", "rooms"] },
  { label: "Testing", color: "#06b6d4", keys: ["test", "transform"] },
  { label: "Solution", color: "#8b5cf6", keys: ["system", "trust", "pricing", "comparison", "boost"] },
  { label: "Close", color: "#22c55e", keys: ["customerClose", "dealerClose"] },
];

interface ProgressBarProps {
  currentStepKey: string;
  steps: StepDef[];
  isPresentationMode: boolean;
  /** Use grouped mode (default) or flat mode */
  grouped?: boolean;
}

export function DemoProgressBar({
  currentStepKey,
  steps,
  isPresentationMode,
  grouped = true,
}: ProgressBarProps) {
  if (!grouped) {
    // Flat mode — same as original but step-aware
    const stepIdx = steps.findIndex((s) => s.key === currentStepKey);
    return (
      <div className="flex gap-0.5">
        {steps.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 rounded-full transition-all duration-500 ${isPresentationMode ? "h-1.5" : "h-1"}`}
            style={{
              background:
                i < stepIdx
                  ? s.color
                  : i === stepIdx
                    ? `${s.color}80`
                    : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </div>
    );
  }

  // Grouped mode: show section pills
  const stepKeys = steps.map((s) => s.key);
  const currentIdx = stepKeys.indexOf(currentStepKey);

  // Filter to only sections that have active steps
  const activeSections = SECTION_GROUPS.filter((sg) =>
    sg.keys.some((k) => stepKeys.includes(k)),
  );

  return (
    <div className="flex items-center gap-1.5">
      {activeSections.map((section) => {
        // Find the first and last step indices for this section
        const sectionStepIndices = section.keys
          .map((k) => stepKeys.indexOf(k))
          .filter((i) => i >= 0);

        if (sectionStepIndices.length === 0) return null;

        const firstIdx = Math.min(...sectionStepIndices);
        const lastIdx = Math.max(...sectionStepIndices);

        const isComplete = currentIdx > lastIdx;
        const isCurrent = currentIdx >= firstIdx && currentIdx <= lastIdx;
        const isPending = currentIdx < firstIdx;

        // Sub-progress within section
        const stepsInSection = sectionStepIndices.length;
        const stepsCompleted = sectionStepIndices.filter((i) => i < currentIdx).length;
        const subProgress = isCurrent
          ? Math.max(stepsCompleted / stepsInSection, 0.1)
          : isComplete
            ? 1
            : 0;

        return (
          <div key={section.label} className="flex-1 flex flex-col items-center gap-1">
            {/* Section label */}
            <span
              className={`text-[8px] font-bold uppercase tracking-wider transition-all ${
                isCurrent
                  ? "text-white/70"
                  : isComplete
                    ? "text-white/40"
                    : "text-white/20"
              } ${isPresentationMode ? "text-[10px]" : ""}`}
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
            {/* Bar */}
            <div
              className={`w-full rounded-full overflow-hidden ${
                isPresentationMode ? "h-1.5" : "h-1"
              }`}
              style={{ background: "rgba(255,255,255,0.08)" }}
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
