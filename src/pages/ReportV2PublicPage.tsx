import { useQuery } from "convex/react";
import { Loader2, Printer } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { api } from "../../convex/_generated/api";

/**
 * Public version of the V2 report — accessed via /r/:shareToken/v2
 * Read-only, no editing, no auth required.
 * Re-uses the same visual components but fetches via getPublicReport.
 */

// ---- Types (duplicated for isolation — could be shared via lib) ----

interface Contaminant {
  name?: string;
  contaminant: string;
  detected?: boolean;
  detection_status?: string;
  detected_level: number;
  legal_limit: number | null;
  health_guideline: number | null;
  over_health: boolean;
  over_legal: boolean;
  times_above_ewg: number | null;
  effect: string | null;
  unit: string;
}

function cName(c: Contaminant) { return c.contaminant || c.name || "Unknown"; }
function isDetected(c: Contaminant) { return c.detected !== false && c.detection_status !== "not_detected"; }

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("trihalomethane") || n.includes("tthm") || n.includes("bromate")) return "Disinfection Byproduct";
  if (n.includes("haloacetic")) return "Haloacetic Acid";
  if (n.includes("radium") || n.includes("uranium")) return "Radioactive Element";
  if (n.includes("lead") || n.includes("chromium") || n.includes("mercury") || n.includes("arsenic")) return "Heavy Metal";
  if (n.includes("butadiene") || n.includes("benzene")) return "Industrial Chemical";
  if (n.includes("barium") || n.includes("molybdenum") || n.includes("strontium") || n.includes("vanadium") || n.includes("manganese")) return "Heavy Metal / Mineral";
  if (n.includes("fluoride")) return "Water Additive";
  if (n.includes("nitrate") || n.includes("nitrite")) return "Fertilizer / Runoff";
  return "Chemical";
}

function letterGrade(score: number) {
  if (score >= 80) return { letter: "A", label: "Very Good", color: "#16a34a", bg: "#f0fdf4" };
  if (score >= 60) return { letter: "B", label: "Good", color: "#d97706", bg: "#fffbeb" };
  if (score >= 40) return { letter: "C", label: "Average", color: "#ea580c", bg: "#fff7ed" };
  if (score >= 20) return { letter: "D", label: "Poor", color: "#dc2626", bg: "#fef2f2" };
  return { letter: "F", label: "Very Poor", color: "#991b1b", bg: "#fef2f2" };
}

function legalGrade(v: number) {
  if (v === 0) return { letter: "A", label: "No violations", color: "#16a34a" };
  if (v === 1) return { letter: "B", label: `${v} legal violation`, color: "#d97706" };
  if (v <= 3) return { letter: "C", label: `${v} legal violations`, color: "#ea580c" };
  return { letter: "D", label: `${v} legal violations`, color: "#dc2626" };
}

function healthGrade(e: number) {
  if (e === 0) return { letter: "A", label: "All within guidelines", color: "#16a34a" };
  if (e <= 2) return { letter: "B", label: `${e} contaminants exceed`, color: "#d97706" };
  if (e <= 5) return { letter: "C", label: `${e} contaminants exceed`, color: "#ea580c" };
  return { letter: "D", label: `${e} contaminants exceed`, color: "#dc2626" };
}

// ---- Lightweight page components ----

function Page({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative bg-white w-[816px] min-h-[1056px] mx-auto shadow-lg print:shadow-none print:break-after-page flex flex-col ${className}`} style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {children}
    </div>
  );
}

function PH({ section, utility }: { section: string; utility: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-6">
      <span className="text-[11px] font-bold tracking-[0.15em] text-slate-800 uppercase">{section}</span>
      <span className="text-[11px] text-slate-500">{utility}</span>
    </div>
  );
}

function PF({ page, label = "Personalized Water Report" }: { page?: number; label?: string }) {
  return (
    <div className="mt-auto pt-6">
      <div className="border-t border-slate-300 pt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>{label}</span>{page != null && <span>Page {page}</span>}
      </div>
    </div>
  );
}

export function ReportV2PublicPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const report = useQuery(api.reports.getPublicReport, shareToken ? { shareToken } : "skip");

  const { overHealth, belowHealth, topContaminants, legalViolations, total } = useMemo(() => {
    if (!report?.contaminants) return { overHealth: [] as Contaminant[], belowHealth: [] as Contaminant[], topContaminants: [] as Contaminant[], legalViolations: 0, total: 0 };
    try {
      const raw: Contaminant[] = JSON.parse(report.contaminants);
      const junk = ["reverse osmosis", "surface water treatment rule", "consumer confidence rule", "lead and copper rule", "total coliform rule", "ground water rule", "filter backwash", "disinfection byproducts rule", "enhanced surface water", "aircraft drinking water"];
      const filtered = raw.filter((c) => !junk.some((b) => cName(c).toLowerCase().includes(b))).filter(isDetected);
      const over = filtered.filter((c) => c.over_health);
      const below = filtered.filter((c) => !c.over_health);
      const top = [...over].sort((a, b) => ((b.over_legal ? 1000 : 0) + (b.times_above_ewg ?? 0)) - ((a.over_legal ? 1000 : 0) + (a.times_above_ewg ?? 0)));
      return { overHealth: over, belowHealth: below, topContaminants: top, legalViolations: filtered.filter((c) => c.over_legal).length, total: filtered.length };
    } catch { return { overHealth: [] as Contaminant[], belowHealth: [] as Contaminant[], topContaminants: [] as Contaminant[], legalViolations: 0, total: 0 }; }
  }, [report?.contaminants]);

  if (report === undefined) return <div className="flex min-h-screen items-center justify-center bg-slate-100"><Loader2 className="size-10 animate-spin text-blue-500" /></div>;
  if (!report) return <div className="flex min-h-screen items-center justify-center bg-slate-100"><p className="text-slate-500">Report not found.</p></div>;

  const score = report.waterScore ?? 50;
  const dateStr = new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long" });
  const name = report.customerName || "Homeowner";
  const addr = report.customerAddress || "";
  const csz = `${report.customerCity || report.city}, ${report.customerState || report.state} ${report.customerZip || report.zip}`;
  const phone = report.customerPhone || "";
  const overall = letterGrade(score);
  const legal = legalGrade(legalViolations);
  const health = healthGrade(overHealth.length);
  const solutionName = report.solutionProductName || "Whole Home Advanced Filtration System";
  const solutionDesc = report.solutionProductDescription || "Hand-picked for this home's water profile and designed to protect every tap.";
  const solutionBullets = Array.isArray(report.solutionProductBullets) && report.solutionProductBullets.length ? report.solutionProductBullets : ["Reduces chemicals, heavy metals, and harmful contaminants", "Protects your health and home", "Improves taste, skin, and hair", "High capacity, low maintenance"];

  return (
    <div className="min-h-screen bg-slate-200 py-6 print:bg-white print:py-0">
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button size="sm" onClick={() => window.print()} className="bg-slate-900 text-white shadow-lg">
          <Printer className="size-4 mr-1" /> Print / PDF
        </Button>
      </div>

      <div className="space-y-6 print:space-y-0">
        {/* COVER */}
        <Page>
          <div className="flex-1 flex flex-col p-12 text-white" style={{ background: "linear-gradient(160deg, #0a1628 0%, #0f2444 40%, #162d50 70%, #0a1628 100%)" }}>
            <div className="h-24" />
            <div className="border border-slate-500/40 rounded px-4 py-2 inline-block self-start">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-slate-300 uppercase">Personalized Water Quality Analysis</span>
            </div>
            <h1 className="mt-8" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>
              <span className="block text-[56px] font-bold leading-[1.1] text-white">Your Home's</span>
              <span className="block text-[56px] font-bold leading-[1.1] text-[#6ba3d6]">Water Report</span>
            </h1>
            <p className="mt-5 text-[15px] leading-relaxed text-slate-300 max-w-md">A detailed analysis of contaminants detected in your local water supply by {report.utilityName}.</p>
            <div className="mt-12 bg-white/[0.06] border border-white/10 rounded-lg p-6 max-w-sm backdrop-blur-sm">
              <span className="text-[10px] font-bold tracking-[0.2em] text-slate-400 uppercase">Prepared For</span>
              <h2 className="mt-2 text-xl font-bold text-white" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>{name}</h2>
              <div className="mt-2 space-y-0.5 text-[13px] text-slate-300">
                {addr && <p>{addr}</p>}
                <p>{csz}</p>
                {phone && <p>{phone}</p>}
              </div>
            </div>
            <div className="flex-1" />
            <div className="border-t border-slate-600/40 pt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>{dateStr}</span><span>Powered by AquaReport</span>
            </div>
          </div>
        </Page>

        {/* OVERVIEW */}
        <Page className="p-10">
          <PH section="Water Quality Overview" utility={report.utilityName} />
          <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>Water Quality Score</h2>
          <p className="mt-2 text-sm text-slate-600">Your water is supplied by {report.utilityName}, serving approximately ~{report.populationServed.toLocaleString()} residents in the {report.city}, {report.state} area.</p>
          <div className="mt-5 grid grid-cols-3 gap-4">
            {[
              { title: "OVERALL SCORE", ...overall },
              { title: "LEGAL COMPLIANCE", letter: legal.letter, label: legal.label, color: legal.color, bg: "#fffbeb" },
              { title: "HEALTH GUIDELINES", letter: health.letter, label: health.label, color: health.color, bg: "#fef2f2" },
            ].map((c) => (
              <div key={c.title} className="rounded-lg border p-5 text-center" style={{ borderColor: `${c.color}30`, backgroundColor: c.bg }}>
                <span className="text-[10px] font-bold tracking-[0.15em] text-slate-600 uppercase">{c.title}</span>
                <div className="mt-2 text-6xl font-bold" style={{ color: c.color, fontFamily: "'Playfair Display', 'Georgia', serif" }}>{c.letter}</div>
                <p className="mt-1 text-[11px] text-slate-500">{c.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-4 gap-3">
            {[
              { value: total, label: "Total Contaminants\nDetected", color: "#0f172a" },
              { value: overHealth.length, label: "Exceeding Health\nGuidelines", color: "#dc2626" },
              { value: belowHealth.length, label: "Detected Below\nGuidelines", color: "#16a34a" },
              { value: legalViolations, label: "EPA Legal Limit\nViolations", color: "#d97706" },
            ].map((s) => (
              <div key={s.label} className="rounded-lg border border-slate-200 p-4 text-center">
                <div className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <p className="mt-1 text-[10px] text-slate-500 whitespace-pre-line leading-tight">{s.label}</p>
              </div>
            ))}
          </div>
          <PF page={1} />
        </Page>

        {/* CONTAMINANTS TABLE */}
        <Page className="p-10">
          <PH section="Contaminants Detected" utility={report.utilityName} />
          <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>Contaminants Exceeding Health Guidelines</h2>
          <p className="mt-2 text-[12px] text-slate-600">These {overHealth.length} contaminants were detected at levels above health-based guidelines.</p>
          <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
            <table className="w-full text-[11px]">
              <thead><tr className="bg-[#1a2332] text-white text-left">
                <th className="px-3 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Contaminant</th>
                <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Detected</th>
                <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Guideline</th>
                <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Legal</th>
                <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">× Over</th>
                <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Status</th>
                <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Category</th>
              </tr></thead>
              <tbody>
                {overHealth.map((c, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                    <td className="px-3 py-2.5 font-semibold text-slate-900">{cName(c)}</td>
                    <td className="px-2 py-2.5">{c.detected_level} {c.unit}</td>
                    <td className="px-2 py-2.5 text-slate-500">{c.health_guideline ?? "N/A"} {c.health_guideline != null ? c.unit : ""}</td>
                    <td className="px-2 py-2.5 text-slate-500">{c.legal_limit ?? "N/A"} {c.legal_limit != null ? c.unit : ""}</td>
                    <td className="px-2 py-2.5 font-bold">{c.times_above_ewg ? `${Math.round(c.times_above_ewg)}×` : "–"}</td>
                    <td className="px-2 py-2.5"><span className="inline-block rounded px-2 py-0.5 text-[9px] font-bold text-white bg-red-600 uppercase">Exceeds</span></td>
                    <td className="px-2 py-2.5 text-slate-500">{guessCategory(cName(c))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {belowHealth.length > 0 && (
            <>
              <h2 className="mt-8 text-2xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>Other Contaminants Detected</h2>
              <div className="mt-4 rounded-lg border border-slate-200 overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead><tr className="bg-[#1a2332] text-white text-left">
                    <th className="px-3 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Contaminant</th>
                    <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Detected</th>
                    <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Legal Limit</th>
                    <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Status</th>
                    <th className="px-2 py-2.5 font-semibold tracking-wide uppercase text-[10px]">Category</th>
                  </tr></thead>
                  <tbody>
                    {belowHealth.map((c, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                        <td className="px-3 py-2.5 font-semibold text-slate-900">{cName(c)}</td>
                        <td className="px-2 py-2.5">{c.detected_level} {c.unit}</td>
                        <td className="px-2 py-2.5 text-slate-500">{c.legal_limit ?? "N/A"} {c.legal_limit != null ? c.unit : ""}</td>
                        <td className="px-2 py-2.5"><span className="inline-block rounded px-2 py-0.5 text-[9px] font-bold text-white bg-emerald-600 uppercase">Meets</span></td>
                        <td className="px-2 py-2.5 text-slate-500">{guessCategory(cName(c))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <PF page={2} />
        </Page>

        {/* SOLUTIONS */}
        <Page className="p-10">
          <PH section="Recommended Solutions" utility={report.utilityName} />
          <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>Best Solutions For Your Water</h2>
          <div className="mt-5 rounded-lg border border-slate-200 overflow-hidden">
            <div className="flex">
              <div className="w-[160px] shrink-0 bg-slate-50 flex items-center justify-center p-4 border-r border-slate-200">
                {report.solutionProductImage ? <img src={report.solutionProductImage} alt={solutionName} className="max-h-[140px] object-contain" /> : <div className="size-16 rounded-full bg-blue-100 flex items-center justify-center"><Droplets className="size-8 text-blue-500" /></div>}
              </div>
              <div className="flex-1 p-5">
                <h3 className="text-[15px] font-bold text-slate-900">{solutionName}</h3>
                <p className="mt-1.5 text-[12px] text-slate-600">{solutionDesc}</p>
                <div className="mt-3 space-y-1.5">
                  {solutionBullets.map((b: string, i: number) => <p key={i} className="flex items-start gap-1.5 text-[11px] text-slate-700"><span className="text-emerald-600 mt-0.5">✓</span>{b}</p>)}
                </div>
              </div>
            </div>
          </div>
          {report.companyPhone && <p className="mt-4 text-center text-sm text-slate-500">Call us: <strong>{report.companyPhone}</strong></p>}
          <PF page={total > 0 ? 5 : 3} />
        </Page>

        {/* TEST RESULTS (read-only) */}
        <Page className="p-10">
          <div className="text-center mt-4">
            <h2 className="text-3xl font-bold text-slate-900" style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}>On-Site Water Quality Test Results</h2>
            <p className="mt-2 text-[13px] text-slate-500">Completed at the time of the in-home water quality consultation</p>
          </div>
          <div className="mt-2 border-t-2 border-blue-500" />
          <div className="mt-6 rounded-lg border border-slate-200 p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-6">Test Results</h3>
            <div className="space-y-6">
              {[
                { icon: "💧", label: "Water Hardness Level", value: report.hardness, unit: "GPG" },
                { icon: "🧪", label: "Chlorine Level", value: report.chlorine, unit: "ppm" },
                { icon: "⚗️", label: "TDS Level", value: report.tds, unit: "ppm" },
                { icon: "📊", label: "pH Level", value: report.ph, unit: "(ideal: 6.5 – 8.5)" },
              ].map((f) => (
                <div key={f.label} className="flex items-center gap-4">
                  <span className="text-2xl w-10 text-center">{f.icon}</span>
                  <span className="text-[13px] font-semibold text-slate-800 w-[160px]">{f.label}</span>
                  <div className="flex-1 border-b border-slate-300 py-1 min-h-[28px] text-sm font-semibold text-slate-900">
                    {f.value != null ? String(f.value) : ""}
                  </div>
                  <span className="text-[11px] text-slate-400 w-[140px] text-right">{f.unit}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-auto pt-6">
            <div className="border-t border-slate-300 pt-3 text-center text-[10px] text-slate-400">
              Personalized Water Report · {report.utilityName} Service Area · {dateStr}
            </div>
          </div>
        </Page>
      </div>
    </div>
  );
}
