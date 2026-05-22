import { Lock, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function PlanGateScreen({
  currentPlan,
  requiredPlan,
  featureName,
  description,
}: {
  currentPlan: string;
  requiredPlan: string;
  featureName: string;
  description?: string;
}) {
  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md space-y-5 px-6">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Lock className="size-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{featureName}</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {description ||
              `This feature is available on the ${planLabel} plan and above. Upgrade to unlock ${featureName.toLowerCase()}.`}
          </p>
        </div>
        <Button size="lg" className="gap-2" asChild>
          <Link to="/subscription">
            <Sparkles className="size-4" />
            Upgrade to {planLabel}
          </Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          Your current plan:{" "}
          <span className="capitalize font-medium">{currentPlan || "Free"}</span>
        </p>
      </div>
    </div>
  );
}
