import { useMutation, useQuery } from "convex/react";
import {
  AlertTriangle,
  Baby,
  BookOpen,
  Check,
  ChevronDown,
  Droplets,
  FlaskConical,
  GlassWater,
  Heart,
  Home,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Printer,
  Shield,
  ShowerHead,
  Sparkles,
  Star,
  User,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../convex/_generated/api";

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_STREET_VIEW_API_KEY;

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

function contaminantName(c: Contaminant): string {
  return c.contaminant || c.name || "Unknown contaminant";
}

function isDetectedContaminant(c: Contaminant): boolean {
  return c.detected !== false && c.detection_status !== "not_detected";
}

type Severity = "critical" | "high" | "moderate" | "low";

function severity(c: Contaminant): Severity {
  if (c.over_legal) return "critical";
  if (c.times_above_ewg && c.times_above_ewg >= 50) return "critical";
  if (c.over_health && c.times_above_ewg && c.times_above_ewg >= 10) return "high";
  if (c.over_health) return "moderate";
  return "low";
}

const SEV = {
  critical: { dot: "bg-rose-500", text: "text-rose-400", label: "CRITICAL", bar: "#f43f5e", bg: "bg-rose-500/10", border: "border-rose-500/20" },
  high: { dot: "bg-orange-500", text: "text-orange-400", label: "HIGH RISK", bar: "#f97316", bg: "bg-orange-500/10", border: "border-orange-500/20" },
  moderate: { dot: "bg-amber-500", text: "text-amber-400", label: "MODERATE", bar: "#f59e0b", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  low: { dot: "bg-emerald-500", text: "text-emerald-400", label: "LOW RISK", bar: "#22c55e", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
};

function scoreLabel(s: number) {
  if (s >= 80) return "GOLD";
  if (s >= 60) return "SILVER";
  if (s >= 40) return "BRONZE";
  return "AT RISK";
}

function scoreColor(s: number) {
  if (s >= 80) return "#ffb000";
  if (s >= 60) return "#a8c7e8";
  if (s >= 40) return "#ff8a00";
  return "#ff4b5c";
}

function guessCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("trihalomethane") || n.includes("haloacetic") || n.includes("chloroform") || n.includes("bromodichloromethane") || n.includes("dibromochloromethane") || n.includes("bromoform"))
    return "Disinfection Byproducts";
  if (n.includes("chlor") || n.includes("chloramine"))
    return "Disinfectants";
  if (n.includes("lead") || n.includes("copper") || n.includes("barium") || n.includes("chromium") || n.includes("arsenic") || n.includes("mercury") || n.includes("cadmium") || n.includes("antimony") || n.includes("thallium") || n.includes("selenium") || n.includes("manganese"))
    return "Heavy Metals";
  if (n.includes("nitrate") || n.includes("nitrite"))
    return "Nitrates";
  if (n.includes("fluoride"))
    return "Fluoride";
  if (n.includes("radium") || n.includes("uranium") || n.includes("radon") || n.includes("gross alpha") || n.includes("gross beta") || n.includes("radioactive"))
    return "Radioactive";
  return "Other";
}

const healthConcerns: Record<string, string> = {
  cancer: "Long-term exposure may increase cancer risk. This substance has been classified as a potential carcinogen based on peer-reviewed toxicology studies.",
  developmental: "May impact brain development and growth in children. Developing bodies are especially vulnerable to this contaminant.",
  reproductive: "May affect reproductive health and fertility with prolonged exposure at elevated levels.",
  liver: "Long-term exposure above recommended levels may cause liver damage and reduced liver function.",
  kidney: "May contribute to kidney damage and impaired filtration over time with chronic exposure.",
  thyroid: "May interfere with thyroid hormone production, potentially affecting metabolism and energy regulation.",
  nervous: "May impact the central nervous system, potentially causing neurological effects with chronic exposure.",
  cardiovascular: "Long-term exposure above the maximum contaminant level may increase blood pressure and cardiovascular risk.",
  gastrointestinal: "May cause digestive issues and stomach discomfort, particularly in sensitive individuals.",
};

function getHealthConcern(c: Contaminant): string {
  if (c.effect) {
    const e = c.effect.toLowerCase();
    for (const [key, val] of Object.entries(healthConcerns)) {
      if (e.includes(key)) return val;
    }
    return `Long-term exposure above the maximum contaminant level may cause ${c.effect.toLowerCase()} effects.`;
  }
  return "Elevated levels warrant monitoring. Consult a water treatment specialist for personalized recommendations.";
}

function getFiltrationSolution(c: Contaminant): string {
  const n = contaminantName(c).toLowerCase();
  if (n.includes("lead") || n.includes("arsenic") || n.includes("chromium") || n.includes("mercury"))
    return "Reverse osmosis and activated carbon filtration are most effective at reducing this contaminant to safe levels. A whole-home system provides protection at every tap.";
  if (n.includes("chlor") || n.includes("trihalomethane") || n.includes("haloacetic"))
    return "Activated carbon filtration effectively removes chlorine and its byproducts. Whole-home carbon systems protect every tap and eliminate chemical vapors during showers.";
  if (n.includes("nitrate") || n.includes("nitrite"))
    return "Reverse osmosis is the most effective residential treatment for nitrate removal. Point-of-use RO systems at the kitchen sink are the most common solution.";
  if (n.includes("fluoride"))
    return "Reverse osmosis, bone char filters, and activated alumina can reduce fluoride levels. RO systems typically remove 85–92% of fluoride.";
  if (n.includes("radium") || n.includes("uranium"))
    return "Ion exchange and reverse osmosis are the most effective methods for radioactive contaminant removal. Professional installation is recommended.";
  return "Reverse osmosis and activated carbon filtration are most effective at reducing this contaminant to safe levels.";
}

function streetViewUrl(address: string, city: string, state: string, zip: string): string {
  if (!GOOGLE_API_KEY) return FALLBACK_HOUSE;
  const q = encodeURIComponent(`${address}, ${city}, ${state} ${zip}`);
  return `https://maps.googleapis.com/maps/api/streetview?size=1200x600&location=${q}&fov=90&pitch=5&key=${GOOGLE_API_KEY}`;
}

const FALLBACK_HOUSE = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&h=600&fit=crop&q=80";

/* ================================================================
   ANIMATED SCORE GAUGE
   ================================================================ */

function ScoreGauge({ score, size = 220 }: { score: number; size?: number }) {
  const [anim, setAnim] = useState(0);
  const r = (size - 24) / 2;
  const circ = 2 * Math.PI * r;
  const color = scoreColor(score);

  useEffect(() => {
    const t = setTimeout(() => setAnim(score), 400);
    return () => clearTimeout(t);
  }, [score]);

  const offset = circ - (anim / 100) * 0.75 * circ;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="absolute inset-0 rounded-full" style={{ boxShadow: `0 0 60px 10px ${color}30, 0 0 120px 30px ${color}15` }} />
      <div className="absolute rounded-full bg-[#0d1117] border border-white/5" style={{ width: size * 0.72, height: size * 0.72, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <svg width={size} height={size} className="absolute" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => {
          const angle = -225 + i * (270 / 39);
          const rad = (angle * Math.PI) / 180;
          const r1 = size / 2 - 4;
          const r2 = size / 2 - 10;
          return (
            <line key={i} x1={size / 2 + r1 * Math.cos(rad)} y1={size / 2 + r1 * Math.sin(rad)} x2={size / 2 + r2 * Math.cos(rad)} y2={size / 2 + r2 * Math.sin(rad)} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
          );
        })}
      </svg>
      <svg width={size} height={size} className="relative" style={{ transform: 'rotate(135deg)' }} role="img" aria-label={`AquaScore ${score} out of 100`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} strokeLinecap="round" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={offset} className="transition-all duration-[2000ms] ease-out" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-bold tabular-nums" style={{ color }}>{anim}</span>
        <span className="text-sm text-gray-500 -mt-1">/ 100</span>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-2 px-3 py-1 rounded-full border" style={{ color, borderColor: `${color}40` }}>
          {scoreLabel(score)}
        </span>
      </div>
      <GaugeParticles color={color} size={size} progress={anim / 100} />
    </div>
  );
}

function GaugeParticles({ color, size, progress }: { color: string; size: number; progress: number }) {
  const [dots, setDots] = useState<{ x: number; y: number; opacity: number; delay: number }[]>([]);
  useEffect(() => {
    const angle = -225 + progress * 270;
    const rad = (angle * Math.PI) / 180;
    const cx = size / 2 + (size / 2 - 12) * Math.cos(rad);
    const cy = size / 2 + (size / 2 - 12) * Math.sin(rad);
    setDots(Array.from({ length: 5 }).map((_, i) => ({
      x: cx + (Math.random() - 0.5) * 20 + i * 8,
      y: cy + (Math.random() - 0.5) * 10,
      opacity: 1 - i * 0.2,
      delay: i * 0.1,
    })));
  }, [progress, size]);
  return (
    <svg className="absolute inset-0 pointer-events-none" width={size} height={size} aria-hidden="true">
      {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={2.5 - i * 0.3} fill={color} opacity={d.opacity} className="animate-pulse" style={{ animationDelay: `${d.delay}s` }} />)}
    </svg>
  );
}

/* ================================================================
   CONTAMINANT BAR — Redesigned for clarity
   ================================================================ */

function ContaminantBar({ c }: { c: Contaminant }) {
  const s = severity(c);
  const sc = SEV[s];

  // Build scale: max = largest of detected, guideline, legal * 1.2
  const vals = [c.detected_level];
  if (c.health_guideline != null) vals.push(c.health_guideline);
  if (c.legal_limit != null) vals.push(c.legal_limit);
  const scaleMax = Math.max(...vals) * 1.3;

  const detPct = Math.min(98, (c.detected_level / scaleMax) * 100);
  const guidePct = c.health_guideline != null ? Math.min(98, (c.health_guideline / scaleMax) * 100) : null;
  const legalPct = c.legal_limit != null ? Math.min(98, (c.legal_limit / scaleMax) * 100) : null;

  return (
    <div className="mt-4 space-y-1.5">
      {/* Bar */}
      <div className="relative h-3 rounded-full bg-white/[0.04] overflow-visible">
        {/* Detected fill */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
          style={{ width: `${detPct}%`, backgroundColor: sc.bar, boxShadow: `0 0 12px ${sc.bar}50` }}
        />
        {/* Guideline marker */}
        {guidePct != null && (
          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${guidePct}%` }}>
            <div className="w-[3px] h-5 rounded-full bg-amber-400/80" />
          </div>
        )}
        {/* Legal marker */}
        {legalPct != null && (
          <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `${legalPct}%` }}>
            <div className="w-[3px] h-5 rounded-full bg-gray-400/60" />
          </div>
        )}
      </div>

      {/* Labels row */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="font-bold" style={{ color: sc.bar }}>{c.detected_level}</span>
          <span className="text-gray-600">{c.unit}</span>
        </div>
        <div className="flex items-center gap-3">
          {c.health_guideline != null && (
            <span className="flex items-center gap-1 text-gray-500">
              <span className="inline-block w-2 h-2 rounded-sm bg-amber-400/80" />
              Guideline: {c.health_guideline}
            </span>
          )}
          {c.legal_limit != null && (
            <span className="flex items-center gap-1 text-gray-500">
              <span className="inline-block w-2 h-2 rounded-sm bg-gray-400/60" />
              Legal: {c.legal_limit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   CONTAMINANT CARD
   ================================================================ */

function ContaminantCard({ c }: { c: Contaminant }) {
  const [open, setOpen] = useState(false);
  const s = severity(c);
  const sc = SEV[s];
  const cat = guessCategory(contaminantName(c));

  const icons: Record<string, typeof Droplets> = {
    "Disinfection Byproducts": FlaskConical,
    "Disinfectants": Zap,
    "Heavy Metals": Wrench,
    "Nitrates": Sparkles,
    "Fluoride": GlassWater,
    "Radioactive": AlertTriangle,
    "Other": Droplets,
  };
  const Icon = icons[cat] || Droplets;

  return (
    <button
      type="button"
      className={`w-full text-left rounded-xl border bg-[#111827]/80 backdrop-blur-sm overflow-hidden transition-all duration-300 cursor-pointer hover:border-white/20 ${sc.border}`}
      onClick={() => setOpen(!open)}
    >
      <div className="p-5">
        {/* Top row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`size-10 rounded-lg flex items-center justify-center shrink-0 ${sc.bg}`}>
              <Icon className="size-5" style={{ color: sc.bar }} />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-white text-[15px] truncate">{contaminantName(c)}</h4>
              <p className="text-[11px] uppercase tracking-wider text-gray-500 mt-0.5">{cat}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full border ${sc.border} ${sc.text}`}>
              <span className={`size-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </span>
            <ChevronDown className={`size-4 text-gray-600 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </div>
        </div>

        {/* Exceeds badges */}
        {c.over_health && (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <AlertTriangle className="size-3" /> EXCEEDS GUIDELINES
            </span>
            {c.times_above_ewg && c.times_above_ewg > 1 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/25">
                <Zap className="size-3" /> {c.times_above_ewg}× above health guideline
              </span>
            )}
          </div>
        )}

        {/* Visual bar */}
        <ContaminantBar c={c} />
      </div>

      {/* Expanded details */}
      <div className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="overflow-hidden">
          <div className="px-5 pb-5 space-y-5 border-t border-white/5 pt-4">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-400 mb-2">
                <AlertTriangle className="size-3" /> HEALTH CONCERN
              </p>
              <p className="text-[13px] text-gray-300 leading-relaxed">{getHealthConcern(c)}</p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">
                <Shield className="size-3" /> FILTRATION SOLUTION
              </p>
              <p className="text-[13px] text-gray-300 leading-relaxed">{getFiltrationSolution(c)}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">DETECTED</p>
                <p className="text-lg font-bold" style={{ color: sc.bar }}>{c.detected_level}</p>
                <p className="text-[10px] text-gray-600">{c.unit}</p>
              </div>
              {c.health_guideline != null && (
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">GUIDELINE</p>
                  <p className="text-lg font-bold text-amber-400">{c.health_guideline}</p>
                  <p className="text-[10px] text-gray-600">{c.unit}</p>
                </div>
              )}
              {c.legal_limit != null && (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
                  <p className="text-[9px] uppercase tracking-wider text-gray-500 mb-1">LEGAL LIMIT</p>
                  <p className="text-lg font-bold text-gray-400">{c.legal_limit}</p>
                  <p className="text-[10px] text-gray-600">{c.unit}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ================================================================
   COMPARISON CARDS
   ================================================================ */

function ComparisonCards({ without, withF }: { without: string[]; withF: string[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="rounded-xl border border-rose-500/25 bg-rose-500/5 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-3">WITHOUT FILTRATION</p>
        <ul className="space-y-2.5">
          {without.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[13px] text-gray-300 leading-snug">
              <span className="size-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" /> {t}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-cyan-500/25 bg-cyan-500/5 p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-3">WITH FILTRATION</p>
        <ul className="space-y-2.5">
          {withF.map((t) => (
            <li key={t} className="flex items-start gap-2 text-[13px] text-gray-300 leading-snug">
              <span className="size-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" /> {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ================================================================
   DESKTOP SIDEBAR
   ================================================================ */

function DesktopSidebar({ report, score, contaminants, overHealth, overLegal, companyColor, setShowLeadForm }: {
  report: any; score: number; contaminants: Contaminant[]; overHealth: Contaminant[]; overLegal: Contaminant[]; companyColor: string; setShowLeadForm: (v: boolean) => void;
}) {
  return (
    <div className="hidden lg:block w-80 xl:w-96 shrink-0">
      <div className="sticky top-20 space-y-5">
        {/* Score card */}
        <div className="rounded-2xl border border-white/10 bg-[#111827]/80 backdrop-blur-sm p-6">
          <div className="flex justify-center mb-4">
            <ScoreGauge score={score} size={180} />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 py-2">
              <p className="text-lg font-bold text-amber-400">{contaminants.length}</p>
              <p className="text-[9px] text-gray-500 uppercase">Detected</p>
            </div>
            <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 py-2">
              <p className="text-lg font-bold text-orange-400">{overHealth.length}</p>
              <p className="text-[9px] text-gray-500 uppercase">Over Guideline</p>
            </div>
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 py-2">
              <p className="text-lg font-bold text-rose-400">{overLegal.length}</p>
              <p className="text-[9px] text-gray-500 uppercase">Over Legal</p>
            </div>
          </div>
        </div>

        {/* Quick info */}
        <div className="rounded-2xl border border-white/10 bg-[#111827]/80 backdrop-blur-sm p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="size-4 text-gray-500" />
            <span>{report.utilityName}, {report.state}</span>
          </div>
          {report.customerAddress && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Home className="size-4 text-gray-500" />
              <span>{report.customerAddress}, {report.customerCity}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Droplets className="size-4 text-gray-500" />
            <span>{report.waterSource || "Municipal Water"}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-white/10 bg-[#111827]/80 backdrop-blur-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-white">Ready to take action?</p>
          <button
            onClick={() => setShowLeadForm(true)}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-white text-sm cursor-pointer"
            style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}
          >
            <ShowerHead className="size-4" /> Get a Free Quote
          </button>
          {report.companyPhone && (
            <a href={`tel:${report.companyPhone}`} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-gray-300 text-sm border border-white/10 hover:bg-white/5 transition-all">
              <Phone className="size-4" /> {report.companyPhone}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN COMPONENT
   ================================================================ */

export function CustomerReportPage() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const report = useQuery(api.reports.getPublicReport, shareToken ? { shareToken } : "skip");
  const submitLead = useMutation(api.leads.submitLead);
  const [activeCategory, setActiveCategory] = useState("All");
  const contaminantsRef = useRef<HTMLDivElement>(null);
  const [showStickyBar, setShowStickyBar] = useState(true);
  const [houseImgLoaded, setHouseImgLoaded] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadMessage, setLeadMessage] = useState("");
  const [leadSaving, setLeadSaving] = useState(false);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareToken || !leadName.trim()) return;
    setLeadSaving(true);
    try {
      await submitLead({
        shareToken,
        name: leadName.trim(),
        phone: leadPhone.trim() || undefined,
        email: leadEmail.trim() || undefined,
        message: leadMessage.trim() || undefined,
      });
      setLeadSubmitted(true);
    } catch {
      // silently fail for the customer
    } finally {
      setLeadSaving(false);
    }
  };

  const contaminants: Contaminant[] = useMemo(() => {
    if (!report?.contaminants) return [];
    try {
      const raw: Contaminant[] = JSON.parse(report.contaminants);
      // Filter out junk entries that aren't real contaminants
      const JUNK = ["reverse osmosis", "how your levels compare", "surface water treatment rule",
        "consumer confidence rule", "lead and copper rule", "total coliform rule",
        "ground water rule", "filter backwash", "disinfection byproducts rule",
        "enhanced surface water", "aircraft drinking water", "lead (90th percentile)"];
      return raw.filter((c) => {
        const n = contaminantName(c).toLowerCase();
        return !JUNK.some((j) => n.includes(j));
      }).filter(isDetectedContaminant);
    } catch { return []; }
  }, [report?.contaminants]);

  const sorted = useMemo(() =>
    [...contaminants].sort((a, b) => {
      const order: Record<Severity, number> = { critical: 0, high: 1, moderate: 2, low: 3 };
      return order[severity(a)] - order[severity(b)];
    }), [contaminants]);

  const categories = useMemo(() => {
    const cats = new Set(sorted.map((c) => guessCategory(contaminantName(c))));
    return ["All", ...Array.from(cats)];
  }, [sorted]);

  const filtered = activeCategory === "All" ? sorted : sorted.filter((c) => guessCategory(contaminantName(c)) === activeCategory);
  const overHealth = contaminants.filter((c) => c.over_health);
  const overLegal = contaminants.filter((c) => c.over_legal);
  const highRisk = contaminants.filter((c) => severity(c) === "critical" || severity(c) === "high");
  const score = report?.waterScore ?? 50;

  const houseUrl = report?.customerAddress && report?.customerCity && report?.customerState && report?.customerZip
    ? streetViewUrl(report.customerAddress, report.customerCity, report.customerState, report.customerZip)
    : null;

  if (report === undefined) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center">
        <Droplets className="size-10 animate-pulse text-blue-500" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-white">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Report Not Found</h1>
          <p className="text-gray-400">This link may have expired or is invalid.</p>
        </div>
      </div>
    );
  }

  const companyColor = report.companyColor || "#2563eb";
  const solutionName = report.solutionProductName || `${report.companyName} Whole Home System`;
  const solutionDescription = report.solutionProductDescription || `Configured for ${report.utilityName}'s specific contaminant profile and selected to protect every tap in the home.`;
  const solutionBullets = Array.isArray(report.solutionProductBullets) && report.solutionProductBullets.length
    ? report.solutionProductBullets
    : ["Reduces chemicals, heavy metals, and harmful contaminants", "Protects your health and home", "Improves taste, skin, and hair", "High capacity, low maintenance"];

  return (
    <div className="min-h-screen bg-[#080c14] text-white">
      {/* ====== HEADER ====== */}
      <header className="sticky top-0 z-50 bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-5 h-14">
          <div className="flex items-center gap-2.5">
            {report.companyLogo ? (
              <img src={report.companyLogo} alt={`${report.companyName} logo`} className="h-8 max-w-36 object-contain" />
            ) : (
              <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}>
                <Droplets className="size-4 text-white" />
              </div>
            )}
            <span className="font-semibold text-sm">{report.companyName}</span>
          </div>
          <div className="flex items-center gap-2">
            {report.flipbookUrl ? (
              <Link
                to={`/r/${shareToken}/flipbook`}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 border border-white/10 rounded-full px-3 py-1 hover:bg-white/5 hover:text-gray-200 transition-all"
              >
                <BookOpen className="size-3" /> Flipbook
              </Link>
            ) : (
              <Link
                to={`/r/${shareToken}/print`}
                className="flex items-center gap-1.5 text-[11px] text-gray-400 border border-white/10 rounded-full px-3 py-1 hover:bg-white/5 hover:text-gray-200 transition-all"
              >
                <Printer className="size-3" /> Export
              </Link>
            )}
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400 border border-white/10 rounded-full px-3 py-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> LIVE REPORT
            </span>
          </div>
        </div>
      </header>

      {/* ====== HERO with house background ====== */}
      <section className="relative overflow-hidden">
        {/* House background image */}
        <img
          src={houseUrl || FALLBACK_HOUSE}
          alt=""
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${houseImgLoaded ? "opacity-40" : "opacity-0"}`}
          onLoad={() => setHouseImgLoaded(true)}
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_HOUSE; }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080c14]/30 via-[#080c14]/60 to-[#080c14]" />

        <div className="relative max-w-7xl mx-auto px-5 pt-10 pb-6 lg:pt-14 lg:pb-10">
          {/* Utility pill */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 text-[12px] text-gray-400 border border-white/10 rounded-full px-4 py-1.5 mb-6">
              <MapPin className="size-3" />
              {report.utilityName}, {report.state} · {new Date(report.createdAt).getFullYear()}
            </div>
          </div>

          <div className="lg:flex lg:items-start lg:gap-12">
            {/* Left: title + subtitle + gauge (mobile) */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4">
                <span className="text-gray-400">{report.customerName?.split(" ")[0] || "Your"}'s</span>{" "}
                <span className="text-gray-500">Home</span>
                <br />
                <span className="text-white">Water Diagnostic</span>
              </h1>
              <p className="text-gray-400 text-[15px] lg:text-base leading-relaxed max-w-lg mx-auto lg:mx-0 mb-8">
                {score >= 70
                  ? `Significant concerns found. ${report.utilityName} contains substances exceeding health-protective guidelines.`
                  : score >= 40
                    ? `Some concerns detected. ${report.utilityName} contains substances that warrant attention.`
                    : `Your water profile is cleaner, with fewer elevated levels in this report.`
                }
              </p>

              {/* Gauge — shown inline on mobile, to the right on desktop */}
              <div className="flex justify-center lg:hidden py-6">
                <ScoreGauge score={score} size={240} />
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto lg:mx-0">
                <div className="rounded-xl border border-amber-500/20 bg-[#111827]/50 p-4 text-center">
                  <p className="text-2xl font-bold text-amber-400">{contaminants.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1 leading-tight">Contaminants<br/>Detected</p>
                </div>
                <div className="rounded-xl border border-orange-500/20 bg-[#111827]/50 p-4 text-center">
                  <p className="text-2xl font-bold text-orange-400">{overHealth.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1 leading-tight">Exceed Health<br/>Guidelines</p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-[#111827]/50 p-4 text-center">
                  <p className="text-2xl font-bold text-rose-400">{overLegal.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mt-1 leading-tight">Exceed Legal<br/>Limit</p>
                </div>
              </div>

              {/* Scroll prompt - mobile only */}
              <button
                onClick={() => contaminantsRef.current?.scrollIntoView({ behavior: "smooth" })}
                className="flex flex-col items-center gap-1 mx-auto lg:mx-0 mt-8 text-[10px] uppercase tracking-[0.2em] text-gray-500 hover:text-gray-300 transition-colors lg:hidden"
              >
                SCROLL TO EXPLORE
                <ChevronDown className="size-4 animate-bounce" />
              </button>
            </div>

            {/* Score gauge is in the desktop sidebar — no duplicate here */}
          </div>
        </div>
      </section>

      {/* ====== MAIN CONTENT with desktop sidebar ====== */}
      <div className="max-w-7xl mx-auto px-5 lg:flex lg:gap-8 pb-28">
        {/* Main content column */}
        <div className="flex-1 min-w-0 max-w-3xl">

          {/* ====== WHAT WE FOUND ====== */}
          <section ref={contaminantsRef} className="py-10">
            <div className="mb-6">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 border border-rose-500/30 rounded-full px-3 py-1">
                LABORATORY ANALYSIS
              </span>
              <h2 className="text-3xl lg:text-4xl font-bold mt-4">
                What We Found<br />
                <span className="text-cyan-400">In Your Water</span>
              </h2>
              <p className="text-gray-400 text-sm lg:text-base mt-3 leading-relaxed max-w-xl">
                {report.utilityName} was screened for hundreds of substances.{" "}
                {highRisk.length > 0
                  ? `${highRisk.length} contaminant${highRisk.length > 1 ? "s are" : " is"} flagged as high risk or critical — tap any to learn more.`
                  : "Tap any contaminant to learn more."
                }
              </p>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-gray-400 mb-5">
              {(["low", "moderate", "high", "critical"] as Severity[]).map((s) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className={`size-2.5 rounded-full ${SEV[s].dot}`} />
                  {s === "low" ? "Low Risk" : s === "moderate" ? "Moderate" : s === "high" ? "High Risk" : "Critical"}
                </span>
              ))}
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[12px] font-medium px-4 py-2 rounded-full border transition-all ${
                    activeCategory === cat
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
                  }`}
                >
                  {cat === "All" ? `All Contaminants (${sorted.length})` : cat}
                </button>
              ))}
            </div>

            {/* Contaminant list */}
            <div className="space-y-3">
              {filtered.map((c) => <ContaminantCard key={contaminantName(c)} c={c} />)}
            </div>

            {/* Health guidelines note */}
            <div className="mt-6 rounded-xl bg-[#111827]/50 border border-white/5 p-5">
              <p className="text-[13px] text-gray-400 leading-relaxed">
                <span className="font-semibold text-gray-300">About health guidelines:</span> Health-protective guidelines are based on independent science and are often 10–100× more protective than legal limits. A contaminant can be legal yet still exceed health-protective thresholds.
              </p>
            </div>
          </section>

          {/* ====== IMPACT SECTIONS ====== */}

          {/* 01: SKIN & HAIR */}
          <section className="py-10 border-t border-white/5">
            <p className="text-[11px] text-gray-600 font-mono mb-2">01</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-4">SKIN & HAIR</p>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
              Every shower is<br />stripping your skin.
            </h2>
            <p className="text-cyan-400 text-[15px] font-semibold leading-relaxed mb-4 max-w-xl">
              Chlorine and dissolved minerals remove the natural oils your skin and hair need — every single day.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-xl">
              Most families blame their shampoo or moisturizer. The real culprit is the water itself. Chlorine — added to kill bacteria — also destroys the skin barrier. Hard water minerals leave a film on hair that causes frizz, breakage, and dullness.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8 max-w-xl">
              During a 10-minute hot shower, you're exposed to more chlorine than drinking 8 glasses of tap water. The steam opens pores and delivers chlorine compounds into your bloodstream faster than any glass of water could.
            </p>
            <ComparisonCards
              without={["Chlorine steam with every shower", "Respiratory irritation over time", "Skin absorbs chlorine through pores"]}
              withF={["Clean, chemical-free steam", "No airborne disinfectant exposure", "Fresher air inside your bathroom"]}
            />
          </section>

          {/* 02: FAMILY SAFETY */}
          <section className="py-10 border-t border-white/5">
            <p className="text-[11px] text-gray-600 font-mono mb-2">02</p>
            <div className="flex items-center gap-2 mb-4">
              <Baby className="size-4 text-rose-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400">FAMILY SAFETY</p>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
              Your family deserves<br />
              <span className="text-rose-400">better than &quot;legal.&quot;</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xl">
              Legal limits haven't been meaningfully updated in over 20 years. Children, pregnant women, and the elderly are most vulnerable to contaminants that are technically "within limits" but far exceed health-protective guidelines.
            </p>
            <ComparisonCards
              without={["Lead impacts developing brains", "Nitrates endanger infants under 6mo", "PFAS accumulate silently over years"]}
              withF={["Safe water for every age", "Contaminants removed at source", "Long-term health confidence"]}
            />
          </section>

          {/* 03: HOME & APPLIANCES */}
          <section className="py-10 border-t border-white/5">
            <p className="text-[11px] text-gray-600 font-mono mb-2">03</p>
            <div className="flex items-center gap-2 mb-4">
              <Home className="size-4 text-amber-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">HOME & APPLIANCES</p>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="size-16 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Home className="size-8 text-amber-400" />
              </div>
              <div>
                <p className="text-5xl font-bold text-amber-400">40%</p>
                <p className="text-[13px] text-gray-500 leading-tight">reduction in appliance<br/>lifespan from hard water</p>
              </div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
              Hard water is silently<br />destroying your home.
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-4 max-w-xl">
              Scale buildup coats the inside of water heaters, dishwashers, and washing machines — forcing them to work harder, use more energy, and fail sooner.
            </p>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xl">
              The average homeowner spends $300–$500 more per year on energy and repairs due to hard water damage. A whole-home filtration system pays for itself.
            </p>
          </section>

          {/* 04: TASTE & DRINKING */}
          <section className="py-10 border-t border-white/5">
            <p className="text-[11px] text-gray-600 font-mono mb-2">04</p>
            <div className="flex items-center gap-2 mb-4">
              <GlassWater className="size-4 text-cyan-400" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400">TASTE & DRINKING</p>
            </div>
            <div className="flex items-center gap-4 mb-6">
              <div className="size-16 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                <Droplets className="size-8 text-cyan-400" />
              </div>
              <div>
                <p className="text-5xl font-bold text-cyan-400">$1,200</p>
                <p className="text-[13px] text-gray-500 leading-tight">average family spends<br/>per year on bottled water</p>
              </div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mb-3">
              Clean water should<br />taste like nothing.
            </h2>
            <p className="text-cyan-400 text-[15px] font-semibold leading-relaxed mb-4 max-w-xl">
              That metallic taste, chlorine smell, or earthy odor is your water telling you something.
            </p>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xl">
              Chlorine byproducts, minerals, and dissolved organics create the distinctive taste most families simply accept as normal. It isn't. Filtered water tastes dramatically different — and when it tastes better, families drink more of it.
            </p>
          </section>

          {/* 05: HAND-PICKED SOLUTION */}
          <section className="py-10 border-t border-white/5">
            <p className="text-[11px] text-gray-600 font-mono mb-2">05</p>
            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 border border-cyan-500/30 rounded-full px-3 py-1">
              YOUR HAND-PICKED HOME SOLUTION
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold leading-tight mt-5 mb-3">
              Recommended for<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">your home water profile.</span>
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-xl">
              Based on the contaminants flagged in this report, {report.companyName} recommends a home solution designed to reduce the highest-priority risks before they reach your taps.
            </p>

            <div className="rounded-2xl border border-cyan-500/20 bg-[#111827]/90 overflow-hidden mb-5 max-w-xl shadow-2xl shadow-cyan-950/20">
              <div className="grid gap-5 p-6 sm:grid-cols-[180px_1fr]">
                <div className="rounded-xl border border-white/10 bg-white overflow-hidden min-h-44 flex items-center justify-center">
                  {report.solutionProductImage ? (
                    <img src={report.solutionProductImage} alt={solutionName} className="h-full w-full object-contain p-3" />
                  ) : (
                    <div className="size-20 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}>
                      <Droplets className="size-10 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 mb-2">Recommended Solution</p>
                  <p className="font-semibold text-white text-xl leading-tight">{solutionName}</p>
                  <p className="text-[13px] text-gray-400 mt-2 leading-relaxed">{solutionDescription}</p>
                  <div className="mt-4 space-y-2">
                    {solutionBullets.slice(0, 5).map((bullet: string) => (
                      <div key={bullet} className="flex items-start gap-2 text-[13px] text-gray-300">
                        <Check className="mt-0.5 size-4 shrink-0 text-cyan-300" />
                        <span>{bullet}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 text-white" style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}>
                <p className="font-semibold">Improve your water. Protect your family.</p>
                <p className="text-sm opacity-85">Request a free quote and see what this solution would look like for your home.</p>
              </div>
            </div>

            {/* Product recommendation */}
            <div className="hidden rounded-xl border border-white/10 bg-[#111827]/80 p-6 mb-5 max-w-xl">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}>
                  <Droplets className="size-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-white text-lg">{report.companyName} Whole Home System</p>
                  <p className="text-[13px] text-gray-400 mt-1 leading-relaxed">Configured for {report.utilityName}'s specific contaminant profile — targeting every substance found in your water report.</p>
                </div>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="max-w-xl space-y-3">
              <button
                onClick={() => setShowLeadForm(true)}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white text-[15px] transition-all hover:opacity-90 cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}
              >
                <ShowerHead className="size-5" /> Get a Free Water Filter Quote
              </button>
              {report.companyPhone && (
                <a href={`tel:${report.companyPhone}`} className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-gray-300 text-[15px] border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <Phone className="size-4" /> {report.companyPhone}
                </a>
              )}
              <p className="text-center text-[11px] text-gray-600 mt-2">
                Provided by {report.companyName} · Licensed Water Treatment Specialists
              </p>
            </div>
          </section>

          {/* ====== TRUST SECTION (Light) ====== */}
          <section className="bg-white text-gray-900 rounded-t-3xl mt-6 px-6 py-10 lg:rounded-2xl lg:mb-6">
            <div className="flex items-center gap-3 mb-6">
              {report.companyLogo ? (
                <img src={report.companyLogo} alt={`${report.companyName} logo`} className="max-h-12 max-w-44 object-contain" />
              ) : (
                <div className="size-10 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}>
                  <Droplets className="size-5 text-white" />
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{report.companyName}</p>
                <p className="text-[12px] text-gray-500">Certified Water Treatment Specialists</p>
              </div>
            </div>

            <h3 className="text-2xl font-bold leading-tight mb-2">
              A consultation built for your specific home.
            </h3>
            <p className="text-cyan-600 text-sm font-medium mb-6">
              No pressure. No sales pitch. Just clarity — at no cost to you.
            </p>

            <div className="space-y-4 mb-6">
              {[
                "Your report is reviewed by a certified specialist — not a chatbot.",
                "Recommendations are specific to your water supply and family.",
                "No obligation to purchase. Honest advice, always.",
              ].map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <span className="size-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <Heart className="size-3 text-emerald-600" />
                  </span>
                  <p className="text-[14px] text-gray-600 leading-relaxed">{t}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} className="size-5 fill-amber-400 text-amber-400" />)}
              </div>
              <span className="text-[13px] text-gray-500">Trusted by thousands of homeowners</span>
            </div>

            <div className="space-y-3 max-w-md">
              <button type="button" onClick={() => setShowLeadForm(true)} className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-white text-[15px] cursor-pointer" style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}>
                Request My Home Solution →
              </button>
              {report.companyPhone && (
                <a href={`tel:${report.companyPhone}`} className="flex items-center justify-center gap-2 w-full py-4 rounded-xl font-semibold text-gray-700 text-[15px] border border-gray-200 hover:bg-gray-50 transition-all">
                  <Phone className="size-4" /> Call {report.companyPhone}
                </a>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="size-6 rounded flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}>
                  <Droplets className="size-3 text-white" />
                </div>
                <span className="font-semibold text-sm text-gray-900">{report.companyName}</span>
              </div>
              <p className="text-[11px] text-gray-400">© {new Date().getFullYear()} {report.companyName}</p>
            </div>
          </section>
        </div>

        {/* Desktop sidebar */}
        <DesktopSidebar report={report} score={score} contaminants={contaminants} overHealth={overHealth} overLegal={overLegal} companyColor={companyColor} setShowLeadForm={setShowLeadForm} />
      </div>

      {/* ====== STICKY CTA BAR ====== */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#080c14]/95 backdrop-blur-xl border-t border-white/5 z-50 lg:hidden">
          <div className="max-w-lg mx-auto px-4 py-2.5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[12px] text-gray-400">Speak with a water specialist — free</p>
              <button onClick={() => setShowStickyBar(false)} className="text-gray-600 hover:text-gray-400 text-xs px-1">✕</button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLeadForm(true)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white text-[13px] cursor-pointer"
                style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}
              >
                <ShowerHead className="size-4" /> Get a Free Water Filter Quote
              </button>
              {report.companyPhone && (
                <a href={`tel:${report.companyPhone}`} className="size-12 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all">
                  <Phone className="size-5 text-gray-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====== LEAD CAPTURE MODAL ====== */}
      {showLeadForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close quote request form"
            onClick={() => !leadSaving && setShowLeadForm(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl bg-[#111827] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 pb-4" style={{ background: `linear-gradient(135deg, ${companyColor}20, transparent)` }}>
              <button onClick={() => setShowLeadForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-300">
                <X className="size-5" />
              </button>
              <div className="size-12 rounded-xl flex items-center justify-center mb-3" style={{ background: `${companyColor}20` }}>
                <ShowerHead className="size-6" style={{ color: companyColor }} />
              </div>
              <h3 className="text-xl font-bold text-white">Get Your Free Quote</h3>
              <p className="text-sm text-gray-400 mt-1">
                A water specialist from {report.companyName} will contact you to discuss solutions for your home.
              </p>
            </div>

            {!leadSubmitted ? (
              <form onSubmit={handleLeadSubmit} className="p-6 pt-2 space-y-4">
                <div>
                  <label htmlFor="quote-lead-name" className="text-xs font-medium text-gray-400 mb-1.5 block">Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                    <input
                      id="quote-lead-name"
                      type="text"
                      required
                      placeholder="John Smith"
                      value={leadName}
                      onChange={(e) => setLeadName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="quote-lead-phone" className="text-xs font-medium text-gray-400 mb-1.5 block">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <input
                        id="quote-lead-phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={leadPhone}
                        onChange={(e) => setLeadPhone(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="quote-lead-email" className="text-xs font-medium text-gray-400 mb-1.5 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-500" />
                      <input
                        id="quote-lead-email"
                        type="email"
                        placeholder="john@email.com"
                        value={leadEmail}
                        onChange={(e) => setLeadEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="quote-lead-message" className="text-xs font-medium text-gray-400 mb-1.5 block">Message (optional)</label>
                  <textarea
                    id="quote-lead-message"
                    placeholder="I'm interested in learning about water filtration options..."
                    value={leadMessage}
                    onChange={(e) => setLeadMessage(e.target.value)}
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={leadSaving || !leadName.trim()}
                  className="w-full py-3.5 rounded-xl font-semibold text-white text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${companyColor}, #06b6d4)` }}
                >
                  {leadSaving ? <Loader2 className="size-4 animate-spin" /> : <ShowerHead className="size-4" />}
                  {leadSaving ? "Submitting..." : "Request Free Quote"}
                </button>
                <p className="text-[11px] text-gray-600 text-center">No obligation · We respect your privacy</p>
              </form>
            ) : (
              <div className="p-8 text-center space-y-4">
                <div className="size-16 rounded-full mx-auto flex items-center justify-center" style={{ background: `${companyColor}20` }}>
                  <Check className="size-8" style={{ color: companyColor }} />
                </div>
                <h4 className="text-lg font-bold text-white">Quote Request Sent!</h4>
                <p className="text-sm text-gray-400">
                  A water specialist from {report.companyName} will be in touch shortly to discuss your water quality and filtration options.
                </p>
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="text-sm font-medium px-6 py-2.5 rounded-xl border border-white/10 text-gray-300 hover:bg-white/5"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
