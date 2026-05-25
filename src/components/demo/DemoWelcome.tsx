import { Check, Droplets, Home, MapPin, TrendingUp } from "lucide-react";
import { playTapSound } from "@/lib/demoSounds";

const GOOGLE_MAPS_KEY = "AIzaSyAb2Yr5O4Kkx64sywtfMjfTfe9nCKNVVds";
const FALLBACK_HOUSE =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop&q=80";

function streetViewUrl(address: string, city: string, state: string, zip: string) {
  if (!GOOGLE_MAPS_KEY) return FALLBACK_HOUSE;
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x600&location=${encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)}&fov=90&pitch=5&key=${GOOGLE_MAPS_KEY}`;
}

interface Props {
  report: any;
  companyColor: string;
  onNext: () => void;
}

const AGENDA = [
  { text: "Your home's water profile", color: "#06b6d4" },
  { text: "What's in your water", color: "#f59e0b" },
  { text: "Live water test", color: "#06b6d4" },
  { text: "How it affects your family", color: "#f43f5e" },
  { text: "The solution for your home", color: "#8b5cf6" },
  { text: "Your options", color: "#10b981" },
];

export function DemoWelcome({ report, companyColor, onNext }: Props) {
  const imgSrc =
    report.customerAddress && report.customerCity && report.customerState && report.customerZip
      ? streetViewUrl(report.customerAddress, report.customerCity, report.customerState, report.customerZip)
      : null;
  const firstName = report.customerName?.split(" ")[0] || "Homeowner";

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Street View hero */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 h-48 sm:h-56">
        <img
          src={imgSrc || FALLBACK_HOUSE}
          alt="Customer's home"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_HOUSE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/60 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-5">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="size-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}
            >
              <Home className="size-4 text-white" />
            </div>
            <p className="text-xs text-white/50 font-medium">Personalized Water Analysis</p>
          </div>
          <h2 className="text-2xl font-black leading-tight">Welcome, {firstName}</h2>
          {report.customerAddress && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="size-3 text-white/40" />
              <span className="text-xs text-white/50">
                {report.customerAddress}, {report.customerCity}, {report.customerState} {report.customerZip}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-blue-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Customer</span>
          </div>
          <p className="font-semibold text-sm truncate">{report.customerName || "Homeowner"}</p>
          {report.customerPhone && <p className="text-[11px] text-white/40 mt-0.5 truncate">{report.customerPhone}</p>}
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="size-4 text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">Water Utility</span>
          </div>
          <p className="font-semibold text-sm truncate">{report.utilityName}</p>
          <p className="text-[11px] text-white/40 mt-0.5">{report.city}, {report.state}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-lg font-black">{report.populationServed?.toLocaleString() ?? "—"}</p>
          <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">People Served</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-lg font-black capitalize">{report.waterSource || "Municipal"}</p>
          <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">Water Source</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-lg font-black">{report.totalContaminants}</p>
          <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">Detected</p>
        </div>
      </div>

      {/* Agenda */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">What we'll cover today</p>
        <div className="space-y-2.5">
          {AGENDA.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="flex size-5 items-center justify-center rounded-full shrink-0"
                style={{ background: `${item.color}25` }}
              >
                <Check className="size-3" style={{ color: item.color }} />
              </div>
              <span className="text-sm text-white/70">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => { playTapSound(); onNext(); }}
        className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-2 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${companyColor}, #06b6d4)`,
          boxShadow: `0 4px 24px ${companyColor}25`,
        }}
      >
        Let's Get Started →
      </button>
    </div>
  );
}
