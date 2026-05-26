import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { Activity, BookOpen, Building2, Calendar, ChartNoAxesCombined, CreditCard, DollarSign, FileText, FolderKanban, Home, Lock, LogOut, Mail, Map, Megaphone, RefreshCw, Settings, ShieldCheck, Star, Users as UsersIcon, Users2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { PAGE_MIN_PLAN, PLAN_RANK, planLabel, type Plan } from "@/lib/planGate";

import { APP_NAME } from "@/lib/constants";
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

/** Custom section label — bypasses broken SidebarGroupLabel */
function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div
      style={{
        height: "2rem",
        display: "flex",
        alignItems: "center",
        paddingLeft: "0.5rem",
        fontSize: "0.65rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        color,
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
}

// ─── Role-based navigation configuration ─────────────────────────

/** Pages accessible on free trial (not gated) */

const pipelineNav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/pipeline", label: "Pipeline", icon: FolderKanban },
  { href: "/customers", label: "Customers", icon: UsersIcon },
  { href: "/leads", label: "Leads", icon: Users2, badgeKey: "leads" },
  { href: "/appointments", label: "Appointments", icon: Calendar },
];

const salesNav = [
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  { href: "/demo-analytics", label: "Demo Stats", icon: Activity },
  { href: "/proposals", label: "Proposals", icon: FileText },
  { href: "/commissions", label: "Commissions", icon: DollarSign },
];

const retentionNav = [
  { href: "/retention", label: "Retention", icon: RefreshCw },
  { href: "/follow-ups", label: "Follow-Ups", icon: Mail },
  { href: "/reviews", label: "Reviews", icon: Star },
];

const intelligenceNav = [
  { href: "/territory-map", label: "Territory Map", icon: Map },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
  { href: "/training", label: "Training", icon: BookOpen },
];

const settingsNav = [
  { href: "/team", label: "Team", icon: ShieldCheck },
  { href: "/company", label: "Company", icon: Building2 },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Minimum roles for each section
const SECTION_ACCESS: Record<string, string[]> = {
  pipeline: ["owner", "admin", "manager", "sales_rep", "viewer"],
  sales: ["owner", "admin", "manager", "sales_rep"],
  retention: ["owner", "admin", "manager"],
  intelligence: ["owner", "admin", "manager"],
  settings: ["owner", "admin", "manager", "sales_rep", "viewer"],
};

function hasAccess(role: string | undefined, section: string): boolean {
  // Show all sections for free trial (no role) and unknown roles
  if (!role) return true;
  return SECTION_ACCESS[section]?.includes(role) ?? false;
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

  return (
    <SidebarContent>
      {/* Pipeline / Core */}
      {hasAccess(role, "pipeline") && (
        <SidebarGroup>
          <SectionLabel color="rgba(34,211,238,0.8)">PIPELINE</SectionLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pipelineNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActivePath(item.href)}
                  badge={(item as any).badgeKey === "leads" ? newLeadCount ?? 0 : undefined}
                  locked={isLocked(item.href)}
                  requiredPlan={getRequiredPlan(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Sales */}
      {hasAccess(role, "sales") && (
        <SidebarGroup>
          <SectionLabel color="rgba(52,211,153,0.8)">SALES</SectionLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActivePath(item.href)}
                  locked={isLocked(item.href)}
                  requiredPlan={getRequiredPlan(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Retention */}
      {hasAccess(role, "retention") && (
        <SidebarGroup>
          <SectionLabel color="rgba(251,191,36,0.8)">RETENTION</SectionLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {retentionNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActivePath(item.href)}
                  locked={isLocked(item.href)}
                  requiredPlan={getRequiredPlan(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Intelligence + Marketing */}
      {hasAccess(role, "intelligence") && (
        <SidebarGroup>
          <SectionLabel color="rgba(167,139,250,0.8)">INTELLIGENCE</SectionLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {intelligenceNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActivePath(item.href)}
                  locked={isLocked(item.href)}
                  requiredPlan={getRequiredPlan(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Settings */}
      {hasAccess(role, "settings") && (
        <SidebarGroup>
          <SectionLabel color="rgba(161,161,170,0.6)">SETTINGS</SectionLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={location.pathname === item.href}
                  locked={isLocked(item.href)}
                  requiredPlan={getRequiredPlan(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {isAdmin && (
        <SidebarGroup>
          <SectionLabel color="rgba(251,113,133,0.8)">PLATFORM</SectionLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <NavLink
                href="/admin"
                label="Admin Dashboard"
                icon={ShieldCheck}
                isActive={location.pathname === "/admin"}
              />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}
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

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <Link
          to="/dashboard"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2.5 px-2 py-1 font-semibold text-lg"
        >
          <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" />
        </Link>
      </SidebarHeader>
      <SidebarNav />
      <SidebarUserMenu />
    </Sidebar>
  );
}
