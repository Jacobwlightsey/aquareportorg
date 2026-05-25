/* ──── Visual Design Tokens ────
   Single source of truth for the entire demo wizard visual language.
   Apple Health / Keynote / Tesla ordering aesthetic.
   
   RULES:
   - 4 typography levels only: hero, section, body, caption
   - 5 colors + 3 semantic only
   - Whitespace creates separation, not borders
   - One powerful idea per screen
   ──── */

export const colors = {
  /** Page/app background */
  bg: "#070B14",
  /** Card / surface background */
  surface: "#101826",
  /** Elevated surface (modals, popovers) */
  elevated: "#162033",
  /** Primary accent — used for emphasis, active states, key moments */
  primary: "#6FD3FF",
  /** Primary glow — subtle halos, focus rings */
  primaryGlow: "rgba(111, 211, 255, 0.18)",
  /** Success — confirmations, positive changes, projected scores */
  success: "#6EE7B7",
  /** Warning — health concerns, attention needed */
  warning: "#FBBF24",
  /** Critical — legal violations, danger (use sparingly) */
  critical: "#FB7185",

  /** Text hierarchy */
  textPrimary: "rgba(255, 255, 255, 0.92)",
  textSecondary: "rgba(255, 255, 255, 0.55)",
  textMuted: "rgba(255, 255, 255, 0.32)",
  textFaint: "rgba(255, 255, 255, 0.18)",

  /** Borders — use sparingly */
  border: "rgba(255, 255, 255, 0.06)",
  borderActive: "rgba(255, 255, 255, 0.12)",
} as const;

/** Typography scale — 4 levels only */
export const type = {
  hero: "text-[48px] sm:text-[56px] font-black leading-none tracking-tight",
  section: "text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight",
  body: "text-[16px] sm:text-[17px] leading-relaxed",
  caption: "text-[12px] sm:text-[13px] leading-normal tracking-wide",
} as const;

/** Spacing rhythm — consistent vertical flow */
export const space = {
  /** Between major sections */
  section: "space-y-10",
  /** Between grouped items */
  group: "space-y-6",
  /** Between inline items */
  inline: "space-y-3",
} as const;

/** Spring animation config for emotional moments */
export const spring = {
  /** Slow emotional reveal (score, transform, pricing) */
  slow: { duration: 2800, easing: "cubic-bezier(0.16, 1, 0.3, 1)" },
  /** Medium interaction (cards, selections) */
  medium: { duration: 600, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
  /** Fast utility (nav, tabs, toggles) */
  fast: { duration: 250, easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" },
} as const;

/** Score tier colors — aligned to the 5-color palette */
export function scoreColor(s: number): string {
  if (s >= 80) return colors.warning;    // Gold — amber
  if (s >= 60) return colors.primary;    // Silver — cyan/blue
  if (s >= 40) return "#F59E0B";         // Bronze — warm amber
  return colors.critical;                 // At risk — coral
}

export function scoreLabel(s: number): string {
  if (s >= 80) return "EXCELLENT";
  if (s >= 60) return "GOOD";
  if (s >= 40) return "FAIR";
  return "AT RISK";
}

export function scoreTierInfo(s: number) {
  if (s >= 80) return { label: "Excellent", color: colors.warning, desc: "Your water quality is outstanding." };
  if (s >= 60) return { label: "Good", color: colors.primary, desc: "Your water is mostly clean with a few areas to monitor." };
  if (s >= 40) return { label: "Fair", color: "#F59E0B", desc: "Some contaminants are above recommended health levels." };
  return { label: "At Risk", color: colors.critical, desc: "Significant quality concerns that should be addressed." };
}
