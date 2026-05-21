import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import type { ComponentType } from "react";
import {
  Building2,
  ChartNoAxesCombined,
  CreditCard,
  Droplets,
  Lock,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  Users as UsersIcon,
  Users2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";
import { APP_NAME } from "@/lib/constants";
import { hasLeadPipeline, upgradeMessage } from "@/lib/planGate";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

const mainNav = [
  { href: "/customers", label: "Customers", icon: UsersIcon },
  { href: "/leads", label: "Leads", icon: Users2, minPlan: "pro" as const },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesCombined },
];

const settingsNav = [
  { href: "/team", label: "Team", icon: ShieldCheck },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/company", label: "Company", icon: Building2 },
  { href: "/settings", label: "Account", icon: Settings },
];

function NavLink({
  href,
  label,
  icon: Icon,
  isActive,
  badge,
  locked,
  lockedMessage,
  lockedPlan,
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  badge?: number;
  locked?: boolean;
  lockedMessage?: string;
  lockedPlan?: string;
}) {
  const { setOpenMobile } = useSidebar();

  if (locked) {
    return (
      <SidebarMenuItem>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton className="opacity-40 cursor-not-allowed pointer-events-auto">
                <Icon />
                <span>{label}</span>
                <span className="ml-auto flex items-center gap-1">
                  <Lock className="size-3 text-muted-foreground" />
                  {lockedPlan && (
                    <span className="text-[10px] font-semibold text-muted-foreground">{lockedPlan}</span>
                  )}
                </span>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs max-w-[200px]">
              <p>{lockedMessage || "Upgrade your plan to unlock this feature"}</p>
              <Link to="/subscription" className="mt-1 inline-block text-blue-500 hover:text-blue-400 font-medium">
                View plans →
              </Link>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </SidebarMenuItem>
    );
  }

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
  const company = useQuery(api.companies.getMyCompany);
  const newLeadCount = useQuery(api.leads.getNewLeadCount);

  return (
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Workspace</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {mainNav.map((item) => {
              const planLocked = item.minPlan ? !hasLeadPipeline(company) : false;
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  isActive={
                    location.pathname === item.href ||
                    (item.href === "/customers" && location.pathname.startsWith("/customers"))
                  }
                  badge={item.href === "/leads" ? newLeadCount ?? 0 : undefined}
                  locked={planLocked}
                  lockedPlan={planLocked ? "Pro" : undefined}
                  lockedMessage={planLocked ? upgradeMessage("lead_pipeline") : undefined}
                />
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
      <SidebarGroup>
        <SidebarGroupLabel>Settings</SidebarGroupLabel>
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
    </SidebarContent>
  );
}

function SidebarUserMenu() {
  const user = useQuery(api.auth.currentUser);
  const { signOut } = useAuthActions();
  const { theme, toggleTheme, switchable } = useTheme();
  const { setOpenMobile } = useSidebar();

  return (
    <SidebarFooter className="border-t border-sidebar-border">
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-blue-600 text-white text-sm font-medium">
                    {user?.name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-left">
                  <span className="text-sm font-medium truncate">
                    {user?.name || "User"}
                  </span>
                  <span className="text-xs text-muted-foreground truncate">
                    {user?.email}
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
                  <CreditCard className="size-4" />
                  Subscription
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/company" onClick={() => setOpenMobile(false)}>
                  <Building2 className="size-4" />
                  Company Settings
                </Link>
              </DropdownMenuItem>
              {switchable && (
                <DropdownMenuItem onClick={toggleTheme}>
                  {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  {theme === "light" ? "Dark mode" : "Light mode"}
                </DropdownMenuItem>
              )}
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
          to="/customers"
          onClick={() => setOpenMobile(false)}
          className="flex items-center gap-2.5 px-2 py-1 font-semibold text-lg"
        >
          <div className="size-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center">
            <Droplets className="size-4 text-white" />
          </div>
          <span>{APP_NAME}</span>
        </Link>
      </SidebarHeader>
      <SidebarNav />
      <SidebarUserMenu />
    </Sidebar>
  );
}
