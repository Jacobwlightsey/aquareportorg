
import {
  FileText,
  Home,
  Plus,
  Settings,
  Users2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { href: "/dashboard", icon: Home, label: "Home" },
  { href: "/leads", icon: Users2, label: "Leads" },
  { href: "/customers/new", icon: Plus, label: "New", accent: true },
  { href: "/customers", icon: FileText, label: "Reports" },
  { href: "/settings", icon: Settings, label: "More" },
] as const;

export function MobileNav() {
  const location = useLocation();

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
                : tab.href === "/dashboard"
                  ? location.pathname === "/dashboard"
                  : location.pathname === tab.href ||
                    location.pathname.startsWith(tab.href + "/");

          if ("accent" in tab && tab.accent) {
            return (
              <Link
                key={tab.href}
                to={tab.href}
                className="flex size-12 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 active:scale-95 transition-transform -mt-4"
              >
                <tab.icon className="size-5 stroke-[2.5]" />
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                isActive
                  ? "text-cyan-500 dark:text-cyan-400"
                  : "text-muted-foreground"
              }`}
            >
              <tab.icon className="size-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
