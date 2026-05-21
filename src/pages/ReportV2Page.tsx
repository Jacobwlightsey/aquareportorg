import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Droplets,
  Edit3,
  Heart,
  Loader2,
  Printer,
  Save,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

/* ================================================================
   TYPES & HELPERS
   ================================================================ */

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

/** Letter grade from numeric score (0-100) */
function letterGrade(score: number): { letter: string; label: string; color: string; bg: string } {
  if (score >= 90) return { letter: "A", label: "Excellent", color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 80) return { letter: "A", label: "Very Good", color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 70) return { letter: "B", label: "Good", color: "#d97706", bg: "#fffbeb" };
  if (score >= 60) return { letter: "B", label: "Above Average", color: "#d97706", bg: "#fffbeb" };
  if (score >= 50) return { letter: "C", label: "Average", color: "#ea580c", bg: "#fff7ed" };
  if (score >= 40) return { letter: "C", label: "Below Average", color: "#ea580c", bg: "#fff7ed" };
  if (score >= 20) return { letter: "D", label: "Poor", color: "#dc2626", bg: "#fef2f2" };
  return { letter: "F", label: "Very Poor", color: "#991b1b", bg: "#fef2f2" };
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
        Your water is supplied by {utilityName}, serving approximately ~{populationServed.toLocaleString()} residents in the {city}, {state} area.
      </p>

      {/* Score cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {[
          { title: "OVERALL SCORE", ...overall },
          { title: "LEGAL COMPLIANCE", letter: legal.letter, label: legal.label, color: legal.color, bg: "#fffbeb" },
          { title: "HEALTH GUIDELINES", letter: health.letter, label: health.label, color: health.color, bg: "#fef2f2" },
        ].map((card) => (
          <div
            key={card.title}
            className="rounded-lg border p-5 text-center"
            style={{ borderColor: `${card.color}30`, backgroundColor: card.bg || "#f0fdf4" }}
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
          <span className="text-slate-500">Population Served</span><span className="font-semibold text-slate-800">~{populationServed.toLocaleString()}</span>
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
  belowHealth,
}: {
  utilityName: string;
  overHealth: Contaminant[];
  belowHealth: Contaminant[];
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
                  <td className="px-2 py-2.5 text-slate-700">{c.detected_level} {c.unit}</td>
                  <td className="px-2 py-2.5 text-slate-500">{c.health_guideline ?? "N/A"} {c.health_guideline != null ? c.unit : ""}</td>
                  <td className="px-2 py-2.5 text-slate-500">{c.legal_limit ?? "N/A"} {c.legal_limit != null ? c.unit : ""}</td>
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

      {/* Other contaminants */}
      <h2 className="mt-8 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
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
                <td className="px-2 py-2.5 text-slate-700">{c.detected_level} {c.unit}</td>
                <td className="px-2 py-2.5 text-slate-500">{c.legal_limit ?? "N/A"} {c.legal_limit != null ? c.unit : ""}</td>
                <td className="px-2 py-2.5">
                  <span className="inline-block rounded px-2 py-0.5 text-[9px] font-bold tracking-wide text-white bg-emerald-600 uppercase">Meets</span>
                </td>
                <td className="px-2 py-2.5 text-slate-500">{guessCategory(cName(c))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PageFooter page={2} />
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
                <span>Detected: <strong className="text-slate-900">{c.detected_level} {c.unit}</strong></span>
                <span>Guideline: <strong className="text-slate-900">{c.health_guideline ?? "N/A"} {c.health_guideline != null ? c.unit : ""}</strong></span>
                <span>Legal: <strong className="text-slate-900">{c.legal_limit ?? "N/A"} {c.legal_limit != null ? c.unit : ""}</strong></span>
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

      <PageFooter page={3} />
    </Page>
  );
}

/* ================================================================
   HEALTH OVERVIEW (Page 5)
   ================================================================ */

function HealthOverviewPage({
  utilityName,
  healthExceedances,
  legalViolations,
  totalContaminants,
}: {
  utilityName: string;
  healthExceedances: number;
  legalViolations: number;
  totalContaminants: number;
}) {
  return (
    <Page className="p-10">
      <PageHeader section="Health Overview" utility={utilityName} />

      <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        What This Means For Your Family
      </h2>
      <p className="mt-2 text-[12px] text-slate-600">
        A summary of the health implications of the contaminants found in your water supply and recommended actions.
      </p>

      {/* Exceedance cards */}
      <div className="mt-5 space-y-3">
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-5">
          <div className="text-3xl font-bold text-amber-700">{healthExceedances}</div>
          <h3 className="mt-1 text-sm font-bold text-slate-900">Health Guideline Exceedances</h3>
          <p className="mt-2 text-[12px] text-slate-600 leading-relaxed">
            Contaminants detected above levels that independent health organizations consider safe for long-term consumption. These include
            disinfection byproducts, heavy metals, and other regulated substances.
          </p>
        </div>

        <div className="rounded-lg border border-red-200 bg-red-50/40 p-5">
          <div className="text-3xl font-bold text-red-700">{legalViolations}</div>
          <h3 className="mt-1 text-sm font-bold text-slate-900">Legal Limit Violations</h3>
          <p className="mt-2 text-[12px] text-slate-600 leading-relaxed">
            Your water has {legalViolations} contaminant(s) exceeding EPA legal limits. This is a serious concern requiring immediate attention.
          </p>
        </div>
      </div>

      {/* Who is at risk */}
      <div className="mt-5 rounded-lg border border-slate-200 p-5">
        <p className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
          <Droplets className="size-4 text-blue-500" /> Who Is Most at Risk?
        </p>
        <div className="mt-3 space-y-3 text-[12px] text-slate-700 leading-relaxed">
          <p><strong>Children & infants:</strong> Developing brains and bodies are more vulnerable to lead, nitrates, and chemical exposure.</p>
          <p><strong>Pregnant women:</strong> Disinfection byproducts and heavy metals are linked to reproductive complications.</p>
          <p><strong>Elderly & immunocompromised:</strong> Weakened immune systems are less equipped to handle contaminant exposure.</p>
        </div>
      </div>

      {/* What can you do */}
      <div className="mt-4 rounded-lg border border-slate-200 p-5">
        <p className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
          <Check className="size-4 text-emerald-600" /> What Can You Do?
        </p>
        <div className="mt-3 space-y-2 text-[12px] text-slate-700 leading-relaxed">
          <p><strong>Whole-home filtration</strong> is the most effective solution — it protects every tap, shower, and appliance in your home.</p>
          <p>Point-of-use filters (pitcher, faucet) help for drinking but don't address shower/bath exposure where chemicals are absorbed through skin and inhaled as steam.</p>
          <p>A system customized for your specific contaminant profile provides the best protection.</p>
        </div>
      </div>

      {/* Why filtration matters */}
      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/30 p-4">
        <p className="text-[12px] font-semibold text-amber-800 flex items-center gap-1.5">
          <AlertTriangle className="size-3.5" /> Why Filtration Matters
        </p>
        <p className="mt-1.5 text-[11.5px] leading-relaxed text-slate-700">
          Studies show that exposure to water contaminants occurs not just through drinking, but through <strong>showering, bathing, cooking,
          and dishwashing</strong>. Chlorine and volatile organic compounds are absorbed through the skin and inhaled as steam during hot
          showers. A whole-home system addresses all exposure routes — not just your kitchen faucet.
        </p>
      </div>

      {/* Recommendation */}
      <div className="mt-4 rounded-lg border border-slate-200 p-5">
        <p className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="size-4 text-blue-500" /> Your Personalized Recommendation
        </p>
        <p className="mt-2 text-[12px] text-slate-700 leading-relaxed">
          Based on the {totalContaminants} contaminants detected in your water — including {healthExceedances} exceeding health guidelines — we recommend a <strong>whole-home
          advanced filtration system</strong> customized for your water profile. This system targets the specific contaminants found in {utilityName}'s water supply, providing clean, filtered water at every tap in your home.
        </p>
      </div>

      <PageFooter page={4} />
    </Page>
  );
}

/* ================================================================
   BEST SOLUTIONS PAGE (Page 6) — NEW, pulls from company products
   ================================================================ */

interface SolutionProduct {
  name: string;
  description: string;
  image?: string;
  bullets: string[];
}

function SolutionsPage({
  utilityName,
  products,
  companyName,
  companyPhone,
}: {
  utilityName: string;
  products: SolutionProduct[];
  companyName: string;
  companyPhone?: string;
}) {
  return (
    <Page className="p-10">
      <PageHeader section="Recommended Solutions" utility={utilityName} />

      <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
        Best Solutions For Your Water
      </h2>
      <p className="mt-2 text-[12px] text-slate-600">
        Based on your water quality profile, {companyName} recommends the following solutions customized for your home.
      </p>

      <div className="mt-5 space-y-4">
        {products.map((product, i) => (
          <div key={i} className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="flex">
              {/* Product image */}
              <div className="w-[160px] shrink-0 bg-slate-50 flex items-center justify-center p-4 border-r border-slate-200">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="max-h-[140px] max-w-full object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-300">
                    <Shield className="size-12" />
                    <span className="text-[10px] font-medium">Filtration System</span>
                  </div>
                )}
              </div>

              {/* Product info */}
              <div className="flex-1 p-5">
                <h3 className="text-[15px] font-bold text-slate-900">{product.name}</h3>
                <p className="mt-1.5 text-[12px] text-slate-600 leading-relaxed">{product.description}</p>

                {product.bullets.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                    {product.bullets.map((bullet, j) => (
                      <p key={j} className="flex items-start gap-1.5 text-[11px] text-slate-700">
                        <Check className="size-3.5 shrink-0 mt-0.5 text-emerald-600" />
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

      {/* Why choose us */}
      <div className="mt-6 rounded-lg bg-[#0f2444] p-6 text-white">
        <h3 className="text-lg font-bold">Why Choose {companyName}?</h3>
        <div className="mt-3 grid grid-cols-3 gap-4 text-[12px]">
          <div className="flex items-start gap-2">
            <Shield className="size-5 shrink-0 text-blue-300 mt-0.5" />
            <div>
              <p className="font-semibold">Custom Solutions</p>
              <p className="mt-0.5 text-blue-200/80">Systems matched to your specific water profile</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Users className="size-5 shrink-0 text-blue-300 mt-0.5" />
            <div>
              <p className="font-semibold">Expert Installation</p>
              <p className="mt-0.5 text-blue-200/80">Professional setup by certified technicians</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Heart className="size-5 shrink-0 text-blue-300 mt-0.5" />
            <div>
              <p className="font-semibold">Family Protection</p>
              <p className="mt-0.5 text-blue-200/80">Clean water at every tap in your home</p>
            </div>
          </div>
        </div>
        {companyPhone && (
          <p className="mt-4 text-center text-sm font-semibold text-blue-200">
            Call us today: {companyPhone}
          </p>
        )}
      </div>

      <PageFooter page={5} />
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
  const report = useQuery(api.reports.getReport, reportId ? { reportId: reportId as Id<"reports"> } : "skip");
  const company = useQuery(api.companies.getMyCompany);
  const updateReadings = useMutation(api.reports.updateInHomeReadings);

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
        <Button variant="outline" asChild><Link to="/reports"><ArrowLeft className="size-4 mr-1" /> Back</Link></Button>
      </div>
    );
  }

  const score = report.waterScore ?? 50;
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
              <Link to={`/reports/${reportId}`}>
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
              onClick={() => window.print()}
              className="bg-slate-900 text-white shadow-lg"
            >
              <Printer className="size-4 mr-1" /> Print / PDF
            </Button>
          </>
        )}
      </div>

      {/* Report pages */}
      <div className="space-y-6 print:space-y-0">
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

        <ContaminantDetailsPage
          utilityName={report.utilityName}
          topContaminants={topContaminants}
        />

        <HealthOverviewPage
          utilityName={report.utilityName}
          healthExceedances={report.overHealthGuidelines ?? overHealth.length}
          legalViolations={legalViolations}
          totalContaminants={report.totalContaminants ?? allContaminants.length}
        />

        {products.length > 0 && (
          <SolutionsPage
            utilityName={report.utilityName}
            products={products}
            companyName={companyName}
            companyPhone={companyPhone}
          />
        )}

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

