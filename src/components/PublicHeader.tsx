import { Link } from "react-router-dom";

interface PublicHeaderProps {
  navLinks?: { label: string; to: string }[];
}

const DEFAULT_NAV = [
  { label: "Water Quality", to: "/water-quality" },
  { label: "Blog", to: "/blog" },
  { label: "Learn", to: "/learn" },
];

export function PublicHeader({ navLinks = DEFAULT_NAV }: PublicHeaderProps) {
  return (
    <header className="border-b border-slate-800/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/aquareport-logo.png" alt="AquaReport" className="h-8 w-auto" width="112" height="32" />
        </Link>
        <nav className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="hidden text-sm text-slate-400 transition-colors hover:text-white md:block"
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/login"
            className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyan-400"
          >
            Sign In
          </Link>
        </nav>
      </div>
    </header>
  );
}
