import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

export function Header() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header className={isLanding ? "sticky top-0 z-50 border-b border-border bg-[#020617]/85 text-foreground backdrop-blur-xl" : "sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md"}>
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" />
          </Link>

          <nav className="flex items-center gap-4">
            <a href="#demo" className={isLanding ? "hidden text-sm text-slate-400 transition-colors hover:text-foreground md:block" : "text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"}>
              Demo
            </a>
            <a href="#pricing" className={isLanding ? "hidden text-sm text-slate-400 transition-colors hover:text-foreground md:block" : "text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"}>
              Pricing
            </a>
            <Link to="/blog" className={isLanding ? "hidden text-sm text-slate-400 transition-colors hover:text-foreground md:block" : "text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"}>
              Blog
            </Link>
            <Button size="sm" className={isLanding ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200" : "bg-blue-600 hover:bg-blue-700 text-white"} asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
