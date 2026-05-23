import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";

export function PublicLayout() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {!isLanding && <Header />}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
