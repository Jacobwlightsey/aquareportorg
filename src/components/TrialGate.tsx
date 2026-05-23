import { Crown, Lock, Sparkles, FileText, BarChart3, FolderKanban, Users2, Calendar, DollarSign, RefreshCw, Mail, Star, Map, Megaphone, BookOpen, type LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useFreeTrial } from "@/hooks/useFreeTrial";

/**
 * Pages that free-trial users ARE allowed to access.
 * Everything else gets the upgrade wall.
 */
const FREE_TRIAL_ALLOWED = new Set([
  "dashboard",      // Landing page after login
  "customers",      // Can view their 1 report
  "customer-detail",// Can view report details
  "create-customer",// Create their 1 free report (has its own exhausted gate)
  "reports",        // View reports list
  "view-report",    // View report detail
  "report-v2",      // V2 report view
  "demo-wizard",    // Part of report experience
  "subscription",   // Must be able to upgrade
  "settings",       // Account settings
  "company",        // Company settings (needed for onboarding)
  "team",           // Team page
]);

const FEATURE_DESCRIPTIONS: Record<string, { icon: LucideIcon; title: string; description: string; plan: string }> = {
  pipeline: {
    icon: FolderKanban,
    title: "Sales Pipeline",
    description: "Track deals from lead to close with a visual pipeline. Manage deal stages, values, and close dates.",
    plan: "Starter",
  },
  leads: {
    icon: Users2,
    title: "Lead Management",
    description: "Capture, score, and convert leads into customers. Track lead sources and automate follow-ups.",
    plan: "Starter",
  },
  appointments: {
    icon: Calendar,
    title: "Appointments",
    description: "Schedule and manage customer appointments. Set reminders and track appointment history.",
    plan: "Starter",
  },
  analytics: {
    icon: BarChart3,
    title: "Analytics",
    description: "Deep insights into your sales performance, report trends, and team activity.",
    plan: "Growth",
  },
  "demo-analytics": {
    icon: BarChart3,
    title: "Demo Analytics",
    description: "Track your in-home demo performance, conversion rates, and presentation effectiveness.",
    plan: "Growth",
  },
  proposals: {
    icon: FileText,
    title: "Proposals",
    description: "Create and send professional proposals. Track views, approvals, and conversion rates.",
    plan: "Starter",
  },
  commissions: {
    icon: DollarSign,
    title: "Commissions",
    description: "Track sales commissions, payouts, and team earnings. Leaderboard and performance metrics.",
    plan: "Starter",
  },
  retention: {
    icon: RefreshCw,
    title: "Customer Retention",
    description: "Monitor customer health, schedule maintenance visits, and reduce churn.",
    plan: "Growth",
  },
  "follow-ups": {
    icon: Mail,
    title: "Follow-Ups",
    description: "Automated follow-up reminders and email sequences to keep customers engaged.",
    plan: "Growth",
  },
  reviews: {
    icon: Star,
    title: "Reviews",
    description: "Collect and manage customer reviews. Build social proof and improve your online reputation.",
    plan: "Starter",
  },
  "territory-map": {
    icon: Map,
    title: "Territory Map",
    description: "Visualize your service territory, see customer density, and plan routes.",
    plan: "Pro",
  },
  marketing: {
    icon: Megaphone,
    title: "Marketing",
    description: "Marketing campaigns, email templates, and outreach tools to grow your customer base.",
    plan: "Growth",
  },
  training: {
    icon: BookOpen,
    title: "Training",
    description: "Sales training resources, product knowledge base, and onboarding materials for your team.",
    plan: "Growth",
  },
};

/**
 * Wraps a page component. If the user is on free trial (no paid plan),
 * shows an upgrade wall instead of the page content — unless the page
 * is in the allowed list (report creation flow, settings, etc.)
 */
export function TrialGate({
  page,
  children,
}: {
  page: string;
  children: React.ReactNode;
}) {
  const { loading, isFree, hasUsedTrial } = useFreeTrial();

  // Still loading subscription data — show nothing (avoid flash)
  if (loading) return null;

  // Paid users — no gate
  if (!isFree) return <>{children}</>;

  // Free users on allowed pages — let them through
  if (FREE_TRIAL_ALLOWED.has(page)) return <>{children}</>;

  // Free user on a gated page → upgrade wall
  const feature = FEATURE_DESCRIPTIONS[page];
  const Icon = feature?.icon || Lock;
  const title = feature?.title || "Premium Feature";
  const description = feature?.description || "This feature requires a paid subscription.";
  const plan = feature?.plan || "Starter";

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
            Available on {plan} plan and above
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
          {!hasUsedTrial && (
            <Button size="lg" variant="outline" className="gap-2" asChild>
              <Link to="/customers/new">
                <FileText className="size-4" />
                Create Your Free Report
              </Link>
            </Button>
          )}
        </div>

        {/* What they get */}
        <div className="pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {hasUsedTrial
              ? "You've used your free trial report. Upgrade to unlock all features."
              : "You have 1 free report — create it first, then upgrade for full access."}
          </p>
        </div>
      </div>
    </div>
  );
}
