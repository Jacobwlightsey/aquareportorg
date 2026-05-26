import type { Id } from "../../convex/_generated/dataModel";

// ─── Financing Config ─────────────────────────────────────────────
export interface FinancingConfig {
  enabled?: boolean;
  terms?: number[];
  aprRange?: string;
  defaultApr?: number;
  provider?: string;
}

// ─── Demo Config ──────────────────────────────────────────────────
export interface DemoConfig {
  accentColor?: string;
  logoUrl?: string;
  welcomeHeadline?: string;
  welcomeSubtext?: string;
  systemIncludes?: { title: string; description: string }[];
  warrantyTitle?: string;
  revealPrice?: string;
  programPrice?: number;
  financing?: FinancingConfig;
  discountOptions?: { id: string; label: string; amount: number; icon: string }[];
  trustSection?: {
    installCount: number;
    installArea: string;
    citySkyline?: string;
    reviews: { name: string; rating: number; quote: string }[];
    certifications: { label: string; icon: string }[];
  };
  costItems?: { label: string; monthlyCost: number; enabled: boolean }[];
  costComparison?: { items?: { id: string; label: string; monthlyCost: number }[] };
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
  demoModes?: unknown;
  [key: string]: unknown; // allow additional fields without breaking
}

// ─── Company (demo-facing subset) ─────────────────────────────────
// Intentionally loose — accepts both the full Convex document and
// partial mock objects used in DemoPreviewPage.
export interface CompanyForDemo {
  _id?: Id<"companies"> | string;
  name?: string;
  logoUrl?: string;
  primaryColor?: string;
  city?: string;
  demoConfig?: DemoConfig;
  [key: string]: unknown; // accept extra Convex fields transparently
}
