import { Droplets } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { APP_NAME } from "@/lib/constants";
import { Button } from "./ui/button";

export function Header() {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <header className={isLanding ? "sticky top-0 z-50 border-b border-white/10 bg-[#020617]/85 text-white backdrop-blur-xl" : "sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md"}>
      <div className="container">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2.5 font-semibold text-lg hover:opacity-80 transition-opacity"
          >
            <div className={isLanding ? "flex size-8 items-center justify-center rounded-lg bg-cyan-300 text-slate-950" : "size-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 flex items-center justify-center"}>
              <Droplets className={isLanding ? "size-4" : "size-4 text-white"} />
            </div>
            <span className="hidden sm:inline">{APP_NAME}</span>
          </Link>

          <nav className="flex items-center gap-4">
            <a href="#demo" className={isLanding ? "hidden text-sm text-slate-400 transition-colors hover:text-white md:block" : "text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"}>
              Demo
            </a>
            <a href="#pricing" className={isLanding ? "hidden text-sm text-slate-400 transition-colors hover:text-white md:block" : "text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"}>
              Pricing
            </a>
            <Link to="/blog" className={isLanding ? "hidden text-sm text-slate-400 transition-colors hover:text-white md:block" : "text-sm text-muted-foreground hover:text-foreground transition-colors hidden md:block"}>
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
