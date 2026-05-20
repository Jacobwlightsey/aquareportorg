import { useQuery } from "convex/react";
import { AlertTriangle, Check, Droplets, Factory, Home, Info, MapPin, Phone, Printer, Shield, Sprout, Wrench } from "lucide-react";
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";

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

function contaminantName(item: Contaminant): string {
  return item.contaminant || item.name || "Unknown contaminant";
}

function isDetectedContaminant(item: Contaminant): boolean {
  return item.detected !== false && item.detection_status !== "not_detected";
}

function scoreLabel(score: number) {
  if (score >= 80) return "Gold";
  if (score >= 60) return "Silver";
  if (score >= 40) return "Bronze";
  return "At Risk";
}

function riskColor(score: number) {
  if (score >= 80) return "#ffb000";
  if (score >= 60) return "#a8c7e8";
  if (score >= 40) return "#ff8a00";
  return "#ff4b5c";
}

function category(name: string) {
  const n = name.toLowerCase();
  if (n.includes("trihalomethane") || n.includes("haloacetic") || n.includes("chlor")) return "Chemical Risk";
  if (n.includes("lead") || n.includes("mercury") || n.includes("arsenic") || n.includes("chromium")) return "Health Risk";
  if (n.includes("hardness") || n.includes("iron") || n.includes("manganese")) return "Aesthetic Risk";
  return "Other Factors";
}

export function PrintReportPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const report = useQuery(api.reports.getPublicReport, shareToken ? { shareToken } : "skip");

  const contaminants: Contaminant[] = useMemo(() => {
    if (!report?.contaminants) return [];
    try {
      const raw: Contaminant[] = JSON.parse(report.contaminants);
      const junk = [
        "reverse osmosis",
        "how your levels compare",
        "surface water treatment rule",
        "consumer confidence rule",
        "lead and copper rule",
        "total coliform rule",
        "ground water rule",
        "filter backwash",
        "disinfection byproducts rule",
        "enhanced surface water",
        "aircraft drinking water",
        "lead (90th percentile)",
      ];
      return raw
        .filter((item) => !junk.some((blocked) => contaminantName(item).toLowerCase().includes(blocked)))
        .filter(isDetectedContaminant);
    } catch {
      return [];
    }
  }, [report?.contaminants]);

  const sorted = useMemo(
    () =>
      [...contaminants]
        .sort((a, b) => {
          const severity = (item: Contaminant) => (item.over_legal ? 0 : item.over_health ? 1 : 2);
          return severity(a) - severity(b);
        })
        .slice(0, 9),
    [contaminants],
  );

  if (report === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Droplets className="size-10 animate-pulse text-blue-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <p className="text-gray-500">Report not found.</p>
      </div>
    );
  }

  const score = report.waterScore ?? 50;
  const companyColor = report.companyColor || "#0b5d91";
  const accent = "#28a9df";
  const dateStr = new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const overHealth = contaminants.filter((item) => item.over_health);
  const solutionName = report.solutionProductName || "Whole Home Advanced Filtration System";
  const solutionDescription = report.solutionProductDescription || "Hand-picked for this water profile and designed to protect every tap in the home.";
  const solutionBullets =
    Array.isArray(report.solutionProductBullets) && report.solutionProductBullets.length
      ? report.solutionProductBullets
      : ["Reduces chemicals, heavy metals, and harmful contaminants", "Protects your health and home", "Improves taste, skin, and hair", "High capacity, low maintenance"];

  const categoryTotals = contaminants.reduce<Record<string, number>>((acc, item) => {
    const key = category(contaminantName(item));
    acc[key] = (acc[key] || 0) + (item.over_legal ? 4 : item.over_health ? 2 : 1);
    return acc;
  }, {});
  const categorySum = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0) || 1;

  return (
    <div className="min-h-screen bg-slate-100 py-6 print:bg-white print:py-0">
      <div className="print:hidden fixed right-4 top-4 z-50">
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
        >
          <Printer className="size-4" /> Print / Save PDF
        </button>
      </div>

      <main className="mx-auto w-[1000px] bg-white p-8 text-[#0b2441] shadow-2xl print:w-full print:p-6 print:shadow-none">
        <header className="flex items-center justify-between border-b-4 pb-5" style={{ borderColor: `${accent}55` }}>
          <div className="flex w-64 items-center gap-3">
            {report.companyLogo ? (
              <img src={report.companyLogo} alt={`${report.companyName} logo`} className="max-h-16 max-w-60 object-contain" />
            ) : (
              <>
                <div className="flex size-14 items-center justify-center rounded-xl text-white" style={{ backgroundColor: companyColor }}>
                  <Droplets className="size-8" />
                </div>
                <div>
                  <p className="text-2xl font-black uppercase leading-none">{report.companyName}</p>
                  <p className="text-xs font-bold tracking-[0.28em]" style={{ color: accent }}>WATER SOLUTIONS</p>
                </div>
              </>
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">Your Water. Your Health. Your Home.</p>
            <h1 className="text-4xl font-black tracking-tight">
              DYNAMIC <span style={{ color: accent }}>AQUASCORE</span> REPORT
            </h1>
            <p className="text-lg font-bold">Your Custom Water Quality Report</p>
          </div>
          <div className="w-64 text-right">
            <p className="text-xs font-bold text-slate-500">Powered by</p>
            <p className="text-4xl font-black tracking-tight" style={{ color: accent }}>AQUA</p>
            <p className="text-lg font-bold tracking-[0.35em]">REPORT</p>
          </div>
        </header>

        <section className="mt-5 grid grid-cols-[310px_1fr_300px] gap-4">
          <div className="overflow-hidden rounded-md border border-sky-200">
            <div className="flex h-44 items-center justify-center bg-sky-50">
              <Home className="size-20 text-sky-300" />
            </div>
            <div className="space-y-3 bg-[#063763] p-5 text-white">
              <p className="flex items-start gap-3 text-lg font-semibold"><Home className="mt-1 size-5" /> {report.customerName || "Homeowner"}</p>
              <p className="flex items-start gap-3 text-base"><MapPin className="mt-1 size-5" /> <span>{report.customerAddress || "Home address"}<br />{report.customerCity || report.city}, {report.customerState || report.state} {report.customerZip || report.zip}</span></p>
              <p className="text-base font-semibold">{dateStr}</p>
              <p className="text-sm">Sample Type: Tap Water<br />Point of Use: Kitchen Sink</p>
            </div>
          </div>

          <div className="rounded-md border border-sky-200 p-5 text-center">
            <p className="text-xl font-black uppercase" style={{ color: accent }}>Your Overall<br />AquaScore</p>
            <div className="relative mx-auto mt-5 flex size-64 items-center justify-center rounded-full border-[18px]" style={{ borderColor: riskColor(score) }}>
              <div className="absolute inset-6 rounded-full border-[12px] border-slate-100" />
              <div>
                <p className="text-7xl font-black" style={{ color: riskColor(score) }}>{score}</p>
                <p className="text-2xl font-black" style={{ color: riskColor(score) }}>{scoreLabel(score)}</p>
              </div>
            </div>
            <p className="mx-auto mt-4 max-w-sm text-base font-semibold">
              Your water shows {overHealth.length > 0 ? "contaminants that may impact your health and plumbing." : "a cleaner profile with fewer flagged concerns."}
            </p>
          </div>

          <div className="rounded-md border border-sky-200">
            <h2 className="rounded-t-md bg-[#063763] px-4 py-3 text-center text-lg font-black uppercase text-white">What Does Your Score Mean? <Info className="inline size-4" /></h2>
            <div className="space-y-4 p-5 text-sm">
              {[
                ["80 - 100", "Gold", "Excellent water quality profile.", "bg-amber-400", Check],
                ["60 - 79", "Silver", "Good quality with minor concerns.", "bg-slate-400", Check],
                ["40 - 59", "Bronze", "Moderate concerns. Treatment may help.", "bg-orange-500", AlertTriangle],
                ["0 - 39", "At Risk", "Significant concerns. Treatment is recommended.", "bg-rose-500", AlertTriangle],
              ].map(([range, label, text, color, Icon]) => {
                const RiskIcon = Icon as typeof Check;
                return (
                  <div key={String(range)} className="grid grid-cols-[44px_82px_1fr] items-center gap-3 border-b border-slate-200 pb-4 last:border-0">
                    <div className={`flex size-10 items-center justify-center rounded-full text-white ${color as string}`}><RiskIcon className="size-6" /></div>
                    <div>
                      <p className="font-black" style={{ color: accent }}>{range as string}</p>
                      <p className="font-black">{label as string}</p>
                    </div>
                    <p className="font-semibold">{text as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-md border border-sky-200">
          <h2 className="bg-[#063763] px-5 py-3 text-lg font-black uppercase text-white">Detected Contaminants</h2>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-sky-50 text-left uppercase text-[#143a62]">
              <tr>
                <th className="px-5 py-3">Contaminant</th>
                <th className="px-3 py-3">Result</th>
                <th className="px-3 py-3">Unit</th>
                <th className="px-3 py-3">MCL</th>
                <th className="px-3 py-3">Health Impact</th>
                <th className="px-3 py-3 text-right">Risk Contribution</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => {
                const contribution = item.over_legal ? 24 : item.over_health ? Math.min(22, Math.max(8, item.times_above_ewg || 10)) : 4;
                const color = item.over_legal ? "#dc2626" : item.over_health ? "#f97316" : "#16a34a";
                return (
                  <tr key={contaminantName(item)} className="border-t border-sky-100">
                    <td className="px-5 py-3 font-black" style={{ color }}>{contaminantName(item)}</td>
                    <td className="px-3 py-3 font-black" style={{ color }}>{item.detected_level}</td>
                    <td className="px-3 py-3 font-semibold">{item.unit}</td>
                    <td className="px-3 py-3 font-semibold">{item.legal_limit ?? "N/A"}</td>
                    <td className="px-3 py-3 font-semibold">{item.effect || (item.over_health ? "Potential long-term health risk" : "Within listed health guideline")}</td>
                    <td className="px-3 py-3">
                      <div className="ml-auto flex items-center justify-end gap-3">
                        <div className="h-2 w-36 rounded-full bg-sky-100">
                          <div className="h-2 rounded-full" style={{ width: `${Math.min(100, contribution * 4)}%`, backgroundColor: color }} />
                        </div>
                        <span className="w-10 text-right font-black" style={{ color }}>{Math.round(contribution)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <section className="mt-5 grid grid-cols-3 gap-4">
          <div className="rounded-md border border-sky-200 p-5">
            <h2 className="text-center text-lg font-black uppercase" style={{ color: accent }}>Score Breakdown <Info className="inline size-4" /></h2>
            <div className="mx-auto mt-5 grid size-52 place-items-center rounded-full" style={{ background: "conic-gradient(#dc2626 0 38%, #f97316 38% 70%, #facc15 70% 90%, #22c55e 90% 100%)" }}>
              <div className="size-24 rounded-full bg-white" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm font-semibold">
              {Object.entries(categoryTotals).map(([name, value]) => (
                <p key={name}>{Math.round((value / categorySum) * 100)}% {name}</p>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-sky-200 p-5">
            <h2 className="text-center text-lg font-black uppercase" style={{ color: accent }}>Where Contaminants Come From</h2>
            <div className="mt-5 space-y-4 text-sm font-semibold">
              {[
                [Factory, "Industrial Discharge", "Chemicals and heavy metals from industrial activities."],
                [Sprout, "Agricultural Runoff", "Fertilizers and pesticides seeping into the water supply."],
                [Wrench, "Aging Pipes & Plumbing", "Corrosion and leaching from older pipes."],
                [Droplets, "Water Treatment Byproducts", "Disinfectants reacting with organic matter."],
              ].map(([Icon, title, text]) => {
                const SourceIcon = Icon as typeof Factory;
                return (
                  <div key={String(title)} className="flex gap-3">
                    <SourceIcon className="size-8 shrink-0" style={{ color: accent }} />
                    <p><span className="font-black">{title as string}</span><br />{text as string}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-sky-200">
            <div className="p-5">
              <h2 className="text-center text-lg font-black uppercase" style={{ color: accent }}>Recommended Solution <Info className="inline size-4" /></h2>
              <div className="mt-4 grid grid-cols-[120px_1fr] gap-4">
                <div className="flex h-36 items-center justify-center rounded-md bg-sky-50">
                  {report.solutionProductImage ? (
                    <img src={report.solutionProductImage} alt={solutionName} className="max-h-full max-w-full object-contain p-2" />
                  ) : (
                    <Droplets className="size-16" style={{ color: accent }} />
                  )}
                </div>
                <div>
                  <p className="text-lg font-black">{solutionName}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{solutionDescription}</p>
                  <div className="mt-3 space-y-1.5 text-sm font-semibold">
                    {solutionBullets.slice(0, 4).map((item: string) => (
                      <p key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0" style={{ color: companyColor }} /> {item}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 text-white" style={{ backgroundColor: companyColor }}>
              <p className="text-lg font-black">Improve your score. Protect your family.</p>
              <Shield className="size-9" />
            </div>
          </div>
        </section>

        <footer className="mt-5 flex items-center justify-between rounded-md bg-[#063763] px-8 py-5 text-white">
          <p className="text-xl font-black">Clean water isn't a luxury. It's essential.</p>
          <div className="flex items-center gap-6 text-lg font-bold">
            {report.companyPhone && <p className="flex items-center gap-2"><Phone className="size-5" /> {report.companyPhone}</p>}
            {report.companyWebsite && <p>{report.companyWebsite.replace(/^https?:\/\//, "")}</p>}
          </div>
        </footer>
      </main>
    </div>
  );
}
