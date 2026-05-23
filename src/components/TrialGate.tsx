import { Crown, Lock, Sparkles, FileText, BarChart3, FolderKanban, Users2, Calendar, DollarSign, RefreshCw, Mail, Star, Map, Megaphone, BookOpen, Activity, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { PAGE_MIN_PLAN, PLAN_RANK, planLabel, planPrice, type Plan } from "@/lib/planGate";

/**
 * Feature metadata for upgrade walls — icon, title, description per page.
 */
const FEATURE_DESCRIPTIONS: Record<string, { icon: LucideIcon; title: string; description: string }> = {
  pipeline: {
    icon: FolderKanban,
    title: "Sales Pipeline",
    description: "Track deals from lead to close with a visual pipeline. Manage deal stages, values, and close dates.",
  },
  leads: {
    icon: Users2,
    title: "Lead Management",
    description: "Capture, score, and convert leads into customers. Track lead sources and automate follow-ups.",
  },
  appointments: {
    icon: Calendar,
    title: "Appointments",
    description: "Schedule and manage customer appointments. Set reminders and track appointment history.",
  },
  analytics: {
    icon: BarChart3,
    title: "Analytics",
    description: "Deep insights into your sales performance, report trends, and team activity.",
  },
  "demo-analytics": {
    icon: Activity,
    title: "Demo Analytics",
    description: "Track your in-home demo performance, conversion rates, and presentation effectiveness.",
  },
  proposals: {
    icon: FileText,
    title: "Proposals",
    description: "Create and send professional proposals. Track views, approvals, and conversion rates.",
  },
  commissions: {
    icon: DollarSign,
    title: "Commissions",
    description: "Track sales commissions, payouts, and team earnings. Leaderboard and performance metrics.",
  },
  retention: {
    icon: RefreshCw,
    title: "Customer Retention",
    description: "Service agreements, maintenance reminders, referral rewards, and churn prevention tools.",
  },
  "follow-ups": {
    icon: Mail,
    title: "Follow-Ups",
    description: "Automated follow-up sequences via email and SMS to keep customers engaged after appointments.",
  },
  reviews: {
    icon: Star,
    title: "Reviews & Testimonials",
    description: "Collect and manage customer reviews. Build social proof and improve your online reputation.",
  },
  "territory-map": {
    icon: Map,
    title: "Territory Intelligence",
    description: "Visualize your service territory, water quality by ZIP code, customer density, and route planning.",
  },
  marketing: {
    icon: Megaphone,
    title: "Marketing Tools",
    description: "AI-powered social posts, door hanger generators, email campaigns, and competitor templates.",
  },
  training: {
    icon: BookOpen,
    title: "Team Training",
    description: "Sales training modules, product knowledge base, progress tracking, and team leaderboards.",
  },
  "demo-wizard": {
    icon: Activity,
    title: "In-Home Demo Wizard",
    description: "Interactive 12-step presentation tool for in-home water quality consultations.",
  },
};

/**
 * Plan-aware page gate.
 *
 * Behavior:
 *  - Free trial users (pre-trial or in trial experience): Growth-level access
 *    to allowed pages (dashboard, customers, reports, demo-wizard, settings, etc.)
 *  - Paid users: access based on their plan level
 *  - If the user's plan is below the page requirement: upgrade wall with CTA
 */
export function TrialGate({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  const { loading, isFree, hasUsedTrial, isInTrialExperience, effectivePlan } = useFreeTrial();

  // Still loading — avoid flash
  if (loading) return null;

  // Determine the required plan for this page
  const requiredPlan: Plan = PAGE_MIN_PLAN[page] ?? "free";

  // Check access: use effectivePlan (which already accounts for free trial)
  const userPlanRank = PLAN_RANK[effectivePlan] ?? 0;
  const requiredRank = PLAN_RANK[requiredPlan] ?? 0;

  // Free pages — always accessible
  if (requiredPlan === "free") return <>{children}</>;

  // User has sufficient plan access
  if (userPlanRank >= requiredRank) return <>{children}</>;

  // ─── Upgrade Wall ───
  const feature = FEATURE_DESCRIPTIONS[page];
  const Icon = feature?.icon || Lock;
  const title = feature?.title || "Premium Feature";
  const description = feature?.description || "This feature requires a higher subscription plan.";
  const planName = planLabel(requiredPlan);
  const price = planPrice(requiredPlan);

  return (
    <div className="flex items-center justify-center min-h-[70vh] px-6">
      <div className="text-center max-w-lg space-y-6">
        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
          <Icon className="size-10 text-cyan-400" />
        </div>

        {/* Title & Description */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          <p className="mt-2 text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>

        {/* Plan badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5">
          <Crown className="size-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-300">
            Requires {planName} plan ({price})
          </span>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700" asChild>
            <Link to="/subscription">
              <Sparkles className="size-4" />
              View Plans & Upgrade
            </Link>
          </Button>
          {isFree && !hasUsedTrial && !isInTrialExperience && (
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/customers/new">
                <FileText className="size-4" />
                Create Your Free Report
              </Link>
            </Button>
          )}
        </div>

        {/* Context message */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {isFree
              ? hasUsedTrial && !isInTrialExperience
                ? "You've used your free trial report. Upgrade to unlock all features."
                : "You have 1 free report — create it first, then upgrade for full access."
              : `Your current plan is ${planLabel(effectivePlan as Plan)}. Upgrade to ${planName} to unlock this feature.`}
          </p>
        </div>
      </div>
    </div>
  );
}
