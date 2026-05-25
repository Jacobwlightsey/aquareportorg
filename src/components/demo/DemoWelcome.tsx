/* ──── Welcome Screen — First Impression ────
   Personal, warm, branded. Sets the stage.
   Street view hero, clean info, agenda preview.
   ──── */

import { Check, Droplets, Home, MapPin, TrendingUp } from "lucide-react";
import { playTapSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_STREET_VIEW_API_KEY || "";
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
  { text: "Your home's water profile", color: colors.primary },
  { text: "What's in your water", color: colors.warning },
  { text: "Live water test", color: colors.primary },
  { text: "How it affects your family", color: colors.critical },
  { text: "The solution for your home", color: colors.success },
  { text: "Your options", color: colors.success },
];

export function DemoWelcome({ report, companyColor, onNext }: Props) {
  const imgSrc =
    report.customerAddress && report.customerCity && report.customerState && report.customerZip
      ? streetViewUrl(report.customerAddress, report.customerCity, report.customerState, report.customerZip)
      : null;
  const firstName = report.customerName?.split(" ")[0] || "Homeowner";

  return (
    <div className="mx-auto w-full max-w-5xl px-8 pt-6">
      {/* Street View hero */}
      <div className="relative overflow-hidden rounded-2xl h-48 sm:h-56 mb-8">
        <img
          src={imgSrc || FALLBACK_HOUSE}
          alt="Customer's home"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_HOUSE; }}
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${colors.bg}, ${colors.bg}99, transparent)` }} />
        <div className="absolute bottom-0 inset-x-0 p-6">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="size-8 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})` }}
            >
              <Home className="size-4 text-white" />
            </div>
            <p className="text-[12px] font-medium" style={{ color: colors.textMuted }}>
              Personalized Water Analysis
            </p>
          </div>
          <h2 className="text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight">
            Welcome, {firstName}
          </h2>
          {report.customerAddress && (
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin className="size-3" style={{ color: colors.textFaint }} />
              <span className="text-[13px]" style={{ color: colors.textMuted }}>
                {report.customerAddress}, {report.customerCity}, {report.customerState} {report.customerZip}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="size-4" style={{ color: colors.primary }} />
            <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: colors.textMuted }}>Homeowner</span>
          </div>
          <p className="font-semibold text-[15px] truncate" style={{ color: colors.textPrimary }}>
            {report.customerName || "Homeowner"}
          </p>
          {report.customerPhone && (
            <p className="text-[12px] mt-1 truncate" style={{ color: colors.textFaint }}>{report.customerPhone}</p>
          )}
        </div>
        <div className="rounded-2xl p-4" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex items-center gap-2 mb-3">
            <Droplets className="size-4" style={{ color: colors.primary }} />
            <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: colors.textMuted }}>Water Utility</span>
          </div>
          <p className="font-semibold text-[15px] truncate" style={{ color: colors.textPrimary }}>
            {report.utilityName}
          </p>
          <p className="text-[12px] mt-1" style={{ color: colors.textFaint }}>
            {report.city}, {report.state}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>
            {report.populationServed?.toLocaleString() ?? "—"}
          </p>
          <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: colors.textFaint }}>
            People Served
          </p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[18px] font-bold capitalize" style={{ color: colors.textPrimary }}>
            {report.waterSource || "Municipal"}
          </p>
          <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: colors.textFaint }}>
            Water Source
          </p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>
            {report.totalContaminants}
          </p>
          <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: colors.textFaint }}>
            Detected
          </p>
        </div>
      </div>

      {/* Agenda */}
      <div className="rounded-2xl p-6 mb-8" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-[12px] font-medium tracking-wide uppercase mb-4" style={{ color: colors.textMuted }}>
          What we'll cover today
        </p>
        <div className="space-y-3">
          {AGENDA.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="flex size-6 items-center justify-center rounded-full shrink-0"
                style={{ background: `${item.color}18` }}
              >
                <Check className="size-3" style={{ color: item.color }} />
              </div>
              <span className="text-[15px]" style={{ color: colors.textSecondary }}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        onClick={() => { playTapSound(); onNext(); }}
        className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform flex items-center justify-center gap-2 cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})`,
          boxShadow: `0 4px 24px ${companyColor}20`,
        }}
      >
        Let's Get Started
      </button>
    </div>
  );
}
