import { useQuery } from "convex/react";
import {
  ChartNoAxesCombined,
  Lock,
  Plus,
  Settings,
  Users,
  Users2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { hasLeadPipeline } from "@/lib/planGate";
import { api } from "../../convex/_generated/api";

const tabs = [
  { href: "/customers", icon: Users, label: "Customers" },
  { href: "/leads", icon: Users2, label: "Leads" },
  { href: "/customers/new", icon: Plus, label: "New", accent: true },
  { href: "/analytics", icon: ChartNoAxesCombined, label: "Analytics" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const;

export function MobileNav() {
  const location = useLocation();
  const company = useQuery(api.companies.getMyCompany);
  const newLeadCount = useQuery(api.leads.getNewLeadCount);
  const leadsLocked = !hasLeadPipeline(company);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg md:hidden safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-1">
        {tabs.map((tab) => {
          const isActive =
            tab.href === "/customers/new"
              ? location.pathname === "/customers/new"
              : tab.href === "/customers"
                ? location.pathname === "/customers" ||
                  (location.pathname.startsWith("/customers/") &&
                    location.pathname !== "/customers/new")
                : location.pathname === tab.href;

          if (tab.accent) {
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className="flex size-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 active:scale-95 transition-transform -mt-4"
              >
                <tab.icon className="size-5 stroke-[2.5]" />
              </Link>
            );
          }

          // Plan-gate the Leads tab for plans below Pro
          if (tab.href === "/leads" && leadsLocked) {
            return (
              <div
                key={tab.href}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium text-muted-foreground/40 cursor-not-allowed"
              >
                <tab.icon className="size-5" />
                <span>{tab.label}</span>
                <Lock className="absolute -top-0.5 right-1 size-3 text-muted-foreground/50" />
              </div>
            );
          }

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className="size-5" />
              <span>{tab.label}</span>
              {tab.href === "/leads" &&
                newLeadCount != null &&
                newLeadCount > 0 && (
                  <span className="absolute -top-0.5 right-1 min-w-4 rounded-full bg-red-500 px-1 py-0 text-center text-[9px] font-bold text-white">
                    {newLeadCount > 99 ? "99+" : newLeadCount}
                  </span>
                )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
