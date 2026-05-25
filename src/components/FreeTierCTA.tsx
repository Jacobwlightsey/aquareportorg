import { ArrowRight, Crown, Rocket, Sparkles, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Full-width upgrade banner shown to free-tier users after they've used their trial report.
 * Designed to be placed at the top of the dashboard, customers list, etc.
 */
export function FreeTierBanner({ totalReports: _totalReports = 1 }: { totalReports?: number }) {
  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 dark:border-amber-800">
      <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-100 dark:bg-amber-900/50 p-2.5 shrink-0">
            <Rocket className="size-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900 dark:text-amber-200">
              Your free report has been created!
            </h3>
            <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
              You've used your 1 free trial report. Upgrade to Starter to create more
              reports, generate flipbook PDFs, send consumer links, and unlock branded reports.
            </p>
          </div>
        </div>
        <Link to="/subscription" className="shrink-0">
          <Button className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white gap-2">
            <Crown className="size-4" />
            Upgrade Now
            <ArrowRight className="size-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

/**
 * Compact inline CTA for use inside cards, sections, or feature areas.
 * Shows when a specific feature requires an upgrade.
 */
export function UpgradeFeatureCTA({
  feature,
  requiredPlan = "Starter",
  description,
}: {
  feature: string;
  requiredPlan?: string;
  description?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-blue-300 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20 p-4 text-center">
      <Sparkles className="size-5 text-blue-500 mx-auto" />
      <p className="mt-2 text-sm font-medium text-blue-900 dark:text-blue-200">
        {feature}
      </p>
      <p className="mt-1 text-xs text-blue-600 dark:text-blue-400">
        {description || `Available on the ${requiredPlan} plan and above.`}
      </p>
      <Link to="/subscription">
        <Button size="sm" variant="outline" className="mt-3 gap-1.5 text-blue-600 border-blue-300 hover:bg-blue-100 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/30">
          <Zap className="size-3.5" />
          View Plans
        </Button>
      </Link>
    </div>
  );
}

/**
 * Blocking overlay for report creation when free trial is exhausted.
 * Replaces the create report form content.
 */
export function FreeTrialExhausted() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="rounded-full bg-amber-100 dark:bg-amber-900/40 p-4 mb-4">
        <Crown className="size-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold tracking-tight">
        Free Trial Report Used
      </h2>
      <p className="mt-2 text-muted-foreground max-w-md">
        You've created your 1 free trial report. Upgrade to a paid plan to create
        unlimited reports, access flipbook PDFs, consumer links, and all premium features.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link to="/subscription">
          <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Rocket className="size-4" />
            Choose a Plan
          </Button>
        </Link>
        <Link to="/customers">
          <Button size="lg" variant="outline" className="gap-2">
            View My Report
          </Button>
        </Link>
      </div>
      <div className="mt-8 grid gap-3 sm:grid-cols-3 max-w-lg w-full">
        {[
          { plan: "Starter", price: "$199/mo", reports: "20 reports/mo" },
          { plan: "Growth", price: "$349/mo", reports: "50 reports/mo" },
          { plan: "Pro", price: "$599/mo", reports: "150+ reports/mo" },
        ].map((p) => (
          <div key={p.plan} className="rounded-lg border p-3 text-center">
            <p className="font-semibold text-sm">{p.plan}</p>
            <p className="text-lg font-bold text-blue-600">{p.price}</p>
            <p className="text-xs text-muted-foreground">{p.reports}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
