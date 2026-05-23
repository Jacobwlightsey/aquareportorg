import type { LucideIcon } from "lucide-react";

/**
 * Consistent page header used across all app pages.
 * Provides title, subtitle, optional icon, and an action slot (right side).
 */
export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-cyan-400",
  actions,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className={`rounded-xl bg-white/[0.06] p-2.5 ${iconColor}`}>
            <Icon className="size-5" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-black sm:text-2xl">{title}</h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground sm:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
