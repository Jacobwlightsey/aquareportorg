/* ──── Phase 2: Home Water Profile ────
   Customer-facing "Your Home Water Profile" screen using existing
   intake/customer data. Makes the presentation feel personal before
   showing the score.
   ──── */

import { Droplets, Home, MapPin, Thermometer, Users } from "lucide-react";
import { playTapSound } from "@/lib/demoSounds";
import type { ConcernData } from "./DemoConcernIntake";

const GOOGLE_MAPS_KEY = "AIzaSyAb2Yr5O4Kkx64sywtfMjfTfe9nCKNVVds";
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

  // Build profile items from available data
  const profileItems: { icon: typeof Home; label: string; value: string; color: string }[] = [];

  if (report?.utilityName) {
    profileItems.push({
      icon: Droplets,
      label: "Water Provider",
      value: report.utilityName,
      color: "#06b6d4",
    });
  }
  if (report?.waterSource) {
    profileItems.push({
      icon: Thermometer,
      label: "Water Source",
      value: report.waterSource.charAt(0).toUpperCase() + report.waterSource.slice(1),
      color: "#3b82f6",
    });
  }
  if (concerns?.householdSize) {
    const parts = [`${concerns.householdSize} people`];
    if (concerns.bathrooms) parts.push(`${concerns.bathrooms} bathrooms`);
    if (concerns.hasKids) parts.push("children in home");
    profileItems.push({
      icon: Users,
      label: "Household",
      value: parts.join(" · "),
      color: "#8b5cf6",
    });
  }
  if (concerns?.currentSolution && concerns.currentSolution !== "nothing") {
    profileItems.push({
      icon: Droplets,
      label: "Current Solution",
      value: SOLUTION_LABELS[concerns.currentSolution] || concerns.currentSolution,
      color: "#f59e0b",
    });
  }

  // Selected concerns
  const selectedConcerns = concerns?.concerns
    ?.map((k) => CONCERN_LABELS[k] || k)
    .filter(Boolean) ?? [];

  return (
    <div className="mx-auto max-w-lg space-y-5 pt-2">
      {/* Street View hero with overlay */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 h-44 sm:h-52">
        <img
          src={imgSrc || FALLBACK_HOUSE}
          alt="Customer's home"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
          onError={(e) => {
            (e.target as HTMLImageElement).src = FALLBACK_HOUSE;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e1a] via-[#0a0e1a]/70 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 p-5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1">
            YOUR HOME
          </span>
          <h2 className="text-2xl font-black mt-2 leading-tight">
            Your Home Water Profile
          </h2>
          {hasAddress && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin className="size-3 text-white/40" />
              <span className="text-xs text-white/50">
                {report.customerAddress}, {report.customerCity},{" "}
                {report.customerState} {report.customerZip}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subcopy */}
      <p className="text-sm text-white/50 text-center leading-relaxed px-2">
        This report is based on the water provider serving your home
        {concerns?.householdSize ? ", your household details," : ""}
        {" "}combined with today's live in-home test.
      </p>

      {/* Customer info card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
          Profile
        </p>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="size-10 rounded-xl flex items-center justify-center text-lg font-black"
            style={{ background: `${companyColor}20`, color: companyColor }}
          >
            {firstName.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-base">{report?.customerName || "Homeowner"}</p>
            {report?.customerEmail && (
              <p className="text-xs text-white/40">{report.customerEmail}</p>
            )}
          </div>
        </div>

        {/* Profile details */}
        <div className="space-y-3 pt-2 border-t border-white/5">
          {profileItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-3">
                <div
                  className="size-8 shrink-0 rounded-lg flex items-center justify-center"
                  style={{ background: `${item.color}15` }}
                >
                  <Icon className="size-4" style={{ color: item.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                    {item.label}
                  </p>
                  <p className="text-sm text-white/70 truncate">{item.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected concerns (if available from intake) */}
      {selectedConcerns.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-3">
            Your Priorities
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedConcerns.map((concern) => (
              <span
                key={concern}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                style={{
                  background: `${companyColor}10`,
                  borderColor: `${companyColor}30`,
                  color: companyColor,
                }}
              >
                {concern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-lg font-black">
            {report?.populationServed?.toLocaleString() ?? "—"}
          </p>
          <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">
            People Served
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-lg font-black capitalize">
            {report?.waterSource || "Municipal"}
          </p>
          <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">
            Water Source
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
          <p className="text-lg font-black">{report?.totalContaminants ?? "—"}</p>
          <p className="text-[9px] text-white/40 font-medium uppercase tracking-wider">
            Detected
          </p>
        </div>
      </div>

      {/* Company branding footer */}
      {companyName && (
        <p className="text-xs text-white/30 text-center">
          Prepared by {companyName}
        </p>
      )}

      {/* Continue */}
      <button
        onClick={() => {
          playTapSound();
          onNext();
        }}
        className="w-full rounded-2xl py-4 text-base font-bold active:scale-[0.97] transition-transform cursor-pointer"
        style={{
          background: `linear-gradient(135deg, ${companyColor}, #06b6d4)`,
          boxShadow: `0 4px 24px ${companyColor}30`,
        }}
      >
        Let's Look at Your Water →
      </button>
    </div>
  );
}
