import { useAction, useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Droplets,
  Edit3,
  Heart,
  Loader2,
  Save,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { computeAquaScore } from "@/lib/waterScore";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/* ================================================================
   TYPES & HELPERS
   ================================================================ */

/** Safely convert any value to a renderable string — prevents React #310 */
function safe(v: unknown, fallback = ""): string | number {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return typeof v === "boolean" ? String(v) : v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

interface Contaminant {
  name?: string;
  contaminant: string;
  detected?: boolean;
  detection_status?: "detected" | "not_detected" | "trace" | "unknown";
  detected_level: number;
  legal_limit: number | null;
  health_guideline: number | null;
  over_health: boolean;
  over_legal: boolean;
  times_above_ewg: number | null;
  effect: string | null;
  unit: string;
}

function cName(c: Contaminant): string {
  return c.contaminant || c.name || "Unknown";
}

function isDetected(c: Contaminant): boolean {
  return c.detected !== false && c.detection_status !== "not_detected";
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("trihalomethane") || n.includes("tthm") || n.includes("bromate"))
    return "Disinfection Byproduct";
  if (n.includes("haloacetic")) return "Haloacetic Acid";
  if (n.includes("radium") || n.includes("uranium") || n.includes("radon") || n.includes("gross alpha"))
    return "Radioactive Element";
  if (n.includes("lead") || n.includes("chromium") || n.includes("mercury") || n.includes("arsenic") || n.includes("cadmium"))
    return "Heavy Metal";
  if (n.includes("butadiene") || n.includes("benzene") || n.includes("vinyl"))
    return "Industrial Chemical";
  if (n.includes("barium") || n.includes("molybdenum") || n.includes("strontium") || n.includes("vanadium") || n.includes("manganese"))
    return "Heavy Metal / Mineral";
  if (n.includes("fluoride")) return "Water Additive";
  if (n.includes("nitrate") || n.includes("nitrite")) return "Fertilizer / Runoff";
  return "Chemical";
}

function healthDescription(c: Contaminant): string {
  const n = cName(c).toLowerCase();
  if (n.includes("trihalomethane") || n.includes("tthm"))
    return "THMs form when chlorine used to disinfect water reacts with organic matter. Long-term exposure is linked to increased risk of **bladder cancer, colon cancer, and reproductive problems**. Exposure occurs through drinking, skin absorption during showers, and inhalation of steam.";
  if (n.includes("haloacetic"))
    return "Haloacetic acids form alongside THMs during chlorine disinfection. Associated with **liver and kidney damage, nervous system effects, and increased cancer risk**. Fetuses and infants are especially vulnerable to these compounds.";
  if (n.includes("bromate"))
    return "Bromate forms as a byproduct of water disinfection with ozone. Long-term exposure is associated with **increased cancer risk** and **kidney damage**. It is classified as a probable human carcinogen.";
  if (n.includes("radium"))
    return "Radium is a naturally occurring radioactive element found in groundwater. Long-term exposure increases risk of **bone cancer and other cancers**. Even low levels carry cumulative risk over time.";
  if (n.includes("chromium"))
    return "Hexavalent chromium (chromium-6) is a known carcinogen. Exposure through drinking water is linked to **stomach cancer, liver damage, and reproductive harm**. It occurs naturally and from industrial contamination.";
  if (n.includes("butadiene"))
    return "1,3-Butadiene is an industrial chemical classified as a **known human carcinogen**. It is linked to **leukemia and lymphoma**. Exposure occurs through contaminated water and air near industrial sites.";
  if (n.includes("lead"))
    return "Lead is a toxic heavy metal with no safe level of exposure. It causes **brain damage in children, kidney disease, and cardiovascular problems**. Lead enters water primarily through aging pipes and plumbing fixtures.";
  if (c.effect) return c.effect;
  return "Elevated levels may pose health risks with long-term exposure. Consult a water treatment specialist for personalized recommendations.";
}

/** AquaScore tier from numeric score (0-100) — matches myaquareport.com */
function letterGrade(score: number): { letter: string; label: string; tier: string; color: string; bg: string } {
  if (score >= 80) return { letter: "A", label: "Gold", tier: "Gold", color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 60) return { letter: "B", label: "Silver", tier: "Silver", color: "#d97706", bg: "#fffbeb" };
  if (score >= 40) return { letter: "C", label: "Bronze", tier: "Bronze", color: "#ea580c", bg: "#fff7ed" };
  if (score >= 20) return { letter: "D", label: "At Risk", tier: "At Risk", color: "#dc2626", bg: "#fef2f2" };
  return { letter: "F", label: "At Risk", tier: "At Risk", color: "#991b1b", bg: "#fef2f2" };
}

function legalGrade(violations: number): { letter: string; label: string; color: string } {
  if (violations === 0) return { letter: "A", label: "No violations", color: "#16a34a" };
  if (violations === 1) return { letter: "B", label: `${violations} legal violation`, color: "#d97706" };
  if (violations <= 3) return { letter: "C", label: `${violations} legal violations`, color: "#ea580c" };
  return { letter: "D", label: `${violations} legal violations`, color: "#dc2626" };
}

function healthGrade(exceeding: number): { letter: string; label: string; color: string } {
  if (exceeding === 0) return { letter: "A", label: "All within guidelines", color: "#16a34a" };
  if (exceeding <= 2) return { letter: "B", label: `${exceeding} contaminants exceed`, color: "#d97706" };
  if (exceeding <= 5) return { letter: "C", label: `${exceeding} contaminants exceed`, color: "#ea580c" };
  return { letter: "D", label: `${exceeding} contaminants exceed`, color: "#dc2626" };
}

/** Bold markdown-like text: wraps **text** in <strong> */
function renderBold(text: string) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
  );
}

/* ================================================================
   PAGE HEADER — repeats on pages 2-7
   ================================================================ */

function PageHeader({ section, utility }: { section: string; utility: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-6">
      <span className="text-[11px] font-bold tracking-[0.15em] text-slate-800 uppercase">{section}</span>
      <span className="text-[11px] text-slate-500">{utility}</span>
    </div>
  );
}

/* ================================================================
   PAGE FOOTER
   ================================================================ */

function PageFooter({ page, label = "Personalized Water Report" }: { page?: number; label?: string }) {
  return (
    <div className="mt-auto pt-6">
      <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>{label}</span>
        {page != null && <span>Page {page}</span>}
      </div>
    </div>
  );
}

/* ================================================================
   PAGE WRAPPER — each page is a printable sheet
   ================================================================ */

function Page({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      data-report-page
      className={`relative bg-white w-[816px] min-h-[1056px] mx-auto shadow-lg print:shadow-none print:break-after-page flex flex-col ${className}`}
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {children}
    </div>
  );
}

/* ================================================================
   COVER PAGE (1)
   ================================================================ */

function CoverPage({
  customerName,
  customerAddress,
  customerCityStateZip,
  customerPhone,
  utilityName,
  dateStr,
}: {
  customerName: string;
  customerAddress: string;
  customerCityStateZip: string;
  customerPhone: string;
  utilityName: string;
  dateStr: string;
}) {
  return (
    <Page>
      <div
        className="flex-1 flex flex-col p-12 text-white"
        style={{
          background: "linear-gradient(160deg, #0a1628 0%, #0f2444 40%, #162d50 70%, #0a1628 100%)",
        }}
      >
        {/* Top spacing */}
        <div className="h-24" />

        {/* Label */}
        <div className="border border-slate-500/40 rounded px-4 py-2 inline-block self-start">
          <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-300 uppercase">
            Personalized Water Quality Analysis
          </span>
        </div>

        {/* Title */}
        <h1 className="mt-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
          <span className="block text-[56px] font-bold leading-[1.1] text-white">Your Home's</span>
          <span className="block text-[56px] font-bold leading-[1.1] text-[#6ba3d6]">Water Report</span>
        </h1>

        <p className="mt-5 text-[15px] leading-relaxed text-slate-300 max-w-md">
          A detailed analysis of contaminants detected in your local water supply by {utilityName}.
        </p>

        {/* Customer card */}
        <div className="mt-12 bg-white/[0.06] border border-white/10 rounded-lg p-6 max-w-sm backdrop-blur-sm">
          <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Prepared For</span>
          <h2 className="mt-2 text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
            {customerName}
          </h2>
          <div className="mt-2 space-y-0.5 text-[13px] text-slate-300">
            {customerAddress && <p>{customerAddress}</p>}
            <p>{customerCityStateZip}</p>
            {customerPhone && <p>{customerPhone}</p>}
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Footer */}
        <div className="border-t border-slate-600/40 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span>{dateStr}</span>
          <span>Powered by AquaReport</span>
        </div>
      </div>
    </Page>
  );
}

/* ================================================================
   WATER QUALITY OVERVIEW (Page 2)
   ================================================================ */

function OverviewPage({
  utilityName,
  score,
  legalViolations,
  healthExceedances,
  totalContaminants,
  belowGuidelines,
  populationServed,
  waterSource,
  city,
  state,
  zip,
}: {
  utilityName: string;
  score: number;
  legalViolations: number;
  healthExceedances: number;
  totalContaminants: number;
  belowGuidelines: number;
  populationServed: number;
  waterSource: string;
  city: string;
  state: string;
  zip: string;
}) {
  const overall = letterGrade(score);
  const legal = legalGrade(legalViolations);
  const health = healthGrade(healthExceedances);

  return (
    <Page className="p-10">
      <PageHeader section="Water Quality Overview" utility={utilityName} />

      <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        Water Quality Score
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Your water is supplied by {utilityName}, serving approximately ~{(populationServed ?? 0).toLocaleString()} residents in the {city}, {state} area.
      </p>

      {/* Score cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {/* AquaScore card — numeric */}
        <div
          className="rounded-lg border p-5 text-center"
          style={{ borderColor: `${overall.color}30`, backgroundColor: overall.bg }}
        >
          <span className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase">AQUASCORE</span>
          <div className="mt-2 text-[52px] font-bold" style={{ color: overall.color, fontFamily: "'Playfair Display', 'Georgia', serif" }}>
            {score}
          </div>
          <p className="mt-1 text-[12px] font-semibold" style={{ color: overall.color }}>{overall.tier}</p>
        </div>
        {/* Legal & Health cards — keep letter grades */}
        {[
          { title: "LEGAL COMPLIANCE", letter: legal.letter, label: legal.label, color: legal.color, bg: "#fffbeb" },
          { title: "HEALTH GUIDELINES", letter: health.letter, label: health.label, color: health.color, bg: "#fef2f2" },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border p-5 text-center"
            style={{ borderColor: `${card.color}30`, backgroundColor: card.bg }}
          >
            <span className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase">{card.title}</span>
            <div className="mt-2 text-6xl font-bold" style={{ color: card.color, fontFamily: "'Playfair Display', 'Georgia', serif" }}>
              {card.letter}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">{card.label}</p>
          </div>
        ))}
      </div>

      {/* What does this mean */}
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <p className="text-[12px] font-semibold text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" /> What does this mean?
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-700">
          While your water may not fully meet EPA legal minimums, it does <strong>not</strong> meet stricter health-based guidelines recommended by
          independent health organizations. Many federal standards have not been updated in decades, while scientific research has
          identified health risks at far lower concentrations.
        </p>
      </div>

      {/* Utility info */}
      <div className="mt-5 rounded-lg border border-slate-200 p-5">
        <h3 className="text-sm font-bold text-slate-900">Your Water Utility</h3>
        <div className="mt-3 grid grid-cols-[120px_1fr] gap-y-2 text-[12px]">
          <span className="text-slate-500">Provider</span><span className="font-semibold text-slate-800">{utilityName}</span>
          <span className="text-slate-500">Population Served</span><span className="font-semibold text-slate-800">~{(populationServed ?? 0).toLocaleString()}</span>
          <span className="text-slate-500">Water Source</span><span className="font-semibold text-slate-800">{waterSource}</span>
          <span className="text-slate-500">Location</span><span className="font-semibold text-slate-800">{city}, {state} {zip}</span>
        </div>
      </div>

      {/* Stat boxes */}
      <div className="mt-5 grid grid-cols-4 gap-3">
        {[
          { value: totalContaminants, label: "Total Contaminants\nDetected", color: "#0f172a" },
          { value: healthExceedances, label: "Exceeding Health\nGuidelines", color: "#dc2626" },
          { value: belowGuidelines, label: "Detected Below\nGuidelines", color: "#16a34a" },
          { value: legalViolations, label: "EPA Legal Limit\nViolations", color: "#d97706" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg border border-slate-200 p-4 text-center">
            <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <p className="mt-1 text-[10px] text-slate-500 whitespace-pre-line leading-tight">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Water source info */}
      <div className="mt-5 rounded-lg border border-slate-200 p-4">
        <p className="text-[12px] font-semibold text-slate-800 flex items-center gap-1.5">
          <Droplets className="size-3.5 text-blue-500" /> About Your Water Source
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-600">
          Your water is drawn from <strong>{waterSource.toLowerCase().includes("ground") ? "underground aquifers (groundwater)" : waterSource.toLowerCase()}</strong> serving the {city} area.
          {waterSource.toLowerCase().includes("ground")
            ? " Groundwater picks up minerals and naturally occurring contaminants as it filters through rock and soil layers. While generally cleaner than surface water, it can contain elevated levels of heavy metals, radium, and other dissolved substances."
            : " Surface water can be affected by agricultural runoff, industrial discharge, and natural contaminants. Treatment processes add disinfectants that may create byproducts."}
        </p>
      </div>

      <PageFooter page={1} />
    </Page>
  );
}

/* ================================================================
   CONTAMINANTS DETECTED TABLE (Page 3)
   ================================================================ */

function ContaminantsTablePage({
  utilityName,
  overHealth,
}: {
  utilityName: string;
  overHealth: Contaminant[];
  belowHealth?: Contaminant[];
}) {
  return (
    <Page className="p-10">
      <PageHeader section="Contaminants Detected" utility={utilityName} />

      <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        Contaminants Exceeding Health Guidelines
      </h2>
      <p className="mt-2 text-[12px] text-slate-600">
        These {overHealth.length} contaminants were detected at levels above health-based guidelines set by independent health organizations.
      </p>

      {/* Exceeding table */}
      <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-[#1a2332] text-white text-left">
              <th className="px-3 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Contaminant</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Detected</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Health Guideline</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Legal Limit</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">× Over</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Status</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Category</th>
            </tr>
          </thead>
          <tbody>
            {overHealth.map((c, i) => {
              const timesOver = c.times_above_ewg ? `${Math.round(c.times_above_ewg)}×` : "–";
              return (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                  <td className="px-3 py-2.5 font-semibold text-slate-900">{cName(c)}</td>
                  <td className="px-2 py-2.5 text-slate-700">{safe(c.detected_level)} {safe(c.unit)}</td>
                  <td className="px-2 py-2.5 text-slate-500">{safe(c.health_guideline, "N/A")} {c.health_guideline != null ? safe(c.unit) : ""}</td>
                  <td className="px-2 py-2.5 text-slate-500">{safe(c.legal_limit, "N/A")} {c.legal_limit != null ? safe(c.unit) : ""}</td>
                  <td className="px-2 py-2.5 font-bold text-slate-900">{timesOver}</td>
                  <td className="px-2 py-2.5">
                    <span className="inline-block rounded px-2 py-0.5 text-[9px] font-bold tracking-wide text-white bg-red-600 uppercase">Exceeds</span>
                  </td>
                  <td className="px-2 py-2.5 text-slate-500">{guessCategory(cName(c))}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PageFooter page={2} />
    </Page>
  );
}

/* ================================================================
   OTHER CONTAMINANTS (Page 3B)
   ================================================================ */

function OtherContaminantsPage({
  utilityName,
  belowHealth,
}: {
  utilityName: string;
  belowHealth: Contaminant[];
}) {
  return (
    <Page className="p-10">
      <PageHeader section="Other Contaminants" utility={utilityName} />

      <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        Other Contaminants Detected
      </h2>
      <p className="mt-2 text-[12px] text-slate-600">
        These {belowHealth.length} contaminants were detected but at levels within health-based guidelines.
      </p>

      <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="bg-[#1a2332] text-white text-left">
              <th className="px-3 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Contaminant</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Detected</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Legal Limit</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Status</th>
              <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Category</th>
            </tr>
          </thead>
          <tbody>
            {belowHealth.map((c, i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-3 py-2.5 font-semibold text-slate-900">{cName(c)}</td>
                <td className="px-2 py-2.5 text-slate-700">{safe(c.detected_level)} {safe(c.unit)}</td>
                <td className="px-2 py-2.5 text-slate-500">{safe(c.legal_limit, "N/A")} {c.legal_limit != null ? safe(c.unit) : ""}</td>
                <td className="px-2 py-2.5">
                  <span className="inline-block rounded px-2 py-0.5 text-[9px] font-bold tracking-wide text-white bg-emerald-600 uppercase">Meets</span>
                </td>
                <td className="px-2 py-2.5 text-slate-500">{guessCategory(cName(c))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PageFooter page={3} />
    </Page>
  );
}

/* ================================================================
   CONTAMINANT DETAILS (Page 4)
   ================================================================ */

function ContaminantDetailsPage({
  utilityName,
  topContaminants,
}: {
  utilityName: string;
  topContaminants: Contaminant[];
}) {
  // Show top 4 most significant contaminants
  const shown = topContaminants.slice(0, 4);

  return (
    <Page className="p-10">
      <PageHeader section="Contaminant Details & Health Risks" utility={utilityName} />

      <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        Understanding Your Contaminants
      </h2>
      <p className="mt-2 text-[12px] text-slate-600">
        Detailed breakdown of the most significant contaminants found in your water and their potential health effects.
      </p>

      <div className="mt-5 space-y-4">
        {shown.map((c, i) => {
          const timesOver = c.times_above_ewg ? `${Math.round(c.times_above_ewg)}×` : null;
          const cat = guessCategory(cName(c));
          return (
            <div key={i} className="rounded-lg border border-slate-200 p-5">
              <h3 className="text-[15px] font-bold text-slate-900">{cName(c)}</h3>
              <p className="mt-0.5 text-[10px] font-semibold tracking-wide text-slate-500 uppercase">
                {cat}{timesOver ? ` · ${timesOver} above guideline` : ""}
              </p>
              <p className="mt-3 text-[12px] leading-relaxed text-slate-700">
                {renderBold(healthDescription(c))}
              </p>
              <div className="mt-3 flex items-center gap-6 border-t border-slate-100 pt-3 text-[11px]">
                <span>Detected: <strong className="text-slate-900">{safe(c.detected_level)} {safe(c.unit)}</strong></span>
                <span>Guideline: <strong className="text-slate-900">{safe(c.health_guideline, "N/A")} {c.health_guideline != null ? safe(c.unit) : ""}</strong></span>
                <span>Legal: <strong className="text-slate-900">{safe(c.legal_limit, "N/A")} {c.legal_limit != null ? safe(c.unit) : ""}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Legal vs Safe callout */}
      <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
        <p className="text-[12px] font-semibold text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" /> "Legal" Does Not Mean "Safe"
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-700">
          Federal EPA standards were set years — sometimes decades — ago. Independent health organizations set stricter guidelines based
          on <strong>current scientific research</strong>. Your water passes legal tests but carries measurable health risks according to modern science.
          Contaminants like chromium-6, trihalomethanes, and nitrates are colorless, odorless, and tasteless — they cannot be detected
          without testing.
        </p>
      </div>

      <PageFooter page={4} />
    </Page>
  );
}

/* ================================================================
   HEALTH OVERVIEW (Page 5)
   ================================================================ */

/* ================================================================
   COMBINED HEALTH & SOLUTIONS PAGE (Page 5)
   ================================================================ */

interface SolutionProduct {
  name: string;
  description: string;
  image?: string;
  bullets: string[];
}

function HealthAndSolutionsPage({
  utilityName,
  healthExceedances,
  legalViolations,
  totalContaminants,
  products,
  companyName,
  companyPhone,
}: {
  utilityName: string;
  healthExceedances: number;
  legalViolations: number;
  totalContaminants: number;
  products: SolutionProduct[];
  companyName: string;
  companyPhone?: string;
}) {
  return (
    <Page className="p-10">
      <PageHeader section="Health Overview & Solutions" utility={utilityName} />

      <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        What This Means & What You Can Do
      </h2>
      <p className="mt-2 text-[12px] text-slate-600">
        Understanding the health impact of your water quality — and the best solutions to protect your family.
      </p>

      {/* Exceedance cards - compact row */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
          <div className="text-2xl font-bold text-amber-700">{healthExceedances}</div>
          <h3 className="mt-0.5 text-[12px] font-bold text-slate-900">Health Guideline Exceedances</h3>
          <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
            Contaminants above levels health organizations consider safe for long-term consumption.
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50/40 p-4">
          <div className="text-2xl font-bold text-red-700">{legalViolations}</div>
          <h3 className="mt-0.5 text-[12px] font-bold text-slate-900">Legal Limit Violations</h3>
          <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
            Contaminant(s) exceeding EPA legal limits — a serious concern requiring immediate attention.
          </p>
        </div>
      </div>

      {/* Who is at risk - compact */}
      <div className="mt-3 rounded-lg border border-slate-200 p-4">
        <p className="text-[12px] font-bold text-slate-900 flex items-center gap-1.5">
          <Droplets className="size-3.5 text-blue-500" /> Who Is Most at Risk?
        </p>
        <div className="mt-2 grid grid-cols-3 gap-3 text-[11px] text-slate-700">
          <p><strong>Children & infants:</strong> Developing bodies are more vulnerable to chemical exposure.</p>
          <p><strong>Pregnant women:</strong> DBPs and heavy metals are linked to reproductive complications.</p>
          <p><strong>Elderly:</strong> Weakened immune systems are less equipped to handle exposure.</p>
        </div>
      </div>

      {/* Filtration recommendation */}
      <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/30 p-3">
        <p className="text-[11px] text-slate-700 leading-relaxed">
          <strong className="text-amber-800">Whole-home filtration</strong> is the most effective solution — exposure occurs through <strong>drinking, showering, bathing, and cooking</strong>.
          A system customized for your {totalContaminants} detected contaminants provides the best protection at every tap.
        </p>
      </div>

      {/* Products */}
      {products.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Shield className="size-4 text-blue-600" /> Recommended Solutions
          </h3>
          <div className="mt-2 space-y-3">
            {products.map((product, i) => (
              <div key={i} className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="flex">
                  <div className="w-[120px] shrink-0 bg-slate-50 flex items-center justify-center p-3 border-r border-slate-200">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="max-h-[100px] max-w-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-300">
                        <Shield className="size-10" />
                        <span className="text-[9px] font-medium">Filtration</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 p-4">
                    <h4 className="text-[13px] font-bold text-slate-900">{product.name}</h4>
                    <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">{product.description}</p>
                    {product.bullets.length > 0 && (
                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                        {product.bullets.slice(0, 4).map((bullet, j) => (
                          <p key={j} className="flex items-start gap-1 text-[10px] text-slate-700">
                            <Check className="size-3 shrink-0 mt-0.5 text-emerald-600" />
                            <span>{bullet}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Why choose us - compact */}
      <div className="mt-4 rounded-lg bg-[#0f2444] p-5 text-white">
        <h3 className="text-base font-bold">Why Choose {companyName}?</h3>
        <div className="mt-2 grid grid-cols-3 gap-3 text-[11px]">
          <div className="flex items-start gap-1.5">
            <Shield className="size-4 shrink-0 text-blue-300 mt-0.5" />
            <div>
              <p className="font-semibold">Custom Solutions</p>
              <p className="mt-0.5 text-blue-200/80">Matched to your water profile</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Users className="size-4 shrink-0 text-blue-300 mt-0.5" />
            <div>
              <p className="font-semibold">Expert Installation</p>
              <p className="mt-0.5 text-blue-200/80">Certified technicians</p>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <Heart className="size-4 shrink-0 text-blue-300 mt-0.5" />
            <div>
              <p className="font-semibold">Family Protection</p>
              <p className="mt-0.5 text-blue-200/80">Clean water at every tap</p>
            </div>
          </div>
        </div>
        {companyPhone && (
          <p className="mt-3 text-center text-[12px] font-semibold text-blue-200">
            Call us today: {companyPhone}
          </p>
        )}
      </div>

      <PageFooter page={5} />
    </Page>
  );
}

/* ================================================================
   SCORE IMPROVEMENT PAGE (Page 6.5) — Before vs After Filtration
   ================================================================ */

/** Estimate which contaminant categories a whole-home filtration system addresses */
function filtrationReductionFactor(contaminantName: string): number {
  const n = contaminantName.toLowerCase();
  // Chlorine / disinfection byproducts — excellent removal (90-99%)
  if (n.includes("chlor") || n.includes("trihalomethane") || n.includes("tthm") || n.includes("haloacetic") || n.includes("haa"))
    return 0.05;
  // Heavy metals — very good removal (85-95%)
  if (n.includes("lead") || n.includes("mercury") || n.includes("arsenic") || n.includes("cadmium") || n.includes("chromium") || n.includes("copper") || n.includes("barium"))
    return 0.1;
  // VOCs / industrial — good removal (80-95%)
  if (n.includes("benzene") || n.includes("butadiene") || n.includes("ethylene") || n.includes("vinyl") || n.includes("tetrachloro") || n.includes("trichloro"))
    return 0.08;
  // Radionuclides — moderate removal (70-90%)
  if (n.includes("radium") || n.includes("uranium") || n.includes("radon") || n.includes("gross alpha") || n.includes("gross beta"))
    return 0.2;
  // Nitrates/nitrites — moderate removal with RO (60-85%)
  if (n.includes("nitrate") || n.includes("nitrite"))
    return 0.25;
  // Fluoride — moderate
  if (n.includes("fluoride"))
    return 0.3;
  // General — moderate reduction
  return 0.35;
}

function ScoreImprovementPage({
  utilityName,
  currentScore,
  contaminants,
  companyName,
}: {
  utilityName: string;
  currentScore: number;
  contaminants: Contaminant[];
  companyName: string;
}) {
  // Simulate post-filtration — always project to Gold tier (80+)
  const { projectedScore, improvements } = useMemo(() => {
    // Build improvement list for contaminants over guidelines
    const improved = contaminants
      .filter((c) => c.over_health || c.over_legal)
      .map((c) => {
        const factor = filtrationReductionFactor(cName(c));
        const reduction = Math.round((1 - factor) * 100);
        return {
          name: cName(c),
          currentLevel: c.detected_level,
          projectedLevel: +(c.detected_level * factor).toFixed(3),
          unit: c.unit,
          healthGuideline: c.health_guideline,
          legalLimit: c.legal_limit,
          reduction,
          wasOverHealth: c.over_health,
          wasOverLegal: c.over_legal,
          nowSafe: c.health_guideline ? c.detected_level * factor <= c.health_guideline : true,
        };
      })
      .sort((a, b) => b.reduction - a.reduction);

    // Always project to Gold — minimum 85, scale up from current score
    const projected = Math.max(85, Math.min(98, currentScore + Math.max(20, 85 - currentScore)));

    return { projectedScore: projected, improvements: improved };
  }, [contaminants, currentScore]);

  const currentGrade = letterGrade(currentScore);
  const projectedGrade = letterGrade(projectedScore);
  const scoreDelta = projectedScore - currentScore;
  const contaminantsResolved = improvements.filter((i) => i.nowSafe).length;

  return (
    <Page className="p-10">
      <PageHeader section="Score Improvement Projection" utility={utilityName} />

      <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        How Filtration Improves Your Score
      </h2>
      <p className="mt-2 text-[12px] text-slate-600">
        Installing a whole-home advanced filtration system can dramatically improve your water quality.
        Here's what your AquaScore could look like after professional filtration.
      </p>

      {/* Before → After Score Cards */}
      <div className="mt-6 flex items-center gap-4">
        {/* Current Score */}
        <div className="flex-1 rounded-xl border-2 border-slate-200 bg-white p-6 text-center">
          <span className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">Current Score</span>
          <div className="mt-2 text-[56px] font-bold" style={{ color: currentGrade.color, fontFamily: "'Playfair Display', 'Georgia', serif" }}>
            {currentScore}
          </div>
          <p className="mt-1 text-[13px] font-semibold" style={{ color: currentGrade.color }}>{currentGrade.tier}</p>
        </div>

        {/* Arrow */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center">
            <ArrowRight className="size-7 text-white" />
          </div>
          <span className="text-[11px] font-bold text-emerald-600">+{scoreDelta} pts</span>
        </div>

        {/* Projected Score */}
        <div className="flex-1 rounded-xl border-2 bg-white p-6 text-center" style={{ borderColor: `${projectedGrade.color}60` }}>
          <span className="text-[10px] font-bold tracking-[0.15em] text-slate-500 uppercase">After Filtration</span>
          <div className="mt-2 text-[56px] font-bold" style={{ color: projectedGrade.color, fontFamily: "'Playfair Display', 'Georgia', serif" }}>
            {projectedScore}
          </div>
          <p className="mt-1 text-[13px] font-semibold" style={{ color: projectedGrade.color }}>{projectedGrade.tier}</p>
        </div>
      </div>

      {/* Key stats */}
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-700">+{scoreDelta}</div>
          <p className="mt-0.5 text-[10px] text-emerald-600 font-medium">Point Improvement</p>
        </div>
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{contaminantsResolved}</div>
          <p className="mt-0.5 text-[10px] text-blue-600 font-medium">Contaminants Resolved</p>
        </div>
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-center">
          <div className="text-2xl font-bold text-amber-700">{improvements.length}</div>
          <p className="mt-0.5 text-[10px] text-amber-600 font-medium">Contaminants Improved</p>
        </div>
      </div>

      {/* Contaminant improvement table */}
      <div className="mt-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
          <TrendingUp className="size-4 text-emerald-600" /> Projected Contaminant Reductions
        </h3>
        <div className="mt-2 rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Contaminant</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">Current</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">After Filtration</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">Guideline</th>
                <th className="px-3 py-2 text-center font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {improvements.slice(0, 8).map((item, i) => (
                <tr key={i} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}>
                  <td className="px-3 py-2 font-medium text-slate-800">{item.name}</td>
                  <td className="px-3 py-2 text-right text-red-600 font-semibold">
                    {safe(item.currentLevel)} {safe(item.unit)}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-600 font-semibold">
                    {safe(item.projectedLevel)} {safe(item.unit)}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-500">
                    {safe(item.healthGuideline ?? item.legalLimit, "—")} {(item.healthGuideline ?? item.legalLimit) != null ? safe(item.unit) : ""}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {item.nowSafe ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        <Check className="size-3" /> Safe
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        <TrendingUp className="size-3" /> Reduced
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 rounded-xl bg-gradient-to-r from-[#0f2444] to-[#1a3a6c] p-6 text-white text-center">
        <Zap className="size-8 mx-auto text-amber-300" />
        <h3 className="mt-2 text-xl font-bold">Take Action Today</h3>
        <p className="mt-2 text-[12px] text-blue-200 max-w-md mx-auto">
          A whole-home filtration system from {companyName} could raise your AquaScore
          from <strong className="text-white">{currentScore}</strong> to <strong className="text-emerald-300">{projectedScore}</strong> —
          resolving {contaminantsResolved} contaminant{contaminantsResolved !== 1 ? "s" : ""} and protecting your family's health.
        </p>
        <p className="mt-3 text-[11px] text-blue-300/80 italic">
          Contact your water specialist for a free in-home consultation.
        </p>
      </div>

      <PageFooter page={6} />
    </Page>
  );
}

/* ================================================================
   ON-SITE TEST RESULTS (Page 7) — Editable
   ================================================================ */

interface TestResults {
  hardness: string;
  chlorine: string;
  tds: string;
  ph: string;
  notes: string;
  repName: string;
  repDate: string;
  repPhone: string;
}

function TestResultsPage({
  utilityName,
  dateStr,
  values,
  onChange,
  editing,
}: {
  utilityName: string;
  dateStr: string;
  values: TestResults;
  onChange: (field: keyof TestResults, value: string) => void;
  editing: boolean;
}) {
  const fieldClass = editing
    ? "border-b-2 border-blue-400 bg-blue-50/30 px-2 py-1 text-sm text-slate-900 font-semibold outline-none focus:border-blue-600 min-w-[180px]"
    : "border-b border-slate-300 px-2 py-1 text-sm text-slate-900 font-semibold min-w-[180px]";

  return (
    <Page className="p-10">
      <div className="text-center mt-4">
        <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
          On-Site Water Quality Test Results
        </h2>
        <p className="mt-2 text-[13px] text-slate-500">
          Completed at the time of the in-home water quality consultation
        </p>
      </div>

      <div className="mt-2 border-t-2 border-blue-500" />

      {/* Test Results */}
      <div className="mt-6 rounded-lg border border-slate-200 p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-6">Test Results</h3>

        <div className="space-y-6">
          {[
            { key: "hardness" as const, icon: "💧", label: "Water Hardness Level", unit: "GPG (grains per gallon)" },
            { key: "chlorine" as const, icon: "🧪", label: "Chlorine Level", unit: "ppm (parts per million)" },
            { key: "tds" as const, icon: "⚗️", label: "TDS Level", unit: "ppm (parts per million)" },
            { key: "ph" as const, icon: "📊", label: "pH Level", unit: "(ideal: 6.5 – 8.5)" },
          ].map((field) => (
            <div key={field.key} className="flex items-center gap-4">
              <span className="text-2xl w-10 text-center">{field.icon}</span>
              <span className="text-[13px] font-semibold text-slate-800 w-[160px]">{field.label}</span>
              <div className="flex-1">
                {editing ? (
                  <input
                    type="text"
                    value={values[field.key]}
                    onChange={(e) => onChange(field.key, e.target.value)}
                    className={fieldClass}
                    placeholder="Enter value..."
                  />
                ) : (
                  <div className="border-b border-slate-300 py-1 min-h-[28px] text-sm font-semibold text-slate-900">
                    {values[field.key] || "\u00A0"}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-slate-400 w-[140px] text-right">{field.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div className="mt-6">
        <h3 className="text-[13px] font-bold text-slate-900 mb-3">Additional Notes / Observations</h3>
        {editing ? (
          <textarea
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            className="w-full rounded-lg border-2 border-blue-400 bg-blue-50/30 p-3 text-sm text-slate-900 outline-none focus:border-blue-600 min-h-[100px] resize-none"
            placeholder="Enter notes..."
          />
        ) : (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="border-b border-slate-300 py-1 min-h-[24px] text-sm text-slate-900">
                {i === 0 ? values.notes : ""}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Performed by */}
      <div className="mt-8 border-t-2 border-blue-500 pt-6">
        <h3 className="text-[14px] font-bold text-slate-900 mb-6">Water Quality Test Performed By</h3>

        <div className="grid grid-cols-2 gap-x-12 gap-y-6">
          {[
            { key: "repName" as const, label: "Representative Name" },
            { key: "repDate" as const, label: "Date" },
          ].map((field) => (
            <div key={field.key}>
              {editing ? (
                <input
                  type={field.key === "repDate" ? "date" : "text"}
                  value={values[field.key]}
                  onChange={(e) => onChange(field.key, e.target.value)}
                  className={fieldClass + " w-full"}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                />
              ) : (
                <div className="border-b border-slate-300 py-1 min-h-[28px] text-sm font-semibold text-slate-900">
                  {values[field.key] || "\u00A0"}
                </div>
              )}
              <p className="mt-1.5 text-[11px] text-slate-500">{field.label}</p>
            </div>
          ))}

          <div>
            <div className="border-b border-slate-300 py-1 min-h-[28px] text-sm italic text-slate-400">
              {editing ? "Signature captured digitally" : "\u00A0"}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">Representative Signature</p>
          </div>

          <div>
            {editing ? (
              <input
                type="text"
                value={values.repPhone}
                onChange={(e) => onChange("repPhone", e.target.value)}
                className={fieldClass + " w-full"}
                placeholder="Enter phone..."
              />
            ) : (
              <div className="border-b border-slate-300 py-1 min-h-[28px] text-sm font-semibold text-slate-900">
                {values.repPhone || "\u00A0"}
              </div>
            )}
            <p className="mt-1.5 text-[11px] text-slate-500">Phone Number</p>
          </div>
        </div>
      </div>

      {/* Bottom footer */}
      <div className="mt-auto pt-6">
        <div className="border-t border-slate-300 pt-3 text-center text-[10px] text-slate-400">
          Personalized Water Report · {utilityName} Service Area · {dateStr}
        </div>
      </div>
    </Page>
  );
}

/* ================================================================
   MAIN REPORT V2 PAGE
   ================================================================ */

export function ReportV2Page() {
  const { reportId } = useParams<{ reportId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const report = useQuery(api.reports.getReport, reportId ? { reportId: reportId as Id<"reports"> } : "skip");
  const company = useQuery(api.companies.getMyCompany);
  const updateReadings = useMutation(api.reports.updateInHomeReadings);
  const finalizePdf = useAction(api.reportPdfClient.finalizePdf);
  const generateUploadUrl = useMutation(api.dealerShared.generateUploadUrl);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const pdfAutoTriggered = useRef(false);

  const [editing, setEditing] = useState(false);
  const [testResults, setTestResults] = useState<TestResults>({
    hardness: "",
    chlorine: "",
    tds: "",
    ph: "",
    notes: "",
    repName: "",
    repDate: "",
    repPhone: "",
  });
  const [saving, setSaving] = useState(false);

  // Initialize test results from report data
  useEffect(() => {
    if (report) {
      setTestResults({
        hardness: report.hardness != null ? String(report.hardness) : "",
        chlorine: report.chlorine != null ? String(report.chlorine) : "",
        tds: report.tds != null ? String(report.tds) : "",
        ph: report.ph != null ? String(report.ph) : "",
        notes: (report as any).testNotes || "",
        repName: (report as any).repName || "",
        repDate: (report as any).repDate || "",
        repPhone: (report as any).repPhone || "",
      });
    }
  }, [report]);

  // Parse contaminants
  const { allContaminants, overHealth, belowHealth, topContaminants, legalViolations } = useMemo(() => {
    if (!report?.contaminants) return { allContaminants: [], overHealth: [], belowHealth: [], topContaminants: [], legalViolations: 0 };
    try {
      const raw: Contaminant[] = JSON.parse(report.contaminants);
      const junk = [
        "reverse osmosis", "how your levels compare", "surface water treatment rule",
        "consumer confidence rule", "lead and copper rule", "total coliform rule",
        "ground water rule", "filter backwash", "disinfection byproducts rule",
        "enhanced surface water", "aircraft drinking water",
      ];
      const filtered = raw
        .filter((item) => !junk.some((blocked) => cName(item).toLowerCase().includes(blocked)))
        .filter(isDetected);

      const over = filtered.filter((c) => c.over_health);
      const below = filtered.filter((c) => !c.over_health);
      const legal = filtered.filter((c) => c.over_legal).length;

      // Sort top contaminants by severity
      const top = [...over].sort((a, b) => {
        const aScore = (a.over_legal ? 1000 : 0) + (a.times_above_ewg ?? 0);
        const bScore = (b.over_legal ? 1000 : 0) + (b.times_above_ewg ?? 0);
        return bScore - aScore;
      });

      return { allContaminants: filtered, overHealth: over, belowHealth: below, topContaminants: top, legalViolations: legal };
    } catch {
      return { allContaminants: [], overHealth: [], belowHealth: [], topContaminants: [], legalViolations: 0 };
    }
  }, [report?.contaminants]);

  // Build products list from company settings
  const products = useMemo<SolutionProduct[]>(() => {
    if (!company) return [];
    const main: SolutionProduct = {
      name: (company as any).solutionProductName || "Whole Home Advanced Filtration System",
      description: (company as any).solutionProductDescription || "Hand-picked for this home's water profile and designed to protect every tap.",
      image: (company as any).solutionProductImage || undefined,
      bullets: Array.isArray((company as any).solutionProductBullets)
        ? (company as any).solutionProductBullets
        : ["Reduces chemicals, heavy metals, and harmful contaminants", "Protects your health and home", "Improves taste, skin, and hair", "High capacity, low maintenance"],
    };

    // Support additional products if stored
    const additional: SolutionProduct[] = Array.isArray((company as any).additionalProducts)
      ? (company as any).additionalProducts
      : [];

    return [main, ...additional];
  }, [company]);

  const handleFieldChange = useCallback((field: keyof TestResults, value: string) => {
    setTestResults((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!reportId) return;
    setSaving(true);
    try {
      await updateReadings({
        reportId: reportId as Id<"reports">,
        hardness: testResults.hardness ? parseFloat(testResults.hardness) : undefined,
        chlorine: testResults.chlorine ? parseFloat(testResults.chlorine) : undefined,
        tds: testResults.tds ? parseFloat(testResults.tds) : undefined,
        ph: testResults.ph ? parseFloat(testResults.ph) : undefined,
        testNotes: testResults.notes || undefined,
        repName: testResults.repName || undefined,
        repDate: testResults.repDate || undefined,
        repPhone: testResults.repPhone || undefined,
      });
      toast.success("Test results saved!");
      setEditing(false);
    } catch (err) {
      toast.error("Failed to save test results");
      console.error(err);
    } finally {
      setSaving(false);
    }
  }, [reportId, testResults, updateReadings]);

  // Compute score using unified algorithm (matches myaquareport.com)
  // NOTE: this useMemo MUST come before any early returns to satisfy React's Rules of Hooks
  const score = useMemo(() => {
    if (!report) return 50;
    try {
      const parsed = JSON.parse(report.contaminants || "[]");
      return computeAquaScore(report.waterScore, parsed, {
        chlorine: report.chlorine,
        hardness: report.hardness,
        tds: report.tds,
        ph: report.ph,
      });
    } catch {
      return report.waterScore ?? 50;
    }
  }, [report?.contaminants, report?.waterScore, report?.chlorine, report?.hardness, report?.tds, report?.ph]);

  // Client-side PDF generation: captures rendered pages → PDF → upload → flipbook
  const handleGeneratePdf = useCallback(async () => {
    if (!reportId || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      const container = document.getElementById("report-pages-container");
      if (!container) throw new Error("Report container not found");

      toast.info("Capturing report pages…");
      const { generatePdfFromDom } = await import("@/lib/generatePdfClient");
      const pdfBlob = await generatePdfFromDom(container);

      // Also trigger a download for the user
      const downloadUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `water-report-${reportId}.pdf`;
      a.click();
      URL.revokeObjectURL(downloadUrl);

      // Upload to Convex storage
      toast.info("Uploading & creating flipbook…");
      const uploadUrl = await generateUploadUrl();
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: pdfBlob,
      });
      if (!uploadRes.ok) throw new Error("Failed to upload PDF");
      const { storageId } = await uploadRes.json();

      // Finalize: store URL + create Heyzine flipbook
      await finalizePdf({ reportId: reportId as any, pdfStorageId: storageId });
      toast.success("PDF downloaded & flipbook created!");

      // If auto-triggered from customer detail page, navigate back
      if (searchParams.get("action") === "pdf") {
        navigate(`/customers/${reportId}`, { replace: true });
      }
    } catch (err: any) {
      toast.error(err.message || "PDF generation failed");
      console.error("PDF generation error:", err);
    } finally {
      setGeneratingPdf(false);
    }
  }, [reportId, generatingPdf, generateUploadUrl, finalizePdf, searchParams, navigate]);

  // Auto-trigger PDF generation when navigated with ?action=pdf
  useEffect(() => {
    if (
      searchParams.get("action") === "pdf" &&
      report &&
      company &&
      !pdfAutoTriggered.current &&
      !generatingPdf
    ) {
      pdfAutoTriggered.current = true;
      // Delay to allow the pages to fully render
      const timer = setTimeout(() => handleGeneratePdf(), 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, report, company, generatingPdf, handleGeneratePdf]);

  if (report === undefined || company === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="size-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-100">
        <p className="text-slate-500">Report not found.</p>
        <Button variant="outline" asChild><Link to="/customers"><ArrowLeft className="size-4 mr-1" /> Back</Link></Button>
      </div>
    );
  }
  const dateStr = new Date(report._creationTime).toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const customerName = report.customerName || "Homeowner";
  const customerAddress = report.customerAddress || "";
  const customerCityStateZip = `${report.customerCity || report.city}, ${report.customerState || report.state} ${report.customerZip || report.zip}`;
  const customerPhone = report.customerPhone || "";
  const companyName = (company as any)?.name || "Your Water Solutions Company";
  const companyPhone = (company as any)?.phone || undefined;

  return (
    <div className="min-h-screen bg-slate-200 py-6 print:bg-white print:py-0">
      {/* Toolbar — hidden in print */}
      <div className="print:hidden fixed top-4 right-4 z-50 flex items-center gap-2">
        {editing ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(false)}
              className="bg-white shadow-lg"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 text-white shadow-lg hover:bg-blue-700"
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : <Save className="size-4 mr-1" />}
              Save Results
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="outline" asChild className="bg-white shadow-lg">
              <Link to={`/customers/${reportId}`}>
                <ArrowLeft className="size-4 mr-1" /> Back
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setEditing(true)}
              className="bg-white shadow-lg"
            >
              <Edit3 className="size-4 mr-1" /> Edit Test Results
            </Button>
            <Button
              size="sm"
              onClick={handleGeneratePdf}
              disabled={generatingPdf}
              className="bg-slate-900 text-white shadow-lg"
            >
              {generatingPdf ? <Loader2 className="size-4 mr-1 animate-spin" /> : <Download className="size-4 mr-1" />}
              {generatingPdf ? "Generating…" : "Download PDF"}
            </Button>
          </>
        )}
      </div>

      {/* Report pages */}
      <div id="report-pages-container" className="space-y-6 print:space-y-0">
        <CoverPage
          customerName={customerName}
          customerAddress={customerAddress}
          customerCityStateZip={customerCityStateZip}
          customerPhone={customerPhone}
          utilityName={report.utilityName}
          dateStr={dateStr}
        />

        <OverviewPage
          utilityName={report.utilityName}
          score={score}
          legalViolations={legalViolations}
          healthExceedances={report.overHealthGuidelines ?? overHealth.length}
          totalContaminants={report.totalContaminants ?? allContaminants.length}
          belowGuidelines={belowHealth.length}
          populationServed={report.populationServed}
          waterSource={report.waterSource}
          city={report.city}
          state={report.state}
          zip={report.zip}
        />

        <ContaminantsTablePage
          utilityName={report.utilityName}
          overHealth={overHealth}
          belowHealth={belowHealth}
        />

        <OtherContaminantsPage
          utilityName={report.utilityName}
          belowHealth={belowHealth}
        />

        <ContaminantDetailsPage
          utilityName={report.utilityName}
          topContaminants={topContaminants}
        />

        <HealthAndSolutionsPage
          utilityName={report.utilityName}
          healthExceedances={report.overHealthGuidelines ?? overHealth.length}
          legalViolations={legalViolations}
          totalContaminants={report.totalContaminants ?? allContaminants.length}
          products={products}
          companyName={companyName}
          companyPhone={companyPhone}
        />

        <ScoreImprovementPage
          utilityName={report.utilityName}
          currentScore={score}
          contaminants={allContaminants}
          companyName={companyName}
        />

        <TestResultsPage
          utilityName={report.utilityName}
          dateStr={dateStr}
          values={testResults}
          onChange={handleFieldChange}
          editing={editing}
        />
      </div>
    </div>
  );
}

