import { Outlet, useLocation } from "react-router-dom";
import { AppSidebarV2 } from "./AppSidebarV2";
import { MobileNav } from "./MobileNav";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "./ui/sidebar";

/** Regex to detect full-screen demo routes that skip the layout chrome */
const DEMO_PATH = /^\/customers\/[^/]+\/demo$/;

export function AppLayoutV2() {
  const location = useLocation();

  // Demo wizard renders full-screen — no sidebar, no mobile nav
  if (DEMO_PATH.test(location.pathname)) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <AppSidebarV2 />
      <SidebarInset>
        <header className="flex h-12 items-center px-4 md:hidden">
          <SidebarTrigger />
        </header>
        <main className="flex-1 p-4 pb-24 md:pb-6 lg:p-6">
          <Outlet />
        </main>
      </SidebarInset>
      <MobileNav />
    </SidebarProvider>
  );
}
