import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Reusable stat/KPI card — shows a label, big number, and optional icon.
 * Works in responsive grid layouts (2-col mobile, 3-4 col desktop).
 */
export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color = "text-cyan-400",
  onClick,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={onClick ? "cursor-pointer hover:border-white/20 transition-colors" : ""}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className={`text-xl font-black sm:text-2xl ${color}`}>{value}</p>
            {subtitle && (
              <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {Icon && (
            <div className={`shrink-0 rounded-xl bg-white/[0.04] p-2 ${color}`}>
              <Icon className="size-4" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
