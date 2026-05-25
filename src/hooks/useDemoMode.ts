import { createContext, useContext, useState } from "react";

export type DemoModeType = "quick" | "standard" | "full";

export interface DemoModeCtx {
  demoMode: DemoModeType;
  setDemoMode: (mode: DemoModeType) => void;
}

export const DemoModeContext = createContext<DemoModeCtx>({
  demoMode: "standard",
  setDemoMode: () => {},
});

/** Default step keys for each mode (matches original 12-step flow + extras) */
export const DEFAULT_MODE_STEPS: Record<DemoModeType, string[]> = {
  quick: [
    "welcome",
    "homeProfile",
    "topConcerns",
    "score",
    "test",
    "system",
    "pricing",
    "decision",
    "customerClose",
    "dealerClose",
  ],
  standard: [
    "intake",
    "welcome",
    "homeProfile",
    "customerConcerns",
    "contaminants",
    "topConcerns",
    "score",
    "test",
    "verifiedScore",
    "impact",
    "system",
    "transform",
    "trust",
    "comparison",
    "pricing",
    "boost",
    "summary",
    "decision",
    "customerClose",
    "dealerClose",
  ],
  full: [], // empty = all steps (includes rooms, every detail section)
};

export const MODE_LABELS: Record<DemoModeType, { label: string; time: string }> = {
  quick:    { label: "Quick",    time: "~5 min" },
  standard: { label: "Standard", time: "~20 min" },
  full:     { label: "Full",     time: "~30 min" },
};

export function useDemoModeProvider(): DemoModeCtx {
  const [demoMode, setDemoMode] = useState<DemoModeType>("standard");
  return { demoMode, setDemoMode };
}

export function useDemoMode(): DemoModeCtx {
  return useContext(DemoModeContext);
}
