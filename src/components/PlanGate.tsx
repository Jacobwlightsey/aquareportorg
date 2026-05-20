import { Lock, Sparkles } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Wraps a button or action. When `locked` is true the child is greyed out,
 * non-interactive, and shows a tooltip with an upgrade CTA.
 */
export function PlanGate({
  locked,
  message = "Upgrade your plan to unlock this feature",
  requiredPlan,
  children,
}: {
  locked: boolean;
  message?: string;
  requiredPlan?: string;
  children: ReactNode;
}) {
  if (!locked) return <>{children}</>;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative cursor-not-allowed">
            <div className="pointer-events-none opacity-35 select-none grayscale">
              {children}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-1 rounded-full bg-background/80 backdrop-blur-sm px-2 py-0.5 border border-border/50 shadow-sm">
                <Lock className="size-3 text-muted-foreground" />
                {requiredPlan && (
                  <span className="text-[10px] font-semibold text-muted-foreground">
                    {requiredPlan}
                  </span>
                )}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs text-xs">
          <div className="flex items-start gap-2">
            <Sparkles className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
            <div>
              <p>{message}</p>
              <Link
                to="/subscription"
                className="mt-1 inline-flex items-center gap-1 text-blue-500 hover:text-blue-400 font-medium"
              >
                View plans →
              </Link>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
