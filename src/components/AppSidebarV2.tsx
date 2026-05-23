import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Building2,
  Calendar,
  ChartNoAxesCombined,
  CreditCard,
  DollarSign,
  FileText,
  FolderKanban,
  Home,
  LogOut,
  Mail,
  Map,
  Megaphone,

  PenTool,
  RefreshCw,
  Settings,
  ShieldCheck,
  Star,

  Target,
  Users as UsersIcon,
  Users2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";

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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";

// ─── Role-based navigation configuration ─────────────────────────

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
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: number;
}) {
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive}>
        <Link to={href} onClick={() => setOpenMobile(false)}>
          <Icon />
          <span>{label}</span>
          {badge !== undefined && badge > 0 && (
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
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-cyan-400/80">
            PIPELINE
          </SidebarGroupLabel>
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
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Sales */}
      {hasAccess(role, "sales") && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-emerald-400/80">
            SALES
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {salesNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActivePath(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Retention */}
      {hasAccess(role, "retention") && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-amber-400/80">
            RETENTION
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {retentionNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActivePath(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Intelligence + Marketing */}
      {hasAccess(role, "intelligence") && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-violet-400/80">
            INTELLIGENCE
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {intelligenceNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={isActivePath(item.href)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {/* Settings */}
      {hasAccess(role, "settings") && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground/60">
            SETTINGS
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsNav.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={location.pathname === item.href}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

      {isAdmin && (
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-rose-400/80">
            PLATFORM
          </SidebarGroupLabel>
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
