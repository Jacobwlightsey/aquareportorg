import type { Id } from "../../convex/_generated/dataModel";

// ─── Demo Config ──────────────────────────────────────────────────
export interface DemoConfig {
  accentColor?: string;
  logoUrl?: string;
  welcomeHeadline?: string;
  welcomeSubtext?: string;
  systemIncludes?: { title: string; description: string }[];
  warrantyTitle?: string;
  revealPrice?: string;
  discountOptions?: { id: string; label: string; amount: number; icon: string }[];
  trustSection?: {
    installCount: number;
    installArea: string;
    reviews: { name: string; rating: number; quote: string }[];
    certifications: { label: string; icon: string }[];
  };
  costItems?: { label: string; monthlyCost: number; enabled: boolean }[];
  costComparison?: Record<string, unknown>;
  systemCostMonthly?: string;
  roSystemName?: string;
  roSystemDescription?: string;
  roSystemImage?: string;
  boostedScore?: number;
  closeHeadline?: string;
  customerCloseSubtext?: string;
  closeOptions?: string[];
  concernOptions?: { key: string; label: string; description: string }[];
  decisionOptions?: { key: string; label: string; description: string }[];
  summaryBenefits?: string[];
  demoSetupComplete?: boolean;
}

// ─── Company (demo-facing subset) ─────────────────────────────────
export interface CompanyForDemo {
  _id: Id<"companies">;
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  city?: string;
  demoConfig?: DemoConfig;
}
