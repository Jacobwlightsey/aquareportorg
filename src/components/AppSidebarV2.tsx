import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Activity, BookOpen, Building2, Calendar, ChartNoAxesCombined, CreditCard, DollarSign, FileText, Home, Lock, LogOut, Mail, Map, Megaphone, Moon, MousePointerClick, RefreshCw, Settings, ShieldCheck, Star, Sun, Users as UsersIcon, Users2, Wrench } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { PAGE_MIN_PLAN, PLAN_RANK, planLabel, type Plan } from "@/lib/planGate";

import { APP_NAME } from "@/lib/constants";
import { useTheme } from "@/contexts/ThemeContext";
import { api } from "../../convex/_generated/api";

import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

// ─── Role-based navigation configuration ─────────────────────────

/** Pages accessible on free trial (not gated) */

const pipelineNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/customers", label: "Reports", icon: UsersIcon },
  { href: "/leads", label: "Leads", icon: Users2, badgeKey: "leads" },
  { href: "/appointments", label: "Appointments", icon: Calendar },
];

const salesNav = [
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/demo-analytics", label: "Demo Stats", icon: Activity },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/commissions", label: "Commissions", icon: DollarSign },
  { href: "/installs", label: "Installs", icon: Wrench },
];

const retentionNav = [
  { href: "/retention", label: "Retention", icon: RefreshCw },
  { href: "/follow-ups", label: "Follow-Ups", icon: Mail },
  { href: "/reviews", label: "Reviews", icon: Star },
];

const intelligenceNav = [
  { href: "/territory-map", label: "Territory Map", icon: Map },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/attribution", label: "Attribution", icon: MousePointerClick },
  { href: "/audiences", label: "Audiences", icon: Users2 },
  { href: "/training", label: "Training", icon: BookOpen },
];

const settingsNav = [
  { href: "/team", label: "Team", icon: ShieldCheck },
  { href: "/company", label: "Company", icon: Building2 },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Feature access gating: owners see everything, sales reps see only granted sections
function hasAccess(role: string | undefined, section: string, featureAccess?: string[]): boolean {
  // Owners always see everything
  if (role === "owner") return true;
  // Settings is always visible
  if (section === "settings") return true;
  // No role yet (loading / free trial) — show all
  if (!role) return true;
  // Sales reps: check featureAccess array
  const access = featureAccess ?? ["pipeline"];
  if (access.includes("all")) return true;
  return access.includes(section);
}

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  badge,
  locked,
  requiredPlan,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: number;
  locked?: boolean;
  requiredPlan?: string;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link to={href} onClick={() => setOpenMobile(false)} className={locked ? "opacity-50" : ""}>
          <Icon />
          <span>{label}</span>
          {locked && (
            <span className="ml-auto flex items-center gap-1 shrink-0">
              {requiredPlan && (
                <span className="hidden sm:inline rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400 leading-none whitespace-nowrap">
                  {requiredPlan}
                </span>
              )}
              <Lock className="size-3 text-muted-foreground shrink-0" />
            </span>
          )}
          {!locked && badge !== undefined && badge > 0 && (
            <span className="ml-auto min-w-5 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
              {badge > 99 ? "99+" : badge}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function SidebarNav() {
  const location = useLocation();
  const newLeadCount = useQuery(api.leads.getNewLeadCount);
  const isAdmin = useQuery(api.admin.isPlatformAdmin);
  const company = useQuery(api.companies.getMyCompany);
  const role = company?.role;
  const featureAccess = (company as any)?.featureAccess as string[] | undefined;
  const { isFree, plan } = useFreeTrial();

  /** Pages free-trial users can access (matches TrialGate allowlist) */
  const FREE_PAGES = new Set(["/dashboard", "/customers", "/subscription", "/settings", "/company", "/team"]);

  /** True when the nav item should show a lock icon */
  const isLocked = (href: string): boolean => {
    if (isFree) {
      // Free users: locked = not in the free allowlist
      return !FREE_PAGES.has(href);
    }
    // Paid users: locked = page requires a higher plan
    const pageKey = href.replace(/^\//, "").split("/")[0] || "dashboard";
    const requiredPlan = PAGE_MIN_PLAN[pageKey] ?? "free";
    const requiredRank = PLAN_RANK[requiredPlan] ?? 0;
    const userPlanRank = PLAN_RANK[plan] ?? 0;
    return userPlanRank < requiredRank;
  };

  /** Get the required plan label for a locked page */
  const getRequiredPlan = (href: string): string | undefined => {
    const pageKey = href.replace(/^\//, "").split("/")[0] || "dashboard";
    const requiredPlan = PAGE_MIN_PLAN[pageKey] ?? "free";
    if (requiredPlan === "free") return undefined;
    return planLabel(requiredPlan as Plan);
  };

  const isActivePath = (href: string) => {
    if (href === "/customers") return location.pathname === href || location.pathname.startsWith("/customers/");
    if (href === "/pipeline") return location.pathname === href || location.pathname.startsWith("/pipeline/");
    if (href === "/dashboard") return location.pathname === href;
    return location.pathname === href || location.pathname.startsWith(href + "/");
  };

  // Build flat list of sections
  const sections: { label: string; color: string; items: typeof pipelineNav; section: string }[] = [];
  if (hasAccess(role, "pipeline", featureAccess)) sections.push({ label: "CRM", color: "#22d3ee", items: pipelineNav, section: "pipeline" });
  if (hasAccess(role, "sales", featureAccess)) sections.push({ label: "SALES", color: "#34d399", items: salesNav, section: "sales" });
  if (hasAccess(role, "retention", featureAccess)) sections.push({ label: "RETENTION", color: "#fbbf24", items: retentionNav, section: "retention" });
  if (hasAccess(role, "intelligence", featureAccess)) sections.push({ label: "INTELLIGENCE", color: "#a78bfa", items: intelligenceNav, section: "intelligence" });
  if (hasAccess(role, "settings", featureAccess)) sections.push({ label: "SETTINGS", color: "#71717a", items: settingsNav, section: "settings" });
  if (isAdmin) sections.push({ label: "PLATFORM", color: "#fb7185", items: [{ href: "/admin", label: "Admin Dashboard", icon: ShieldCheck }], section: "settings" });

  return (
    <SidebarContent>
      <div style={{ display: "flex", flexDirection: "column", padding: "0.5rem", gap: "0.125rem", overflowY: "auto", flex: 1 }}>
        <SidebarMenu>
          {sections.map((sec, si) => (
            <div key={sec.label}>
              {/* Section divider label */}
              <li
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: "1.75rem",
                  paddingLeft: "0.5rem",
                  marginTop: si === 0 ? 0 : "0.5rem",
                  fontSize: "0.625rem",
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  color: sec.color,
                  opacity: 0.85,
                  userSelect: "none",
                  listStyle: "none",
                }}
              >
                {sec.label}
              </li>
              {/* Nav items */}
              {sec.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={sec.section === "settings" ? location.pathname === item.href : isActivePath(item.href)}
                  badge={(item as any).badgeKey === "leads" ? newLeadCount ?? 0 : undefined}
                  locked={isLocked(item.href)}
                  requiredPlan={getRequiredPlan(item.href)}
                />
              ))}
            </div>
          ))}
        </SidebarMenu>
      </div>
    </SidebarContent>
  );
}

function getInitials(name?: string): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
}

function SidebarUserMenu() {
  const user = useQuery(api.auth.currentUser);
  const company = useQuery(api.companies.getMyCompany);
  const { signOut } = useAuthActions();

  const { setOpenMobile } = useSidebar();

  return (
    <SidebarFooter className="border-t border-sidebar-border">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-emerald-600 text-white text-xs font-bold">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {company?.name || APP_NAME}
                  </span>
                </div>
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-[--radix-dropdown-menu-trigger-width]"
            >
              <DropdownMenuItem asChild>
                <Link to="/settings" onClick={() => setOpenMobile(false)}>
                  <Settings className="size-4" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/subscription" onClick={() => setOpenMobile(false)}>
                  <Building2 className="size-4" />
                  Subscription
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/company" onClick={() => setOpenMobile(false)}>
                  <Building2 className="size-4" />
                  Company Settings
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

export function AppSidebarV2() {
  const { setOpenMobile } = useSidebar();
  const { theme, toggleTheme } = useTheme();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center justify-between px-2 py-1">
          <Link
            to="/dashboard"
            onClick={() => setOpenMobile(false)}
            className="flex items-center gap-2.5 font-semibold text-lg"
          >
            <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" />
          </Link>
          <button
            onClick={toggleTheme}
            className="flex items-center justify-center size-8 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </SidebarHeader>
      <SidebarNav />
      <SidebarUserMenu />
    </Sidebar>
  );
}
