import { useAction, useQuery } from "convex/react";
import { getCountryText } from "@/lib/i18n";
import {
  AlertTriangle,
  Calendar,
  Check,
  ClipboardCopy,
  DollarSign,
  Download,
  Droplets,
  ExternalLink,
  FlaskConical,
  Loader2,
  Mail,
  FileText,
  MessageSquare,
  Phone,
  Play,
  RefreshCw,
  Shield,
  Star,
  Wrench,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  derivePipelineStage,
  parseContaminants,
  stageMeta,
} from "@/lib/pipeline";
import { contaminantName } from "@/lib/supabase";
import {
  computeAquaScore,
  readingPayload,
  type FieldWaterReadings,
} from "@/lib/waterScore";
import { hasPlanOverride, hasConsumerLinks, hasVerification, hasFiltration, hasFlipbook, upgradeMessage } from "@/lib/planGate";
import { useFreeTrial } from "@/hooks/useFreeTrial";
import { FreeTierBanner } from "@/components/FreeTierCTA";
import { PlanGate } from "@/components/PlanGate";
import { api } from "../../convex/_generated/api";
import { DemoReport } from "@/components/demo/DemoReport";

/* ── AquaScore Gauge ─────────────────────────────────────── */

function AquaScoreGauge({ score }: { score?: number }) {
  const s = score ?? 0;
  const tier =
    s >= 80 ? "Gold" : s >= 60 ? "Silver" : s >= 40 ? "Bronze" : "At Risk";
  const tierEmoji = s >= 80 ? "🥇" : s >= 60 ? "🥈" : s >= 40 ? "🥉" : "⚠️";

  const ringColor =
    s >= 80
      ? "stroke-amber-400"
      : s >= 60
        ? "stroke-slate-400"
        : s >= 40
          ? "stroke-orange-400"
          : "stroke-rose-400";
  const tierBg =
    s >= 80
      ? "bg-amber-500/20 text-amber-400"
      : s >= 60
        ? "bg-slate-500/20 text-slate-300"
        : s >= 40
          ? "bg-orange-500/20 text-orange-400"
          : "bg-rose-500/20 text-rose-400";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (s / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            strokeWidth="10"
            className="stroke-muted/40"
          />
          <circle
            cx="70"
            cy="70"
            r="54"
            fill="none"
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${ringColor} transition-all duration-700`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-black">{score ?? "--"}</span>
          <span className="text-[10px] font-bold tracking-wider text-muted-foreground">AQUASCORE</span>
        </div>
      </div>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${tierBg}`}>
        {tierEmoji} {tier} Tier
      </span>
    </div>
  );
}

/* ── Contaminant Table Row ──────────────────────────────── */

/** Safely convert any value to a renderable string — prevents React #310 */
function safe(v: unknown, fallback = ""): string | number {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "string" || typeof v === "number") return v;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

function ContaminantTableRow({ c }: { c: any }) {
  return (
    <div className="flex items-center justify-between py-3 px-1 border-b border-muted/20 last:border-0">
      <p className="text-sm font-medium truncate flex-1">{contaminantName(c)}</p>
      <div className="flex items-center gap-6 text-right text-xs shrink-0">
        <div>
          <p className="text-[10px] text-muted-foreground">DETECTED</p>
          <p className={`font-bold ${c.over_legal ? "text-red-400" : ""}`}>
            {safe(c.detected_level)} {safe(c.unit)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">LEGAL</p>
          <p className="font-medium">{safe(c.legal_limit, "—")} {c.legal_limit ? safe(c.unit) : ""}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">HEALTH</p>
          <p className="font-medium">{safe(c.health_guideline, "—")} {c.health_guideline ? safe(c.unit) : ""}</p>
        </div>
      </div>
    </div>
  );
}

/* ── In-Home Test Form ─────────────────────────────────── */

function InHomeTestForm({
  reportId,
  existingReadings,
}: {
  reportId: any;
  existingReadings?: FieldWaterReadings;
}) {
  const [readings, setReadings] = useState({
    chlorine: existingReadings?.chlorine?.toString() || "",
    hardness: existingReadings?.hardness?.toString() || "",
    tds: existingReadings?.tds?.toString() || "",
    ph: existingReadings?.ph?.toString() || "",
  });
  const [saving, setSaving] = useState(false);
  const saveInHomeTest = useAction(api.dealerShared.saveReportInHomeTest);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = readingPayload(readings);
      await saveInHomeTest({ reportId, readings: payload });
      toast.success("In-home test saved & synced to consumer side!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { key: "chlorine", label: "Chlorine (ppm)", placeholder: "0.5" },
          { key: "hardness", label: "Hardness (ppm)", placeholder: "120" },
          { key: "tds", label: "TDS (ppm)", placeholder: "350" },
          { key: "ph", label: "pH", placeholder: "7.2" },
        ].map(({ key, label, placeholder }) => (
          <div key={key} className="space-y-1">
            <Label className="text-xs">{label}</Label>
            <Input
              type="number"
              step="any"
              placeholder={placeholder}
              value={readings[key as keyof typeof readings]}
              onChange={(e) =>
                setReadings({ ...readings, [key]: e.target.value })
              }
              className="h-9"
            />
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <><Loader2 className="size-4 animate-spin" /> Saving...</>
        ) : (
          <><FlaskConical className="size-4" /> Save Test Results</>
        )}
      </Button>
    </div>
  );
}

/* ── Stat Card ────────────────────────────────────────── */

function StatCard({
  label,
  value,
  description,
  barColor,
  barPercent,
}: {
  label: string;
  value: string | number;
  description: string;
  barColor?: string;
  barPercent?: number;
}) {
  return (
    <Card className="bg-card/50">
      <CardContent className="p-4">
        <p className="text-[10px] font-bold tracking-wider text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-black">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
        {barColor && barPercent !== undefined && (
          <div className="mt-3 h-1.5 rounded-full bg-muted/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${barColor}`}
              style={{ width: `${Math.min(barPercent, 100)}%` }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ── Main Page ─────────────────────────────────────────── */

export function CustomerDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const report = useQuery(
    api.reports.getReport,
    reportId ? { reportId: reportId as any } : "skip"
  );
  const rawCompany = useQuery(api.companies.getMyCompany);
  const { isFree, hasUsedTrial, isInTrialExperience, effectivePlan, totalReports } = useFreeTrial();
  // For free-trial users: pre-trial OR in their trial experience (1 report created),
  // override the plan to growth so PlanGate helpers unlock demo, verify, flipbook, etc.
  const company = useMemo(() => {
    if (!rawCompany) return rawCompany;
    if (isFree && (!hasUsedTrial || isInTrialExperience)) {
      return { ...rawCompany, stripePlan: "growth", stripeStatus: "active" };
    }
    return rawCompany;
  }, [rawCompany, isFree, hasUsedTrial, isInTrialExperience]);
  const createReferral = useAction(api.referrals.createConsumerReferral);
  const [referralUrl, setReferralUrl] = useState<string>("");
  const [, setSendingReferral] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const generateReportPdf = useAction(api.reportPdf.generateReportPdf);
  const demoSessions = useQuery(
    api.dealerShared.getDemoSessionsByReport,
    reportId ? { reportId: reportId as any } : "skip"
  );
  const hub = useQuery(
    api.reports.getCustomerHub,
    reportId ? { reportId: reportId as any } : "skip"
  );
  const [activeTab, setActiveTab] = useState("overview");

  const contaminants = useMemo(
    () => parseContaminants(report?.contaminants),
    [report?.contaminants]
  );
  const stage = report ? derivePipelineStage(report) : "sent";
  const meta = stageMeta(stage);
  const score = report
    ? computeAquaScore(report.waterScore, contaminants, {
        chlorine: report.chlorine,
        hardness: report.hardness,
        tds: report.tds,
        ph: report.ph,
      })
    : undefined;

  const overHealth = contaminants.filter((c: any) => c.over_health);
  const overLegal = contaminants.filter((c: any) => c.over_legal);
  const t = getCountryText(company?.country as string | undefined);
  const shareUrl = report?.shareToken
    ? `${window.location.origin}/r/${report.shareToken}`
    : null;
  const created = report?._creationTime
    ? new Date(report._creationTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const handleCreateReferral = useCallback(async () => {
    if (!reportId) return;
    setSendingReferral(true);
    try {
      const result = await createReferral({ reportId: reportId as any });
      setReferralUrl(result.referralUrl);
      toast.success("Consumer link created!");
    } catch (err: any) {
      const msg = err?.data ?? err?.message ?? "Failed to create consumer link";
      toast.error(typeof msg === "string" ? msg : "Failed to create consumer link");
    }
    setSendingReferral(false);
  }, [reportId, createReferral]);

  const handleGeneratePdf = useCallback(async () => {
    if (!reportId || generatingPdf) return;
    setGeneratingPdf(true);
    try {
      toast.info("Generating PDF & Flipbook…");
      const result = await generateReportPdf({ reportId: reportId as any });
      if (result && "ok" in result && result.ok) {
        toast.success("PDF & Flipbook created!");
        // Navigate to flipbook view
        navigate(`/reports/${reportId}/flipbook`);
      } else if (result && "reason" in result && result.reason === "PDF_PROVIDER_NOT_CONFIGURED") {
        toast.error("PDF provider not configured. Add PDFSHIFT_API_KEY in Convex environment variables.");
      } else {
        toast.error("PDF generation failed");
      }
    } catch (err: any) {
      toast.error(err.message || "PDF generation failed");
    } finally {
      setGeneratingPdf(false);
    }
  }, [reportId, generatingPdf, generateReportPdf, navigate]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied!`);
    });
  };

  if (report === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Droplets className="size-8 animate-pulse text-blue-500" />
      </div>
    );
  }

  if (report === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="mb-4 size-12 text-muted-foreground/30" />
        <h2 className="font-semibold">Customer not found</h2>
        <Button asChild className="mt-4">
          <Link to="/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  const fieldReadingsCount = [report.chlorine, report.hardness, report.tds, report.ph].filter((v) => v != null).length;
  const readingsText = [
    report.chlorine != null ? `Chlorine: ${report.chlorine}` : null,
    report.hardness != null ? `Hardness: ${report.hardness}` : null,
    report.tds != null ? `TDS: ${report.tds}` : null,
    report.ph != null ? `pH: ${report.ph}` : null,
  ].filter(Boolean).join(" · ");

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Free tier upgrade banner */}
      {isFree && hasUsedTrial && <FreeTierBanner totalReports={totalReports} />}

      {/* Breadcrumb */}
      <nav className="text-sm text-muted-foreground">
        <Link to="/customers" className="hover:text-foreground transition-colors">
          Customers
        </Link>
        <span className="mx-2">›</span>
        <span className="text-foreground font-medium">
          {report.customerName || report.utilityName}
        </span>
      </nav>

      {/* Hero Section — Two Panel */}
      <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
        {/* AquaScore Panel */}
        <Card className="bg-card/50">
          <CardContent className="flex items-center justify-center p-6">
            <AquaScoreGauge score={score} />
          </CardContent>
        </Card>

        {/* Info Panel */}
        <Card className="bg-card/50 relative">
          <CardContent className="p-5">
            {/* Stage Badge — Top Right */}
            <span className={`absolute top-4 right-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.badge}`}>
              <span className={`size-2 rounded-full ${meta.color}`} />
              {meta.label}
            </span>

            <h1 className="text-xl font-bold">
              {report.customerName || report.utilityName}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
              {report.customerEmail && (
                <a href={`mailto:${report.customerEmail}`} className="flex items-center gap-1 hover:text-foreground">
                  <Mail className="size-3" />
                  {report.customerEmail}
                </a>
              )}
              {report.customerPhone && (
                <a href={`tel:${report.customerPhone}`} className="flex items-center gap-1 hover:text-foreground">
                  <Phone className="size-3" />
                  {report.customerPhone}
                </a>
              )}
            </p>

            {/* Info Grid */}
            <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground">LOCATION</p>
                <p className="text-sm font-medium">
                  {report.customerCity || report.city}, {report.customerState || report.state} {report.customerZip || report.zip}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground">UTILITY</p>
                <p className="text-sm font-medium">{report.utilityName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground">CREATED</p>
                <p className="text-sm font-medium">{created}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground">CONTAMINANTS</p>
                <p className="text-sm font-medium">
                  <span className="text-red-400">{overLegal.length} legal</span>
                  <span className="mx-1">·</span>
                  <span className="text-emerald-400">{overHealth.length} health</span>
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground">SOURCE</p>
                <p className="text-sm font-medium capitalize">{report.waterSource || "—"}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold tracking-wider text-muted-foreground">POPULATION</p>
                <p className="text-sm font-medium">{report.populationServed?.toLocaleString() ?? "—"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <PlanGate locked={!hasPlanOverride(effectivePlan as any, "growth")} message={upgradeMessage("demo_wizard")} requiredPlan="Growth">
          <Button asChild className="bg-red-500 hover:bg-red-600 text-white rounded-lg shadow-lg shadow-red-500/20">
            <Link to={`/customers/${reportId}/demo`}>
              <Play className="size-4" />
              Start Demo
            </Link>
          </Button>
        </PlanGate>
        <PlanGate locked={!hasConsumerLinks(company)} message={upgradeMessage("consumer_links")} requiredPlan="Starter">
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-lg shadow-emerald-500/20"
            onClick={() => {
              if (referralUrl) {
                copyToClipboard(referralUrl, "Consumer link");
              } else {
                handleCreateReferral();
              }
            }}
          >
            <ExternalLink className="size-4" />
            Send Consumer Link
          </Button>
        </PlanGate>
        <Button
          variant="outline"
          className="rounded-lg"
          onClick={() => {
            if (shareUrl) copyToClipboard(shareUrl, "Report link");
            else toast.error("No share link available");
          }}
        >
          <ClipboardCopy className="size-4" />
          Copy Report Link
        </Button>
        <Button
          variant="outline"
          className="rounded-lg"
          asChild
        >
          <Link to={`/reports/${reportId}/v2`} target="_blank">
            <FileText className="size-4" />
            Report
          </Link>
        </Button>
        {report.pdfUrl && (
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => window.open(report.pdfUrl, "_blank")}
          >
            <Download className="size-4" />
            PDF
          </Button>
        )}
        <PlanGate locked={!hasFlipbook(company)} message={upgradeMessage("flipbook")} requiredPlan="Starter">
          <Button
            variant="outline"
            className="rounded-lg"
            onClick={() => {
              if (report.flipbookUrl) {
                navigate(`/reports/${report._id}/flipbook`);
              } else {
                toast.info("Generating PDF & Flipbook…");
                handleGeneratePdf();
              }
            }}
            disabled={generatingPdf}
          >
            {generatingPdf ? <Loader2 className="size-4 animate-spin" /> : <MessageSquare className="size-4" />}
            Flipbook
          </Button>
        </PlanGate>
        <Button
          variant="outline"
          className="rounded-lg"
          onClick={handleGeneratePdf}
          disabled={generatingPdf}
          title="Regenerate PDF &amp; Flipbook with latest data"
        >
          {generatingPdf ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
          {report.pdfUrl ? "Regen" : "Generate"}
        </Button>
      </div>

      {/* Consumer Sync Banner — always visible */}
      <Card className="border-emerald-800/50 bg-emerald-950/30">
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="size-4 text-emerald-400 shrink-0" />
            <p className="text-sm">
              <span className="font-medium text-emerald-400">Consumer profile synced</span>
              <span className="text-muted-foreground"> — Changes made here reflect on myaquareport.com automatically</span>
            </p>
          </div>
          {referralUrl ? (
            <a
              href={referralUrl}
              target="_blank"
              rel="noopener"
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap shrink-0"
            >
              View consumer side →
            </a>
          ) : (
            <button
              onClick={handleCreateReferral}
              className="text-sm font-medium text-emerald-400 hover:text-emerald-300 whitespace-nowrap shrink-0"
            >
              View consumer side →
            </button>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-transparent border-b border-muted/20 rounded-none p-0">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Overview
          </TabsTrigger>
          <TabsTrigger value="report" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Report
          </TabsTrigger>
          <TabsTrigger value="verify" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Verify
          </TabsTrigger>
          <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Activity
          </TabsTrigger>
          {demoSessions && demoSessions.length > 0 && (
            <TabsTrigger value="demo" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
              Demo Report
            </TabsTrigger>
          )}
          <TabsTrigger value="pipeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="appointments" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Appointments
          </TabsTrigger>
          <TabsTrigger value="follow-ups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Follow-Ups
          </TabsTrigger>
          <TabsTrigger value="proposals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Proposals
          </TabsTrigger>
          <TabsTrigger value="retention" className="rounded-none border-b-2 border-transparent data-[state=active]:border-cyan-400 data-[state=active]:text-cyan-400 data-[state=active]:bg-transparent pb-2">
            Retention
          </TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {/* 2x2 Stat Cards */}
          <div className="grid gap-3 sm:grid-cols-2">
            <StatCard
              label="LEGAL VIOLATIONS"
              value={overLegal.length}
              description={`Above ${t.agency} ${t.guidelineFull.toLowerCase()}s`}
              barColor="bg-red-500"
              barPercent={overLegal.length > 0 ? Math.min((overLegal.length / contaminants.length) * 100, 100) : 0}
            />
            <StatCard
              label="HEALTH GUIDELINES"
              value={overHealth.length}
              description={`Above ${t.healthGuideline}`}
              barColor="bg-amber-500"
              barPercent={overHealth.length > 0 ? Math.min((overHealth.length / contaminants.length) * 100, 100) : 0}
            />
            <StatCard
              label="FIELD READINGS"
              value={fieldReadingsCount}
              description={readingsText || "No field readings yet"}
            />
            <StatCard
              label="SCORE BREAKDOWN"
              value={`${score ?? "--"} / 100`}
              description={`Legal: -${overLegal.length * 7} · Health: -${overHealth.length * 3} · Detection: -${Math.max(contaminants.length - overLegal.length - overHealth.length, 0)}`}
            />
          </div>

          {/* Top Contaminants — Legal Violations */}
          {overLegal.length > 0 && (
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                  <Shield className="size-3.5" />
                  TOP CONTAMINANTS — LEGAL VIOLATIONS
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {overLegal.map((c: any) => (
                  <ContaminantTableRow key={c.contaminant_id || c.contaminant} c={c} />
                ))}
              </CardContent>
            </Card>
          )}

          {/* Health Guideline Exceedances */}
          {overHealth.filter((c: any) => !c.over_legal).length > 0 && (
            <Card className="bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold tracking-wider text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="size-3.5" />
                  TOP CONTAMINANTS — HEALTH GUIDELINES
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {overHealth
                  .filter((c: any) => !c.over_legal)
                  .slice(0, 8)
                  .map((c: any) => (
                    <ContaminantTableRow key={c.contaminant_id || c.contaminant} c={c} />
                  ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* REPORT TAB */}
        <TabsContent value="report" className="space-y-4 mt-4">
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-sm">
                All Detected Contaminants ({contaminants.length})
              </CardTitle>
              <CardDescription>
                Full water quality analysis from {report.utilityName}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              {contaminants.map((c: any) => (
                <ContaminantTableRow key={c.contaminant_id || c.contaminant} c={c} />
              ))}
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-2">
            {shareUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={shareUrl} target="_blank" rel="noopener">
                  <ExternalLink className="size-3.5" /> View Full Report
                </a>
              </Button>
            )}
            {shareUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={`${shareUrl}/flipbook`} target="_blank" rel="noopener">
                  <MessageSquare className="size-3.5" /> Flipbook
                </a>
              </Button>
            )}
            {report.pdfUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={report.pdfUrl} target="_blank" rel="noopener">
                  <Download className="size-3.5" /> Download PDF
                </a>
              </Button>
            )}
          </div>
        </TabsContent>

        {/* VERIFY TAB */}
        <TabsContent value="verify" className="space-y-4 mt-4">
          <PlanGate locked={!hasVerification(company)} message={upgradeMessage("verification")} requiredPlan="Growth">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <FlaskConical className="size-4" /> In-Home Water Test
                </CardTitle>
                <CardDescription>
                  Enter field readings from a test kit. Results sync automatically to the
                  customer's myaquareport.com dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InHomeTestForm
                  reportId={reportId}
                  existingReadings={{
                    chlorine: report.chlorine,
                    hardness: report.hardness,
                    tds: report.tds,
                    ph: report.ph,
                  }}
                />
              </CardContent>
            </Card>
          </PlanGate>

          <PlanGate locked={!hasFiltration(company)} message={upgradeMessage("filtration")} requiredPlan="Growth">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Wrench className="size-4" /> Filtration Installation
                </CardTitle>
                <CardDescription>
                  Record a filtration system install. Creates a verified record on the consumer side.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FiltrationForm report={report} />
              </CardContent>
            </Card>
          </PlanGate>
        </TabsContent>

        {/* ACTIVITY TAB */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <Card>
            <CardContent className="py-6">
              <ActivityTimeline report={report} stage={stage} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* DEMO REPORT TAB */}
        {demoSessions && demoSessions.length > 0 && (
          <TabsContent value="demo" className="space-y-4 mt-4">
            {demoSessions.map((session) => (
              <DemoReport key={session._id} session={session as any} />
            ))}
          </TabsContent>
        )}

        {/* PIPELINE TAB */}
        <TabsContent value="pipeline" className="space-y-4 mt-4">
          {hub?.deals && hub.deals.length > 0 ? hub.deals.map((deal) => (
            <Card key={deal._id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{deal.customerName}</CardTitle>
                  <Badge variant="outline" className="capitalize">{deal.stage.replace(/_/g, " ")}</Badge>
                </div>
                {deal.dealValue && <CardDescription>${deal.dealValue.toLocaleString()}</CardDescription>}
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                {deal.source && <p>Source: {deal.source}</p>}
                {deal.notes && <p>{deal.notes}</p>}
                {deal.closedAt && <p>Closed: {new Date(deal.closedAt).toLocaleDateString()}</p>}
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No deals linked to this customer yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* APPOINTMENTS TAB */}
        <TabsContent value="appointments" className="space-y-4 mt-4">
          {hub?.appointments && hub.appointments.length > 0 ? hub.appointments.map((appt) => (
            <Card key={appt._id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{new Date(appt.scheduledAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                    <span className="text-xs text-muted-foreground">{new Date(appt.scheduledAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}</span>
                    <span className="text-xs text-muted-foreground">({appt.durationMinutes}min)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">{appt.type.replace(/_/g, " ")}</Badge>
                    <Badge variant={appt.status === "completed" ? "default" : appt.status === "cancelled" ? "destructive" : "secondary"} className="capitalize">{appt.status}</Badge>
                  </div>
                </div>
                {appt.notes && <p className="text-xs text-muted-foreground mt-2">{appt.notes}</p>}
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No appointments scheduled yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* FOLLOW-UPS TAB */}
        <TabsContent value="follow-ups" className="space-y-4 mt-4">
          {hub?.followUps && hub.followUps.length > 0 ? (
            <Card>
              <CardContent className="py-4">
                <div className="space-y-3">
                  {hub.followUps.map((msg) => (
                    <div key={msg._id} className="flex items-center gap-3 text-sm">
                      <div className={`size-2 rounded-full shrink-0 ${msg.status === "sent" ? "bg-green-500" : msg.status === "pending" ? "bg-amber-400" : msg.status === "failed" ? "bg-red-500" : "bg-muted-foreground/30"}`} />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{msg.subject || `Step ${msg.stepIndex + 1}`}</span>
                        <span className="text-xs text-muted-foreground ml-2">via {msg.channel}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {msg.sentAt ? new Date(msg.sentAt).toLocaleDateString() : new Date(msg.scheduledAt).toLocaleDateString()}
                      </span>
                      <Badge variant="outline" className="capitalize text-[10px]">{msg.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No follow-up messages yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* PROPOSALS TAB */}
        <TabsContent value="proposals" className="space-y-4 mt-4">
          {hub?.proposals && hub.proposals.length > 0 ? hub.proposals.map((prop) => (
            <Card key={prop._id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="size-4" />
                    ${prop.totalPrice.toLocaleString()}
                  </CardTitle>
                  <Badge variant={prop.status === "accepted" ? "default" : prop.status === "declined" ? "destructive" : "secondary"} className="capitalize">{prop.status}</Badge>
                </div>
                {prop.monthlyPayment && <CardDescription>${prop.monthlyPayment}/mo financing</CardDescription>}
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground space-y-1">
                {prop.sentAt && <p>Sent: {new Date(prop.sentAt).toLocaleDateString()}</p>}
                {prop.viewedAt && <p>Viewed: {new Date(prop.viewedAt).toLocaleDateString()}</p>}
                {prop.acceptedAt && <p>Accepted: {new Date(prop.acceptedAt).toLocaleDateString()}</p>}
                {prop.notes && <p>{prop.notes}</p>}
              </CardContent>
            </Card>
          )) : (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No proposals created yet.</CardContent></Card>
          )}
        </TabsContent>

        {/* RETENTION TAB */}
        <TabsContent value="retention" className="space-y-4 mt-4">
          {/* Service Agreements */}
          {hub?.agreements && hub.agreements.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Wrench className="size-4" /> Service Agreements</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {hub.agreements.map((a) => (
                  <div key={a._id} className="flex items-center justify-between text-sm border-b border-muted/20 pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{a.equipmentInstalled}</span>
                      <span className="text-xs text-muted-foreground ml-2">${a.monthlyFee}/mo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Next service: {a.nextServiceDate ? new Date(a.nextServiceDate).toLocaleDateString() : "N/A"}</span>
                      <Badge variant="outline" className="capitalize">{a.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* Service Reminders */}
          {hub?.reminders && hub.reminders.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="size-4" /> Service Reminders</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {hub.reminders.map((r) => (
                  <div key={r._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="capitalize">{r.reminderType.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Due: {new Date(r.dueDate).toLocaleDateString()}</span>
                      <Badge variant={r.status === "completed" ? "default" : r.status === "sent" ? "secondary" : "outline"} className="capitalize">{r.status}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {/* Review Requests */}
          {hub?.reviews && hub.reviews.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Star className="size-4" /> Review Requests</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {hub.reviews.map((r) => (
                  <div key={r._id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {r.rating && <span className="text-amber-400">{"★".repeat(r.rating)}</span>}
                      <span className="text-xs text-muted-foreground">{new Date(r.scheduledAt).toLocaleDateString()}</span>
                    </div>
                    <Badge variant={r.status === "positive_review" ? "default" : r.status === "negative_feedback" ? "destructive" : "outline"} className="capitalize">{r.status.replace(/_/g, " ")}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {(!hub?.agreements?.length && !hub?.reminders?.length && !hub?.reviews?.length) && (
            <Card><CardContent className="py-8 text-center text-muted-foreground text-sm">No retention records yet. Create a service agreement after the sale closes.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Filtration Form ───────────────────────────────────── */

function FiltrationForm({ report }: { report: any }) {
  const [system, setSystem] = useState("");
  const [installDate, setInstallDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [saving, setSaving] = useState(false);
  const createFiltration = useAction(api.dealerShared.createFiltrationVerification);

  const systems = [
    "Excalibur Chlor-A-Soft",
    "Excalibur Premium",
    "SpringWell CF1",
    "AquaOx FCS-2",
    "Pelican PC600",
    "US Water Matrixx",
    "Kind Water E-2000",
    "Pentair Pelican Whole House",
  ];

  const handleSave = async () => {
    if (!system) { toast.error("Select a filtration system"); return; }
    setSaving(true);
    try {
      await createFiltration({
        customerName: report.customerName || "Homeowner",
        customerAddress: report.customerAddress || `${report.city}, ${report.state} ${report.zip}`,
        customerZip: report.customerZip || report.zip,
        customerEmail: report.customerEmail || "",
        customerPhone: report.customerPhone || "",
        systemName: system,
        systemType: "whole_home",
        installDate,
      });
      toast.success("Filtration verified & synced!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    }
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs">Filtration System</Label>
        <select
          value={system}
          onChange={(e) => setSystem(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Select system...</option>
          {systems.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Install Date</Label>
        <Input
          type="date"
          value={installDate}
          onChange={(e) => setInstallDate(e.target.value)}
          className="h-9"
        />
      </div>
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? (
          <><Loader2 className="size-4 animate-spin" /> Verifying...</>
        ) : (
          <><Wrench className="size-4" /> Verify Installation</>
        )}
      </Button>
    </div>
  );
}

/* ── Activity Timeline ────────────────────────────────── */

function ActivityTimeline({ report, stage }: { report: any; stage: string }) {
  const steps = [
    {
      label: "Report Created",
      done: true,
      time: report._creationTime ? new Date(report._creationTime).toLocaleDateString() : null,
    },
    { label: "Link Sent to Customer", done: ["claimed", "tested", "filtered", "certified"].includes(stage) },
    {
      label: "Customer Claimed Report",
      done: ["claimed", "tested", "filtered", "certified"].includes(stage),
      time: report.claimedAt ? new Date(report.claimedAt).toLocaleDateString() : null,
    },
    { label: "In-Home Test Completed", done: ["tested", "filtered", "certified"].includes(stage) },
    { label: "Filtration Installed", done: ["filtered", "certified"].includes(stage) },
    { label: "Certified", done: stage === "certified" },
  ];

  return (
    <div className="space-y-0">
      {steps.map((s, i) => (
        <div key={s.label} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 ${
                s.done ? "border-emerald-500 bg-emerald-500 text-white" : "border-muted-foreground/30"
              }`}
            >
              {s.done && <Check className="size-3" />}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-0.5 flex-1 min-h-[24px] ${s.done ? "bg-emerald-500" : "bg-muted-foreground/20"}`} />
            )}
          </div>
          <div className="pb-4">
            <p className={`text-sm font-medium ${s.done ? "" : "text-muted-foreground"}`}>{s.label}</p>
            {s.time && <p className="text-xs text-muted-foreground">{s.time}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
