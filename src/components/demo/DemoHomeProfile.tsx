/* ──── Home Water Profile — "This Is Your Home" ────
   Personal, data-driven. Surface cards, no glass.
   Fix #1: env var for Google Maps key
   Fix #9: no bordered pill labels
   ──── */

import { Droplets, Home, MapPin, Thermometer, Users } from "lucide-react";
import { playTapSound } from "@/lib/demoSounds";
import { colors } from "@/lib/designTokens";
import type { ConcernData } from "./DemoConcernIntake";

const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || "";
const FALLBACK_HOUSE =
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop&q=80";

function streetViewUrl(address: string, city: string, state: string, zip: string) {
  if (!GOOGLE_MAPS_KEY) return FALLBACK_HOUSE;
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x600&location=${encodeURIComponent(`${address}, ${city}, ${state} ${zip}`)}&fov=90&pitch=5&key=${GOOGLE_MAPS_KEY}`;
}

interface Props {
  report: any;
  company?: any;
  concerns?: ConcernData | null;
  companyColor?: string;
  onNext: () => void;
}

const CONCERN_LABELS: Record<string, string> = {
  taste_smell: "Taste & Smell",
  health_safety: "Family Health",
  staining: "Staining / Hard Water",
  skin_hair: "Skin & Hair",
  appliances: "Appliance Protection",
  drinking_water: "Drinking Water",
  family_health: "Family Health",
  skin_and_hair: "Skin & Hair",
  appliances_plumbing: "Appliances & Plumbing",
  taste_or_smell: "Taste or Smell",
  stains_buildup: "Stains & Buildup",
  bottled_water_costs: "Bottled Water Costs",
  other: "Other",
};

const SOLUTION_LABELS: Record<string, string> = {
  nothing: "No current filter",
  pitcher: "Pitcher filter",
  delivery: "Water delivery service",
  whole_home: "Existing whole-home system",
};

export function DemoHomeProfile({
  report,
  company,
  concerns,
  companyColor = "#2563eb",
  onNext,
}: Props) {
  const firstName = report?.customerName?.split(" ")[0] || "Homeowner";
  const companyName = report?.companyName || company?.name || "";

  const hasAddress =
    report?.customerAddress && report?.customerCity && report?.customerState;
  const imgSrc = hasAddress
    ? streetViewUrl(
        report.customerAddress,
        report.customerCity,
        report.customerState,
        report.customerZip || ""
      )
    : null;

  // Build profile items
  const profileItems: { icon: typeof Home; label: string; value: string; color: string }[] = [];

  if (report?.utilityName) {
    profileItems.push({ icon: Droplets, label: "Water Provider", value: report.utilityName, color: colors.primary });
  }
  if (report?.waterSource) {
    profileItems.push({ icon: Thermometer, label: "Water Source", value: report.waterSource.charAt(0).toUpperCase() + report.waterSource.slice(1), color: "#3b82f6" });
  }
  if (concerns?.householdSize) {
    const parts = [`${concerns.householdSize} people`];
    if (concerns.bathrooms) parts.push(`${concerns.bathrooms} bathrooms`);
    if (concerns.hasKids) parts.push("children in home");
    profileItems.push({ icon: Users, label: "Household", value: parts.join(" · "), color: "#8b5cf6" });
  }
  if (concerns?.currentSolution && concerns.currentSolution !== "nothing") {
    profileItems.push({ icon: Droplets, label: "Current Solution", value: SOLUTION_LABELS[concerns.currentSolution] || concerns.currentSolution, color: colors.warning });
  }

  const selectedConcerns = concerns?.concerns?.map((k) => CONCERN_LABELS[k] || k).filter(Boolean) ?? [];

  return (
    <div className="mx-auto w-full max-w-5xl px-8 space-y-6 pt-4">
      {/* Street View hero */}
      <div className="relative overflow-hidden rounded-2xl h-44 sm:h-52">
        <img
          src={imgSrc || FALLBACK_HOUSE}
          alt="Customer's home"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_HOUSE; }}
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${colors.bg}, ${colors.bg}99, transparent)` }} />
        <div className="absolute bottom-0 inset-x-0 p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: `${colors.primary}b0` }}>
            YOUR HOME
          </p>
          <h2 className="text-[24px] sm:text-[28px] font-bold mt-2 leading-tight tracking-tight">
            Your Home Water Profile
          </h2>
          {hasAddress && (
            <div className="flex items-center gap-1.5 mt-2">
              <MapPin className="size-3" style={{ color: colors.textFaint }} />
              <span className="text-[13px]" style={{ color: colors.textMuted }}>
                {report.customerAddress}, {report.customerCity},{" "}
                {report.customerState} {report.customerZip}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subcopy */}
      <p className="text-[14px] text-center leading-relaxed px-2" style={{ color: colors.textMuted }}>
        Based on your water provider, household info, and today's live test.
      </p>

      {/* Customer info card */}
      <div className="rounded-2xl p-5 space-y-1" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.textFaint }}>
          Profile
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center text-lg font-bold"
            style={{ background: `${companyColor}18`, color: companyColor }}
          >
            {firstName.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-[16px]" style={{ color: colors.textPrimary }}>{report?.customerName || "Homeowner"}</p>
            {report?.customerEmail && (
              <p className="text-[13px]" style={{ color: colors.textFaint }}>{report.customerEmail}</p>
            )}
          </div>
        </div>

        {/* Profile details */}
        <div className="space-y-3 pt-3" style={{ borderTop: `1px solid ${colors.border}` }}>
          {profileItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="size-8 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: `${item.color}12` }}
                >
                  <Icon className="size-4" style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: colors.textFaint }}>
                    {item.label}
                  </p>
                  <p className="text-[14px] truncate" style={{ color: colors.textSecondary }}>{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected concerns */}
      {selectedConcerns.length > 0 && (
        <div className="rounded-2xl p-5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: colors.textFaint }}>
            Your Priorities
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedConcerns.map((concern) => (
              <span
                key={concern}
                className="rounded-full px-3 py-1.5 text-[13px] font-medium"
                style={{ background: `${companyColor}12`, color: companyColor }}
              >
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>
            {report?.populationServed?.toLocaleString() ?? "—"}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.textFaint }}>
            People Served
          </p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[18px] font-bold capitalize" style={{ color: colors.textPrimary }}>
            {report?.waterSource || "Municipal"}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.textFaint }}>
            Water Source
          </p>
        </div>
        <div className="rounded-xl p-3 text-center" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
          <p className="text-[18px] font-bold" style={{ color: colors.textPrimary }}>{report?.totalContaminants ?? "—"}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: colors.textFaint }}>
            Detected
          </p>
        </div>
      </div>

      {/* Company branding */}
      {companyName && (
        <p className="text-[13px] text-center" style={{ color: colors.textFaint }}>
          Prepared by {companyName}
        </p>
      )}

      {/* Continue */}
      <button
        onClick={() => { playTapSound(); onNext(); }}
        className="w-full rounded-2xl py-4 text-[16px] font-bold active:scale-[0.97] transition-transform cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${companyColor}, ${colors.primary})`,
          boxShadow: `0 4px 24px ${companyColor}20`,
        }}
      >
        Let's Look at Your Water →
      </button>
    </div>
  );
}
