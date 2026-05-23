import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

/**
 * Hook that returns free-trial state for the current user/company.
 *
 * Key behaviors:
 *  - Free users with 0 reports → treated like Starter (they can explore features)
 *  - Free users with 1+ reports → trial is used, everything locked with upgrade CTAs
 *  - Paid users → normal access based on their plan
 */
export function useFreeTrial() {
  const usage = useQuery(api.reports.getReportUsageStatus);
  const subscription = useQuery(api.stripe.getSubscription);

  if (!usage || !subscription) {
    return {
      loading: true,
      isFree: false,
      hasUsedTrial: false,
      canCreateReport: true,
      trialRemaining: null,
      totalReports: 0,
      plan: "free" as const,
      /** Effective plan for UI gating — free users pre-trial see "starter" */
      effectivePlan: "free" as string,
    };
  }

  const isFree = usage.isFree;
  const hasUsedTrial = usage.hasUsedFreeTrial;
  const canCreateReport = (usage.remaining ?? 1) > 0;
  // Trial experience: created their 1 free report but should still have full
  // Growth-level access to demo, verify, flipbook etc. for that report.
  const isInTrialExperience = usage.isInTrialExperience ?? false;

  // Effective plan: free users who are pre-trial OR in their trial experience
  // get Growth-level preview so they can fully use their 1 free report
  let effectivePlan = usage.plan;
  if (isFree && (!hasUsedTrial || isInTrialExperience)) {
    effectivePlan = "growth";
  }

  return {
    loading: false,
    isFree,
    hasUsedTrial,
    isInTrialExperience,
    canCreateReport,
    trialRemaining: usage.freeTrialRemaining,
    totalReports: usage.totalReportsEver,
    plan: usage.plan,
    effectivePlan,
  };
}
