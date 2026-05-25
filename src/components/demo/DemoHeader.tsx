/* ──── Demo Header Bar — Mockup-faithful ────
   Logo + company name left. Step counter right.
   Coaching toggle (Lightbulb icon) — rep-only, right side before step counter.
   Uses company.logo with fallback to /assets/aquareport-logo.png.
   ──── */

import { Lightbulb } from "lucide-react";
import { colors } from "@/lib/designTokens";

interface Props {
  currentStep: number;
  totalSteps: number;
  companyName?: string;
  companyLogo?: string;
  isRepView?: boolean;
  coachingOpen?: boolean;
  onToggleCoaching?: () => void;
}

export function DemoHeader({
  currentStep,
  totalSteps,
  companyName,
  companyLogo,
  isRepView = false,
  coachingOpen = false,
  onToggleCoaching,
}: Props) {
  return (
    <div
      className="flex items-center justify-between px-8 py-3"
      style={{ borderBottom: `1px solid ${colors.border}` }}
    >
      {/* Left: Logo + brand */}
      <div className="flex items-center gap-2.5">
        <img
          src={companyLogo || "/assets/aquareport-logo.png"}
          alt={companyName || "AquaReport"}
          className="w-5 h-6 object-contain"
          style={{ filter: "brightness(1.1)" }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/aquareport-logo.png";
          }}
        />
        <span
          className="text-[14px] font-semibold tracking-tight"
          style={{ color: colors.textPrimary }}
        >
          {companyName || "AquaReport"}
        </span>
      </div>

      {/* Right: coaching toggle (rep only) + step counter */}
      <div className="flex items-center gap-4">
        {isRepView && onToggleCoaching && (
          <button
            onClick={onToggleCoaching}
            className="p-1.5 rounded-lg transition-all cursor-pointer"
            style={{
              background: coachingOpen ? `${colors.warning}15` : "transparent",
              color: coachingOpen ? colors.warning : colors.textFaint,
            }}
            title="Rep Coaching"
          >
            <Lightbulb className="size-4" />
          </button>
        )}
        <span
          className="text-[13px] font-medium tabular-nums"
          style={{ color: colors.textMuted }}
        >
          Step {currentStep} of {totalSteps}
        </span>
      </div>
    </div>
  );
}
