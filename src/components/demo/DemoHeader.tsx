/* ──── Demo Header Bar — Persistent Brand + Step Counter ────
   Shown on every screen. Clean, minimal, consistent.
   AquaReport logo + name on left.
   "Step X of Y" on right.
   Thin, doesn't compete with content.
   ──── */

import { colors } from "@/lib/designTokens";

interface Props {
  currentStep: number;
  totalSteps: number;
  companyName?: string;
}

export function DemoHeader({ currentStep, totalSteps, companyName }: Props) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3"
      style={{ borderBottom: `1px solid ${colors.border}` }}
    >
      {/* Left: Logo + brand */}
      <div className="flex items-center gap-2.5">
        <img
          src="/assets/aquareport-logo.png"
          alt="AquaReport"
          className="w-5 h-6 object-contain"
        />
        <span
          className="text-[14px] font-semibold tracking-tight"
          style={{ color: colors.textPrimary }}
        >
          {companyName || "AquaReport"}
        </span>
      </div>

      {/* Right: Step counter */}
      <span
        className="text-[13px] font-medium tabular-nums"
        style={{ color: colors.textMuted }}
      >
        Step {currentStep} of {totalSteps}
      </span>
    </div>
  );
}
