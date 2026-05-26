/* ──── Demo Preview — Renders a single demo step for the setup wizard iframe ──── */

import { useSearchParams } from "react-router-dom";
import { DemoWelcome } from "@/components/demo/DemoWelcome";
import { DemoSystemInfo } from "@/components/demo/DemoSystemInfo";
import { DemoPricing } from "@/components/demo/DemoPricing";
import { DemoTrustProof } from "@/components/demo/DemoTrustProof";
import { DemoCostComparison } from "@/components/demo/DemoCostComparison";
import { DemoScoreBoost } from "@/components/demo/DemoScoreBoost";
import { DemoCustomerClose } from "@/components/demo/DemoCustomerClose";
import type { CompanyForDemo } from "@/lib/types";
import { DemoBackground } from "@/components/demo/DemoBackground";

const SAMPLE_REPORT: Record<string, any> = {
  customerName: "Sarah Johnson",
  address: "123 Oak Street",
  city: "Phoenix",
  state: "AZ",
  zipCode: "85001",
  overallScore: 62,
  source: "Municipal",
};

const SAMPLE_COMPANY: CompanyForDemo = {
  name: "Pure Water Solutions",
  primaryColor: "#3b82f6",
  demoConfig: {},
};

export function DemoPreviewPage() {
  const [params] = useSearchParams();
  const step = params.get("step") || "welcome";
  const brand = params.get("brand") || "#3b82f6";

  const noop = () => {};

  // Build a company object that uses the brand color from query
  const company = {
    ...SAMPLE_COMPANY,
    primaryColor: brand,
    demoConfig: { accentColor: brand },
  };

  const report = { ...SAMPLE_REPORT };

  return (
    <div className="w-full h-screen overflow-hidden" style={{ backgroundColor: "#070B14" }}>
      <DemoBackground stepKey={step} />
      <div className="relative z-10 w-full h-full overflow-y-auto">
        <div className="p-4 pt-10">
          {step === "welcome" && <DemoWelcome report={report} companyColor={brand} onNext={noop} />}
          {step === "system" && <DemoSystemInfo company={company} report={report} onNext={noop} />}
          {step === "pricing" && <DemoPricing company={company} onNext={noop} onBack={noop} onPricingChange={noop} />}
          {step === "trust" && <DemoTrustProof company={company} report={report} onNext={noop} />}
          {step === "comparison" && <DemoCostComparison company={company} onNext={noop} onBack={noop} />}
          {step === "boost" && <DemoScoreBoost projectedScore={72} boostedScore={99} company={company} report={report} onBoostApplied={noop} onNext={noop} />}
          {step === "customerClose" && <DemoCustomerClose report={report} company={company} finalScore={99} companyColor={brand} onEndDemo={noop} />}
        </div>
      </div>
    </div>
  );
}
